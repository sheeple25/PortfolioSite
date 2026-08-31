import { createDocumentCollection } from "./collection";

export type {
  TocEntry,
  WritingDocument,
  WritingFrontmatter,
  WritingSection,
  WritingSummary,
} from "./types";

/*
 * The writing registry.
 *
 * Adding a piece of writing is one step: drop a `.md` file in `content/writing`.
 * The filename becomes the slug, the frontmatter supplies everything the index
 * card, the sidebar, the sitemap and the metadata need, and nothing here or in
 * `lib/site.ts` has to be touched. Ordering is by `date` descending rather than
 * by a hand-kept list, so a new file lands in the right place on its own.
 *
 * The loading itself lives in `collection.ts`, which `lib/entries` shares.
 */

const writing = createDocumentCollection("writing");

/** Newest first. Drafts are included in dev only. */
export const getWritingSummaries = () => writing.getSummaries();

/** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
export const getWritingSlugs = () => writing.getSlugs();

/** `null` for an unknown slug, so the page can call `notFound()`. */
export const getWritingDocument = (slug: string) => writing.getDocument(slug);

/**
 * A document's words as one continuous string, for the index's header texture.
 * Private sections are already excluded. `null` for an unknown slug.
 */
export const getWritingProse = (slug: string) => writing.getProse(slug);
