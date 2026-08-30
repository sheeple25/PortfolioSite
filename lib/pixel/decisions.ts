import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

/*
 * DecisionLogs — `content/decisions/<slug>.md`.
 *
 * One file per project, serving two readers that the content model deliberately
 * keeps together (see `source/content-model.md`):
 *
 *  - **"What I did"** — the process summary a recruiter needs in the first
 *    twenty seconds. Rendered into Pixel's margin on the project page,
 *    unprompted, as plain text. No model call: it fires on every project open,
 *    so generating it would mean an API request per visitor per page before
 *    anyone has typed anything.
 *  - **The decisions** — the *why* behind each call, which is the "Interrogate"
 *    depth tier. Folded into Pixel's system prompt so a visitor can ask about
 *    them in chat.
 *
 * The page is the summary; this is the primary record. Content cut from a case
 * study for length is supposed to land here — `source/traces-rebuild.md` is
 * already written on that assumption.
 *
 * Server-only: reads the filesystem, same as the other content collections.
 */

const DECISIONS_DIR = path.join(process.cwd(), "content", "decisions");

export type DecisionLog = {
  /** Slug of the project or archive entry this belongs to. */
  slug: string;
  /** Which collection that slug lives in, so a path can be built for it. */
  collection: "projects" | "archive";
  /** The process summary: what Vidush actually did, in order. */
  process: string;
  /** The body below the process block — the decisions themselves. */
  decisions: string;
  /**
   * True while this file is still scaffolding rather than real content.
   * Placeholders are kept out of the prompt and out of the margin entirely:
   * showing a recruiter "TK" is worse than showing them nothing, and feeding a
   * placeholder to the model invites it to elaborate on nothing.
   */
  placeholder: boolean;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
/** The process summary is the first `## What I did` block; the rest is decisions. */
const PROCESS_HEADING = /^##\s+What I did\s*$/im;

function parseFile(slug: string, source: string): DecisionLog | null {
  const match = FRONTMATTER.exec(source);
  if (!match) return null;

  const data = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  const body = match[2].trim();

  const collection = data.collection === "projects" ? "projects" : "archive";

  let process = "";
  let decisions = body;

  const headingMatch = PROCESS_HEADING.exec(body);
  if (headingMatch) {
    const after = body.slice(headingMatch.index + headingMatch[0].length);
    const nextHeading = after.search(/^##\s+/m);
    process = (nextHeading === -1 ? after : after.slice(0, nextHeading)).trim();
    decisions = nextHeading === -1 ? "" : after.slice(nextHeading).trim();
  }

  return {
    slug,
    collection,
    process,
    decisions,
    placeholder: data.placeholder === true,
  };
}

function readAll(): DecisionLog[] {
  if (!fs.existsSync(DECISIONS_DIR)) return [];

  return fs
    .readdirSync(DECISIONS_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => parseFile(file.replace(/\.md$/, ""), fs.readFileSync(path.join(DECISIONS_DIR, file), "utf-8")))
    .filter((log): log is DecisionLog => log !== null);
}

/** Every log with real content in it. Placeholders are excluded by design. */
export function getDecisionLogs(): DecisionLog[] {
  return readAll().filter((log) => !log.placeholder);
}

/** One project's log, or `null` — including when it is still a placeholder. */
export function getDecisionLog(slug: string): DecisionLog | null {
  return getDecisionLogs().find((log) => log.slug === slug) ?? null;
}

/**
 * How many logs are still scaffolding. Surfaced so the gap is visible in a
 * build rather than being discovered by a recruiter.
 */
export function countPlaceholderLogs(): number {
  return readAll().filter((log) => log.placeholder).length;
}
