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
import type { Expression } from "./sprites";

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
  const [reaction, setReaction] = useState<Expression | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hidden, setHidden] = useState(false);

  const react = useCallback((expression: Expression, ms = 900) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction(expression);
    reactionTimer.current = setTimeout(() => setReaction(null), ms);
  }, []);

  useEffect(() => {
    return () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, []);

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
 * Handy for a 404 page: `usePixelMood("dead")`.
 */
export function usePixelMood(expression: Expression | null) {
  const { setMood } = usePixel();

  useEffect(() => {
    setMood(expression);
    return () => setMood(null);
  }, [expression, setMood]);
}
