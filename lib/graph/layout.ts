import type { GraphNode, ProjectGraph } from "./index";

/*
 * Where every node goes — decided here, not by a simulation.
 *
 * The graph used to be laid out by running d3-force for 300 ticks and then
 * rescaling whatever fell out to fit the box. That is fine for a texture and
 * wrong for navigation: the arrangement changed shape every time a tag was
 * added, nothing could be art-directed, and the one thing the page most needs
 * to say — *this* is the work to look at first — was left to a centring force
 * to argue for against everything else pushing back.
 *
 * So position is authored, in two registers:
 *
 *   **Projects snap to a grid.** They are the nine heaviest objects on the
 *   canvas — real photographs, an order of magnitude more visual weight than
 *   anything else — and nine rectangles at nine unrelated angles is what made
 *   the concentric arrangement that preceded this read as scattered, however
 *   carefully its radii were tuned. Aligned to a shared grid they read as
 *   composed. The grid is deliberately not filled: the gaps are where
 *   everything else lives.
 *
 *   **Everything else is placed by what it connects.** A domain, skill or tool
 *   sits at the centroid of the projects it belongs to, so its edges are short
 *   and it lands in the gap between the work it describes. Nothing about a tag
 *   is snapped to anything, and that looseness against the projects' order is
 *   the composition.
 *
 * The physics that remains (`WorkGraph.tsx`) is a spring back to these homes
 * plus collision — enough that the graph breathes and a dragged node fights
 * back, not enough to decide anything.
 *
 * Everything in here is a pure function of `(graph, dims, inset)` and is called
 * on the server and the client both, so it has to agree with itself across two
 * JS engines. That is what the rounding at the end is for — see `round2`.
 */

export type LayoutDims = { width: number; height: number };

/**
 * Canvas units the layout must keep clear for floating chrome.
 *
 * The side panel is persistent, so it is no longer something the graph can be
 * allowed to slide under — a node parked behind the panel is a project you
 * cannot reach. Passed in rather than hardcoded because the panel is sized in
 * `rem` against a band whose pixel width the layout knows nothing about; the
 * component measures both and converts.
 *
 * It reserves on the *left*. The right edge is Pixel's: the mascot floats in
 * that corner across the whole site, and two persistent surfaces in one corner
 * is a fight neither wins. See `useChromeInset` in `WorkGraph.tsx`.
 */
export type LayoutInset = { left?: number; right?: number; bottom?: number };

/** A node's authored resting place, in canvas units. */
export type Home = { x: number; y: number };

/** Half-extents, because every node is a rectangle — see `nodeBox`. */
export type Box = { hw: number; hh: number };

/*
 * The project card. One size, for every project.
 *
 * Selected work used to be drawn larger — 178×126 against 138×98 — which was
 * doing real work back when the arrangement was concentric and size was one of
 * the few things distinguishing the middle from the ring around it. On a grid
 * it stopped helping and started hurting: two card sizes on shared column and
 * row lines read as a grid somebody got wrong, because alignment is exactly
 * what makes a size difference look like a mistake rather than a decision.
 *
 * The centre row already says which work is selected. That is enough, and it
 * is the same argument that removed the ring and the second colour.
 *
 * `caption` is the band the title is laid across *on hover*, not a permanent
 * strip. Sizes live here rather than in the component because the placement
 * below needs them too, and two copies of a card's width is exactly the kind of
 * thing that drifts.
 */
export const CARD = { w: 168, h: 118, caption: 24, title: 11.5 } as const;

/*
 * Domain and skill are no longer the same object with a different colour.
 *
 * A domain is a real pill — a bordered chip you can see the edges of. A skill
 * is bare text, and its `pad` buys only the sliver of ground-coloured fill that
 * keeps an edge from running straight through the middle of a word; there is no
 * border to pad away from.
 */
export const PILL = {
  domain: { h: 26, font: 12, pad: 8, tracking: 0.06 },
  skill: { h: 22, font: 13, pad: 5, tracking: 0 },
} as const;

