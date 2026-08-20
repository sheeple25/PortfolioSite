"use client";

import { useEffect, useState } from "react";
import { COMPACT_QUERY } from "./breakpoints";

/**
 * Subscribe to a media query.
 *
 * Always starts `false` so the server render and the first client render agree;
 * the real value lands in the effect immediately after hydration. Anything that
 * would look broken for that one frame should be styled by CSS instead, which
 * has the answer before the first paint.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Mirrors the `@media (max-width: 640px)` blocks — see `lib/breakpoints.ts`. */
export function useCompactViewport(): boolean {
  return useMediaQuery(COMPACT_QUERY);
}
