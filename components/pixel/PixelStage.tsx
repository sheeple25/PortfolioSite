"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Pixel from "./Pixel";
import { useCornerSlot, usePixel } from "./PixelContext";
import { useGaze } from "./hooks";
import { useCompanionMind } from "./useCompanionMind";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./PixelStage.module.css";

/**
 * Pixel on stage: the corner companion's mind in a body the page lays out.
 *
 * The home page introduces him, and an introduction to a 24px dot in a corner
 * is no introduction. This is the same character — `useCompanionMind` is the
 * one brain both bodies share, so he drifts off, brightens at a link, jolts
 * at a click and wears the session costume exactly as he does everywhere else
 * — but drawn at whatever size the page gives the box, in the page's flow.
 *
 * **He talks here the way he talks everywhere.** `PixelSpeech` draws his
 * `data-pixel-say` line in a fixed box above the corner; on a route where he
 * is on stage that corner is empty, so the box would caption nothing. The
 * stage claims the corner (`useCornerSlot`, the same claim `IndexShell` makes)
 * and draws the line itself, in the same box, above his own head. With no
 * hover line the box holds his standing `greeting`.
 *
 * **Answers are typed; the standing greeting need not be.** A hover line is
 * him replying to you, and a reply arrives one character at a time. The
 * greeting is only what is written on the box before you have asked
 * anything — on the home page it lands at the end of a timed intro, where
 * waiting another two seconds for a sentence nobody prompted is dead air.
 * `typeGreeting` lets the page say so; hover lines type either way.
 *
 * The page owns the box he stands in and anything that moves it (the home
 * hero flies its box to the corner on exit); this component only fills it.
 */

/** Seconds per character when he types. Faster than a person, slower than a paste. */
const TYPE_MS = 22;

/**
 * The line, arriving one character at a time.
 *
 * Kept as `{ text, count }` so a new line resets *during render* rather than
 * from an effect — the same shape as `useHoverSpeech`'s `resetKey`, for the
 * same lint-enforced reason. The interval only ever advances the count.
 */
function useTyped(text: string | null, enabled: boolean) {
  const [typed, setTyped] = useState<{ text: string | null; count: number }>(
    { text, count: enabled ? 0 : Infinity },
  );

  if (typed.text !== text) {
    setTyped({ text, count: enabled ? 0 : Infinity });
  }

  const length = text?.length ?? 0;
  const typing = enabled && typed.count < length;

  useEffect(() => {
    if (!typing) return;
    const id = setInterval(
      () => setTyped((prev) => ({ ...prev, count: prev.count + 1 })),
      TYPE_MS,
    );
    return () => clearInterval(id);
  }, [typing]);

  return {
    shown: text ? text.slice(0, Math.min(typed.count, length)) : "",
    typing,
  };
}

export default function PixelStage({
  awake = true,
  greeting = null,
  typeGreeting = true,
  speaking = true,
  onClick,
  label = "Ask Pixel anything",
}: {
  /** `false` holds him asleep — see `useCompanionMind`. */
  awake?: boolean;
  /** What he says when nothing is being pointed at. `null` for silence. */
  greeting?: string | null;
  /** `false` puts the greeting up whole. Hover lines still type. */
  typeGreeting?: boolean;
  /** `false` takes the speech box down — for the moment he leaves the stage. */
  speaking?: boolean;
  /** The stage-sized control over the sprite. A pet is thrown in regardless. */
  onClick?: () => void;
  label?: string;
}) {
  const { accessory, saying, chatOpen } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  /* The corner is ours while we are on stage: `PixelSpeech` stands down. */
  useCornerSlot();

  const spriteRef = useRef<HTMLDivElement>(null);
  const look = useGaze(spriteRef);
  const { expression, flash, asleep } = useCompanionMind({ awake });

  /*
   * A hover line outranks the greeting, and both go quiet while the chat is
   * open — he is already talking in there. `saying` is already `null` while
   * the sidebar is open (the provider suppresses it), so only the greeting
   * needs the check here.
   */
  const audible = speaking && !chatOpen;
  const answer = audible ? saying : null;
  const line = answer ?? (audible ? greeting : null);
  /* An answer always types. The greeting types only if the page asked for it. */
  const { shown, typing } = useTyped(
    line,
    !reducedMotion && (answer !== null || typeGreeting),
  );

  return (
    <div className={styles.stage}>
      <AnimatePresence>
        {line ? (
          <motion.aside
            key="speech"
            className={styles.speech}
            data-typing={typing || undefined}
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {shown}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div ref={spriteRef} className={styles.body}>
        <Pixel
          expression={expression}
          lookX={look.x}
          lookY={look.y}
          /* Whole cells at roughly the size the CSS gives him — the bob steps
             in units of this, and a step of a fraction of a cell would soften
             the pixel art. The stylesheet stretches the svg to the box. */
          size={192}
          accessory={accessory}
          bob={!reducedMotion && !asleep}
          decorative
          className={styles.pixel}
        />
        {/* The full-stage hit area: a pet on the way in, and whatever the page
            wants a click on him to do. The decorative svg never becomes the
            control itself. */}
        <button
          type="button"
          className={styles.pet}
          aria-label={label}
          onClick={() => {
            flash("happy", 900);
            onClick?.();
          }}
        />
      </div>
    </div>
  );
}
