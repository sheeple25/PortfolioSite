import { rowsToRuns, runsToPath } from "@/components/pixel";

/*
 * The stand-in art for the interest band.
 *
 * These are hand-drawn on the same cell grid Pixel itself is drawn on, and
 * built with the same `rowsToRuns`/`runsToPath` pair, so the placeholders are
 * already in the page's final visual language rather than being grey boxes
 * waiting to be replaced. When the real pixelated photo cutouts land, an
 * entry in `interests.tsx` swaps `sprite` for `art` and nothing else moves.
 *
 * Every sprite is 16x16 and symmetric about the vertical centre line. The
 * symmetry is not decoration: an off-centre wing or an unpaired toe reads as
 * a rendering bug rather than as a style, which is exactly the impression a
 * placeholder must not give.
 */

export type Sprite = readonly string[];

/** Travel. Nose up, so it reads as departure rather than as a logo. */
export const PLANE: Sprite = [
  "................",
  ".......##.......",
  ".......##.......",
  "......####......",
  "......####......",
  "......####......",
  ".....######.....",
  "...##########...",
  "..############..",
  "..############..",
  "...##########...",
  ".....######.....",
  "......####......",
  "...##########...",
  "...##########...",
  "......####......",
];

/** Reading. Two blocks of pages with the spine gap kept open all the way down. */
export const BOOK: Sprite = [
  "................",
  "..###......###..",
  ".#####....#####.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".######..######.",
  ".#####....#####.",
  "..###......###..",
  "................",
];

/*
 * Games. A d-pad rather than a controller silhouette: at 16 cells a whole
 * gamepad turns into an unreadable blob once the thumb wells are cut out of
 * it, while a d-pad survives the resolution and is just as unambiguous.
 */
export const DPAD: Sprite = [
  "................",
  "................",
  ".....######.....",
  ".....######.....",
  ".....######.....",
  ".....######.....",
  "..############..",
  "..############..",
  "..############..",
  "..############..",
  ".....######.....",
  ".....######.....",
  ".....######.....",
  ".....######.....",
  "................",
  "................",
];

/** Pets. Four toes and a pad — the one shape that reads as both cat and dog. */
export const PAW: Sprite = [
  "................",
  "................",
  "..##.##..##.##..",
  "..##.##..##.##..",
  "..##.##..##.##..",
  "................",
  "...##########...",
  "..############..",
  "..############..",
  "..############..",
  "..############..",
  "...##########...",
  ".....######.....",
  "................",
  "................",
  "................",
];

/**
 * Renders a sprite as a single `<path>` on a 16-unit viewBox.
 *
 * One path rather than one rect per cell — `rowsToRuns` collapses each row's
 * filled cells into horizontal runs first, so a 16x16 sprite costs a couple
 * of dozen path commands instead of 256 nodes.
 *
 * `shapeRendering="crispEdges"` is what keeps the cells hard at any size; the
 * whole point is that scaling this up looks pixelated rather than smooth.
 */
export default function PixelSprite({
  sprite,
  size = 64,
  className,
}: {
  sprite: Sprite;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path d={runsToPath(rowsToRuns(sprite))} fill="currentColor" />
    </svg>
  );
}
