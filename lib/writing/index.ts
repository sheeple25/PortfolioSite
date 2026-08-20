import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseWritingDocument } from "./parse";
import type { WritingDocument, WritingSummary } from "./types";

export type {
  TocEntry,
  WritingDocument,
  WritingFrontmatter,
  WritingSection,
  WritingSummary,
} from "./types";

/*
 * The document registry.
 *
 * Adding a piece of writing is one step: drop a `.md` file in `content/writing`.
 * The filename becomes the slug, the frontmatter supplies everything the index
 * card, the sidebar, the sitemap and the metadata need, and nothing here or in
 * `lib/site.ts` has to be touched. Ordering is by `date` descending rather than
 * by a hand-kept list, so a new file lands in the right place on its own.
 */

const CONTENT_DIR = join(process.cwd(), "content", "writing");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Sections marked `<!-- private -->` and documents marked `draft: true` render
 * while you're working and disappear from the production build — they stay in
 * the source file either way, so publishing one later is a one-line change.
 */
const INCLUDE_PRIVATE = !IS_PRODUCTION;

/**
 * Parsing is pure and the files never change within a production run, so the
 * result is memoised there. Dev deliberately re-reads on every request, which
 * is what makes editing a `.md` file show up on refresh.
 */
const cache = new Map<string, WritingDocument>();

function readSlugs(): string[] {
  try {
    return readdirSync(CONTENT_DIR)
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3));
  } catch {
    // No content directory yet — an empty section beats a crashed build.
    return [];
  }
}

function loadDocument(slug: string): WritingDocument | null {
  const cached = cache.get(slug);
  if (cached) return cached;

  let source: string;
  try {
    source = readFileSync(join(CONTENT_DIR, `${slug}.md`), "utf8");
  } catch {
    return null;
  }

  const doc = parseWritingDocument(source, slug, {
    includePrivate: INCLUDE_PRIVATE,
  });

  if (IS_PRODUCTION) cache.set(slug, doc);
  return doc;
}

function isPublished(doc: WritingDocument): boolean {
  return !doc.meta.draft || !IS_PRODUCTION;
}

/** Newest first. Drafts are included in dev only. */
export function getWritingSummaries(): WritingSummary[] {
  return readSlugs()
    .map(loadDocument)
    .filter((doc): doc is WritingDocument => doc !== null && isPublished(doc))
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date))
    .map((doc) => ({
      slug: doc.slug,
      meta: doc.meta,
      wordCount: doc.wordCount,
      readingMinutes: doc.readingMinutes,
      sectionTitles: doc.sections
        .filter((section) => !section.private)
        .map((section) => section.title),
      noteCount: doc.notes.length,
    }));
}

/** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
export function getWritingSlugs(): string[] {
  return readSlugs().filter((slug) => {
    const doc = loadDocument(slug);
    return doc !== null && isPublished(doc);
  });
}

/** `null` for an unknown slug, so the page can call `notFound()`. */
export function getWritingDocument(slug: string): WritingDocument | null {
  const doc = loadDocument(slug);
  if (!doc || !isPublished(doc)) return null;
  return doc;
}
