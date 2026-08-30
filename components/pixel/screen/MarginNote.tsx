"use client";

import { useNotes } from "./NotesContext";
import styles from "./notes.module.css";

/**
 * The `[NOTE …]` block, at the point it was written.
 *
 * For an anchored note this renders nothing: the block is only a definition,
 * and the annotation itself opens above Pixel when a bold word calls for it.
 *
 * A note written with no anchors (`[NOTE: …]`) has no word to open it, so this
 * is the only place it could ever appear. Those set inline, in the same hand,
 * where the author put them.
 */
export default function MarginNote({ noteid }: { noteid?: string }) {
  const notes = useNotes();
  const note = noteid && notes ? notes.get(noteid) : undefined;

  if (!note || note.anchors.length > 0) return null;

  return (
    <span className={styles.standalone}>
      <span className={styles.standaloneRule} aria-hidden="true" />
      <span className={styles.standaloneText}>{note.text}</span>
    </span>
  );
}
