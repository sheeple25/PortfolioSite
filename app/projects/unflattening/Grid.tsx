"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/components/case-study/case.module.css";

/**
 * Unflattening's banner texture: the flat panel grid, in place of the
 * anthology cover this slot held before there was real banner art.
 *
 * Traces and Loco Lavatory fill the same slot with a photograph via
 * `BannerImage`; this project's thesis is literally an argument against
 * flatness, so its banner is a grid that materialises stroke by stroke, one
 * line at a time in a shuffled order — V3, then H2, then V7, then H6, then
 * V9, and so on — until every row and column is drawn.
 *
 * The grid is measured with a `ResizeObserver` rather than scaled from a
 * fixed SVG `viewBox`: a `viewBox` stretched non-uniformly to fill an
 * unknown, full-bleed container width is the kind of thing that only works
 * in theory. Measuring the banner's real box and drawing each line at its
 * actual pixel coordinates removes that ambiguity entirely — the SVG's
 * `width`/`height` attributes always match the measured box exactly, so
 * there is nothing left for the browser to scale.
 *
 * Once drawn, the grid warps around the cursor — lines bend away from it
 * within a limited radius and relax back once it moves on. This is done by
 * directly rewriting each nearby line's own path geometry every frame
 * (bending its sample points away from the cursor, falling off with
 * distance), not with an SVG filter: an `feDisplacementMap` fed by a
 * cursor-following gradient field was the first approach here, and while
 * the maths for it checked out in isolation, live-mutating the gradients
 * a filter's `feImage` reads from turned out not to reliably repaint across
 * browsers, and local-fragment `feImage` references have their own
 * coordinate-remapping quirks on top of that — confirmed by testing, not
 * assumed. Bending real path points sidesteps all of it. Only lines within
 * reach of the cursor are resampled; everything else stays a cheap 2-point
 * straight path. The loop mutates `<path>` `d` attributes directly via refs
 * rather than through React state, so hovering never triggers a re-render.
 */

const PITCH = 64;
const STAGGER = 0.05;
const DRAW_SEED = 1337;

/** How far, in pixels, the cursor's pull reaches before fading to nothing. */
const WARP_RADIUS = 260;
/** Peak displacement, in pixels, for a point right under the cursor. */
const WARP_SCALE = 42;
/** Per-frame easing toward the cursor's real position — lower is laggier. */
const WARP_EASE = 0.15;
/** Distance, in pixels, between resampled points on a line within reach of the cursor. */
const SAMPLE_STEP = 9;
/**
 * Where the warp's centre parks when idle: far enough outside the grid that
 * `WARP_RADIUS`'s falloff never reaches back in, so the grid reads as flat
 * until the cursor actually arrives.
 */
const WARP_PARK = -10000;

/**
 * Deterministic PRNG (mulberry32) rather than `Math.random`, so the draw
 * order is reproducible on every measurement rather than reshuffling itself
 * whenever the banner resizes.
 */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type Axis = "v" | "h";
type LineRef = { axis: Axis; index: number };

/** Every line in the grid, shuffled into the order it should draw in. */
function drawOrder(vCols: number, hRows: number): LineRef[] {
  const lines: LineRef[] = [
    ...Array.from({ length: vCols }, (_, i): LineRef => ({ axis: "v", index: i })),
    ...Array.from({ length: hRows }, (_, i): LineRef => ({ axis: "h", index: i })),
  ];
  return seededShuffle(lines, DRAW_SEED);
}

type LineGeom = {
  key: string;
  axis: Axis;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
};

/**
 * Every line's straight geometry and draw-in delay, in one pass. Lines sit
 * at the real 64px pitch and each axis gets one extra line past the
 * measured edge, so the last column/row lands a pitch beyond the box rather
 * than clipping mid-cell.
 */
function buildLines(width: number, height: number): LineGeom[] {
  const vCols = Math.floor(width / PITCH) + 2;
  const hRows = Math.floor(height / PITCH) + 2;

  const order = drawOrder(vCols, hRows);
  const delayByLine = new Map(
    order.map((line, position) => [`${line.axis}${line.index}`, position * STAGGER]),
  );
  const delayFor = (axis: Axis, index: number) => delayByLine.get(`${axis}${index}`) ?? 0;

  const lines: LineGeom[] = [];
  for (let i = 0; i < vCols; i++) {
    lines.push({ key: `v${i}`, axis: "v", x1: i * PITCH, y1: 0, x2: i * PITCH, y2: height, delay: delayFor("v", i) });
  }
  for (let i = 0; i < hRows; i++) {
    lines.push({ key: `h${i}`, axis: "h", x1: 0, y1: i * PITCH, x2: width, y2: i * PITCH, delay: delayFor("h", i) });
  }
  return lines;
}

