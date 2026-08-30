"use client";

import { OpenBook, Row, Shelf, Spine } from "@/components/bookshelf/Shelf";
import { hash, SHOW_SPINE_IMAGERY, type SpineStyle } from "@/lib/bookshelf/spine";
import {
  PERSONAL_READING_LIST,
  type PersonalBook,
} from "@/lib/about/personalReadingList";
import styles from "./Bookshelf.module.css";

/*
 * The personal shelf. Its sibling is the thesis corpus at
 * `components/projects/figures/ReadingListShelf.tsx`.
 *
 * The two share their furniture — the scroll rail, the spine, the open-book
 * frame — via `components/bookshelf/Shelf.tsx`, and nothing else. That split
 * is deliberate and follows an earlier note here: the two data shapes are
 * genuinely different (curated `says`/`why`/`took` annotations there, a
 * Goodreads rating and review here) and threading both through one component
 * would be worse than having two. What that note got wrong was concluding the
 * *whole* component had to be duplicated: the spine math, the centering logic
 * and 117 lines of CSS were identical, and are now shared.
 *
 * The one real difference in spine handling: the corpus hand-authors a
 * colourway per book, because each was chosen for a reason. Goodreads data has
 * no equivalent curation, so the colourway here is generated from the id.
 */

/** A small set of coordinated spine colourways, in the site's own palette. */
const PALETTE: Array<Pick<SpineStyle, "bg" | "fg" | "font">> = [
  { bg: "#1e1e1e", fg: "#f2efe6", font: "serif" },
  { bg: "#eeece3", fg: "#232220", font: "mono" },
  { bg: "#0047ff", fg: "#f5f8fc", font: "sans" },
  { bg: "#3a1f3a", fg: "#f0a95c", font: "sans" },
  { bg: "#123c40", fg: "#8fd8d0", font: "mono" },
  { bg: "#efe9de", fg: "#5c5747", font: "serif" },
  { bg: "#8a2f1f", fg: "#f6ece4", font: "sans" },
  { bg: "#2b2b26", fg: "#d8d5cc", font: "serif" },
];

/** Same book, same spine, every render — see `hash` for why that matters. */
function spineStyle(book: PersonalBook): SpineStyle {
  const h = hash(book.id);
  const colour = PALETTE[h % PALETTE.length];
  return {
    ...colour,
    weight: 500 + ((h >> 5) % 3) * 100,
    italic: ((h >> 2) & 1) === 1,
    tracking: ((h >> 8) % 2) === 0 ? "0.03em" : "0.07em",
    caseStyle: ((h >> 3) & 1) === 1 ? "upper" : "normal",
    fontSize: `${(0.74 + ((h >> 6) % 4) * 0.06).toFixed(2)}rem`,
  };
}

/** `"Sat, 18 Jul 2026 00:00:00 +0000"` (Goodreads' raw RSS date) -> `"18 Jul 2026"`. */
function formatReadAt(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {"★★★★★".slice(0, rating)}
      <span className={styles.starEmpty}>{"★★★★★".slice(rating)}</span>
    </span>
  );
}

export default function Bookshelf({
  books = PERSONAL_READING_LIST,
  label = "Bookshelf",
}: {
  books?: PersonalBook[];
  label?: string;
}) {
  return (
    <Shelf
      items={books}
      getId={(book) => book.id}
      label={label}
      renderSpine={(book, open) => (
        <Spine
          id={book.id}
          label={book.title}
          title={`${book.title} — ${book.author}`}
          spine={spineStyle(book)}
          coverImage={SHOW_SPINE_IMAGERY ? book.coverPath : undefined}
          onSelect={open}
        />
      )}
      renderOpen={(book, close) => (
        <OpenBook
          cover={book.coverPath}
          coverAlt={`Cover of ${book.title}`}
          author={book.author}
          title={book.title}
          year={book.published}
          onClose={close}
        >
          {book.rating !== undefined && (
            <Row label="Rating">
              <Stars rating={book.rating} />
            </Row>
          )}
          {book.review && <Row label="Review">{book.review}</Row>}
          {book.readAt && <Row label="Finished">{formatReadAt(book.readAt)}</Row>}
        </OpenBook>
      )}
    />
  );
}
