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
import { usePrefersReducedMotion } from "@/lib/hooks";

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

  const elements = useRef(new Map<string, HTMLElement>());

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

  const jumpTo = useCallback(
    (targetId: string, ownerId?: string) => {
      const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

      const scroll = () => {
        const target =
          document.getElementById(targetId) ?? elements.current.get(targetId);
        target?.scrollIntoView({ behavior, block: "start" });
      };

      // A subheading inside a collapsed body has no stable position until the
      // height transition finishes, so opening and scrolling in the same frame
      // would land somewhere between the two layouts.
      const mustOpen = ownerId !== undefined && !openIds.has(ownerId);
      if (ownerId !== undefined && mustOpen) {
        setOpenIds((current) => new Set(current).add(ownerId));
      }

      if (mustOpen && !reducedMotion) window.setTimeout(scroll, EXPAND_MS);
      else if (mustOpen) requestAnimationFrame(scroll);
      else scroll();
    },
    // Depending on `openIds` costs nothing: the context value it feeds already
    // changes on every toggle, so the consumers re-render either way.
    [openIds, reducedMotion]
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
