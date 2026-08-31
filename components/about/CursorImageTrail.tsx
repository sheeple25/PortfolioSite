"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./CursorImageTrail.module.css";

/*
 * A trail of images that pop in behind the cursor as it moves and fade back
 * out — purely decorative, so the whole layer is `pointer-events: none` and
 * it never mounts its listener on a touch/coarse-pointer device, where there
 * is no cursor to trail in the first place.
 *
 * A fixed-size DOM pool rather than one node per pop: two independent
 * counters advance on every trigger, one choosing which pool node gets
 * reused and one choosing which image it shows. That split is what lets a
 * fast sweep of the pointer show several different images scattered on
 * screen at once, while a slow one still reuses nodes instead of growing the
 * DOM without bound.
 *
 * Positions are read straight off the pointer event and applied with GSAP's
 * `x`/`y` (a transform, not `top`/`left`), so nothing here ever triggers
 * layout — only compositing.
 *
 * The trail can be scoped to one region with `bounds`. That listens on the
 * given element rather than on `window`, so images only pop while the pointer
 * is over it — on `/about` that is Act I, and the trail falls silent the
 * moment the reader drops into the interest band, where a second layer of
 * scattered images would fight the cutouts for the same job.
 *
 * Scoping deliberately does *not* move the overlay inside that element. The
 * layer stays fixed and full-viewport, so a pop near the region's edge spills
 * past it instead of being clipped into a hard rectangle, and the pool's
 * coordinates stay plain `clientX`/`clientY` with no offset maths.
 */

/** How far the pointer has to travel before the next image pops. */
const MIN_DIST = 90;
/** How many images can be live (popping in, holding, or fading) at once. */
const POOL_SIZE = 6;
/** How long a popped image holds before it starts fading out. */
const HOLD_S = 0.35;
/** Scatter around the exact pointer point, so a straight sweep doesn't line the images up like beads. */
const JITTER = 26;

export default function CursorImageTrail({
  images,
  bounds,
}: {
  images: string[];
  /**
   * Confine the trail to one element. Omit — or pass `null` while it is still
   * resolving — for the whole window.
   *
   * The element itself rather than a ref object, because this is a dependency
   * of the listener effect and a ref can't be one: `ref.current` is null on
   * the first pass and populating it later doesn't re-render, so the effect
   * would bail once and never re-run. Callers hold it in state and pass the
   * setter as the ref callback (`ref={setActOne}`), which makes the node's
   * arrival an ordinary state change the effect can depend on.
   */
  bounds?: HTMLElement | null;
}) {
  const poolRef = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = usePrefersReducedMotion();
  const hasFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const active = !reducedMotion && hasFinePointer && images.length > 0;

  useEffect(() => {
    if (!active) return;

    const target: HTMLElement | Window = bounds ?? window;

    let lastX = -Infinity;
    let lastY = -Infinity;
    let trigger = 0;
    let topZ = 0;

    const onMove = (event: PointerEvent) => {
      // Trackpad-driven touchscreens still match `(pointer: fine)` because
      // the mouse is their primary pointer — a finger dragging across one
      // shouldn't leave a trail behind it.
      if (event.pointerType !== "mouse") return;

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) return;
      lastX = event.clientX;
      lastY = event.clientY;

      const node = poolRef.current[trigger % POOL_SIZE];
      const src = images[trigger % images.length];
      trigger += 1;
      if (!node) return;

      const img = node.querySelector("img");
      if (img && img.getAttribute("src") !== src) img.setAttribute("src", src);

      topZ += 1;
      node.style.zIndex = String(topZ);

      gsap.killTweensOf(node);
      gsap.set(node, {
        x: event.clientX + (Math.random() - 0.5) * JITTER * 2,
        y: event.clientY + (Math.random() - 0.5) * JITTER * 2,
        xPercent: -50,
        yPercent: -50,
        rotate: (Math.random() - 0.5) * 12,
        scale: 0.6,
        opacity: 0,
      });
      gsap
        .timeline()
        .to(node, { scale: 1, opacity: 1, duration: 0.28, ease: "power3.out" })
        .to(
          node,
          { opacity: 0, scale: 0.92, duration: 0.5, ease: "power2.in" },
          `+=${HOLD_S}`,
        );
    };

    target.addEventListener("pointermove", onMove as EventListener);
    const pool = poolRef.current;
    return () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      pool.forEach((node) => node && gsap.killTweensOf(node));
    };
  }, [active, images, bounds]);

  if (!active) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <div
          key={i}
          className={styles.item}
          ref={(el) => {
            poolRef.current[i] = el;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- src is swapped imperatively on a pooled node; next/image can't target an existing DOM ref this way. */}
          <img src={images[i % images.length]} alt="" />
        </div>
      ))}
    </div>
  );
}
