"use client";

import { OpenBook, Row, Shelf, Spine } from "@/components/bookshelf/Shelf";
import type { SpineStyle } from "@/lib/bookshelf/spine";
import { READING_LIST, type ReadingListEntry } from "@/lib/projects/readingList";
import type { DiagramProps } from "./index";
import styles from "./ReadingListShelf.module.css";

/*
 * The thesis corpus shelf. Its sibling is the personal shelf at
 * `components/about/Bookshelf.tsx`; the furniture they share lives in
 * `components/bookshelf/Shelf.tsx`.
 *
 * What stays here is what's actually specific to the corpus: every spine is
 * hand-authored per book (each one was chosen for a reason, so none of it is
 * generated), and an entry is either a text with three curated annotations or
 * a corpus item with a single note.
 */

const KIND_LABEL: Record<ReadingListEntry["kind"], string> = {
  text: "Reading List",
  "corpus-selected": "Corpus — Selected",
  "corpus-rejected": "Corpus — Rejected",
};

/**
 * The stored spine, filled out to a complete `SpineStyle`.
 *
 * The data leaves most fields optional so an entry only has to state what it
 * wants to differ; the defaults below are what the shelf used to inline at
 * each read site.
 */
function spineStyle(entry: ReadingListEntry): SpineStyle {
  const { spine } = entry;
  return {
    bg: spine.bg,
    fg: spine.fg,
    font: spine.font,
    weight: spine.weight ?? 500,
    italic: spine.italic ?? false,
    tracking: spine.tracking ?? "0.02em",
    caseStyle: spine.caseStyle === "upper" ? "upper" : "normal",
    fontSize: spine.fontSize ?? "0.8rem",
  };
}

export default function ReadingListShelf({ label }: DiagramProps) {
  return (
    <Shelf
      items={READING_LIST}
      getId={(entry) => entry.id}
      label={label}
      renderSpine={(entry, open) => (
        <Spine
          id={entry.id}
          label={entry.spineLabel ?? entry.title}
          title={`${entry.title}${entry.year ? ` (${entry.year})` : ""}`}
          spine={spineStyle(entry)}
          onSelect={open}
        />
      )}
      renderOpen={(entry, close) => (
        <OpenBook
          cover={entry.cover}
          coverAlt={`Cover of ${entry.title}`}
          author={entry.author}
          title={entry.title}
          year={entry.year}
          tag={<span className={styles.kindTag}>{KIND_LABEL[entry.kind]}</span>}
          onClose={close}
        >
          {entry.kind === "text" ? (
            <>
              <Row label="What it says">
                {entry.says}
                {entry.saysCite && <sup className={styles.cite}>{entry.saysCite}</sup>}
              </Row>
              <Row label="Why this text">{entry.why}</Row>
              <Row label="What I took from it">{entry.took}</Row>
            </>
          ) : (
            <Row label="Note">{entry.blurb}</Row>
          )}
        </OpenBook>
      )}
    />
  );
}
