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

/* ------------------------------------------------------------- accessories */

export type Accessory = "bowtie" | "bowler" | "sunglasses" | "horns" | "halo";

export type AccessorySprite = {
  /** Shown in the wardrobe, and read out to assistive tech. */
  label: string;
  /** Same literal-grid authoring as the body: 24 columns, `#` is ink. */
  rows: readonly string[];
  /**
   * Where row 0 of `rows` lands on the body grid. NEGATIVE IS ABOVE THE HEAD —
   * a bowler and a halo have to sit off the top of the 24x24 box, which is why
   * `Pixel.module.css` lets the sprite overflow rather than clip to its
   * viewBox. The body's own box is left at 24x24 so nothing about the mascot's
   * layout — the fixed corner, the bob, every `size` prop on the site —
   * changes when a hat goes on.
   */
  originY: number;
  /** Omitted means "the same ink as the eyes", which most of these want. */
  fill?: string;
  /** Opaque lenses. Drawing eyes underneath them just muddies the shape. */
  hidesEyes?: boolean;
};

/**
 * The wardrobe. Five costume pieces, authored the same way as the body and the
 * eyes — a literal grid, so the stair-steps stay part of the artwork instead of
 * being a smooth curve that got downsampled.
 *
 * Two of them break the 24x24 box upward (`originY` below zero) and one paints
 * over the eyes; everything else is an ordinary overlay drawn last.
 */
export const ACCESSORIES: Record<Accessory, AccessorySprite> = {
  bowtie: {
    label: "Bow tie",
    // Sits on the lower body, above the hem's feet (which start at row 21).
    //
    // The wings are five cells tall at the outer edge and taper to one as they
    // reach the knot — that taper is the whole silhouette. An earlier version
    // kept them a constant three tall and it rendered as three dark blobs in a
    // row rather than as a tie.
    //
    // The middle row runs solid all the way across on purpose. Punching it
    // either side of the knot looked right on the grid and rendered as a knot
    // floating unattached between two wings.
    originY: 15,
    rows: [
      "....##............##....",
      "....#####..##..#####....",
      "....################....",
      "....#####..##..#####....",
      "....##............##....",
    ],
  },
  bowler: {
    label: "Bowler hat",
    // Crown four rows, then a brim twice its width — at this resolution a
    // realistically narrow bowler brim just reads as a dark cap, so the
    // silhouette is exaggerated until the hat is unmistakably a hat.
    //
    // The bottom row is 20 cells wide, which is exactly the width of row 0 of
    // the head: the brim lands flush on the shoulders instead of hanging over
    // them or floating above the rounded corners.
    //
    // Warm grey rather than the eyes' near-black, and this is the only reason:
    // the crown is the one piece of costume that sits almost entirely OFF the
    // body, against whatever is behind Pixel — and where the wardrobe is
    // reachable, that is the footer's pure black panel. A black hat on it was
    // simply invisible. Horns and the halo overhang too, which is why they
    // carry their own colours as well; everything that stays on the blue body
    // can safely default to the eye ink.
    originY: -6,
    fill: "#8a8578",
    rows: [
      "........########........",
      ".......##########.......",
      ".......##########.......",
      ".......##########.......",
      "...##################...",
      "..####################..",
    ],
  },
  sunglasses: {
    label: "Sunglasses",
    // Lenses are filled and the eyes are suppressed underneath: a hollow frame
    // reads as spectacles, not shades. The punched pair of cells in each lens
    // is a glint — it shows body colour through, which is what stops the lens
    // being a dead black slab.
    originY: 6,
    hidesEyes: true,
    rows: [
      "..####################..",
      "...##################...",
      "...#..#####..#..#####...",
      "....######....######....",
      ".....####......####.....",
    ],
  },
  horns: {
    label: "Devil horns",
    // Bases sit on the head and taper outward as they climb, so the pair
    // reads as curving away from each other rather than as two spikes.
    originY: -5,
    fill: "#d64545",
    rows: [
      "...#................#...",
      "...##..............##...",
      "....##............##....",
      ".....##..........##.....",
      ".....###........###.....",
    ],
  },
  halo: {
    label: "Angel halo",
    // A closed ring with three empty rows below it — the gap is the float, and
    // it is why this one starts as high as the hat does despite being smaller.
    //
    // Fourteen cells across rather than twelve: narrower, the indented middle
    // row stopped reading as the sides of a ring and the whole thing looked
    // like two stacked bars.
    originY: -6,
    fill: "#f2c94c",
    rows: [
      ".......##########.......",
      ".....##..........##.....",
      ".......##########.......",
    ],
  },
};

export const ACCESSORY_KEYS = Object.keys(ACCESSORIES) as Accessory[];

export function isAccessory(value: unknown): value is Accessory {
  return typeof value === "string" && value in ACCESSORIES;
}