export const TOOL_R = 17;

/*
 * How the layout is being asked to behave, in the one place both the geometry
 * and the placement can read it.
 *
 * There is exactly one axis here — a phone or not — but it changes two things
 * that have to change together, so it is a mode rather than two flags passed
 * around separately:
 *
 *   `tags` scales every tag's type and box. Sizes in this file are canvas
 *   units and the canvas is scaled to the band, so on a phone a 13-unit skill
 *   label renders at about five pixels. That is not small type, it is a
 *   texture: the words are there and cannot be read. Scaling the tags up costs
 *   packing room, which is why it is paid for by the narrow canvas being a
 *   smaller *area* (`WorkGraph.tsx`) rather than by hoping they still fit.
 *
 *   `caption` does the same for a card's own title, which is drawn from
 *   `CARD` rather than from a pill spec and would otherwise be seven pixels
 *   of type on a phone. The card itself is *not* scaled — its size in canvas
 *   units is what the grid is built around, and it grows on a phone by the
 *   canvas being smaller.
 *
 *   `narrow` swaps the project grid for one that suits a portrait band —
 *   two or three columns of several rows, rather than the four-or-more-wide
 *   arrangement a laptop's letterbox gets. The old `minCols: 3` was a floor
 *   the phone could not honour: at a canvas narrow enough for a readable card
 *   the third column simply hung off the edge, which is what put seven nodes
 *   outside the viewBox.
 */
export type LayoutMode = { tags: number; caption: number; narrow: boolean };

export const WIDE: LayoutMode = { tags: 1, caption: 1, narrow: false };
export const NARROW: LayoutMode = { tags: 1.3, caption: 1.55, narrow: true };

/** A tag's box, at whatever size the mode asks for. */
export function pillSpec(type: "domain" | "skill", mode: LayoutMode = WIDE) {
  const base = PILL[type];
  return {
    h: base.h * mode.tags,
    font: base.font * mode.tags,
    pad: base.pad * mode.tags,
    tracking: base.tracking,
  };
}

export function toolRadius(mode: LayoutMode = WIDE): number {
  return TOOL_R * mode.tags;
}

/** JetBrains Mono's advance is a near-fixed 0.6em; tracking adds to it. */
const MONO_ADVANCE = 0.6;

/** Text width for a mono label, in canvas units. The pill is drawn from this
 *  same estimate, so an imperfect guess shows up as slightly uneven padding
 *  rather than as two labels sitting on top of each other. */
export function pillWidth(node: GraphNode, mode: LayoutMode = WIDE): number {
  if (node.type !== "domain" && node.type !== "skill") return toolRadius(mode) * 2;
  const spec = pillSpec(node.type, mode);
  const advance = spec.font * (MONO_ADVANCE + spec.tracking);
  return node.label.length * advance + spec.pad * 2;
}

export function nodeBox(node: GraphNode, mode: LayoutMode = WIDE): Box {
  if (node.type === "project") return { hw: CARD.w / 2, hh: CARD.h / 2 };
  if (node.type === "tool") return { hw: toolRadius(mode), hh: toolRadius(mode) };
  return { hw: pillWidth(node, mode) / 2, hh: pillSpec(node.type, mode).h / 2 };
}

/** A project the graph holds in the middle — the curated Work section. */
export function isSelected(node: GraphNode): boolean {
  return node.type === "project" && node.featured;
}

/** Reserved at the edges so a node on the outermost row still sits inside the
 *  canvas with room to spare. */
const PAD = { x: 0.055, y: 0.09 };

/**
 * The gaps between grid cells — a range, not a number.
 *
 * Wide gutters are what give the tags somewhere to be, so the layout wants the
 * widest it can get. But the grid also has to hold every project *and* leave
 * holes, and on a short band the widest gutter does not produce enough cells:
 * at 58/50 a laptop's band fits 4x2, which is eight cells for nine projects,
 * and two cards end up in the same one. So the gutter is tried from widest to
 * tightest and the first one that yields enough cells wins.
 *
 * The minimum is a real floor, not a fallback — nothing may push two cards
 * closer than this, because projects are pinned and nothing downstream will
 * separate them.
 */
