#!/usr/bin/env node
/**
 * One-time (rerunnable) fetch of a Goodreads "shelf" via its unofficial RSS
 * export, downloading cover art locally and writing a static data file for
 * the About page's bookshelf.
 *
 * Why this exists as a script instead of a runtime fetch: Goodreads' real
 * public API was shut down years ago. The `list_rss` endpoint used here is
 * an unofficial, undocumented mechanism that happens to still work — it is
 * not something a page load should depend on. Personal reading history also
 * barely changes, so "rerun this script by hand when the shelf changes" is
 * the right cadence, not "fetch on every request."
 *
 * Usage:
 *   node scripts/fetch-goodreads-shelf.mjs
 *
 * Re-run any time the Goodreads shelf changes — it overwrites the data file
 * and re-downloads covers idempotently (same book_id -> same filename).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Configuration — change these if pointing at a different shelf/user later.
// ---------------------------------------------------------------------------
const GOODREADS_USER_ID = "143317008";
const SHELF = "read"; // e.g. "read", "currently-reading", "to-read"
const FEED_URL = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${SHELF}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(REPO_ROOT, "public", "about", "books");
const DATA_FILE = path.join(REPO_ROOT, "lib", "about", "personalReadingList.ts");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Tiny, purpose-built XML field extraction — the feed is a flat list of
// <item> blocks with non-nested fields (the one nested exception, <book
// id="...">, is never read here), so a full XML parser dependency isn't
// warranted for a one-time script.
// ---------------------------------------------------------------------------

function splitItems(xml) {
  return xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0]);
}

function getField(itemXml, tag) {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`);
  const match = itemXml.match(re);
  if (!match) return "";
  return decodeXmlEntities(match[1].trim());
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function fetchFeed() {
  console.log(`Fetching ${FEED_URL}`);
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Feed fetch failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function parseItems(xml) {
  const rawItems = splitItems(xml);
  const parsed = [];
  const failures = [];

  for (const raw of rawItems) {
    const bookId = getField(raw, "book_id");
    const title = getField(raw, "title");
    const author = getField(raw, "author_name");

    if (!bookId || !title || !author) {
      failures.push({ reason: "missing required field (book_id/title/author_name)", raw: raw.slice(0, 200) });
      continue;
    }

    const coverUrl =
      getField(raw, "book_large_image_url") ||
      getField(raw, "book_medium_image_url") ||
      getField(raw, "book_image_url");

    if (!coverUrl) {
      failures.push({ reason: "no cover image URL", bookId, title });
      continue;
    }

    const ratingRaw = getField(raw, "user_rating");
    const rating = ratingRaw && Number(ratingRaw) > 0 ? Number(ratingRaw) : undefined;

    const reviewRaw = getField(raw, "user_review");
    const review = reviewRaw.length > 0 ? reviewRaw : undefined;

    const readAtRaw = getField(raw, "user_read_at");
    const readAt = readAtRaw.length > 0 ? readAtRaw : undefined;

    const published = getField(raw, "book_published") || undefined;
    const isbn = getField(raw, "isbn") || undefined;

    parsed.push({ bookId, title, author, coverUrl, rating, review, readAt, published, isbn });
  }

  return { parsed, failures };
}

function extFromUrl(url) {
  const clean = url.split("?")[0];
  const ext = path.extname(clean);
  return ext && ext.length <= 5 ? ext : ".jpg";
}

async function downloadCover(book) {
  const ext = extFromUrl(book.coverUrl);
  const filename = `${slugify(book.title)}-${book.bookId}${ext}`;
  const dest = path.join(IMAGES_DIR, filename);

  const res = await fetch(book.coverUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);

  return `/about/books/${filename}`;
}

function tsStringLiteral(str) {
  return JSON.stringify(str);
}

function renderEntry(book, coverPath) {
  const lines = [
    "  {",
    `    id: ${tsStringLiteral(book.bookId)},`,
    `    title: ${tsStringLiteral(book.title)},`,
    `    author: ${tsStringLiteral(book.author)},`,
    `    coverPath: ${tsStringLiteral(coverPath)},`,
  ];
  if (book.rating !== undefined) lines.push(`    rating: ${book.rating},`);
  if (book.review !== undefined) lines.push(`    review: ${tsStringLiteral(book.review)},`);
  if (book.readAt !== undefined) lines.push(`    readAt: ${tsStringLiteral(book.readAt)},`);
  if (book.published !== undefined) lines.push(`    published: ${tsStringLiteral(book.published)},`);
  lines.push("  },");
  return lines.join("\n");
}

async function main() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  const xml = await fetchFeed();
  const { parsed, failures } = parseItems(xml);

  console.log(`Parsed ${parsed.length} book(s) from the feed; ${failures.length} failed to parse.`);
  for (const f of failures) {
    console.warn(`  - PARSE FAILURE: ${f.reason}${f.title ? ` (${f.title})` : ""}`);
  }

  const entries = [];
  const downloadFailures = [];

  for (const book of parsed) {
    try {
      const coverPath = await downloadCover(book);
      entries.push(renderEntry(book, coverPath));
      console.log(`  ok: ${book.title} -> ${coverPath}`);
    } catch (err) {
      downloadFailures.push({ book, error: err instanceof Error ? err.message : String(err) });
      console.warn(`  DOWNLOAD FAILURE: ${book.title} (${err instanceof Error ? err.message : err})`);
    }
  }

  const header = `/**
 * Vidush's personal reading list, sourced from his Goodreads "${SHELF}" shelf.
 *
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node scripts/fetch-goodreads-shelf.mjs
 *
 * Source feed: ${FEED_URL}
 * Generated:   ${new Date().toISOString()}
 */

export type PersonalBook = {
  id: string;
  title: string;
  author: string;
  /** Local path under /public — never hotlink Goodreads/Amazon CDN URLs. */
  coverPath: string;
  /** 1-5, omitted when unrated on Goodreads. */
  rating?: number;
  /** Goodreads review text, only present when non-empty. */
  review?: string;
  /** Date finished, as recorded on Goodreads (raw string, often absent). */
  readAt?: string;
  /** First-publication year, when Goodreads has it. */
  published?: string;
};

export const PERSONAL_READING_LIST: PersonalBook[] = [
${entries.join("\n")}
];
`;

  await fs.writeFile(DATA_FILE, header, "utf-8");

  console.log("\n--- Summary ---");
  console.log(`Feed items:        ${parsed.length + failures.length}`);
  console.log(`Parsed OK:         ${parsed.length}`);
  console.log(`Parse failures:    ${failures.length}`);
  console.log(`Covers downloaded: ${entries.length}`);
  console.log(`Download failures: ${downloadFailures.length}`);
  console.log(`Data file written: ${path.relative(REPO_ROOT, DATA_FILE)}`);
  console.log(`Images written to: ${path.relative(REPO_ROOT, IMAGES_DIR)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
