import type { WritingFrontmatter, WritingSummary } from "@/lib/writing/types";

/*
 * The entry model — one shape for every piece of work on the site.
 *
 * Before this module there were two collections (`lib/projects`, `lib/archive`)
 * and two kinds of project inside them (hand-built React pages registered in
 * `lib/caseStudies.ts`, and markdown documents parsed by the `/writing`
 * reader). Four surfaces had to understand all of it: the two indexes, the
 * knowledge graph, the sitemap and Pixel's system prompt.
 *
 * That split was never about the work. Traces and Loco lived in
 * `content/archive` and were promoted to Work when they got built out — the
 * archive's `rank` sequence still starts at 3 because ranks 1 and 2 walked
 * out. What actually separated Work from Archive was depth of treatment, and
 * depth of treatment is what `mode` records below.
 *
 * So there is now one registry, and two independent fields on each entry:
 *
 *   - `mode`    — what clicking the entry's tile does.
 *   - `section` — which index the tile appears on.
 *
 * Neither is derived from the other, because they answer different questions.
 * A fully built case study can still belong in the Archive (older work that
 * doesn't fit the current story), and a Work project can be a bare redirect
 * while it's waiting to be written.
 *
 * The design rule this file exists to enforce: **changing `mode` or `section`
 * must never require rebuilding content or moving a file.** Everything that
 * follows from that:
 *
 *   - every payload (`peek`, `link`) lives on the entry regardless of which
 *     mode is selected, so switching back finds its content still there;
 *   - peek content is *derived* from the same `meta` every mode already has,
 *     so flipping something to `peek` costs zero authoring;
 *   - the canonical URL is `/projects/<slug>` for every entry whatever its
 *     section, so moving Work↔Archive never changes a link;
 *   - all markdown lives in one pool (`content/projects`), so moving sections
 *     never moves a file.
 */

/**
 * What a tile click does. Exactly one of these is live at a time — which is
 * why it's a union and not three booleans. Three booleans describe eight
 * states, five of which are nonsense (two modes at once, or none), and no
 * amount of care at the call site can make those unrepresentable.
 */
export type EntryMode =
  /** Opens the entry's own page — a React case study or a parsed document. */
  | "case-study"
  /** Slides a large picture-in-picture card over the index. No navigation. */
  | "peek"
  /** Goes straight out to another URL. */
  | "link";

/** Which index the entry is listed on. A view, not a schema — see above. */
export type EntrySection = "work" | "archive";

/**
 * How much room the entry's tile takes on the work board — 1 is widest, 3 is
 * the base size an unmarked entry gets.
 *
 * A separate field rather than a reading of `section`, for the same reason
 * `mode` is: they answer different questions. `section` says which index lists
 * the work; emphasis says how loudly the board should point at it, and the
 * second tier is archive work (Kobble, Vashi, Flux) that the section split
 * cannot see. Three named tiers rather than a free number so the rail keeps a
 * legible rhythm — a strip where every tile is its own width reads as noise,
 * not ranking.
 */
export type EntryEmphasis = 1 | 2 | 3;

/** A destination outside the entry's own page. */
export type EntryLink = {
  href: string;
  /** Button text. "Open the PDF", "View on Behance" — say where it goes. */
  label: string;
  /**
   * Opens in a new tab with `rel="noreferrer"`. Inferred from `href` when
   * omitted, so an absolute URL doesn't need to say so twice.
   */
  external?: boolean;
};

/**
 * Overrides for the peek card.
 *
 * Every field is optional and every field falls back to `meta`, because the
 * whole point is that flipping an entry to `peek` requires no new content. An
 * entry with no `peek` block at all still peeks correctly — it just shows its
 * cover, title, subtitle and description, which is exactly what its index tile
 * already had. Fill these in only where the card should say something the
 * index card doesn't.
 */
export type PeekContent = {
  /** Defaults to `meta.title`. */
  headline?: string;
  /** Defaults to `meta.subtitle ?? meta.description`. */
  blurb?: string;
  /**
   * Extra plates below the cover. The cover itself is always shown first and
   * doesn't need repeating here.
   */
  images?: Array<{ src: string; alt: string; caption?: string }>;
  /** Small label/value pairs — "Role", "Timeline". Defaults to `meta`'s. */
  facts?: Array<{ label: string; value: string }>;
  /**
   * A way onward from the card. This is the field that makes `peek` and the
   * other two modes non-exclusive in practice: a peek can end in "read the
   * full case study" or "open the original PDF". Defaults to the entry's own
   * page when one exists, then to `link`.
   */
  onward?: EntryLink;
};

/**
 * Where an entry's metadata and body come from.
 *
 * Disjoint by construction: a slug is either a hand-built React page under
 * `app/projects/<slug>/`, a markdown file in `content/projects/`, or neither.
 * `page` and `external` entries carry their metadata inline because there is
 * no prose file to read it from; `document` entries read it from frontmatter,
 * which stays the right home for content metadata.
 *
 * `external` is the case where the work exists but not here — a PDF, a
 * Behance post, a site built somewhere else — and rebuilding it locally isn't
 * wanted. It has enough metadata to draw an index tile and a peek card, and
 * no page of its own.
 */
export type EntrySource =
  | {
      kind: "page";
      meta: WritingFrontmatter;
      /**
       * Beats in the contents rail, mirroring the page's own `CONTENTS`. Kept
       * in step by hand — the rail is a client constant inside a `"use client"`
       * page and can't be imported server-side without dragging the whole page
       * into the graph.
       */
      sectionTitles: string[];
      /**
       * Hand-set rather than counted. There's no prose file to measure, and
       * these pages are half figures, so a word count reads short.
       */
      readingMinutes: number;
    }
  | { kind: "document" }
  | {
      kind: "external";
      /** Enough to draw a tile and a peek card. No body lives here. */
      meta: WritingFrontmatter;
    };

/** One project, as authored in `lib/entries/registry.ts`. */
export type Entry = {
  slug: string;
  section: EntrySection;
  mode: EntryMode;
  source: EntrySource;
  /** Tile width tier on the work board. Omitted means 3, the base size. */
  emphasis?: EntryEmphasis;
  /** Present whatever the mode is. See `PeekContent`. */
  peek?: PeekContent;
  /** Present whatever the mode is — a `case-study` can keep a dead link warm. */
  link?: EntryLink;
};

/**
 * An entry with its metadata resolved and its destination worked out. This is
 * what every consumer sees; nothing outside `lib/entries` should care whether
 * the content came from frontmatter or from the registry.
 */
export type ResolvedEntry = WritingSummary & {
  section: EntrySection;
  /** The authored tier, with the default already applied. */
  emphasis: EntryEmphasis;
  /**
   * The mode actually in effect, which can differ from the authored one: an
   * entry set to `link` with no `link` payload falls back rather than
   * rendering a dead tile. See `resolveMode` in `./index.ts`.
   */
  mode: EntryMode;
  /** True when a page exists at `href` — i.e. the entry could be a case study. */
  hasPage: boolean;
  /**
   * Where the tile goes. `null` for a peek, which opens in place. Never build
   * a project URL by hand: this is the only thing that knows where one lives.
   */
  href: string | null;
  /** Always `/projects/<slug>` when a page exists, whatever the section. */
  pageHref: string | null;
  peek: PeekContent;
  link?: EntryLink;
};