const GUTTER_RANGE = { max: { x: 58, y: 50 }, min: { x: 20, y: 18 } };
const GUTTER_STEPS = 8;

/** Cells the grid should have spare once every project is placed. The holes
 *  are as much the composition as the cards are — see the placement below. */
const FREE_CELLS = 3;

const GRID_LIMITS = { minCols: 3, maxCols: 7, minRows: 2, maxRows: 5 };

/*
 * The same grid, turned on its side for a portrait band.
 *
 * Two columns where there is room and three where there isn't, over as many
 * rows as it takes — the opposite shape from the laptop's four-or-five wide by
 * two or three deep, and for the same reason: the grid should run along the
 * band's long axis, and on a phone that axis is vertical.
 *
 * `minCols: 2` is the load-bearing change. Three columns of a card wide enough
 * to read do not fit across a phone at any canvas size, so the old floor of 3
 * was not a floor, it was an instruction to hang the outer column off the edge
 * of the viewBox. The gutters are tighter to match: a phone has no width to
 * spend on 58 units of air between two cards.
 */
const NARROW_GRID_LIMITS = { minCols: 2, maxCols: 3, minRows: 2, maxRows: 7 };
const NARROW_GUTTER_RANGE = { max: { x: 40, y: 44 }, min: { x: 16, y: 20 } };
const NARROW_FREE_CELLS = 2;

/** Spacing of the lattice of candidate positions tags are placed on. Fine
 *  enough that "nearest free spot" really is near, coarse enough that the
 *  search stays a few hundred thousand comparisons. */
const SLOT_STEP = { x: 22, y: 16 };

/** Clearance kept between any two nodes. */
const GAP = 10;

const TAU = Math.PI * 2;
const START = -Math.PI / 2; // 12 o'clock, so the arrangement reads as one.

/** The box everything is drawn in, once chrome is deducted. Returning the
 *  offset alongside the size is what lets the packing pass clamp into the same
 *  box rather than into the canvas. */
function safeArea(dims: LayoutDims, inset: LayoutInset) {
  const left = inset.left ?? 0;
  const width = dims.width - left - (inset.right ?? 0);
  const height = dims.height - (inset.bottom ?? 0);
  return {
    left,
    width,
    height,
    cx: left + width / 2,
    cy: height / 2,
    ax: width * (0.5 - PAD.x),
    ay: height * (0.5 - PAD.y),
  };
}

type Cell = { c: number; r: number };

/**
 * The invisible grid the project cards align to.
 *
 * Sized off the featured card plus a gutter, then as many whole cells as fit
 * the safe area, centred in it. Nothing draws this — it exists so that nine
 * rectangles share a small set of x and y values instead of nine each.
 */
