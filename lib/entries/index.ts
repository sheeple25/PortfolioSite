import { createDocumentCollection } from "@/lib/writing/collection";
import { ENTRIES } from "./registry";
import type {
  Entry,
  EntryMode,
  EntrySection,
  PeekContent,
  ResolvedEntry,
} from "./types";

export type {
  Entry,
  EntryLink,
  EntryMode,
  EntrySection,
  EntrySource,
  PeekContent,
  ResolvedEntry,
} from "./types";
export { ENTRIES } from "./registry";

/*
 * Resolving the registry.
 *
 * One markdown pool (`content/projects`) serves both sections, so this module
 * creates the collection unordered and sorts per section itself — Work reads
 * newest-first, the Archive is a ranked shortlist. Putting the order here
 * rather than in two collections is what lets an entry change section without
 * its file moving.
 *
 * Everything below returns `ResolvedEntry`, which is a `WritingSummary` with
 * the routing fields added. That shape is deliberate: the graph, the sitemap
 * and Pixel's prompt already consumed summaries, and they keep working
 * unchanged while gaining `mode`, `section` and a trustworthy `href`.
 */

const documents = createDocumentCollection("projects");

/** `/projects/<slug>` for everything with a page, whatever section it's in. */
const pageHrefFor = (slug: string) => `/projects/${slug}`;

/**
 * The mode actually in effect.
 *
 * An authored mode can be impossible — `link` with no `link` block, or
 * `case-study` on an entry whose content lives elsewhere. Rather than render a
 * dead tile, degrade to something that works. This is what makes a half-made
 * switch safe: set `mode: "link"` today, add the URL tomorrow, and in between
 * the tile still opens the thing that does exist.
 */
function resolveMode(authored: EntryMode, hasPage: boolean, hasLink: boolean): EntryMode {
  if (authored === "link" && !hasLink) return hasPage ? "case-study" : "peek";
  if (authored === "case-study" && !hasPage) return hasLink ? "link" : "peek";
  return authored;
}

/**
 * Peek content, filled in from `meta` wherever the entry didn't override it.
 *
 * This function is the reason flipping something to `peek` costs no authoring:
 * a peek with no overrides is the entry's cover, title, subtitle and the facts
 * already in its frontmatter — the same material its index tile draws from.
 */
function resolvePeek(
  entry: Entry,
  meta: ResolvedEntry["meta"],
  pageHref: string | null
): PeekContent {
  const authored = entry.peek ?? {};

  const facts =
    authored.facts ??
    ([
      { label: "Role", value: meta.role },
      { label: "Timeline", value: meta.timeline ?? meta.term },
      { label: "Team", value: meta.team },
      { label: "Made at", value: meta.place },
    ] satisfies Array<{ label: string; value?: string }>).filter(
      (fact): fact is { label: string; value: string } => Boolean(fact.value)
    );

  /*
   * Where the card goes next, in order of usefulness: an explicit override,
   * then the entry's own page if it has one, then its external link. A peek
   * over a project with a full case study behind it is a legitimate and
   * useful state — the card is the trailer, not a substitute.
   */
  const onward =
    authored.onward ??
    (pageHref
      ? { href: pageHref, label: "Read the case study" }
      : entry.link);

  return {
    headline: authored.headline ?? meta.title,
    blurb: authored.blurb ?? meta.subtitle ?? meta.description,
    images: authored.images,
    facts,
    onward,
  };
}

