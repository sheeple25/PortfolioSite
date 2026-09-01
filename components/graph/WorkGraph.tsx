"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { forceCollide, forceSimulation, forceX, forceY } from "d3-force";
import type { Simulation } from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from "d3-zoom";
import { FileText, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useShutter } from "@/components/chrome/Shutter";
import type { GraphNode, ProjectGraph } from "@/lib/graph";
import {
  CARD,
  NARROW,
  WIDE,
  layoutHomes,
  nodeBox,
  pillSpec,
  pillWidth,
  toolRadius,
  type Home,
  type LayoutDims,
  type LayoutInset,
  type LayoutMode,
} from "@/lib/graph/layout";
import styles from "./WorkGraph.module.css";

/*
 * The work knowledge graph — the whole of `/projects`'s navigation, and (since
 * `/` redirects here) the first thing anyone sees of the site.
 *
 * That is the thing to hold on to when reading the rest of this file. There is
 * no tile grid: this is the only way to reach a project from the index, and
 * every awkward-looking piece below — the SVG `<a>` elements, the tab scoping,
 * the cover cards, the measured canvas — is a consequence of that promotion.
 * See `docs/INDEX_NAV_REDESIGN.md`.
 *
 * Three things changed together in the readability pass, and they only make
 * sense as one change:
 *
 *   1. **Position is authored** (`lib/graph/layout.ts`), not simulated. The
 *      force layout that used to decide this was re-deciding it on every
 *      content change and could not be art-directed; the selected work now
 *      sits in the middle because it is *put* there. What remains of the
 *      physics is a spring back to those homes plus collision, so the graph
 *      still breathes and still fights a drag.
 *   2. **Projects are cards, not discs.** A cover cropped into a 27px circle
 *      is a colour swatch. A card is ~9× the area, keeps the cover's own
 *      shape, and has somewhere to put the title other than floating under it.
 *      Cards are rectangles, which is why the packing pass in the layout does
 *      a rectangle test rather than leaving it to `forceCollide`.
 *   3. **The canvas is measured, not assumed.** See `useCanvas` below — this
 *      was quietly throwing away about half the graph.
 */

/*
 * The canvas the layout is computed in, before any measurement. Server render
 * and first client render both use it, so they agree; an effect corrects it
 * from the real band a moment later.
 *
 * 1600×620 is roughly a laptop's band (a 1440×560 slot scales to 1600×622),
 * so in the common case the correction is a couple of units and invisible.
 */
const BASE_DIMS: LayoutDims = { width: 1600, height: 620 };

/*
 * The same trade on a phone, at about seven tenths of the room.
 *
 * Sizes in `layout.ts` are canvas units, so a smaller canvas is how a card
 * gets a larger share of a small screen — and the canvas used to be a flat 980
 * wide here, which rendered a card at 67x47 CSS pixels and a skill label at
 * five. Neither is a thumbnail or a word; they are a texture of them.
 *
 * The number is a measurement, not a taste: `layoutHomes` is pure, so the
 * whole thing can be run offline against a spread of real phone bands and the
 * result checked for overlapping nodes. 700k is the smallest area — the
 * biggest cards — at which every band from a 375x360 squat one up packs
 * cleanly with the larger tag type of `NARROW`. It lands a card at about
 * 100x70 on a typical phone, half again what it was.
 *
 * Constant *area* rather than constant width for the same reason the desktop
 * canvas is (see `CANVAS_AREA`): the packing problem is about how much room
 * there is, and a short band and a tall one of the same area have the same
 * amount of it. A phone in a squat band gets a wider canvas and smaller cards,
 * which is the honest answer — there is less room, so less fits.
 */
const NARROW_AREA = 700_000;
const NARROW_WIDTH_CLAMP = { min: 560, max: 1100 };

/** Guards against a degenerate band (a collapsed flex slot mid-layout, a
 *  browser reporting 0 during a resize) turning into an absurd viewBox. */
const ASPECT_CLAMP = { min: 0.28, max: 1.6 };

/*
 * The canvas keeps a constant *area*, not a constant width.
 *
 * Node sizes are in canvas units, so how much room the graph has is a question
 * about area, and a band that is short and very wide has no less of it than a
 * squarer one — it just has a different shape. Solving `w × (w × aspect) = A`
 * for the width gives every band shape the same amount of room to pack into,
 * and the SVG's own scaling then renders the nodes at whatever size that
 * implies: a little smaller on a letterbox band, a little larger on a deep
 * one. Fixing the width instead is what left the squattest bands with 33% of
 * the canvas covered in cards and nowhere for the packing pass to put them.
 *
 * `Math.sqrt` is required by IEEE-754 to be correctly rounded, so this agrees
 * across engines exactly — which matters because the layout it feeds is
 * server-rendered.
 */
const CANVAS_AREA = 1600 * 620;
const WIDTH_CLAMP = { min: 1350, max: 2200 };

const ZOOM_EXTENT: [number, number] = [0.5, 4];

/*
 * `logoWidth` is authored as a percentage of an index tile, and a tile was
 * roughly 590px across where a card is ~160. Kept literally, Traces' 14% comes
 * out at about 22px — proportionally identical and practically invisible.
 *
 * A mark on a card is doing a different job from a mark on a tile: on a tile it
 * is a watermark over a picture, on a card it is most of how you recognise the
 * project at all. So the authored ratio is kept as the relative sizing between
 * marks — Traces stays smaller than Kobble, which is the point of the numbers
 * being different — and scaled up as a set.
 */