function gridGeometry(
  area: ReturnType<typeof safeArea>,
  projectCount: number,
  mode: LayoutMode
) {
  const limits = mode.narrow ? NARROW_GRID_LIMITS : GRID_LIMITS;
  const gutters = mode.narrow ? NARROW_GUTTER_RANGE : GUTTER_RANGE;
  const usableW = area.ax * 2;
  const usableH = area.ay * 2;
  const wanted = projectCount + (mode.narrow ? NARROW_FREE_CELLS : FREE_CELLS);

  let cell = { w: 0, h: 0 };
  let cols = limits.minCols;
  let rows = limits.minRows;

  for (let step = 0; step <= GUTTER_STEPS; step += 1) {
    const t = step / GUTTER_STEPS;
    const gutterX = gutters.max.x + (gutters.min.x - gutters.max.x) * t;
    const gutterY = gutters.max.y + (gutters.min.y - gutters.max.y) * t;

    cell = { w: CARD.w + gutterX, h: CARD.h + gutterY };
    cols = clamp(Math.floor(usableW / cell.w), limits.minCols, limits.maxCols);
    rows = clamp(Math.floor(usableH / cell.h), limits.minRows, limits.maxRows);

    if (cols * rows >= wanted) break;
  }

  const originX = area.cx - ((cols - 1) * cell.w) / 2;
  const originY = area.cy - ((rows - 1) * cell.h) / 2;

  return {
    cols,
    rows,
    at: ({ c, r }: Cell): Home => ({ x: originX + c * cell.w, y: originY + r * cell.h }),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalise(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

/** Mean of a set of angles, done as vectors so 350° and 10° average to 0°
 *  rather than to 180°. Returns `null` for an empty or perfectly opposed set,
 *  where there is no meaningful answer to fall back from. */
function meanAngle(angles: number[]): number | null {
  if (angles.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const a of angles) {
    x += Math.cos(a);
    y += Math.sin(a);
  }
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return null;
  return Math.atan2(y, x);
}

/**
 * The layout.
 *
 * Returns a home per node id. Collision-free by construction: the grid and the
 * centroids give the arrangement its structure and the packing pass at the end
 * gives it room, so the live simulation can start at rest with nothing already
 * overlapping.
 */
export function layoutHomes(
  graph: ProjectGraph,
  dims: LayoutDims,
  inset: LayoutInset = {},
  mode: LayoutMode = WIDE
): Map<string, Home> {
  const area = safeArea(dims, inset);
  const projects = graph.nodes.filter(
    (n): n is Extract<GraphNode, { type: "project" }> => n.type === "project"
  );
  const grid = gridGeometry(area, projects.length, mode);
  const selected = projects.filter(isSelected);
  const rest = projects.filter((n) => !isSelected(n));

  /** project id -> its tag ids, and tag id -> its project ids. */
  const tagsOf = new Map<string, Set<string>>();
  const projectsOf = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (!tagsOf.has(edge.source)) tagsOf.set(edge.source, new Set());
    tagsOf.get(edge.source)!.add(edge.target);
    if (!projectsOf.has(edge.target)) projectsOf.set(edge.target, []);
    projectsOf.get(edge.target)!.push(edge.source);
  }

  const homes = new Map<string, Home>();
  const taken: Cell[] = [];

  /*
   * The selected work takes the middle row, centred and contiguous.
   *
   * This is now the whole of what marks it out. There used to be a dashed ring
   * around it with `SELECTED WORK` set above — removed, because a labelled
   * circle drawn around your own three best projects is a caption explaining a
   * point the composition can make by itself. A row of larger cards across the
   * middle of a grid is already the centre of the picture.
   */
  const midRow = Math.floor((grid.rows - 1) / 2);
  const startCol = Math.max(0, Math.floor((grid.cols - selected.length) / 2));
  selected.forEach((node, i) => {
    const cell = { c: Math.min(grid.cols - 1, startCol + i), r: midRow };
    taken.push(cell);
    homes.set(node.id, grid.at(cell));
  });

  /*
   * The rest are spread across the cells that are left, greedily: each goes to
   * whichever free cell is furthest from everything already placed.
   *
   * The alternative — filling outward from the centre — packs the cards into a
   * block and leaves the tags nowhere to be except the margins. Spreading them
   * keeps holes in the middle of the grid, and the holes are as much the
   * composition as the cards are.
   */
  const free: Cell[] = [];
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      if (!taken.some((t) => t.c === c && t.r === r)) free.push({ c, r });
    }
  }

  const restCells: Cell[] = [];
  for (let i = 0; i < rest.length && free.length > 0; i += 1) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    free.forEach((cell, index) => {
      let nearest = Infinity;
      for (const t of [...taken, ...restCells]) {
        // Cell distance, not pixel distance — the grid is the unit here.
        const d = Math.hypot(cell.c - t.c, cell.r - t.r);
        if (d < nearest) nearest = d;
      }
      // Strictly greater, so ties break toward the earlier cell and the result
      // never depends on the order `free` happened to be built in.
      if (nearest > bestScore) {
        bestScore = nearest;
        bestIndex = index;
      }
    });
    restCells.push(free.splice(bestIndex, 1)[0]);
  }

  /*
   * Which project goes in which of those cells.
   *
   * Each one is asked which selected projects it shares tags with and takes the
   * mean of their directions as a preference, so the work that overlaps with
   * the thesis ends up near the thesis. Projects and cells are then both sorted
   * by angle around the centre and zipped, which is what lets the similarity
   * ordering survive the snap to the grid.
   */
  const selectedAngle = new Map<string, number>();
  selected.forEach((node, i) => {
    const home = homes.get(node.id)!;
    const dx = home.x - area.cx;
    const dy = home.y - area.cy;
    // A single selected project sits dead centre, where there is no angle to
    // read off its position.
    selectedAngle.set(
      node.id,
      Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6
        ? START + (i / Math.max(1, selected.length)) * TAU
        : Math.atan2(dy, dx)
    );
  });

  const preference = new Map<string, number>();
  rest.forEach((node, i) => {
    const mine = tagsOf.get(node.id) ?? new Set<string>();
    const pull: number[] = [];
    for (const other of selected) {
      const theirs = tagsOf.get(other.id) ?? new Set<string>();
      let shared = 0;
      for (const tag of mine) if (theirs.has(tag)) shared += 1;
      for (let k = 0; k < shared; k += 1) pull.push(selectedAngle.get(other.id)!);
    }
    const mean = meanAngle(pull);
    preference.set(
      node.id,
      mean === null ? START + (i / rest.length) * TAU : normalise(mean)
    );
  });

  const orderedProjects = [...rest].sort((a, b) => {
    const delta = preference.get(a.id)! - preference.get(b.id)!;
    // Registry order breaks ties, so the result never depends on sort stability.
    return delta !== 0 ? delta : rest.indexOf(a) - rest.indexOf(b);
  });

  const orderedCells = [...restCells].sort((a, b) => {
    const ha = grid.at(a);
    const hb = grid.at(b);
    const angleA = normalise(Math.atan2(ha.y - area.cy, ha.x - area.cx));
    const angleB = normalise(Math.atan2(hb.y - area.cy, hb.x - area.cx));
    return angleA !== angleB ? angleA - angleB : a.r - b.r || a.c - b.c;
  });

  /*
   * One project per cell, never two. `gridGeometry` sizes the grid to hold them
   * all, but if a band were ever small enough to defeat even the tightest
   * gutter, wrapping the assignment would stack two cards exactly on top of
   * each other — and cards are pinned, so the packing pass would not pull them
   * apart. Leaving the extras at their centroid-free default is a worse layout
   * and a visible one, rather than a silent collision.
   */
  orderedProjects.forEach((node, i) => {
    if (i >= orderedCells.length) {
      homes.set(node.id, { x: area.cx, y: area.cy });
      return;
    }
    homes.set(node.id, grid.at(orderedCells[i]));
  });

  /*
   * Tags go as near the centroid of their own projects as there is room for.
   *
   * The centroid is where a tag *wants* to be — among the work it describes, so
   * its edges stay short and the cluster it forms is legible without tracing
   * anything. It is very often not where it can be: twenty-six labels share the
   * gaps between nine pinned cards, and a good few centroids land squarely on a
   * card, or on each other where two tags have the same owners.
   *
   * An iterative separation pass was the obvious answer and was the wrong one.
   * Cards do not move, so every correction has to be absorbed by the tag; a tag
   * wedged between two cards is pushed from both sides and simply oscillates,
   * and hundreds of passes later a fifth of them were still overlapping. The
   * problem is not that positions need nudging, it is that they need
   * *assigning* — so they are assigned, greedily, on a lattice.
   *
   * Most-connected first, because a tag with five edges has the most to lose by
   * being pushed out to the margin.
   */
  const tags = graph.nodes
    .filter((n) => n.type !== "project")
    .map((node) => {
      const owners = projectsOf.get(node.id) ?? [];
      const points = owners
        .map((id) => homes.get(id))
        .filter((h): h is Home => Boolean(h));
      const target =
        points.length > 0
          ? {
              x: points.reduce((sum, q) => sum + q.x, 0) / points.length,
              y: points.reduce((sum, q) => sum + q.y, 0) / points.length,
            }
          : { x: area.cx, y: area.cy };
      return { node, box: nodeBox(node, mode), degree: owners.length, target };
    })
    .sort((a, b) => b.degree - a.degree || (a.node.id < b.node.id ? -1 : 1));

  const placed = projects.map((node) => ({
    box: nodeBox(node, mode),
    home: homes.get(node.id)!,
  }));

  const slots = latticeSlots(area);

  for (const tag of tags) {
    let best: Home | null = null;
    let bestCost = Infinity;
    let fallback: Home | null = null;
    let fallbackOverlap = Infinity;

    for (const slot of slots) {
      // Off the edge of the safe area is never a candidate, whatever it costs.
      if (
        slot.x - tag.box.hw < area.left ||
        slot.x + tag.box.hw > area.left + area.width ||
        slot.y - tag.box.hh < 0 ||
        slot.y + tag.box.hh > area.height
      ) {
        continue;
      }

      let overlap = 0;
      for (const other of placed) {
        overlap += overlapArea(slot, tag.box, other.home, other.box);
      }

      const distance = Math.hypot(slot.x - tag.target.x, slot.y - tag.target.y);
      if (overlap === 0) {
        if (distance < bestCost) {
          bestCost = distance;
          best = slot;
        }
      } else if (best === null) {
        /* Only consulted if nothing anywhere is free — a band small enough for
           that is already broken, and a least-bad position beats a pile. */
        const cost = overlap + distance;
        if (cost < fallbackOverlap) {
          fallbackOverlap = cost;
          fallback = slot;
        }
      }
    }

    const home = best ?? fallback ?? tag.target;
    homes.set(tag.node.id, { x: round2(home.x), y: round2(home.y) });
    placed.push({ box: tag.box, home });
  }

  for (const node of projects) {
    const home = homes.get(node.id)!;
    /*
     * Rounded to 2dp. The server and the browser run this same code on two
     * builds of two engines, and `Math.cos`/`Math.atan2` are not required to
     * agree in the last bit — unrounded, that is a hydration mismatch on every
     * x/y attribute in the SVG. At this magnitude the disagreement is ~1e-12,
     * which 2dp is comfortably above.
     */
    homes.set(node.id, { x: round2(home.x), y: round2(home.y) });
  }

  return homes;
}

/** Every candidate position, in a stable order — row by row from the top-left,
 *  so ties in the search below always resolve the same way. */
function latticeSlots(area: ReturnType<typeof safeArea>): Home[] {
  const step = SLOT_STEP;
  const slots: Home[] = [];
  const cols = Math.max(1, Math.floor(area.width / step.x));
  const rows = Math.max(1, Math.floor(area.height / step.y));
  const originX = area.left + (area.width - (cols - 1) * step.x) / 2;
  const originY = (area.height - (rows - 1) * step.y) / 2;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      slots.push({ x: originX + c * step.x, y: originY + r * step.y });
    }
  }
  return slots;
}

/** Overlapping area of two boxes, each grown by `GAP` so neighbours keep a
 *  little air rather than merely not touching. */
function overlapArea(ca: Home, ba: Box, cb: Home, bb: Box): number {
  const dx = ba.hw + bb.hw + GAP - Math.abs(cb.x - ca.x);
  const dy = ba.hh + bb.hh + GAP - Math.abs(cb.y - ca.y);
  return dx > 0 && dy > 0 ? dx * dy : 0;
}
