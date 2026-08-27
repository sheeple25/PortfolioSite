#!/usr/bin/env node
/**
 * recolor-brand-assets.mjs
 *
 * Regenerates the two "mark" brand assets (favicon SVG + animated loader WEBP)
 * in a target accent color:
 *
 *   1. app/icon.svg          - hand-authored SVG, recolored via text substitution
 *   2. public/site-loader.webp - solid-color-on-alpha raster mark, recolored via
 *                                sharp by rewriting the RGB channels per pixel
 *                                (every frame, since the source is an animated
 *                                multi-frame WEBP) while leaving alpha untouched.
 *
 * Usage:
 *   node scripts/recolor-brand-assets.mjs "#0047ff"
 *   node scripts/recolor-brand-assets.mjs "#0047ff" --out-dir scratch/brand-preview
 *   node scripts/recolor-brand-assets.mjs "#0047ff" --icon-out /tmp/icon.svg --loader-out /tmp/loader.webp
 *
 * Safety:
 *   Resolving to the exact default source paths (app/icon.svg /
 *   public/site-loader.webp) is an in-place overwrite of live brand assets,
 *   so it is refused unless --force is also passed. Use --out-dir (or
 *   --icon-out / --loader-out) to write elsewhere for review, which is the
 *   default recommended workflow.
 *
 * Options:
 *   --icon-src <path>     Source SVG to recolor (default: app/icon.svg)
 *   --loader-src <path>   Source WEBP to recolor (default: public/site-loader.webp)
 *   --out-dir <dir>       Write both outputs into this directory, using the
 *                         source basenames (icon.svg, site-loader.webp).
 *   --icon-out <path>     Explicit output path for the SVG (overrides --out-dir).
 *   --loader-out <path>   Explicit output path for the WEBP (overrides --out-dir).
 *   --skip-icon           Don't touch the SVG.
 *   --skip-loader         Don't touch the WEBP.
 *   --force               Allow writing over the default live source paths in place.
 *   -h, --help            Show this help.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_ICON_SRC = path.join(REPO_ROOT, "app", "icon.svg");
const DEFAULT_LOADER_SRC = path.join(REPO_ROOT, "public", "site-loader.webp");

function printHelpAndExit(code) {
  console.log(
    `Usage: node scripts/recolor-brand-assets.mjs <hex-color> [options]\n\n` +
      `Options:\n` +
      `  --icon-src <path>     Source SVG (default: app/icon.svg)\n` +
      `  --loader-src <path>   Source WEBP (default: public/site-loader.webp)\n` +
      `  --out-dir <dir>       Write both outputs here (basenames preserved)\n` +
      `  --icon-out <path>     Explicit output path for the SVG\n` +
      `  --loader-out <path>   Explicit output path for the WEBP\n` +
      `  --skip-icon           Don't process the SVG\n` +
      `  --skip-loader         Don't process the WEBP\n` +
      `  --force               Allow in-place overwrite of the default live files\n` +
      `  -h, --help            Show this help\n`
  );
  process.exit(code);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-h":
      case "--help":
        printHelpAndExit(0);
        break;
      case "--icon-src":
        args.iconSrc = argv[++i];
        break;
      case "--loader-src":
        args.loaderSrc = argv[++i];
        break;
      case "--out-dir":
        args.outDir = argv[++i];
        break;
      case "--icon-out":
        args.iconOut = argv[++i];
        break;
      case "--loader-out":
        args.loaderOut = argv[++i];
        break;
      case "--skip-icon":
        args.skipIcon = true;
        break;
      case "--skip-loader":
        args.skipLoader = true;
        break;
      case "--force":
        args.force = true;
        break;
      default:
        args._.push(a);
    }
  }
  return args;
}

function normalizeHex(input) {
  if (typeof input !== "string") return null;
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  return `#${m[1].toLowerCase()}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** Replace every fill="#xxxxxx" / stroke="#xxxxxx" hex value in the SVG text. */
function recolorSvgText(svgText, hex) {
  return svgText.replace(
    /(fill|stroke)="#[0-9a-fA-F]{3,8}"/g,
    (_match, attr) => `${attr}="${hex}"`
  );
}

/**
 * Recolor a (possibly animated) WEBP by keeping the per-pixel alpha channel
 * and overwriting the RGB channels with a flat target color everywhere alpha
 * is non-zero effectively becomes the new color (fully transparent pixels are
 * left untouched since they're invisible either way).
 */
