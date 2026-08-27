import type { ReactNode } from "react";

/**
 * Shapes for the `/writing` section.
 *
 * Two families live here and the split matters: `TocEntry`, `WritingNote` and
 * `WritingSummary` are plain data and cross the server/client boundary, while
 * `WritingSection` and `WritingDocument` carry already-rendered React trees and
 * must stay on the server. Rendered trees can be *passed* to a client component
 * as children — they just can't be serialised into its props as data.
 */

/** YAML block at the top of every file in `content/writing`. */
export type WritingFrontmatter = {
  title: string;
  /** Optional deck under the title. */
  subtitle?: string;
  /** Used for the index card, `<meta name="description">` and OG tags. */
  description: string;
  /** ISO `yyyy-mm-dd`. Drives sort order on the index. */
  date: string;
  /** Free-form revision label, e.g. `v4`. Shown next to the date. */
  version?: string;
  /**
   * Domain tags — subject matter/theme, e.g. `furniture`, `speculative design`.
   * Feeds the Work/Archive knowledge graph's Domain nodes (`lib/graph`); reuse
   * an existing label verbatim where the concept is the same, so it collapses
   * to one node instead of forking into a near-duplicate.
   */
  tags?: string[];
  /** Flags the piece on the index as the one to start with. */
  recommended?: boolean;
  /**
   * Splits every section into a preview and a body behind a toggle. On by
   * default, which suits a long essay. `/archive` turns it off: those entries
   * are already cut to the bone, so hiding half of one behind a button would
   * be concealing text that has nowhere left to shrink to.
   */
  expandable?: boolean;

  /*
   * Fields below are used by `/archive`, where an entry is a piece of work
   * rather than a piece of writing. They're optional on the shared type so the
   * one parser serves all three sections — `/writing` and `/projects` simply
   * leave them unset.
   */

  /** Where the work happened — studio, campus, client. Shown on the index. */
  place?: string;
  /**
   * Display label for when the work happened, e.g. `Fall 2024`. Shown on the
   * index card in place of the exact date, which is kept in `date` for sorting
   * and for the entry's own masthead. Falls back to the formatted date.
   */
  term?: string;
  /** Discipline label: `PRODUCT`, `TRANSPORT`, `TEXTILE`… Sets the tile accent. */
  category?: ArchiveCategory;
  /** Explicit index order, ascending. Archive is ranked, not chronological. */
  rank?: number;
  /** Masthead credits, rendered as a block above the first section. */
  role?: string;
  timeline?: string;
  team?: string;
  /**
   * Skills/Tools tags, e.g. `Product Design`, `CAD Modelling`. Feeds the
   * Work/Archive knowledge graph's Skill/Tool nodes (`lib/graph`) — a
   * separate node type from Domain tags above, even where a label looks
   * similar (a "Textile Design" skill and a "textile" domain aren't the same
   * node). Reuse an existing label verbatim so it collapses correctly.
   */
  skills?: string[];
  /** Index tile image, as a path under `/public`. */
  cover?: string;
  coverAlt?: string;
  /**
   * Which title animation the document header uses. Keys are resolved against
   * the registry in `components/archive/titleEffects`.
   */
  titleEffect?: string;
  /**
   * Hides the whole document from the index, sitemap and static params in a
   * production build. It still renders in dev so you can work on it.
   */
  draft?: boolean;
};

/**
 * The disciplines an archive entry can belong to. Each maps to an accent colour
 * carried over from the printed portfolio's contents page, so a tile reads as
 * the same category it did there.
 */
export type ArchiveCategory =
  | "product"
  | "transport"
  | "research"
  | "furniture"
  | "textile";

/**
 * A `[NOTE …]` aside. Plain data, because both the margin rail and Pixel's
 * narrator need it on the client — the margin note renders where the note was
 * written, and any bold word listed in `anchors` can call the same text up.
 */
export type WritingNote = {
  id: string;
  /** Slugified bold spans that trigger it, anywhere in the document. */
  anchors: string[];
  text: string;
  /** Id of the section it was written in, for the "jump to it" affordance. */
  sectionId: string | null;
};

/** One entry in the jump-to sidebar. Plain data — safe to hand to the client. */
export type TocEntry = {
  id: string;
  title: string;
  /** Subheadings nested under the section that owns them. */
  children: Array<{ id: string; title: string }>;
  /** Marked with `<!-- private -->`; only ever true in a dev build. */
  private: boolean;
  wordCount: number;
  /**
   * Blocks sitting behind the expand toggle. Zero means the section is preview
   * only and renders without a toggle at all.
   */
  hiddenBlocks: number;
};

/** A parsed section. `preview` and `body` are rendered React trees. */
export type WritingSection = {
  id: string;
  title: string;
  private: boolean;
  wordCount: number;
  hiddenBlocks: number;
  /** Everything above `Expanded:` — always visible. */
  preview: ReactNode;
  /** Everything below it, or `null` when the section is preview only. */
  body: ReactNode | null;
};

export type WritingDocument = {
  slug: string;
  meta: WritingFrontmatter;
  /** Anything before the first section heading, if the file opens with one. */
  lead: ReactNode | null;
  sections: WritingSection[];
  toc: TocEntry[];
  notes: WritingNote[];
  wordCount: number;
  readingMinutes: number;
  /** True when this build is showing sections the author marked private. */
  showsPrivate: boolean;
};

/** Index-card view of a document. Plain data. */
export type WritingSummary = {
  slug: string;
  meta: WritingFrontmatter;
  wordCount: number;
  readingMinutes: number;
  /** Public section titles, used as a contents teaser on the card. */
  sectionTitles: string[];
  noteCount: number;
};
