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

/**
 * The attribute a page puts on anything Pixel should speak about:
 *
 * ```tsx
 * <button data-pixel-say="Vidush loves travelling — click to see where.">
 * ```
 *
 * A plain HTML attribute rather than a component or a hook, and that is the
 * point: it costs an author nothing, needs no import, and works on a server
 * component. The `/about` interest icons stay server-rendered and still talk.
 */
export const SAY_ATTRIBUTE = "data-pixel-say";

/**
 * How long the pointer has to rest on a target before Pixel says anything.
 * Without it he narrates every element a cursor crosses on its way somewhere
 * else, which reads as twitching rather than talking.
 */
const DWELL_MS = 260;

/**
 * How long a line survives the pointer leaving. Long enough to finish reading
 * it, and long enough that sweeping between two adjacent targets swaps the text
 * instead of blanking the corner in between.
 */
const QUIET_MS = 900;

/**
 * What Pixel should be saying about whatever the pointer is resting on, or
 * `null` for silence.
 *
 * One listener on the window rather than a handler per target: the attribute is
 * meant to be sprinkled anywhere, including onto markup this module never sees,
 * and `closest` finds it from the event's target no matter how deeply the
 * pointer landed inside it. Nesting resolves the way you would want, too — the
 * innermost annotated ancestor wins.
 *
 * Silent on touch. `data-pixel-say` describes a hover, and a coarse pointer has
 * none: the line would either never fire or fire on a tap that was meant for
 * the link underneath it.
 *
 * @param enabled Speech is suppressed while this is false — the chat sidebar
 *   being open, for instance, where Pixel is already talking.
 * @param resetKey Changing this clears the current line. The provider passes
 *   the pathname: the element being hovered unmounts on navigation without
 *   ever firing a `pointerout`, so nothing else would take the line down.
 */
export function useHoverSpeech(
  enabled: boolean,
  resetKey?: string,
): string | null {
  /*
   * The line is stored with the `resetKey` it was spoken under, and masked
   * during render when that no longer matches. A navigation therefore takes the
   * line down without an effect having to clear it — same shape as
   * `expandedFor` in `IndexShell`, and for the same reason: adjusting state
   * during render is what React asks for here, and clearing it from an effect
   * is a cascading render the lint rules reject outright.
   */
  const [spoken, setSpoken] = useState<{
    key: string | undefined;
    text: string | null;
  }>({ key: resetKey, text: null });

  useEffect(() => {
    if (!enabled) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    /*
     * What the pointer is over *now*, which is not what Pixel is saying — the
     * gap between the two is the dwell. Kept in a closure variable rather than
     * state because nothing renders from it; it exists only so a `pointerover`
     * onto a different element inside the same target is recognised as "no
     * change" and doesn't restart the timer.
     */
    let target: string | null = null;

    const onPointerOver = (event: PointerEvent) => {
      const el = event.target;
      if (!(el instanceof Element)) return;

      const next =
        el.closest(`[${SAY_ATTRIBUTE}]`)?.getAttribute(SAY_ATTRIBUTE)?.trim() ||
        null;
      if (next === target) return;
      target = next;

      if (timer) clearTimeout(timer);
      timer = setTimeout(
        () => setSpoken({ key: resetKey, text: next }),
        next === null ? QUIET_MS : DWELL_MS,
      );
    };

    window.addEventListener("pointerover", onPointerOver, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pointerover", onPointerOver);
    };
  }, [enabled, resetKey]);

  return enabled && spoken.key === resetKey ? spoken.text : null;
}
