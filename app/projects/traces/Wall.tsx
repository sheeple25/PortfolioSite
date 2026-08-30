import { Fragment } from "react";
import styles from "@/components/case-study/case.module.css";
import { WALL_ROWS, WALL_SENTENCE, wallRowDuration, type WallToken } from "./wallText";

/**
 * Traces' banner texture: the wall of failure modes, as lines that each scroll
 * on their own.
 *
 * This is the one part of the banner that is Traces' alone — Loco Lavatory and
 * Unflattening fill the same slot with a photograph. It is passed to the shared
 * `Banner` as its texture, which is why it is a bare fragment of layers rather
 * than a component that positions itself.
 */

/**
 * One line of the wall, as a marquee.
 *
 * The row's phrases are rendered twice inside a `max-content` track that
 * translates by exactly -50%. At the halfway point the second copy sits exactly
 * where the first started, so the loop restarts on an identical frame and the
 * seam is invisible. The second copy is `aria-hidden` — it is the same text,
 * and a screen reader should not hear the wall twice (it hears the sentence
 * instead, from the label on the container).
 *
 * Direction alternates by row index and the duration varies per row, so no two
 * neighbouring lines travel together.
 */
function WallRow({ row, index }: { row: WallToken[]; index: number }) {
  const copy = (
    <span className={styles.wallRowCopy}>
      {row.map((token, i) => (
        <Fragment key={i}>
          {token.said ? (
            <strong className={styles.wallSaid}>{token.text}</strong>
          ) : (
            token.text
          )}
          {", "}
        </Fragment>
      ))}
    </span>
  );

  return (
    <div className={styles.wallRow}>
      <div
        className={`${styles.wallRowTrack} ${
          index % 2 === 1 ? styles.wallRowTrackReverse : ""
        }`}
        style={{ "--row-duration": `${wallRowDuration(index)}s` } as React.CSSProperties}
      >
        {copy}
        <span aria-hidden="true">{copy}</span>
      </div>
    </div>
  );
}

export default function Wall() {
  return (
    /*
     * The wall is decoration with a sentence inside it. Hiding the rows
     * outright would hide the sentence too, so the container is labelled with
     * the sentence it spells — a screen reader gets the one thing worth
     * hearing, not two thousand comma-separated fragments drifting apart.
     */
    <div className={styles.wallRows} role="img" aria-label={WALL_SENTENCE}>
      {WALL_ROWS.map((row, i) => (
        <WallRow key={i} row={row} index={i} />
      ))}
    </div>
  );
}
