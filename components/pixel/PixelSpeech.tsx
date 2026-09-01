"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { usePixel } from "./PixelContext";
import styles from "./PixelSpeech.module.css";

/**
 * Pixel saying the line on whatever the pointer is resting on.
 *
 * Mounted once in the root layout, beside the mascot, because `data-pixel-say`
 * is meant to work anywhere — the home page and the hand-built case studies
 * have no annotation column and no index note, and without this they would be
 * the two places the attribute silently did nothing.
 *
 * It defers rather than competes. On an index, `IndexShell` renders the line in
 * its own corner note; on a document page with an annotation open, that note is
 * what the visitor deliberately asked for. Both hold `useCornerSlot`, and this
 * stands down while either does — see `cornerClaimed` in `PixelContext`.
 *
 * `aria-hidden`, like the mascot itself. The line paraphrases an element the
 * visitor is already pointing at, and that element announces its own name; a
 * screen reader reaching this would hear the same thing twice, the second time
 * without the control attached to it.
 */
export default function PixelSpeech() {
  const { saying, cornerClaimed, atFooter, hidden, chatOpen } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  /*
   * Goes when the mascot goes. The box rides `--corner-lift` and is anchored
   * off `--companion-size`, so with Pixel hidden or arrived at the footer it
   * would be a caption with nothing to caption.
   */
  const line =
    cornerClaimed || atFooter || hidden || chatOpen ? null : saying;

  return (
    <AnimatePresence>
      {line && (
        /*
          One element with a fixed key rather than one per line: keying on the
          text makes every change a full exit and enter, and since all of them
          are positioned in the same corner the outgoing and incoming boxes
          would overlap. Sweeping across a row of targets should read as Pixel
          changing his mind, not as boxes piling up.
        */
        <motion.aside
          key="speech"
          className={styles.speech}
          aria-hidden="true"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {line}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
