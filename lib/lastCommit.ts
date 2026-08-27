import fs from "fs";
import path from "path";

/**
 * The footer's "alive" line. Reads the snapshot `scripts/generate-last-commit.js`
 * writes as a `predev`/`prebuild` step — this module never shells out to git
 * itself, so a render (which for these static routes happens at build time)
 * stays a plain file read rather than a process spawn.
 */

export type LastCommit = {
  hash: string;
  shortHash: string;
  subject: string;
  isoDate: string;
};

const SNAPSHOT_PATH = path.join(process.cwd(), "lib", "generated", "last-commit.json");

export function getLastCommit(): LastCommit | null {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LastCommit>;
    if (!parsed.shortHash || !parsed.subject || !parsed.isoDate) return null;
    return parsed as LastCommit;
  } catch {
    return null;
  }
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;

/**
 * Coarse relative time — "shipped 3 hours ago" reads as alive, "shipped on
 * March 4th" reads as an archive. Deliberately rougher than a library like
 * date-fns for a one-line footer credit.
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));

  if (seconds < MINUTE) return "just now";
  if (seconds < HOUR) {
    const n = Math.floor(seconds / MINUTE);
    return `${n} minute${n === 1 ? "" : "s"} ago`;
  }
  if (seconds < DAY) {
    const n = Math.floor(seconds / HOUR);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  if (seconds < WEEK) {
    const n = Math.floor(seconds / DAY);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (seconds < MONTH) {
    const n = Math.floor(seconds / WEEK);
    return `${n} week${n === 1 ? "" : "s"} ago`;
  }
  const n = Math.floor(seconds / MONTH);
  return `${n} month${n === 1 ? "" : "s"} ago`;
}
