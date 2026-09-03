"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { usePixel } from "./PixelContext";
import { useBlink, useFlash } from "./hooks";
import type { Expression } from "./sprites";

/**
 * Pixel's mind, separated from Pixel's body.
 *
 * Everything the corner companion does that is *him* rather than *where he
 * is* — drifting off after a while of nothing, brightening when the cursor
 * rests on something clickable, jolting at a click anywhere, the mood a page
 * pins, the reaction a page fires, and the involuntary blink over all of it —
 * lived inside `PixelCompanion`. That was fine while he had one body. The
 * home page gives him a second, bigger one on stage, and Vidush's brief was
 * explicit: it must be *the same* Pixel, not a look-alike with fewer habits.
 * One mind, two bodies — the hook is the mind; `PixelCompanion` and
 * `PixelStage` are the bodies.
 *
 * Resolution order, highest first. A page's `react()` beats everything; the
 * body's own short flash (a pet, a click) beats a pin; a pin (`setMood`, the
 * 404's "dead") beats the drift; `awake: false` sits just under the pins so a
 * stage can hold him asleep until his cue without a reaction being swallowed;
 * then the idle drift, the hover brightening, the route's resting mood, and
 * finally "default".
 */

/** Mood Pixel settles into on each route, unless a page says otherwise. */
const ROUTE_MOODS: Record<string, Expression> = {
  "/": "default",
  "/about": "happy",
  "/projects": "surprised",
};

const SLEEPY_AFTER = 9_000;
const ASLEEP_AFTER = 20_000;

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary';

export type CompanionMind = {
  /** What to draw this frame — blink already folded in. */
  expression: Expression;
  /** A short-lived expression of the body's own (a pet, a click). */
  flash: (expression: Expression, ms?: number) => void;
  /** True once the drift has taken him all the way under — the bob stops. */
  asleep: boolean;
};

export function useCompanionMind({
  awake = true,
}: {
  /**
   * `false` holds him asleep regardless of activity — the home stage keeps
   * him under until the intro's cue. A `react()` or a `flash()` still gets
   * through, which is how the cue itself (a surprised jolt) is delivered.
   */
  awake?: boolean;
} = {}): CompanionMind {
  const pathname = usePathname();
  const { mood, reaction } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  const [idle, setIdle] = useState<"awake" | "sleepy" | "asleep">("awake");
  const [hoveringTarget, setHoveringTarget] = useState(false);
  const [localReaction, flash] = useFlash();

  // --- idle drift + hover awareness ---------------------------------------
  useEffect(() => {
    let sleepyTimer: ReturnType<typeof setTimeout>;
    let asleepTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      setIdle((current) => (current === "awake" ? current : "awake"));
      clearTimeout(sleepyTimer);
      clearTimeout(asleepTimer);
      sleepyTimer = setTimeout(() => setIdle("sleepy"), SLEEPY_AFTER);
      asleepTimer = setTimeout(() => setIdle("asleep"), ASLEEP_AFTER);
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setHoveringTarget(Boolean(target.closest(INTERACTIVE)));
    };

    const onPointerDown = () => {
      resetIdle();
      flash("surprised", 500);
    };

    window.addEventListener("pointermove", resetIdle, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("scroll", resetIdle, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(sleepyTimer);
      clearTimeout(asleepTimer);
      window.removeEventListener("pointermove", resetIdle);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("scroll", resetIdle);
    };
  }, [flash]);

  // --- resolve the expression --------------------------------------------
  // Order matters: a page that pins a mood (a 404 saying "dead") must not drift
  // off to sleep, but a deliberate reaction still gets to interrupt it.
  const idleMood: Expression | null =
    idle === "asleep" ? "asleep" : idle === "sleepy" ? "sleepy" : null;

  const hoverMood: Expression | null = hoveringTarget ? "happy" : null;

  const held: Expression | null = awake ? null : "asleep";

  const expression: Expression =
    reaction ??
    localReaction ??
    held ??
    mood ??
    idleMood ??
    hoverMood ??
    ROUTE_MOODS[pathname] ??
    "default";

  const canBlink =
    expression !== "asleep" && expression !== "dead" && expression !== "blink";

  const blinking = useBlink(!reducedMotion && canBlink);

  return {
    expression: blinking ? "blink" : expression,
    flash,
    asleep: expression === "asleep",
  };
}
