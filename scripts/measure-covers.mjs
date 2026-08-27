/**
 * Records the pixel dimensions of every book cover in `public/` into
 * `lib/bookshelf/cover-sizes.json`.
 *
 * Why this exists: `next/image` needs to know an image's intrinsic size to
 * reserve the right box before the file arrives. The shelves render a cover at
 * a fixed height with `width: auto`, so the width depends on that cover's own
 * aspect ratio — which differs per book and isn't recorded anywhere in the
 * reading-list data. Measuring once and checking the result in keeps the data
 * files free of layout concerns and removes the layout shift the old raw
 * `<img>` had to re-center around.
 *
 * These are static files that change only when a cover is added, so this is a
 * run-it-when-you-add-a-book script, deliberately NOT wired into `dev`/`build`.
 * If a cover is missing from the map the shelf falls back to an unsized image,
 * so forgetting to run it degrades rather than breaks.
 *
 *   node scripts/measure-covers.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Directories under `public/` that hold cover art, as public URL paths. */
const COVER_DIRS = ["/about/books", "/projects/books"];

const OUT_FILE = path.join(process.cwd(), "lib", "bookshelf", "cover-sizes.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function measureDir(urlDir) {
  const diskDir = path.join(process.cwd(), "public", ...urlDir.split("/").filter(Boolean));

  let names;
  try {
    names = await fs.readdir(diskDir);
  } catch {
    console.warn(`No such directory, skipping: ${diskDir}`);
    return [];
  }

  const entries = [];
  for (const name of names) {
    if (!IMAGE_EXT.has(path.extname(name).toLowerCase())) continue;
    const { width, height } = await sharp(path.join(diskDir, name)).metadata();
    if (!width || !height) {
      console.warn(`Could not read dimensions, skipping: ${urlDir}/${name}`);
      continue;
    }
    entries.push([`${urlDir}/${name}`, [width, height]]);
  }
  return entries;
}

const measured = (await Promise.all(COVER_DIRS.map(measureDir))).flat();

// Sorted so the file has a stable diff when a cover is added.
measured.sort(([a], [b]) => a.localeCompare(b));

await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
await fs.writeFile(OUT_FILE, `${JSON.stringify(Object.fromEntries(measured), null, 2)}\n`, "utf8");

console.log(`Measured ${measured.length} covers -> ${path.relative(process.cwd(), OUT_FILE)}`);
