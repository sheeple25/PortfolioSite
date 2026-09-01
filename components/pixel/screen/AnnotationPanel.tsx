"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { usePixel } from "../PixelContext";
import { useNotes } from "./NotesContext";
import styles from "./notes.module.css";

/**
 * The open annotation, set directly above Pixel in the bottom-right corner.
 *
 * Mounted once per page rather than at each trigger. An annotation used to sit
 * beside the word that opened it, which meant it inherited that word's
 * position — including being clipped inside a collapsed section, or floating
 * halfway up a long paragraph. Anchoring it to the mascot instead gives every
 * note one predictable home: wherever you are in the document, the answer
 * appears in the same place, next to the character doing the explaining.
 *
 * Both this and the mascot are positioned from `--shell-inset`, so they share a
 * right margin with the text without either one measuring the other.
 *
 * It also leaves when Pixel does. The panel is fixed and rides `--corner-lift`,
 * so once the footer opens it would be left floating over a black panel it was
 * never designed against — a note anchored to the mascot, hanging in a room the
 * mascot has already walked into. Reaching the footer is the end of the
 * document and the end of the reading, so the note goes with it.
 */
export default function AnnotationPanel() {
  const notes = useNotes();
  const { atFooter } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  const open = notes?.activeId ? notes.get(notes.activeId) : undefined;
  // `AnimatePresence` still runs the exit transition, so it slides away rather
  // than being cut off mid-sentence as the footer arrives.
  const active = atFooter ? undefined : open;

  return (
    <AnimatePresence>
      {active && (
        <motion.aside
          key={active.id}
          className={styles.panel}
          role="note"
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={styles.panelText}>{active.text}</p>
          <div className={styles.panelActions}>
            {/*
              The handoff into InChat. Everything above this line is free and
              hand-authored; pressing this is the visitor choosing to spend a
              turn, and it carries the note across as context so the
              conversation opens knowing what they were reading.
            */}
            <button
              type="button"
              className={styles.panelAsk}
              onClick={() => notes?.askInChat(active.id)}
            >
              say something more
            </button>
            <button
              type="button"
              className={styles.panelClose}
              onClick={() => notes?.dismiss()}
            >
              close
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