/** `null` when the entry's document is missing or held back as a draft. */
function resolve(entry: Entry): ResolvedEntry | null {
  const { source } = entry;

  let meta: ResolvedEntry["meta"];
  let wordCount = 0;
  let readingMinutes = 0;
  let sectionTitles: string[] = [];
  let noteCount = 0;

  if (source.kind === "document") {
    const summary = documents
      .getSummaries()
      .find((doc) => doc.slug === entry.slug);
    // Drafts are already filtered by the collection in a production build, so
    // an unpublished entry drops out of every index, the sitemap and the graph
    // by virtue of not resolving at all.
    if (!summary) return null;
    ({ meta, wordCount, readingMinutes, sectionTitles, noteCount } = summary);
  } else {
    meta = source.meta;
    if (source.kind === "page") {
      readingMinutes = source.readingMinutes;
      sectionTitles = source.sectionTitles;
    }
  }

  const hasPage = source.kind !== "external";
  const pageHref = hasPage ? pageHrefFor(entry.slug) : null;
  const mode = resolveMode(entry.mode, hasPage, Boolean(entry.link));

  const href =
    mode === "case-study" ? pageHref : mode === "link" ? entry.link!.href : null;

  return {
    slug: entry.slug,
    meta,
    wordCount,
    readingMinutes,
    sectionTitles,
    noteCount,
    section: entry.section,
    mode,
    hasPage,
    href,
    pageHref,
    peek: resolvePeek(entry, meta, pageHref),
    link: entry.link,
  };
}

/** Work is a feed — newest first. */
const byDate = (a: ResolvedEntry, b: ResolvedEntry) =>
  b.meta.date.localeCompare(a.meta.date);

/**
 * The Archive is a curated shortlist, so it's ranked rather than dated — the
 * entries that best survive being pulled out of context lead. Unranked files
 * sink below ranked ones rather than jumping to the front.
 */
const byRank = (a: ResolvedEntry, b: ResolvedEntry) =>
  (a.meta.rank ?? Number.MAX_SAFE_INTEGER) -
    (b.meta.rank ?? Number.MAX_SAFE_INTEGER) || byDate(a, b);

/**
 * Every published entry, both sections, ordered per section. Pass a section to
 * get just that index's list.
 */
export function getEntries(section?: EntrySection): ResolvedEntry[] {
  const resolved = ENTRIES.map(resolve).filter(
    (entry): entry is ResolvedEntry => entry !== null
  );

  if (!section) return resolved.sort(byDate);

  return resolved
    .filter((entry) => entry.section === section)
    .sort(section === "archive" ? byRank : byDate);
}

/**
 * Somewhere to point at this entry from elsewhere on the site.
 *
 * `href` is what its *tile* does and can be `null`, because a peek opens in
 * place and has no address. Anything linking in from outside the grid — the
 * knowledge graph, Pixel, a "see also" — still needs a destination, so this
 * degrades: the entry's own page, then its external link, then the index that
 * lists it, where its tile can be clicked to open the peek properly.
 *
 * Shared rather than reimplemented per caller. Both of the current callers
 * previously built `/${featured ? "projects" : "archive"}/${slug}` by hand,
 * which is exactly the assumption this refactor removes.
 */
export function linkHrefFor(entry: ResolvedEntry): string {
  return (
    entry.pageHref ??
    entry.href ??
    (entry.section === "work" ? "/projects" : "/archive")
  );
}

/** `undefined` for an unknown or unpublished slug. */
export function getEntry(slug: string): ResolvedEntry | undefined {
  const entry = ENTRIES.find((candidate) => candidate.slug === slug);
  return entry ? resolve(entry) ?? undefined : undefined;
}

/**
 * Slugs for `generateStaticParams` on `app/projects/[slug]`.
 *
 * Markdown-backed entries only. The three hand-built pages are static routes
 * of the same name — `app/projects/loco` and friends — and a slug appearing in
 * both places would collide. `external` entries have no page at all.
 */
export function getEntryDocumentSlugs(): string[] {
  const published = new Set(documents.getSlugs());
  return ENTRIES.filter(
    (entry) => entry.source.kind === "document" && published.has(entry.slug)
  ).map((entry) => entry.slug);
}

/** The parsed document behind a markdown entry. `null` for anything else. */
export function getEntryDocument(slug: string) {
  const entry = ENTRIES.find((candidate) => candidate.slug === slug);
  if (!entry || entry.source.kind !== "document") return null;
  return documents.getDocument(slug);
}
