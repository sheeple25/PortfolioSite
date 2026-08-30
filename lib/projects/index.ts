import { createDocumentCollection } from "@/lib/writing/collection";
import { getCaseStudySummaries } from "@/lib/caseStudies";
import type { WritingSummary } from "@/lib/writing/types";

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
 * Two kinds of project live here now, and the split is deliberate:
 *
 *  - **Hand-built case studies** (`lib/caseStudies.ts`) are React pages under
 *    `app/projects/<slug>/`, built on the `components/case-study` chassis.
 *    Traces, Loco Lavatory and Unflattening are these.
 *  - **Markdown documents** in `content/projects` are read by the same parser
 *    and reader as `/writing`, and render through `app/projects/[slug]`.
 *
 * `getProjectSummaries()` returns both, because everything that consumes it —
 * the index, the knowledge graph, the sitemap, Pixel's system prompt — cares
 * that a project exists, not how its page is built.
 *
 * `getProjectSlugs()` returns only the markdown ones, and must keep doing so.
 * It feeds `generateStaticParams` on the `[slug]` route, and a case study's
 * slug appearing there would collide with the static route of the same name.
 */

const projects = createDocumentCollection("projects");

/** Newest first — case studies and markdown projects interleaved by date. */
export const getProjectSummaries = (): WritingSummary[] =>
  [...getCaseStudySummaries(), ...projects.getSummaries()].sort((a, b) =>
    b.meta.date.localeCompare(a.meta.date)
  );

/**
 * Slugs for `generateStaticParams` on `app/projects/[slug]`. Markdown only —
 * see the note above. Drafts are excluded from the build.
 */
export const getProjectSlugs = () => projects.getSlugs();

/** `null` for an unknown slug, so the page can call `notFound()`. */
export const getProjectDocument = (slug: string) => projects.getDocument(slug);
