"use client";

import { useReader } from "@/components/writing/ReaderContext";
import styles from "./case.module.css";

/**
 * The contents rail in the left margin, and the row list it is built from.
 *
 * Purpose-built rather than reusing `components/writing/Toc`: that one renders
 * `TocEntry` trees from `content/` with reading estimates and redaction counts,
 * none of which exist here, and its rows are a different object entirely — the
 * frames' rows are a mono index, a title, and an optional `[PROCESS]` tag, with
 * the current beat marked by colouring the index rather than moving the row.
 *
 * Below the rail's breakpoint the same rows are rendered again by
 * `ContentsBar`, in a sticky bar's dropdown sheet. That is why the list is its
 * own export: the two need different furniture around them, but the row is one
 * object and marking the active one is one rule.
 */

export type ContentsRow = {
  num: string;
  title: string;
  /** The frames' `[PROCESS]` marker. */
  tag?: string;
  /** The anchor this row scrolls to. Several rows may share one. */
  target: string;
};

/** The anchors the reader tracks — one per distinct target, in page order. */
export function sectionIds(rows: readonly ContentsRow[]): string[] {
  return [...new Set(rows.map((row) => row.target))];
}

/*
 * Marked by row rather than by target. Several rows can point at the same
 * anchor — the `[PROCESS]` rows all lead to one teaser — so comparing
 * `activeId` to each row's target lights all of them at once, which reads as
 * a bug rather than as "they are all behind this one door". Only the first
 * row holding the active target is marked.
 */
export function activeRowIndex(
  rows: readonly ContentsRow[],
  activeId: string | null,
): number {
  return rows.findIndex((row) => row.target === activeId);
}

/**
 * The rows themselves. `onNavigate` is what the sheet uses to close itself on
 * the way out; the rail passes nothing and never moves.
 */
export function ContentsList({
  rows,
  onNavigate,
}: {
  rows: readonly ContentsRow[];
  onNavigate?: () => void;
}) {
  const { activeId } = useReader();
  const active = activeRowIndex(rows, activeId);

  return (
    <ul className={styles.railList}>
      {rows.map((row, i) => (
        <li key={row.num}>
          <a
            href={`#${row.target}`}
            className={`${styles.railLink} ${
              i === active ? styles.railLinkActive : ""
            }`}
            aria-current={i === active ? "location" : undefined}
            onClick={onNavigate}
          >
            <span className={styles.railNum}>{row.num}</span>
            <span className={styles.railTitle}>{row.title}</span>
            {row.tag ? <span className={styles.railTag}>{row.tag}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Contents({
  rows,
  hidden,
}: {
  rows: readonly ContentsRow[];
  hidden: boolean;
}) {
  return (
    <nav
      className={`${styles.rail} ${hidden ? styles.railHidden : ""}`}
      aria-label="Contents"
      /*
       * Hidden here means slid out of the margin, not removed — the reader is
       * mid-scroll and it comes straight back. Marking it inert while it's off
       * screen keeps it out of the tab order in the meantime.
       */
      inert={hidden || undefined}
    >
      <p className={styles.railHeading}>Contents</p>
      <ContentsList rows={rows} />
    </nav>
  );
}
