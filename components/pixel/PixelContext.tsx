"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFlash } from "./hooks";
import type { Expression } from "./sprites";

/** Reactions raised through the context linger slightly longer than a local flash. */
const REACTION_MS = 900;

type PixelContextValue = {
  /** Explicit override from a page. `null` hands control back to the companion. */
  mood: Expression | null;
  setMood: (mood: Expression | null) => void;
  /** A short-lived expression that outranks everything, then reverts. */
  reaction: Expression | null;
  react: (expression: Expression, ms?: number) => void;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const PixelContext = createContext<PixelContextValue | null>(null);

export function PixelProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<Expression | null>(null);
  const [hidden, setHidden] = useState(false);
  const [reaction, react] = useFlash(REACTION_MS);

  const value = useMemo(
    () => ({ mood, setMood, reaction, react, hidden, setHidden }),
    [mood, reaction, react, hidden],
  );

  return <PixelContext.Provider value={value}>{children}</PixelContext.Provider>;
}

export function usePixel(): PixelContextValue {
  const ctx = useContext(PixelContext);
  if (!ctx) {
    throw new Error("usePixel must be used inside <PixelProvider> (see app/layout.tsx)");
  }
  return ctx;
}

/**
 * Pin Pixel to a mood for as long as this component is mounted, then release it.
 * Used by the 404 page as `usePixelMood("dead")`.
 */
export function usePixelMood(expression: Expression | null) {
  const { setMood } = usePixel();

  useEffect(() => {
    setMood(expression);
    return () => setMood(null);
  }, [expression, setMood]);
}
