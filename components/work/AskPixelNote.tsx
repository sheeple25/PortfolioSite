"use client";

import { usePixel } from "@/components/pixel";
import styles from "./AskPixelNote.module.css";

/**
 * The landing page's corner note, upgraded from an aside to a door.
 *
 * The note is already Pixel's one standing line on an index (`IndexShell`'s
 * `note` prop), and it used to spend that line entirely on the recommendation.
 * But the chat — the site's most differentiating feature — was reachable only
 * through the nav pill, which nothing on the page ever pointed at. This keeps
 * the recommendation and spends the second half of the line advertising the
 * conversation, with the words themselves as the way in.
 *
 * A real `<button>`, not a styled span: it performs an action (opening the
 * sidebar), navigates nowhere, and must be reachable on a keyboard. `source:
 * "companion"` because the note sits in the companion's corner and reads as
 * his speech.
 */
export default function AskPixelNote({ pickTitle }: { pickTitle?: string }) {
  const { openChat } = usePixel();

  return (
    <>
      {pickTitle ? <>Start with {pickTitle}&hellip; or </> : <>I&rsquo;m Pixel — </>}
      <button
        type="button"
        className={styles.ask}
        onClick={() => openChat({ source: "companion" })}
      >
        ask me
      </button>{" "}
      about any of it.
    </>
  );
}
