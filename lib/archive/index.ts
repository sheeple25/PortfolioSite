import { createDocumentCollection } from "@/lib/writing/collection";

export type {
  ArchiveCategory,
  TocEntry,
  WritingDocument,
  WritingFrontmatter,
  WritingSection,
  WritingSummary,
} from "@/lib/writing/types";

/*
 * The archive — work that stands on its own but sits outside the current focus.
 *
 * Third collection off the same parser as `/writing` and `/projects`, with one
 * difference that earns it its own module: it is ordered by `rank`, not date.
 * The archive is a shortlist rather than a feed, so the entries that best
 * survive being pulled out of context lead, and everything else follows.
 */

const archive = createDocumentCollection("archive", { order: "rank" });

/** Ranked, ascending. Drafts are included in dev only. */
export const getArchiveSummaries = () => archive.getSummaries();

/** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
export const getArchiveSlugs = () => archive.getSlugs();

/** `null` for an unknown slug, so the page can call `notFound()`. */
export const getArchiveDocument = (slug: string) => archive.getDocument(slug);
