import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Snapshots the latest commit into a small JSON file at build time, so the
 * footer's "alive" line has something to show without shelling out to git on
 * every request (this project has no server-side runtime, so that isn't even
 * an option in production — but it also isn't the goal in dev).
 *
 * Runs as a `predev`/`prebuild` step, same pattern as copy-latest-cv.js. In
 * dev this re-runs each time the server starts, so the commit info is at
 * most one restart stale; in a real deployment it's fixed at the build that
 * shipped it, which is the correct reading of "last shipped".
 */

const OUT_PATH = path.join(process.cwd(), "lib", "generated", "last-commit.json");

/** Separator unlikely to appear in a commit subject line. */
const SEP = "@@@";

function generate() {
  let raw;
  try {
    raw = execSync(
      `git log -1 --pretty=format:%H${SEP}%h${SEP}%s${SEP}%cI`,
      { encoding: "utf8" }
    ).trim();
  } catch {
    // No git binary, not a repo (e.g. a source-only deploy), or no commits
    // yet. The footer falls back to hiding the line rather than erroring.
    console.warn("generate-last-commit: git log unavailable, skipping");
    return;
  }

  const parts = raw.split(SEP);
  const [hash, shortHash, subject, isoDate] = parts;
  if (!hash || !isoDate) {
    console.warn("generate-last-commit: could not parse git log output");
    return;
  }

  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify({ hash, shortHash, subject, isoDate }, null, 2) + "\n"
  );
  console.log(`Recorded last commit: ${shortHash} ${subject}`);
}

generate();