const CARD_LOGO_SCALE = 2.2;
const CARD_LOGO_MAX = 0.62;

/** A mark's box on a card, in canvas units. Square, with the image fitted
 *  inside it — so `logoWidth` stays an upper bound on the width whatever the
 *  mark's own aspect ratio turns out to be. */
function cardLogoSize(cardWidth: number, logoWidth: number | undefined): number {
  const fraction = ((logoWidth ?? 20) / 100) * CARD_LOGO_SCALE;
  return cardWidth * Math.min(fraction, CARD_LOGO_MAX);
}

/** Spring back to the authored home. Firm enough that a released node returns
 *  promptly, soft enough that the return reads as motion rather than a snap. */
const HOME_STRENGTH = 0.09;

type SimNode = GraphNode & {
  x: number;
  y: number;
  home: Home;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};
type ZoomState = { x: number; y: number; k: number };

/*
 * Real software marks where one exists in Simple Icons (self-hosted under
 * `public/logos/tools/`), a plain initials badge everywhere else.
 * Solidworks/Keyshot/Humanify aren't in that icon set (niche
 * engineering/survey tools, not the open-source-ish brands it covers), so
 * they fall back rather than get a fabricated mark.
 */
const TOOL_LOGOS: Record<string, string> = {
  figma: "/logos/tools/figma.svg",
  "after effects": "/logos/tools/after-effects.svg",
  rhino: "/logos/tools/rhino.svg",
};

type ToolIcon = { kind: "logo"; src: string } | { kind: "initials"; text: string };

function toolIcon(label: string): ToolIcon {
  const src = TOOL_LOGOS[label.trim().toLowerCase()];
  if (src) return { kind: "logo", src };

  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { kind: "initials", text: initials || "?" };
}

/*
 * The legend, cut from five rows to four and from icons to shapes.
 *
 * It used to key five colours with five Lucide glyphs, none of which was the
 * shape the thing actually is on the canvas — a `FileText` icon standing for a
 * project made of a photograph, a `Tag` for a word. A legend whose swatches
 * are the real marks needs no translating, and one fewer row is one fewer
 * distinction to hold before you have looked at anything.
 */
type LegendShape = "card" | "pill" | "text" | "chip";
const LEGEND: Array<{ shape: LegendShape; colorVar: string; label: string }> = [
  { shape: "card", colorVar: "--node-project", label: "Project" },
  { shape: "pill", colorVar: "--node-domain", label: "Domain" },
  { shape: "text", colorVar: "--node-skill", label: "Skill" },
  { shape: "chip", colorVar: "--node-tool", label: "Tool" },
];

/** What the panel calls the thing you are pointing at. The canvas encodes
 *  this in shape and colour; the panel says it in words, so a reader never has
 *  to consult the legend to know which of the four they are looking at. */
const KIND_LABEL: Record<GraphNode["type"], string> = {
  project: "Project",
  domain: "Domain",
  skill: "Skill",
  tool: "Tool",
};

/**
 * The frame a card shows at rest.
 *
 * Not zero. A loop's first frame is often a fade-in from black or an empty
 * plate, which is the one frame of it least worth showing; a fraction of a
 * second in, the composition has arrived. It also doubles as a media fragment
 * on the `src`, which is what makes a browser fetch and paint a frame for a
 * video it has been told not to play.
 */
const STILL_TIME = 0.35;

/**
 * A project's cover loop — always mounted, paused unless the card is hovered.
 *
 * It used to mount only on hover, which meant a card with a video had no video
 * on it at rest: Traces sat as a blank plate with its mark on it until you
 * pointed at it, which reads as a missing image rather than as restraint. A
 * paused video *is* the still, and it is the right still by construction — no
 * separate poster frame to export, keep in step, or (without ffmpeg on this
 * machine) fail to generate at all.
 *
 * `preload="metadata"` plus the `#t=` fragment is the cheap version of that:
 * enough of the file to decode one frame, not the whole loop, for three videos
 * on the page's first screen.
 *
 * Its own component so the play/pause effect has somewhere to live — one ref
 * per video, rather than the parent keeping a map of them keyed by node id.
 */
function CardVideo({ src, playing }: { src: string; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (playing) {
      // Rejected autoplay is not an error worth surfacing — the still stays,
      // which is a perfectly good outcome.
      void el.play().catch(() => {});
      return;
    }

    el.pause();
    // Back to the frame the card shows at rest, so leaving and returning to a
    // card always finds it as you first saw it.
    try {
      el.currentTime = STILL_TIME;
    } catch {
      // Seeking before metadata has arrived throws; the `#t=` fragment on the
      // src has already asked for the same frame, so there is nothing to do.
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      className={styles.cardVideo}
      src={`${src}#t=${STILL_TIME}`}
      preload="metadata"
      muted
      loop
      playsInline
      aria-hidden="true"
    />
  );
}

function LegendSwatch({ shape }: { shape: LegendShape }) {
  if (shape === "chip") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (shape === "pill") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
        <rect
          x="0.5"
          y="3.5"
          width="17"
          height="7"
          fill="var(--pill-fill)"
          stroke="currentColor"
        />
      </svg>
    );
  }
  if (shape === "text") {
    // Skills have no chrome of their own any more, so the swatch is a rule of
    // text rather than a container — the legend should show what is on the
    // canvas, and on the canvas a skill is a word.
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
        <rect x="1" y="5.5" width="16" height="3" fill="currentColor" opacity="0.75" />
      </svg>
    );
  }
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
      <rect x="0.5" y="1.5" width="17" height="8" fill="currentColor" opacity="0.5" />
      <rect x="0.5" y="9.5" width="17" height="3" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/**
 * The canvas the graph is laid out in, taken from the band it is actually
 * rendered into.
 *
 * This is the fix for the largest single readability problem the graph had,
 * and it was invisible in the markup. The canvas was a fixed 1600×1200 drawn
 * with `preserveAspectRatio="slice"` into a band about 1440×560 — `slice`
 * scales to *cover*, so the canvas rendered 1440×1080 inside a 560px window
 * and a little under half of it was off-screen at rest. The layout, meanwhile,
 * spread nodes evenly across the full 1200. Roughly half the graph started
 * outside the viewport, reachable only by panning, on the page whose whole job
 * is to be understood at a glance.
 *
 * Measuring means the viewBox and the band always share an aspect ratio, at
 * which point `meet` and `slice` are the same thing and nothing is ever
 * cropped.
 */
