/**
 * Decides whether each project cover wants a light or a dark title laid over
 * it, and records the answer in `lib/graph/cover-ink.json`.
 *
 * The work graph's cards put the project's name on the thumbnail itself rather
 * than in a solid strip beneath it. That reads far better, and it costs one
 * thing: the title's colour now depends on the picture under it. The covers are
 * not alike — a lit photograph of a book, a near-black title card, a flat mid
 * blue — so a single hardcoded colour is wrong on some of them whatever it is.
 *
 * Only the region the title actually sits over is measured (the bottom
 * `SAMPLE_BAND` of the image), because that is the only part the contrast
 * question is about; a cover can be dark overall and pale exactly where the
 * words go.
 *
 * These are static files, so this is a run-it-when-you-add-a-cover script,
 * deliberately NOT wired into `dev`/`build` — the same call `measure-covers.mjs`
 * makes. A cover missing from the map falls back to light ink over the scrim,
 * so forgetting to run it degrades rather than breaks.
 *
 *   node scripts/measure-cover-ink.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Directories under `public/` holding project cover art, as URL paths. */
const COVER_DIRS = ["/projects", "/archive"];

const OUT_FILE = path.join(process.cwd(), "lib", "graph", "cover-ink.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** The bottom slice of the cover the title is laid across. */
const SAMPLE_BAND = 0.34;

/**
 * Where light ink gives way to dark.
 *
 * The card's scrim follows the ink rather than always darkening — a dark wash
 * under light type, a light one under dark type — so this only has to answer
 * "is the area under the title genuinely bright", not model the scrim as well.
 *
 * The covers fall into two clear groups on the measurement, which is why the
 * exact value is not delicate: Traces (0.79) and Vortex (0.52) are pale where
 * the title sits, and everything else lands between 0.01 and 0.43.
 */
const THRESHOLD = 0.45;

/** sRGB -> relative luminance, gamma-corrected (WCAG's definition). */
function luminance(r, g, b) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

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
    const file = path.join(diskDir, name);

    const { width, height } = await sharp(file).metadata();
    if (!width || !height) {
      console.warn(`Could not read dimensions, skipping: ${urlDir}/${name}`);
      continue;
    }

    const bandHeight = Math.max(1, Math.round(height * SAMPLE_BAND));
    // Averaged down to a single row of samples: the question is "how bright is
    // this area", and a 1×N resize is sharp's own box filter answering it.
    const { data, info } = await sharp(file)
      .extract({ left: 0, top: height - bandHeight, width, height: bandHeight })
      .resize({ width: 16, height: 1, fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let total = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      total += luminance(data[i], data[i + 1], data[i + 2]);
    }
    const mean = total / (data.length / info.channels);

    entries.push([`${urlDir}/${name}`, mean > THRESHOLD ? "dark" : "light"]);
  }
  return entries;
}

const measured = (await Promise.all(COVER_DIRS.map(measureDir))).flat();

// Sorted so the file has a stable diff when a cover is added.
measured.sort(([a], [b]) => a.localeCompare(b));

await fs.writeFile(OUT_FILE, `${JSON.stringify(Object.fromEntries(measured), null, 2)}\n`, "utf8");
console.log(`Wrote ${measured.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);
