"use client";

import { cn } from "@/lib/utils";
import { useNotes } from "./NotesContext";
import styles from "./notes.module.css";

/**
 * A bold word that has a note behind it.
 *
 * The trigger only raises the note — `AnnotationPanel` is what shows it, above
 * Pixel in the corner. Keeping the text out of here is what lets one note be
 * reached from several words in different sections without the answer appearing
 * in a different place each time.
 */
export default function NoteRef({
  noteid,
  children,
}: {
  noteid?: string;
  children?: React.ReactNode;
}) {
  const notes = useNotes();
  const note = noteid && notes ? notes.get(noteid) : undefined;

  // Outside a provider — or if the note it names was stripped from this build —
  // it degrades to the plain `<strong>` the markdown asked for, rather than
  // offering a control that does nothing.
  if (!note || !notes || !noteid) return <strong>{children}</strong>;

  const active = notes.activeId === noteid;

  return (
    <button
      type="button"
      className={cn(styles.ref, active && styles.refActive)}
      onClick={() => notes.speak(noteid)}
      aria-expanded={active}
    >
      <strong>{children}</strong>
      <span className={styles.refMark} aria-hidden="true">
        ?
      </span>
      {/*
        No `aria-label`: one note can be reached from several different bold
        words, so naming the button after the note would announce a word other
        than the one on screen. Letting the accessible name come from the text
        keeps them the same, and this suffix says what pressing it does.
      */}
      <span className="sr-only"> — has a note</span>
    </button>
  );
}
