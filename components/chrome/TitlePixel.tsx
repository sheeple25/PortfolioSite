"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pixel,
  SAY_ATTRIBUTE,
  useBlink,
  useFlash,
  useGaze,
  usePixel,
} from "@/components/pixel";
import type { Expression } from "@/components/pixel";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./TitlePixel.module.css";

/**
 * Pixel as the full stop of an index title.
 *
 * The landing masthead's one job is to say, in the first second, that this
 * site was *built* — and the rebus below it already established the page's
 * rhetorical device: marks standing in for words. This extends that device to
 * the title itself. The mascot — the most distinctive thing on the site, and
 * otherwise a 24px dot in the corner most visitors never notice — sits where
 * the period was, dozing until the cursor comes near, then waking and
 * following it. You meet the site's soul inside the first word you read.
 *
 * Consumes only the pixel module's public surface (`@/components/pixel`) —
 * a local `<Pixel>` mount with its own local state, the same model the footer
 * game reserves in `docs/PIXELBOT_BUILD.md` §12. It wears the session costume
 * (`usePixel().accessory`), so it and the corner companion read as the same
 * character in two places, not two mascots. It never touches the shared
 * `hidden`/`mood` state, so it cannot fight the companion's controllers.
 *
 * The sleep/wake machine is deliberately simple and local:
 *
 * - **Asleep at rest.** The page just opened; he wasn't expecting anyone.
 * - **A cursor inside `WAKE_RADIUS` wakes him** — a beat of surprise, then
 *   attention, blinking on an irregular beat and tracking the pointer.
 * - **A cursor that stays away drifts him back off** — drowsy first, then
 *   asleep, so the transition reads as a character losing interest rather
 *   than a state toggling.
 * - **Touch devices start him awake** — there is no pointer to approach with,
 *   and a permanently sleeping mascot reads as a static image. A tap gets a
 *   happy flash instead.
 *
 * Reduced motion pins him to the neutral expression with no listeners at all:
 * blinking, gaze snaps and the wake beat are all motion.
 */

/** Inside this distance (px from his centre), a pointer wakes him. */
const WAKE_RADIUS = 190;
/** Beyond this, the doze timer runs; between the two he stays awake. */
const FAR_RADIUS = 330;
/** How long the pointer must stay far away before he drifts off. */
const DOZE_AFTER_MS = 8000;
/** The drowsy beat between awake and asleep. */
const DROWSY_MS = 1400;
/** The wake beat. */
const SURPRISE_MS = 620;

type SleepState = "asleep" | "awake" | "drowsy";

export default function TitlePixel({ say }: { say?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const { accessory } = usePixel();

  const ref = useRef<HTMLSpanElement>(null);
  const look = useGaze(ref);
  const [state, setState] = useState<SleepState>("asleep");
  const [flashed, flash] = useFlash(SURPRISE_MS);
  const blinking = useBlink(state === "awake" && !reducedMotion);

  /* Timers live in refs — the machine below sets and clears across events. */
  const dozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drowsyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    /* No pointer to approach with — start awake instead of asleep. Same
       indirection `useMediaQuery` (lib/hooks.ts) uses for syncing state from
       a browser-only source, which satisfies `react-hooks/set-state-in-effect`. */
    if (window.matchMedia("(hover: none)").matches) {
      const wake = () => setState("awake");
      wake();
      return;
    }

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    /*
     * The machine's own copy of the state. Every transition happens inside
     * this effect (pointer, timers), so a closure variable keeps the wake
     * check pure — calling `flash` from inside a `setState` updater would be
     * a side effect in a function React is allowed to run twice.
     */
    let sleepState: SleepState = "asleep";
    const transition = (next: SleepState) => {
      sleepState = next;
      setState(next);
    };

    const clearTimers = () => {
      if (dozeTimer.current) clearTimeout(dozeTimer.current);
      if (drowsyTimer.current) clearTimeout(drowsyTimer.current);
      dozeTimer.current = null;
      drowsyTimer.current = null;
    };

    const startDozeCountdown = () => {
      if (dozeTimer.current) return;
      dozeTimer.current = setTimeout(() => {
        dozeTimer.current = null;
        transition("drowsy");
        drowsyTimer.current = setTimeout(() => {
          drowsyTimer.current = null;
          transition("asleep");
        }, DROWSY_MS);
      }, DOZE_AFTER_MS);
    };

    const apply = () => {
      frame = 0;
      const el = ref.current;
      if (!el || !pointer) return;

      const rect = el.getBoundingClientRect();
      const distance = Math.hypot(
        pointer.x - (rect.left + rect.width / 2),
        pointer.y - (rect.top + rect.height / 2)
      );

      if (distance < WAKE_RADIUS) {
        clearTimers();
        if (sleepState !== "awake") {
          flash("surprised");
          transition("awake");
        }
      } else if (distance > FAR_RADIUS) {
        startDozeCountdown();
      } else {
        /* The middle band: near enough to hold his attention, not to wake him. */
        clearTimers();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      clearTimers();
    };
  }, [reducedMotion, flash]);

  const expression: Expression = reducedMotion
    ? "default"
    : flashed ??
      (state === "asleep"
        ? "asleep"
        : state === "drowsy"
          ? "sleepy"
          : blinking
            ? "blink"
            : "default");

  return (
    <span
      ref={ref}
      className={styles.mark}
      {...(say ? { [SAY_ATTRIBUTE]: say } : {})}
      onClick={reducedMotion ? undefined : () => flash("happy", 900)}
    >
      <Pixel
        expression={expression}
        lookX={look.x}
        lookY={look.y}
        accessory={accessory}
        decorative
        className={styles.pixel}
      />
    </span>
  );
}
