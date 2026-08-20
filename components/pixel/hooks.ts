"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Expression } from "./sprites";

/** Below this many px from the cursor, Pixel looks straight ahead. */
const GAZE_DEAD_ZONE = 40;
/** ~22.5 degrees: the angle at which a diagonal becomes a cardinal direction. */
const GAZE_THRESHOLD = 0.38;

const quantise = (n: number) =>
  n > GAZE_THRESHOLD ? 1 : n < -GAZE_THRESHOLD ? -1 : 0;

/**
 * Snaps the cursor's direction from `ref`'s centre onto the nine gaze cells.
 * rAF-throttled, and the setter bails when the cell hasn't changed — the
 * quantised output only moves nine times across the whole viewport, so
 * re-rendering on every raw pointer event would be almost entirely wasted.
 */
export function useGaze(ref: React.RefObject<HTMLElement | null>) {
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      const el = ref.current;
      if (!el || !pointer) return;

      const rect = el.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);

      const next =
        distance < GAZE_DEAD_ZONE
          ? { x: 0, y: 0 }
          : { x: quantise(dx / distance), y: quantise(dy / distance) };

      setLook((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [ref]);

  return look;
}

/** Involuntary blink on an irregular beat, so it never looks metronomic. */
export function useBlink(enabled: boolean): boolean {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let openTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      openTimer = setTimeout(() => {
        setBlinking(true);
        closeTimer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 110);
      }, 2400 + Math.random() * 3600);
    };

    schedule();

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      // Teardown can land inside the 110ms shut window — Pixel falling asleep
      // disables blinking. Without this the eyes would still be closed when it
      // wakes, and stay that way until the next blink cycle came round.
      setBlinking(false);
    };
  }, [enabled]);

  return blinking;
}

/** A short-lived expression that reverts on its own. */
export function useFlash(defaultMs = 700): [
  Expression | null,
  (expression: Expression, ms?: number) => void,
] {
  const [flashed, setFlashed] = useState<Expression | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(
    (expression: Expression, ms = defaultMs) => {
      if (timer.current) clearTimeout(timer.current);
      setFlashed(expression);
      timer.current = setTimeout(() => setFlashed(null), ms);
    },
    [defaultMs],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return [flashed, flash];
}
