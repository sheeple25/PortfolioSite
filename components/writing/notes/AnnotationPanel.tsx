"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
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
 */
export default function AnnotationPanel() {
  const notes = useNotes();
  const reducedMotion = usePrefersReducedMotion();

  const active = notes?.activeId ? notes.get(notes.activeId) : undefined;

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
          <button
            type="button"
            className={styles.panelClose}
            onClick={() => notes?.dismiss()}
          >
            close
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