async function recolorWebp(sharp, srcPath, hex) {
  const { r, g, b } = hexToRgb(hex);

  const src = sharp(srcPath, { animated: true });
  const meta = await src.metadata();

  const pages = meta.pages ?? 1;
  const pageHeight = meta.pageHeight ?? meta.height;
  const width = meta.width;
  const totalHeight = meta.height; // already pages * pageHeight for animated input

  const { data, info } = await src
    .ensureAlpha() // guarantee a 4th (alpha) channel to key off of
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // expected 4 after ensureAlpha()
  if (channels < 4) {
    throw new Error(
      `Expected an alpha channel after ensureAlpha(), got ${channels} channels.`
    );
  }

  // Walk every pixel across every stacked frame and replace R/G/B, leaving A alone.
  for (let px = 0; px < data.length; px += channels) {
    data[px] = r;
    data[px + 1] = g;
    data[px + 2] = b;
    // data[px + 3] (alpha) is left untouched
  }

  let pipeline = sharp(data, {
    raw: {
      width,
      height: totalHeight,
      channels,
      pageHeight: pages > 1 ? pageHeight : undefined,
    },
  });

  const webpOptions = { lossless: true, effort: 6 };
  if (pages > 1) {
    webpOptions.loop = meta.loop ?? 0;
    if (meta.delay) webpOptions.delay = meta.delay;
  }

  const outBuffer = await pipeline.webp(webpOptions).toBuffer();
  return { outBuffer, pages, pageHeight, width, totalHeight };
}

async function resolveOutputPath({ explicitOut, outDir, srcPath, defaultBasename }) {
  if (explicitOut) return path.resolve(explicitOut);
  if (outDir) return path.resolve(outDir, defaultBasename);
  return path.resolve(srcPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawHex = args._[0];
  const hex = normalizeHex(rawHex);

  if (!hex) {
    console.error(
      `Error: expected a 6-digit hex color as the first argument, e.g. "#0047ff". Got: ${JSON.stringify(
        rawHex
      )}\n`
    );
    printHelpAndExit(1);
  }

  const iconSrc = path.resolve(args.iconSrc ?? DEFAULT_ICON_SRC);
  const loaderSrc = path.resolve(args.loaderSrc ?? DEFAULT_LOADER_SRC);

  const iconOutPath = await resolveOutputPath({
    explicitOut: args.iconOut,
    outDir: args.outDir,
    srcPath: iconSrc,
    defaultBasename: path.basename(DEFAULT_ICON_SRC),
  });
  const loaderOutPath = await resolveOutputPath({
    explicitOut: args.loaderOut,
    outDir: args.outDir,
    srcPath: loaderSrc,
    defaultBasename: path.basename(DEFAULT_LOADER_SRC),
  });

  // Safety: refuse silent in-place overwrites of the live default assets.
  const wouldOverwriteLiveIcon =
    !args.skipIcon && iconOutPath === path.resolve(DEFAULT_ICON_SRC);
  const wouldOverwriteLiveLoader =
    !args.skipLoader && loaderOutPath === path.resolve(DEFAULT_LOADER_SRC);
  if ((wouldOverwriteLiveIcon || wouldOverwriteLiveLoader) && !args.force) {
    console.error(
      "Refusing to overwrite the live brand asset(s) in place without --force:\n" +
        [
          wouldOverwriteLiveIcon ? `  - ${DEFAULT_ICON_SRC}` : null,
          wouldOverwriteLiveLoader ? `  - ${DEFAULT_LOADER_SRC}` : null,
        ]
          .filter(Boolean)
          .join("\n") +
        "\n\nPass --out-dir <dir> (or --icon-out/--loader-out) to write elsewhere, " +
        "or pass --force to update the live files intentionally."
    );
    process.exit(1);
  }

  console.log(`Target color: ${hex}`);

  if (!args.skipIcon) {
    if (!existsSync(iconSrc)) {
      console.error(`Icon source not found: ${iconSrc}`);
      process.exit(1);
    }
    const svgText = await readFile(iconSrc, "utf8");
    const recolored = recolorSvgText(svgText, hex);
    await mkdir(path.dirname(iconOutPath), { recursive: true });
    await writeFile(iconOutPath, recolored, "utf8");
    console.log(`Wrote icon: ${iconOutPath}`);
  }

  if (!args.skipLoader) {
    if (!existsSync(loaderSrc)) {
      console.error(`Loader source not found: ${loaderSrc}`);
      process.exit(1);
    }
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const { outBuffer, pages, pageHeight, width, totalHeight } = await recolorWebp(
      sharp,
      loaderSrc,
      hex
    );
    await mkdir(path.dirname(loaderOutPath), { recursive: true });
    await writeFile(loaderOutPath, outBuffer);
    console.log(
      `Wrote loader: ${loaderOutPath} (${width}x${totalHeight}, ${pages} page(s) of ${pageHeight}px${
        pages > 1 ? ", animated" : ""
      })`
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