function straightPath(line: LineGeom) {
  return `M${line.x1} ${line.y1} L${line.x2} ${line.y2}`;
}

/**
 * Resamples a line into a set of points, each pushed away from `cursor` by
 * an amount that falls off (quadratically, for a softer, more centred bulge
 * than a linear ramp) to nothing at `WARP_RADIUS`. Points outside the radius
 * pass through untouched, so the ends of a bent line rejoin its original
 * straight path exactly.
 */
function bendPoints(line: LineGeom, cursor: { x: number; y: number }) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.round(length / SAMPLE_STEP));

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let px = line.x1 + dx * t;
    let py = line.y1 + dy * t;

    const vx = px - cursor.x;
    const vy = py - cursor.y;
    const dist = Math.hypot(vx, vy);
    if (dist > 0.001 && dist < WARP_RADIUS) {
      const falloff = 1 - dist / WARP_RADIUS;
      const push = falloff * falloff * WARP_SCALE;
      px += (vx / dist) * push;
      py += (vy / dist) * push;
    }
    points.push({ x: px, y: py });
  }
  return points;
}

/**
 * Turns the bent sample points into a smooth curve instead of a faceted
 * polyline: each interior point becomes a quadratic control point, with the
 * curve's actual anchor at the midpoint to the next one — the standard
 * "smooth freehand line" construction, so consecutive segments share a
 * tangent instead of meeting at a visible kink.
 */
function bentPath(line: LineGeom, cursor: { x: number; y: number }) {
  const points = bendPoints(line, cursor);
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    const midX = (p.x + next.x) / 2;
    const midY = (p.y + next.y) / 2;
    d += `Q${p.x.toFixed(2)} ${p.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)} `;
  }
  const last = points[points.length - 1];
  d += `L${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

/** Is any point of this line close enough to the cursor to be worth resampling? */
function withinReach(line: LineGeom, cursor: { x: number; y: number }) {
  return line.axis === "v"
    ? Math.abs(cursor.x - line.x1) < WARP_RADIUS
    : Math.abs(cursor.y - line.y1) < WARP_RADIUS;
}

export default function Grid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lines = useMemo(() => (size ? buildLines(size.width, size.height) : []), [size]);

  // The warp's target (where the pointer actually is) and current (where
  // the bend is currently centred, easing toward the target) positions live
  // in refs, and the loop below writes straight to each `<path>`'s `d`
  // attribute — going through React state or props here would mean a
  // re-render, for every line, on every `pointermove`.
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const targetRef = useRef({ x: WARP_PARK, y: WARP_PARK });
  const currentRef = useRef({ x: WARP_PARK, y: WARP_PARK });

  useEffect(() => {
    // The bend is driven by direct attribute mutation, outside CSS entirely,
    // so `prefers-reduced-motion` has to be honoured here rather than left
    // to a stylesheet rule — checked once, since a user's OS-level setting
    // doesn't change mid-session.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let frame: number;

    const tick = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      current.x += (target.x - current.x) * WARP_EASE;
      current.y += (target.y - current.y) * WARP_EASE;

      for (const line of lines) {
        const el = pathRefs.current.get(line.key);
        if (!el) continue;
        const d = withinReach(line, current) ? bentPath(line, current) : straightPath(line);
        el.setAttribute("d", d);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [lines]);

  useEffect(() => {
    // Tracked on `window`, not as an `onPointerMove` on this div: the
    // banner's title/meta block (`.bannerPlate` in `Banner.tsx`) is this
    // element's DOM *sibling*, not its descendant, and it spans the full
    // banner width — hovering that band would never bubble a pointer event
    // to a listener attached here, leaving a full-width dead zone at the
    // title's height. A window-level listener sees every pointer move
    // regardless of which element is visually on top, and the bounds check
    // below does the job `onPointerLeave` would have.
    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      targetRef.current = inside ? { x, y } : { x: WARP_PARK, y: WARP_PARK };
    };
    const park = () => {
      targetRef.current = { x: WARP_PARK, y: WARP_PARK };
    };

    window.addEventListener("pointermove", handleMove);
    // Fires when the pointer leaves the browsing context entirely (e.g. off
    // the top of the window), which `pointermove` alone would just go
    // silent on rather than reporting.
    document.addEventListener("pointerleave", park);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", park);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.flatGrid} aria-hidden="true">
      {size && (
        <svg className={styles.flatGridSvg} width={size.width} height={size.height}>
          {lines.map((line) => (
            <path
              key={line.key}
              ref={(el) => {
                if (el) pathRefs.current.set(line.key, el);
                else pathRefs.current.delete(line.key);
              }}
              className={styles.gridLine}
              d={straightPath(line)}
              pathLength={1}
              style={{ "--line-delay": `${line.delay}s` } as React.CSSProperties}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