function useCanvas(frame: React.RefObject<HTMLDivElement | null>) {
  // The band's real pixel box, kept alongside the canvas so callers can
  // convert between the two — chrome is sized in `rem`, the layout in canvas
  // units, and the inset below has to be stated in the latter.
  const [band, setBand] = useState({ width: 0, height: 0 });
  // Starts at the base aspect on the server and on the first client render
  // both — reading the element during render would make the markup depend on
  // a box the server cannot see, and this drives an SVG attribute, so a
  // mismatch is a real hydration error and not a cosmetic one.
  const [aspect, setAspect] = useState(BASE_DIMS.height / BASE_DIMS.width);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;

    const query = window.matchMedia("(max-width: 40rem)");
    const syncNarrow = () => setNarrow(query.matches);
    syncNarrow();
    query.addEventListener("change", syncNarrow);

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      setBand({ width, height });
      setAspect(clamp(height / width, ASPECT_CLAMP.min, ASPECT_CLAMP.max));
    });
    observer.observe(el);

    return () => {
      query.removeEventListener("change", syncNarrow);
      observer.disconnect();
    };
  }, [frame]);

  const dims = useMemo<LayoutDims>(() => {
    // A phone runs the same calculation against a smaller area — see
    // `NARROW_AREA`. There the binding constraint is not packing efficiency
    // but that a card has to stay big enough to read, and a label big enough
    // to be a word, on a screen a few hundred pixels wide.
    const area = narrow ? NARROW_AREA : CANVAS_AREA;
    const limit = narrow ? NARROW_WIDTH_CLAMP : WIDTH_CLAMP;
    const width = clamp(Math.round(Math.sqrt(area / aspect)), limit.min, limit.max);
    return { width, height: Math.round(width * aspect) };
  }, [aspect, narrow]);

  return { dims, narrow, band };
}

/**
 * Canvas units to keep clear for the side panel.
 *
 * The panel is persistent now rather than a box that appears on hover, so the
 * graph can no longer be allowed to run underneath it — a node parked behind
 * the panel is a project you cannot reach. The panel is sized in `rem` and the
 * layout works in canvas units, so this measures the panel against the band
 * and converts.
 *
 * It reserves on the *left*. The right edge is Pixel's: the mascot floats in
 * that corner across the whole site, and a panel there is two persistent
 * surfaces competing for the same space.
 *
 * `PANEL_FRACTION` seeds the reservation before anything has been measured,
 * on the server and the first client render both. Without it the first paint
 * would lay the graph out across the full width and then visibly shuffle left
 * once the panel reported its size; with it the correction is a few units.
 */
const PANEL_FRACTION = 0.19;
const CHROME_GUTTER = 20;

