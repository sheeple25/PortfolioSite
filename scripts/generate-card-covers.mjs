/**
 * Builds the square-ish cover variants the work graph's project cards use,
 * for entries whose full-bleed `cover` is composed for a different crop.
 *
 * Only Vashi needs one today, and the reason is worth writing down because it
 * looks like a bug otherwise. `vashi-hero.webp` is a flat `#3d79bb` plate with
 * the mark composited at y=320 of 1100 — deliberately high, because the case
 * study's banner crops it with `object-position: 50% 35%` and a centred mark
 * sat underneath the title plate (see the note in `VashiEntry.tsx`). The graph
 * card crops nothing vertically, so the same asset shows the mark sitting at
 * 29% of the card's height, which reads as badly placed.
 *
 * The two crops genuinely want different compositions, so this writes a second
 * asset rather than moving the mark and breaking the banner. `cardCover` on the
 * entry points at it; everything without one keeps using `cover`.
 *
 * Run when a mark or its plate colour changes — deliberately NOT wired into
 * `dev`/`build`, same as `measure-covers.mjs`. The output is checked in.
 *
 *   node scripts/generate-card-covers.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CARDS = [
  {
    /*
     * Traces is a plate and nothing else — its mark stays a live overlay in the
     * graph (`logo:` on the entry) so that on hover it can sit *over* the video
     * rather than under it.
     *
     * The reason it needs a plate at all: `traces-hero.webp` is the studio's
     * title card, a wall of small grey type behind TECHNOLOGY + DATING inside a
     * hot-pink rule. At full bleed it is the right image; at 178x126 it is
     * illegible noise, and the pink mark laid over it collides with the pink
     * rule. The ground is sampled from the hero's own interior so the card and
     * the case study still read as the same piece of work.
     */
    out: "public/archive/traces-card.webp",
    logo: null,
    background: "#f1f1f1",
    width: 1200,
    height: 850,
  },
  {
    out: "public/archive/vashi-card.webp",
    logo: "public/logos/Vashi.svg",
    // Vashi's own brand blue, confirmed off `vashi-hero.webp` (average of an
    // 8×8 downsample) by the palette note in `VashiEntry.tsx`.
    background: "#3d79bb",
    /* 4:3-ish, matching the card's own proportions closely enough that the
       `slice` crop takes almost nothing off the edges. */
    width: 1200,
    height: 850,
    /** Mark width as a fraction of the plate. */
    scale: 0.58,
    /* Lifted off dead centre by this fraction of the plate's height. The card
       lays its title across the bottom quarter over a scrim, so a
       geometrically centred mark reads as sitting low; this puts it in the
       middle of the space actually left to it. */
    lift: 0.07,
  },
];

for (const card of CARDS) {
  const outPath = path.join(process.cwd(), card.out);

  const plate = sharp({
    create: {
      width: card.width,
      height: card.height,
      channels: 4,
      background: card.background,
    },
  });

  // A plate with no mark baked into it — the entry draws its logo as a live
  // layer instead, so the mark can sit over the hover video.
  if (!card.logo) {
    await plate.webp({ quality: 92 }).toFile(outPath);
    await fs.access(outPath);
    console.log(`wrote ${card.out} (${card.width}x${card.height}, plate only)`);
    continue;
  }

  const logoPath = path.join(process.cwd(), card.logo);
  const markWidth = Math.round(card.width * card.scale);
  // Rasterised at the target width directly — scaling an SVG up after the
  // fact is what makes a composited mark look soft.
  const mark = await sharp(logoPath, { density: 600 })
    .resize({ width: markWidth })
    .png()
    .toBuffer();
  const markMeta = await sharp(mark).metadata();

  await plate
    .composite([
      {
        input: mark,
        // Dead centre, which is the whole point of this file.
        left: Math.round((card.width - (markMeta.width ?? markWidth)) / 2),
        top: Math.round(
          (card.height - (markMeta.height ?? markWidth)) / 2 - card.height * (card.lift ?? 0)
        ),
      },
    ])
    .webp({ quality: 92 })
    .toFile(outPath);

  await fs.access(outPath);
  console.log(`wrote ${card.out} (${card.width}x${card.height})`);
}
