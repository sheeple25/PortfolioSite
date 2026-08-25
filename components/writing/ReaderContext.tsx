"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNarrowToc, usePrefersReducedMotion } from "@/lib/hooks";

/*
 * Shared state for one document: which sections are open, and which one the
 * reader is currently looking at.
 *
 * It's a context rather than state inside each section because two separate
 * places need to agree on it: the section's own toggle, and the sidebar's jump
 * links — a link to a subheading has to open the section hiding it first.
 * Lifting it here is what lets a sidebar click land on a heading that wasn't
 * rendered a moment ago.
 */

/** Kept in step with the height transition in `SectionCard.module.css`. */
export const EXPAND_MS = 420;

/** Fraction of the viewport height that counts as "the line you're reading at". */
const ACTIVE_LINE = 0.3;

type ReaderValue = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  activeId: string | null;
  /** Called by each section to hand over its DOM node for scroll tracking. */
  register: (id: string, element: HTMLElement | null) => void;
  /**
   * Scrolls to `targetId`, opening `ownerId` on the way if the target is a
   * subheading currently collapsed inside it.
   */
  jumpTo: (targetId: string, ownerId?: string) => void;
};

const ReaderContext = createContext<ReaderValue | null>(null);

export function useReader(): ReaderValue {
  const value = useContext(ReaderContext);
  if (!value) throw new Error("useReader must be used inside a ReaderProvider");
  return value;
}

export function ReaderProvider({
  sectionIds,
  children,
}: {
  /** Every section, in document order — drives which one reads as active. */
  sectionIds: string[];
  children: React.ReactNode;
}) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const reducedMotion = usePrefersReducedMotion();
  // Below the rail breakpoint, "contents" is a dropdown sheet that starts
  // closing the instant a row is tapped — animating the scroll at the same
  // time means it's fighting a collapsing sheet on a small screen. The wide
  // rail doesn't move when a row is clicked, so it can afford the animation.
  const narrowToc = useNarrowToc();
  const instant = reducedMotion || narrowToc;

  const elements = useRef(new Map<string, HTMLElement>());
  const scrollAnimation = useRef<number | null>(null);

  const register = useCallback((id: string, element: HTMLElement | null) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  /*
   * A hand-driven animation rather than `scrollIntoView({ behavior: "smooth"
   * })`. Motion's height-"auto" animations (this rail's own expanding
   * subheadings, a section's expand/collapse) suspend the page's scroll
   * position while they measure, then restore it — and if that restore lands
   * mid-flight through a native smooth scroll, it snaps the page back to
   * wherever it was and strands the jump partway to its target. Writing the
   * position ourselves, every frame, means a stray write like that only ever
   * wins for a single frame before the next tick puts it back on the curve.
   */
  const animateScrollTo = useCallback((targetY: number) => {
    if (scrollAnimation.current !== null) {
      clearTimeout(scrollAnimation.current);
    }

    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 1) return;

    const duration = Math.min(900, Math.max(280, Math.abs(delta) * 0.25));
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // `setTimeout` rather than `requestAnimationFrame`: rAF is paused
    // wholesale in a background or unfocused tab, where a jump should still
    // land correctly even if it can't be watched animate. A ~60fps timer
    // keeps ticking either way.
    const step = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      // The two-argument form: always immediate, unlike `scrollTo`/
      // `scrollIntoView` with `behavior: "auto"`, which defer to the page's
      // `scroll-behavior: smooth` and would animate this step itself.
      window.scrollTo(0, startY + delta * easeOutCubic(t));
      scrollAnimation.current = t < 1 ? window.setTimeout(step, 16) : null;
    };

    scrollAnimation.current = window.setTimeout(step, 16);
  }, []);

  useEffect(
    () => () => {
      if (scrollAnimation.current !== null) {
        clearTimeout(scrollAnimation.current);
      }
    },
    []
  );

  const jumpTo = useCallback(
    (targetId: string, ownerId?: string) => {
      const scroll = () => {
        const target =
          document.getElementById(targetId) ?? elements.current.get(targetId);
        if (!target) return;

        // `getBoundingClientRect` doesn't know about `scroll-margin-top`
        // (only `scrollIntoView` resolves that), so it's read directly to
        // land the target the same distance below the sticky nav either way.
        const marginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const targetY = target.getBoundingClientRect().top + window.scrollY - marginTop;

        setActiveId(targetId);

        if (instant) window.scrollTo(0, targetY);
        else animateScrollTo(targetY);
      };

      // A subheading inside a collapsed body has no stable position until the
      // height transition finishes, so opening and scrolling in the same frame
      // would land somewhere between the two layouts.
      const mustOpen = ownerId !== undefined && !openIds.has(ownerId);
      if (ownerId !== undefined && mustOpen) {
        setOpenIds((current) => new Set(current).add(ownerId));
      }

      // This wait is for the *section's own* expand transition (governed by
      // `reducedMotion` alone, in `SectionCard.tsx`) settling before the
      // scroll math runs — independent of whether the scroll itself animates.
      if (mustOpen && !reducedMotion) window.setTimeout(scroll, EXPAND_MS);
      else if (mustOpen) requestAnimationFrame(scroll);
      else scroll();
    },
    // Depending on `openIds` costs nothing: the context value it feeds already
    // changes on every toggle, so the consumers re-render either way.
    [openIds, reducedMotion, instant, animateScrollTo]
  );

  /*
   * Scroll tracking by measurement rather than IntersectionObserver: sections
   * change height as they expand, and "the last heading that has passed the
   * reading line" stays correct through that, where a set of observer
   * thresholds has to be recomputed.
   */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE;
      let current: string | null = sectionIds[0] ?? null;

      for (const id of sectionIds) {
        const element = elements.current.get(id);
        if (element && element.getBoundingClientRect().top <= line) current = id;
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionIds]);

  const value = useMemo<ReaderValue>(
    () => ({
      isOpen: (id: string) => openIds.has(id),
      toggle,
      activeId,
      register,
      jumpTo,
    }),
    [openIds, activeId, toggle, register, jumpTo]
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}
