import { createDocumentCollection } from "@/lib/writing/collection";

export type {
  TocEntry,
  WritingDocument,
  WritingFrontmatter,
  WritingSection,
  WritingSummary,
} from "@/lib/writing/types";

/*
 * The project registry — the work shown under `/projects`.
 *
 * Same deal as `lib/writing`: a project is a `.md` file in `content/projects`,
 * read by the same parser and rendered by the same reader. The two sections are
 * kept apart so a project can't turn up in the writing index (and the other way
 * round) purely by living in a different folder.
 */

const projects = createDocumentCollection("projects");

/** Newest first. Drafts are included in dev only. */
export const getProjectSummaries = () => projects.getSummaries();

/** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
export const getProjectSlugs = () => projects.getSlugs();

/** `null` for an unknown slug, so the page can call `notFound()`. */
export const getProjectDocument = (slug: string) => projects.getDocument(slug);
