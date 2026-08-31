import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseWritingDocument, plainTextFromMarkdown } from "./parse";
import type { WritingDocument, WritingSummary } from "./types";

/*
 * A folder of markdown documents, loaded and parsed on the server.
 *
 * `/writing` and `/projects` are the same reader pointed at different content,
 * so the loading rules — slug from filename, newest first, drafts and private
 * sections held back in production — live here once rather than in each
 * section. A collection is created by naming its directory under `content/`.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Sections marked `<!-- private -->` and documents marked `draft: true` render
 * while you're working and disappear from the production build — they stay in
 * the source file either way, so publishing one later is a one-line change.
 */
const INCLUDE_PRIVATE = !IS_PRODUCTION;

export type DocumentCollection = {
  /** Newest first. Drafts are included in dev only. */
  getSummaries(): WritingSummary[];
  /** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
  getSlugs(): string[];
  /** `null` for an unknown slug, so the page can call `notFound()`. */
  getDocument(slug: string): WritingDocument | null;
  /**
   * The document as one continuous run of prose, private sections excluded.
   * `null` for an unknown or unpublished slug.
   */
  getProse(slug: string): string | null;
};

/**
 * How an index orders its entries.
 *
 * `date` suits writing and work, where the newest thing is the most current.
 * `rank` suits `/archive`, which is a curated shortlist — the strongest entries
 * lead regardless of when they were made, and the order is set per file.
 */
export type CollectionOrder = "date" | "rank";

export function createDocumentCollection(
  directory: string,
  { order = "date" }: { order?: CollectionOrder } = {}
): DocumentCollection {
  const contentDir = join(process.cwd(), "content", directory);

  /** Unranked files sink below ranked ones rather than jumping to the front. */
  const compare = (a: WritingDocument, b: WritingDocument) =>
    order === "rank"
      ? (a.meta.rank ?? Number.MAX_SAFE_INTEGER) -
          (b.meta.rank ?? Number.MAX_SAFE_INTEGER) ||
        b.meta.date.localeCompare(a.meta.date)
      : b.meta.date.localeCompare(a.meta.date);

  /*
   * Parsing is pure and the files never change within a production run, so the
   * result is memoised there. Dev deliberately re-reads on every request, which
   * is what makes editing a `.md` file show up on refresh.
   */
  const cache = new Map<string, WritingDocument>();

  function readSlugs(): string[] {
    try {
      return readdirSync(contentDir)
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
      source = readFileSync(join(contentDir, `${slug}.md`), "utf8");
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

  return {
    getSummaries() {
      return readSlugs()
        .map(loadDocument)
        .filter((doc): doc is WritingDocument => doc !== null && isPublished(doc))
        .sort(compare)
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
    },

    getSlugs() {
      return readSlugs().filter((slug) => {
        const doc = loadDocument(slug);
        return doc !== null && isPublished(doc);
      });
    },

    getDocument(slug) {
      const doc = loadDocument(slug);
      if (!doc || !isPublished(doc)) return null;
      return doc;
    },

    getProse(slug) {
      // Through `loadDocument` first, so an unpublished slug is refused on the
      // same rule the rest of the collection uses rather than a second one.
      const doc = loadDocument(slug);
      if (!doc || !isPublished(doc)) return null;

      try {
        return plainTextFromMarkdown(
          readFileSync(join(contentDir, `${slug}.md`), "utf8"),
          { includePrivate: INCLUDE_PRIVATE },
        );
      } catch {
        return null;
      }
    },
  };
}