function useChromeInset(
  panel: React.RefObject<HTMLElement | null>,
  dims: LayoutDims,
  band: { width: number; height: number },
  narrow: boolean
): LayoutInset {
  const [panelBox, setPanelBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPanelBox({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [panel]);

  return useMemo<LayoutInset>(() => {
    const measured = band.width > 0 && panelBox.width > 0;

    /*
     * Nothing at all on a phone.
     *
     * What is left of the panel there is the legend, a small translucent block
     * in the bottom-left corner with `pointer-events: none` on it — and a
     * strip of reserved height is an expensive way to keep a card out from
     * under something you can see and touch through. Measured against real
     * phone bands it is also the worse layout of the two: reserving the
     * legend's height is what pushed nodes into each other on the shortest
     * bands, where the graph has least room to give in the first place.
     */
    if (narrow) return {};

    if (!measured) return { left: dims.width * PANEL_FRACTION };
    return { left: ((panelBox.width + CHROME_GUTTER) / band.width) * dims.width };
  }, [band, panelBox, dims, narrow]);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** The project's facts, labelled. Same fields the panel always showed, told
 *  apart by what they are rather than by the order they happen to be in. */
function detailFacts(node: GraphNode): Array<{ label: string; value: string }> {
  if (node.type !== "project") return [];
  const facts: Array<{ label: string; value: string }> = [];
  if (node.place) facts.push({ label: "Where", value: node.place });
  if (node.role) facts.push({ label: "Role", value: node.role });
  if (node.team) facts.push({ label: "Team", value: node.team });
  const when = node.timeline ?? node.term;
  if (when) facts.push({ label: "When", value: when });
  return facts;
}

/** Client point -> this SVG's own viewBox coordinates (pre-zoom-transform). */
function toRootPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const local = point.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

export default function WorkGraph({ graph }: { graph: ProjectGraph }) {
  const router = useRouter();
  const shutter = useShutter();
  const frameRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  /** Held so the reset control can drive the same behavior the gestures do,
   *  rather than fighting it by writing the transform state directly. */
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  /*
   * A drag that ended on a project node still produces a `click`, and that
   * node is a real anchor — so without this, letting go of a card you have
   * just dragged across the canvas navigates to it. Set on the pointer-up that
   * ends a move, read and cleared by the click that follows.
   */
  const suppressClickRef = useRef(false);
  /** Namespaces this instance's `<clipPath>` ids. */
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");

  const stillMotion = usePrefersReducedMotion();
  const { dims, narrow, band } = useCanvas(frameRef);
  const inset = useChromeInset(panelRef, dims, band, narrow);
  /* One object, read by the layout and by every mark below, so the geometry
     the packing was checked against is the geometry that gets drawn. */
  const mode: LayoutMode = narrow ? NARROW : WIDE;
  const homes = useMemo(() => layoutHomes(graph, dims, inset, mode), [graph, dims, inset, mode]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomState>({ x: 0, y: 0, k: 1 });
  const [, forceRerender] = useState(0);

  /*
   * The live node objects. The simulation mutates their x/y in place and a
   * tick re-render is what makes React read the new values, so this array has
   * to be stable across ordinary renders — hence the memo rather than a plain
   * map in the render body.
   *
   * It is rebuilt outright when `homes` changes, which happens on the first
   * measurement of the band and on resize. Rebuilding (rather than mutating
   * the existing nodes in an effect) is both simpler and the honest
   * description of what happens: a resize is a layout change, not an
   * interaction, so nodes belong at their new homes immediately rather than
   * springing across to them — and the simulation below, keyed on this array,
   * re-forms around them. A drag in flight is dropped, which is correct: the
   * canvas it was being dragged across no longer exists.
   */
  const nodes = useMemo<SimNode[]>(
    () =>
      graph.nodes.map((n) => {
        const home = homes.get(n.id) ?? { x: 0, y: 0 };
        return { ...n, home, x: home.x, y: home.y } as SimNode;
      }),
    [graph.nodes, homes]
  );

  /*
   * What is left of the physics.
   *
   * No link force, no charge, no centring force — the layout already decided
   * every position, and re-deriving it from springs was what made the old
   * arrangement impossible to control. These two forces exist so the graph is
   * not a picture: collision keeps a dragged card from sitting on top of its
   * neighbours, and the home springs pull everything back when it is let go.
   * At rest (`alpha(0)`) neither one does anything, because every node already
   * starts exactly where it belongs.
   */
  useEffect(() => {
    const sim = forceSimulation<SimNode>(nodes)
      .force("homeX", forceX<SimNode>((d) => d.home.x).strength(HOME_STRENGTH))
      .force("homeY", forceY<SimNode>((d) => d.home.y).strength(HOME_STRENGTH))
      .force(
        "collide",
        forceCollide<SimNode>((d) => {
          const box = nodeBox(d, mode);
          // A disc that covers most of the card without the full half-diagonal's
          // worth of dead corner — the resting layout is already collision-free,
          // so this only has to behave during a drag.
          return Math.max(box.hw, box.hh) * 0.92;
        })
      )
      .alpha(0)
      .alphaTarget(0)
      .stop();

    sim.on("tick", () => forceRerender((t) => t + 1));
    simRef.current = sim;

    return () => {
      sim.stop();
      simRef.current = null;
    };
    /* `mode` is one of two module constants, so listing it costs nothing —
       and it does change (with the breakpoint), which changes the radius the
       collision force is built from. */
  }, [nodes, mode]);

  // Pan/zoom on the SVG itself — a plain translate/scale transform applied
  // to the group wrapping the background, edges and nodes.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .extent([[0, 0], [dims.width, dims.height]])
      .translateExtent([
        [-1.5 * dims.width, -1.5 * dims.height],
        [2.5 * dims.width, 2.5 * dims.height],
      ])
      .filter((event: MouseEvent | WheelEvent | TouchEvent) => {
        // d3-zoom listens for the native mousedown itself, ahead of React's
        // delegated dispatch — a node's own `stopPropagation()` can't reach
        // it in time, so panning is switched off here instead whenever the
        // gesture starts on a node (its own pointer handlers own that drag).
        if ("button" in event && event.button) return false;
        const target = event.target;
        if (target instanceof Element && target.closest(`.${styles.node}`)) return false;

        // A bare wheel is left alone entirely — it scrolls the page like any
        // other content instead of fighting it for the gesture. Only a held
        // Ctrl/Cmd zooms (a trackpad pinch also reports as a ctrlKey wheel
        // event), the same modifier Figma/Maps use, so scrolling past the
        // graph never gets hijacked into a zoom.
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;

        return true;
      })
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });

    const selection = select(svg);
    selection.call(behavior);
    selection.on("dblclick.zoom", null);
    zoomRef.current = behavior;

    // d3-zoom's own wheel handler only calls preventDefault() once it's
    // decided the gesture actually changes the transform — on the first tick
    // of a gesture where the scale is already clamped to `ZOOM_EXTENT`, it
    // bails out before that call, and one unprevented Ctrl/Cmd+wheel tick is
    // all Chrome needs to start its native page zoom. This listener is
    // independent of that logic and always blocks the browser gesture.
    const blockBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };
    svg.addEventListener("wheel", blockBrowserZoom, { passive: false });

    return () => {
      selection.on(".zoom", null);
      svg.removeEventListener("wheel", blockBrowserZoom);
      zoomRef.current = null;
    };
  }, [dims.width, dims.height]);

  /**
   * Put everything back.
   *
   * Three things drift over a visit and there was no way to undo any of them:
   * the viewport can be panned and zoomed anywhere inside `translateExtent`, a
   * tag can be left selected with most of the graph dimmed behind it, and a
   * dragged node can be parked somewhere odd. This resets all three, and does
   * the zoom through d3's own `transform` so the behavior's internal state
   * agrees with what is on screen — setting the React transform alone would
   * leave the next gesture resuming from wherever the old one left off.
   */
  function resetView() {
    setSelectedId(null);
    setHoveredId(null);

    /*
     * Snapped, not eased. `selection.transition()` would need `d3-transition`,
     * which is only here as a transitive dependency of `d3-zoom` and is not a
     * thing to start importing directly — and the reset does not read as abrupt
     * anyway, because the nodes are still springing home under it.
     */
    const svg = svgRef.current;
    if (svg && zoomRef.current) {
      select(svg).call(zoomRef.current.transform, zoomIdentity);
    }

    /*
     * Reached through the simulation's own node list rather than the memoized
     * array this component renders from. They are the same objects — but the
     * simulation is the external system that owns their positions, and going
     * through it is both the honest description of what is happening and what
     * keeps this out of React's render-purity rules.
     */
    const sim = simRef.current;
    for (const node of sim?.nodes() ?? []) {
      node.fx = null;
      node.fy = null;
    }
    sim?.alphaTarget(0).alpha(0.7).restart();
  }

  const activeId = hoveredId ?? selectedId;

  const connected = useMemo(() => {
    if (!activeId) return null;
    const ids = new Set<string>([activeId]);
    for (const edge of graph.edges) {
      if (edge.source === activeId) ids.add(edge.target);
      if (edge.target === activeId) ids.add(edge.source);
    }
    return ids;
  }, [activeId, graph.edges]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const activeNode = activeId ? nodeById.get(activeId) : undefined;

  /*
   * The projects a tag connects, by name.
   *
   * Dimming the rest of the canvas was the whole of a tag's answer before,
   * which asks you to hunt for what stayed lit and then read nine small
   * titles to find out what it was. Saying the names is the answer.
   */
  const activeProjects = useMemo(() => {
    if (!activeNode || activeNode.type === "project") return [];
    const titles: string[] = [];
    for (const edge of graph.edges) {
      if (edge.target !== activeNode.id) continue;
      const project = nodeById.get(edge.source);
      if (project?.type === "project") titles.push(project.title);
    }
    return titles;
  }, [activeNode, graph.edges, nodeById]);

  /** A tag node's click: highlight its connections, or clear them. */
  function toggleTag(node: SimNode) {
    setSelectedId((current) => (current === node.id ? null : node.id));
  }

  /**
   * Go to a project, the way the tile grid used to.
   *
   * The shutter is offered the navigation first, and if it declines — reduced
   * motion, the panel scrolled out of view, nothing to open at the far end —
   * the route change still happens client-side through the router rather than
   * falling through to a full page load.
   */
  function activateProject(node: SimNode) {
    if (node.type !== "project") return;
    track("project_click", { slug: node.slug, title: node.title });
    if (!shutter?.navigate(node.href)) router.push(node.href);
  }

  function handleProjectClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    node: SimNode
  ) {
    if (node.type !== "project") return;

    if (suppressClickRef.current) {
      // The pointer travelled: this was a drag, not a click on a link.
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    activateProject(node);
  }

  function handlePointerDown(event: ReactPointerEvent<Element>, node: SimNode) {
    // The zoom behavior's own filter (above) is what keeps this from also
    // starting a pan — stopPropagation here wouldn't reach d3-zoom's native
    // mousedown listener in time to matter.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    suppressClickRef.current = false;
    dragRef.current = { id: node.id, moved: false };
  }

  function handlePointerMove(event: ReactPointerEvent<Element>, node: SimNode) {
    const drag = dragRef.current;
    if (!drag || drag.id !== node.id || !svgRef.current) return;

    if (!drag.moved) {
      drag.moved = true;
      simRef.current?.alphaTarget(0.3).restart();
    }

    const root = toRootPoint(svgRef.current, event.clientX, event.clientY);
    node.fx = (root.x - transform.x) / transform.k;
    node.fy = (root.y - transform.y) / transform.k;
  }

  function handlePointerUp(event: ReactPointerEvent<Element>, node: SimNode) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== node.id) return;

    if (drag.moved) {
      // Released, not pinned: the home springs take it back from here, which
      // is the whole reason they exist.
      node.fx = null;
      node.fy = null;
      simRef.current?.alphaTarget(0).alpha(0.5).restart();
      // The click that follows this pointer-up belongs to the drag.
      suppressClickRef.current = true;
      return;
    }

    /*
     * A project node does nothing here: it is an anchor, and the browser's own
     * click event is what activates it a moment from now. Acting on pointer-up
     * as well would navigate twice.
     */
    if (node.type !== "project") toggleTag(node);
  }

  return (
    <div className={styles.frame} ref={frameRef}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        /*
         * The viewBox now shares its aspect ratio with the band (see
         * `useCanvas`), so `meet` and `slice` agree and nothing is cropped.
         * `meet` is the safe one of the two: if a measurement is ever briefly
         * stale, it letterboxes rather than hiding nodes off the edge.
         */
        preserveAspectRatio="xMidYMid meet"
        /*
         * No `role="img"`. That role makes the whole subtree a single opaque
         * graphic to assistive tech, which was right while this was a texture
         * and is wrong now that the project cards inside it are the page's
         * links — under `img` a screen reader would be told there is a picture
         * here and never reach any of them.
         */
        aria-label="Projects, and the domains, skills and tools they connect through"
      >
        <defs>
          <pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.1" className={styles.dot} />
          </pattern>

          {/*
            The wash under a card's title, in both directions.

            Two gradients rather than one with a swapped colour because they
            are referenced by name from the measured ink (`url(#…-scrim-light)`
            / `-scrim-dark`), which keeps the choice in the data instead of
            spreading a conditional through the card's markup.
          */}
          <linearGradient id={`${uid}-scrim-light`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id={`${uid}-scrim-dark`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.88" />
          </linearGradient>

          {/* Dots fade approaching the left/right edges of the intended
              canvas — a horizontal fade, not a full vignette. */}
          <linearGradient id={`${uid}-dot-sides`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" />
            <stop offset="14%" stopColor="white" />
            <stop offset="86%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>

          <mask
            id={`${uid}-dot-mask`}
            maskUnits="userSpaceOnUse"
            x={-1.5 * dims.width}
            y={-1.5 * dims.height}
            width={4 * dims.width}
            height={4 * dims.height}
          >
            {/* Invisible by default outside the intended canvas — the dot rect
                is drawn 4x oversized so panning never scrolls into a hard
                edge, but only the 0..dims box should ever show dots. */}
            <rect
              x={-1.5 * dims.width}
              y={-1.5 * dims.height}
              width={4 * dims.width}
              height={4 * dims.height}
              fill="black"
            />
            <rect
              x={0}
              y={0}
              width={dims.width}
              height={dims.height}
              fill={`url(#${uid}-dot-sides)`}
            />
            {/* Cards are opaque and sit on the grid rather than needing a hole
                punched for them; only the pills, which are translucent, clear
                the dots behind themselves. */}
            {nodes.map((node) => {
              if (node.type === "project") return null;
              const box = nodeBox(node, mode);
              return (
                <rect
                  key={node.id}
                  x={node.x - box.hw - 4}
                  y={node.y - box.hh - 4}
                  width={box.hw * 2 + 8}
                  height={box.hh * 2 + 8}
                  rx={box.hh}
                  fill="black"
                />
              );
            })}
          </mask>

          {/*
One clip for every card, declared in the node's
            *own* coordinate space — a clip path resolves against the user
            space in effect where it is referenced, and every card is drawn
            inside a group translated to its position, so a rect at the origin
            lands correctly on all of them.

            The cards are square-cornered now, so this no longer shapes
            anything — it is kept purely as insurance that a `slice` cover
            cannot bleed past the card's own box. That clipping is the spec'd
            behaviour of an `<image>` viewport, but it is one line to guarantee
            it rather than rely on it, and a cover spilling across the canvas
            is a conspicuous way to be wrong.
          */}
          <clipPath id={`${uid}-card`}>
            <rect x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} />
          </clipPath>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          <rect
            className={styles.dotBackground}
            mask={`url(#${uid}-dot-mask)`}
            x={-1.5 * dims.width}
            y={-1.5 * dims.height}
            width={4 * dims.width}
            height={4 * dims.height}
            fill={`url(#${uid}-dots)`}
          />

          <g>
            {graph.edges.map((edge, i) => {
              const a = nodeById.get(edge.source);
              const b = nodeById.get(edge.target);
              if (!a || !b) return null;
              const dimmed = connected
                ? !(connected.has(edge.source) && connected.has(edge.target))
                : false;
              return (
                <line
                  key={i}
                  className={styles.edge}
                  data-dim={dimmed || undefined}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const dimmed = connected ? !connected.has(node.id) : false;
              const box = nodeBox(node, mode);

              /*
               * Everything a node needs whichever element it turns out to be.
               * Pulled out because the two branches below differ only in the
               * element and its semantics — the hover, focus and drag
               * behaviour is identical, and duplicating it was how the two
               * kinds of node would drift apart.
               */
              const shared = {
                transform: `translate(${node.x}, ${node.y})`,
                className: styles.node,
                "data-type": node.type,
                "data-dim": dimmed || undefined,
                "data-active": node.id === activeId || undefined,
                onPointerEnter: () => setHoveredId(node.id),
                onPointerLeave: () => setHoveredId(null),
                onFocus: () => setHoveredId(node.id),
                onBlur: () => setHoveredId(null),
                onPointerDown: (event: ReactPointerEvent<Element>) =>
                  handlePointerDown(event, node),
                onPointerMove: (event: ReactPointerEvent<Element>) =>
                  handlePointerMove(event, node),
                onPointerUp: (event: ReactPointerEvent<Element>) =>
                  handlePointerUp(event, node),
              };

              if (node.type === "project") {
                const card = CARD;
                /*
                 * The cover fills the whole card now and the title sits on top
                 * of it over a scrim, rather than the cover stopping short of a
                 * solid strip along the bottom. That strip was legible and
                 * ugly: on a 138x98 card it spent a quarter of the picture on a
                 * slab of flat colour, and nine of them read as a row of forms.
                 *
                 * Which way the type goes is measured, not guessed — see
                 * `scripts/measure-cover-ink.mjs`. The scrim follows the ink, so
                 * a pale cover gets black type over a lightening wash and a
                 * dark one gets white type over a darkening one.
                 */
                const caption = card.caption * mode.caption;
                const scrimH = Math.min(card.h, caption * 2);
                const playing = hoveredId === node.id && !stillMotion;

                return (
                  /*
                   * A real anchor, not a `<g role="button">` with a router
                   * push on it. This is the only route to a project, and the
                   * anchor is what buys right-click, middle-click,
                   * open-in-new-tab, a visible destination in the status bar
                   * and a working page with the JavaScript still loading.
                   */
                  <a
                    key={node.id}
                    {...shared}
                    href={node.href}
                    data-featured={node.featured}
                    aria-label={node.title}
                    /*
                     * The only tab stops in the graph. Domain, skill and tool
                     * nodes are `-1` below: they are a way to filter what you
                     * are looking at, not destinations, and putting all of
                     * them in the tab order would mean pressing Tab dozens of
                     * times to walk past the tags to the projects.
                     */
                    tabIndex={0}
                    onClick={(event) => handleProjectClick(event, node)}
                    onKeyDown={(event: ReactKeyboardEvent<HTMLAnchorElement>) => {
                      /*
                       * Enter activates an anchor natively and arrives as a
                       * click; Space does not, and people who navigate by
                       * keyboard reach for both. Routed straight to the
                       * activation rather than through a synthetic `.click()`
                       * — this is an `SVGAElement` at runtime whatever React's
                       * types say, and `click()` is an `HTMLElement` method.
                       */
                      if (event.key === " ") {
                        event.preventDefault();
                        activateProject(node);
                      }
                    }}
                    /*
                     * These two deliberately come after the spread and replace
                     * the shared versions: they do the same hover/focus
                     * bookkeeping and additionally warm the route, the same
                     * courtesy `next/link` does for a tile.
                     */
                    onPointerEnter={() => {
                      setHoveredId(node.id);
                      router.prefetch(node.href);
                    }}
                    onFocus={() => {
                      setHoveredId(node.id);
                      router.prefetch(node.href);
                    }}
                  >
                    <rect
                      className={styles.card}
                      x={-box.hw}
                      y={-box.hh}
                      width={card.w}
                      height={card.h}
                    />

                    {node.cover ? (
                      <image
                        href={node.cover}
                        x={-box.hw}
                        y={-box.hh}
                        width={card.w}
                        height={card.h}
                        clipPath={`url(#${uid}-card)`}
                        preserveAspectRatio="xMidYMid slice"
                        className={styles.cardCover}
                      />
                    ) : (
                      // No cover on this entry: the original generic glyph,
                      // which at least says "a project" rather than leaving a
                      // hole in the graph.
                      <g transform={`translate(${-caption / 2}, ${-caption / 2})`}>
                        <FileText
                          className={styles.cardGlyph}
                          width={caption}
                          height={caption}
                          strokeWidth={1.75}
                        />
                      </g>
                    )}

                    {/*
                      The loop. Mounted always, running only while the pointer
                      is on this card — see `CardVideo`.

                      Playing only on hover is the point: three covers loop, and
                      three loops running at once on the page's first screen
                      wrecks the scanning order, because motion outcompetes
                      everything and the eye never settles. One at a time,
                      asked for, rewards a look instead of demanding one.

                      `foreignObject` because SVG has no video element of its
                      own; `pointer-events: none` on it so it stays clear of the
                      card's own drag handlers.
                    */}
                    {node.coverVideo ? (
                      <foreignObject
                        x={-box.hw}
                        y={-box.hh}
                        width={card.w}
                        height={card.h}
                        clipPath={`url(#${uid}-card)`}
                        className={styles.cardVideoSlot}
                      >
                        <CardVideo src={node.coverVideo} playing={playing} />
                      </foreignObject>
                    ) : null}

                    {/* A mark centred over the cover — the same layer the index
                        tiles drew, kept separate from the cover rather than
                        composited into it so it can be recoloured and resized
                        without regenerating the asset. */}
                    {node.logo
                      ? (() => {
                          /*
                            A square box with the mark fitted inside it, rather
                            than a width and no height. An SVG `<image>` needs
                            both to lay out, and the marks have different aspect
                            ratios — `meet` scales each one to fit and centres
                            it, which keeps `logoWidth` meaning "at most this
                            wide" for all of them.
                          */
                          const size = cardLogoSize(card.w, node.logoWidth);
                          return (
                            <image
                              href={node.logo}
                              x={-size / 2}
                              y={-size / 2}
                              width={size}
                              height={size}
                              preserveAspectRatio="xMidYMid meet"
                              className={cn(
                                styles.cardLogo,
                                node.logoInvert && styles.cardLogoInvert
                              )}
                            />
                          );
                        })()
                      : null}

                    {/*
                      Title and scrim together, and only while the card is
                      pointed at or focused.

                      A project's name does not, on its own, tell you what the
                      project is — "Flux", "Mizan", "Vortex" mean nothing until
                      you have opened them — so nine of them set permanently
                      across nine pictures was nine captions' worth of noise
                      buying almost no information. The picture is the thing
                      that identifies the work at a glance; the name is what you
                      want at the moment you are about to click, which is
                      exactly when the pointer is on it.
                    */}
                    <g className={styles.cardCaption} aria-hidden="true">
                      <rect
                        className={styles.cardScrim}
                        x={-box.hw}
                        y={box.hh - scrimH}
                        width={card.w}
                        height={scrimH}
                        fill={`url(#${uid}-scrim-${node.coverInk})`}
                      />
                      <text
                        className={styles.cardTitle}
                        data-ink={node.coverInk}
                        x={-box.hw + 9 * mode.caption}
                        y={box.hh - caption / 2}
                        style={{ fontSize: card.title * mode.caption }}
                      >
                        {node.title}
                      </text>
                    </g>

                    {/* No stroke at rest — this draws only for hover and
                        keyboard focus. See `.cardOutline`. */}
                    <rect
                      className={styles.cardOutline}
                      x={-box.hw}
                      y={-box.hh}
                      width={card.w}
                      height={card.h}
                    />
                  </a>
                );
              }

              if (node.type === "tool") {
                const tool = toolIcon(node.label);
                const r = toolRadius(mode);
                return (
                  <g key={node.id} role="button" aria-label={node.label} tabIndex={-1} {...shared}>
                    <circle className={styles.nodeHit} r={r + 5} />
                    {tool.kind === "logo" ? (
                      <>
                        {/* Simple Icons ship with a plain black fill and no
                            `currentColor` hook — an opaque light chip behind
                            keeps the mark legible on both grounds, instead of
                            trying to recolour a referenced image. */}
                        <circle className={styles.toolChip} r={r} />
                        <image
                          href={tool.src}
                          x={-r * 0.6}
                          y={-r * 0.6}
                          width={r * 1.2}
                          height={r * 1.2}
                        />
                      </>
                    ) : (
                      <>
                        <circle className={styles.toolBadge} r={r} />
                        <text
                          className={styles.toolInitials}
                          style={{ fontSize: 12 * mode.tags }}
                        >
                          {tool.text}
                        </text>
                      </>
                    )}
                  </g>
                );
              }

              /*
               * Domain and skill are the same geometry and two different
               * things to look at.
               *
               * A domain is a real pill — a bordered chip in the site blue,
               * because domains are the one categorical distinction on the
               * canvas worth spending a colour on. A skill is bare text again;
               * its rect is filled with the band's own ground and given no
               * border at all, which is there for one reason only: an edge
               * passing behind a word used to run straight through it. The
               * fill knocks the edge out from under the text without putting a
               * container around it.
               */
              const spec = pillSpec(node.type, mode);
              const width = pillWidth(node, mode);
              const isDomain = node.type === "domain";
              return (
                <g key={node.id} role="button" aria-label={node.label} tabIndex={-1} {...shared}>
                  <rect
                    className={isDomain ? styles.pill : styles.skillGround}
                    x={-width / 2}
                    y={-spec.h / 2}
                    width={width}
                    height={spec.h}
                  />
                  <text
                    className={cn(styles.pillText, isDomain && styles.pillTextDomain)}
                    style={{ fontSize: spec.font }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/*
        The reset control. Top-left, below the site's floating nav bar — the
        one corner an elliptical layout reliably leaves empty, which is why it
        needs no reservation in the layout the way the panel does.
      */}
      <button type="button" className={styles.reset} onClick={resetView}>
        <RotateCcw size={13} aria-hidden="true" />
        Reset
      </button>

      {/*
        One persistent panel instead of three floating boxes.
        
        The detail used to appear on hover in the bottom-left, the hint
        occupied the same corner when nothing was hovered, and the legend was a
        separate block on the right — so pointing at a node made a box appear
        somewhere you were not looking, and moving away made it vanish before
        you had finished reading it. A panel that is always there in the same
        place has somewhere for the eye to go back to, and it can hold more
        than a tooltip's worth: the subtitle, the facts, and for a tag the
        names of everything it connects.

        It is reserved out of the layout rather than floated over it — see
        `useChromeInset` — so it sits beside the graph instead of on top of it.
      */}
      <aside className={styles.panel} ref={panelRef}>
        <div className={styles.panelBody}>
          {activeNode ? (
            <>
              <p className={styles.panelKind}>{KIND_LABEL[activeNode.type]}</p>
              <p className={styles.panelTitle}>
                {activeNode.type === "project" ? activeNode.title : activeNode.label}
              </p>
              {activeNode.type === "project" && activeNode.subtitle ? (
                <p className={styles.panelBlurb}>{activeNode.subtitle}</p>
              ) : null}

              {/*
                The facts, as a labelled block rather than a run of unlabelled
                lines. Place, role, team and dates all set identically was the
                panel's worst stretch — four grey sentences with no way to tell
                which was which without reading all four.
              */}
              {detailFacts(activeNode).length > 0 ? (
                <dl className={styles.panelFacts}>
                  {detailFacts(activeNode).map(({ label, value }) => (
                    <div key={label} className={styles.panelFact}>
                      <dt className={styles.panelFactLabel}>{label}</dt>
                      <dd className={styles.panelFactValue}>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {activeProjects.length > 0 ? (
                <>
                  <p className={styles.panelFactLabel}>
                    {activeProjects.length} project
                    {activeProjects.length === 1 ? "" : "s"}
                  </p>
                  <ul className={styles.panelList}>
                    {activeProjects.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          ) : (
            <>
              <p className={styles.panelKind}>The work</p>
              <p className={styles.panelTitle}>
                Every project I&rsquo;ve made, and what they share.
              </p>
              <p className={styles.panelBlurb}>
                Nine projects, and the domains, skills and tools that run between
                them. The three in the middle are the ones to start with.
              </p>
              <ul className={styles.panelSteps}>
                <li>Click a card to open the project</li>
                <li>Click a tag to see what it connects</li>
                <li>Drag anything; it springs back</li>
              </ul>
            </>
          )}
        </div>

        <div className={styles.legend}>
          {LEGEND.map(({ shape, colorVar, label }) => (
            <span
              key={label}
              className={styles.legendItem}
              style={{ color: `var(${colorVar})` }}
            >
              <LegendSwatch shape={shape} />
              <span className={styles.legendLabel}>{label}</span>
            </span>
          ))}
        </div>
      </aside>
    </div>
  );
}
