/**
 * Pixel's sprite sheet.
 *
 * Everything is authored as a literal grid of cells, not as vectors that get
 * downsampled later. That's the whole point: a curve drawn smooth and then
 * shrunk leaves semi-transparent fringe pixels along every edge, which is what
 * makes a "pixelated" render still look soft. Here the stair-steps ARE the
 * artwork, so the silhouette is hard-edged at any display size.
 *
 * The body is one 24x24 mask. Eyes live in their own 6x6 box, drawn once for
 * the left eye and mirrored for the right, so the face stays symmetrical by
 * construction rather than by counting columns twice.
 */

export const GRID = 24;

const FULL = "#".repeat(GRID);

/**
 * Rounded top corners (rows 0-3, radius ~4 cells), straight sides, and a
 * stair-stepped hem (rows 20-23) that resolves into four 3-cell feet separated
 * by three 4-cell notches: 4*3 + 3*4 = 24.
 *
 * Corner insets run 4, 2, 1, 1 — a shallow shoulder rather than a dome. Fewer
 * dome rows means a squarer head; to soften it again, lengthen the taper
 * (e.g. 7, 5, 3, 2, 1, 1) and drop the same number of FULL rows below so the
 * grid stays 24 tall.
 *
 * The hem steps twice — two rows at notch-width 2, two at width 4. Notch widths
 * have to stay even to keep each V centred on its 4-cell gap, so those are the
 * only two steps available at this resolution; doubling up the rows is what
 * gives the hem enough depth to read as a wave rather than a nibbled edge.
 */
export const BODY: readonly string[] = [
  "..####################..",
  ".######################.",
  ".######################.",
  "########################",
  ...(Array<string>(16).fill(FULL) as string[]), // rows 4-19, full width
  "########################",
  "####..#####..#####..####",
  "###....###....###....###",
  "###....###....###....###",
];

export type Expression =
  | "default"
  | "happy"
  | "embarrassed"
  | "surprised"
  | "sleepy"
  | "asleep"
  | "unimpressed"
  | "dead"
  | "blink";

/**
 * Left eye only, 6x6. The right eye is this mirrored across the body's vertical
 * axis at render time.
 *
 * `sleepy` slopes outer-high to inner-low (a tired droop). Flipping those two
 * rows gives the opposite slant, which reads as irritated rather than sleepy.
 */
export const EYES: Record<Expression, readonly string[]> = {
  default: [
    "......",
    "..##..",
    "..##..",
    "..##..",
    "..##..",
    "......",
  ],
  happy: [
    "......",
    ".####.",
    "##..##",
    "#....#",
    "#....#",
    "......",
  ],
  embarrassed: [
    "......",
    "##....",
    ".##...",
    "..##..",
    ".##...",
    "##....",
  ],
  surprised: [
    "......",
    ".####.",
    ".#..#.",
    ".#..#.",
    ".#..#.",
    ".####.",
  ],
  sleepy: [
    "......",
    "##....",
    ".##...",
    "..##..",
    "...##.",
    "......",
  ],
  asleep: [
    "......",
    "......",
    "#....#",
    ".#..#.",
    "..##..",
    "......",
  ],
  unimpressed: [
    "......",
    "......",
    ".####.",
    ".####.",
    "......",
    "......",
  ],
  dead: [
    "......",
    "#....#",
    ".#..#.",
    "..##..",
    ".#..#.",
    "#....#",
  ],
  blink: [
    "......",
    "......",
    "......",
    ".####.",
    "......",
    "......",
  ],
};

export const EXPRESSIONS = Object.keys(EYES) as Expression[];

/** Top-left cell of the left eye's 6x6 box. The right box mirrors to 13-18. */
export const EYE_ORIGIN = { x: 5, y: 6 } as const;

/**
 * Which moods follow the cursor. Closed or fixed-gaze eyes shouldn't track —
 * a sleeping ghost that still watches you is unsettling in the wrong way.
 */
const TRACKING: ReadonlySet<Expression> = new Set<Expression>([
  "default",
  "happy",
  "embarrassed",
  "surprised",
  "unimpressed",
]);

export function tracksCursor(expression: Expression): boolean {
  return TRACKING.has(expression);
}

export type Run = { x: number; y: number; w: number };

/** Collapse each row of a mask into horizontal runs of filled cells. */
export function rowsToRuns(
  rows: readonly string[],
  originX = 0,
  originY = 0,
): Run[] {
  const runs: Run[] = [];

  rows.forEach((row, r) => {
    let start = -1;
    for (let c = 0; c <= row.length; c++) {
      const filled = row[c] === "#";
      if (filled && start === -1) start = c;
      else if (!filled && start !== -1) {
        runs.push({ x: originX + start, y: originY + r, w: c - start });
        start = -1;
      }
    }
  });

  return runs;
}

export function mirrorRuns(runs: readonly Run[]): Run[] {
  return runs.map(({ x, y, w }) => ({ x: GRID - x - w, y, w }));
}

export function translateRuns(runs: readonly Run[], dx: number, dy: number): Run[] {
  return dx === 0 && dy === 0
    ? (runs as Run[])
    : runs.map(({ x, y, w }) => ({ x: x + dx, y: y + dy, w }));
}

/**
 * All runs become subpaths of a SINGLE path element. Separate <rect>s would
 * anti-alias against each other and show hairline seams between adjacent cells;
 * one path is one fill operation, so shared edges are interior and invisible.
 */
export function runsToPath(runs: readonly Run[]): string {
  return runs.map(({ x, y, w }) => `M${x} ${y}h${w}v1h${-w}z`).join("");
}
