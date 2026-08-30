"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import type { Simulation } from "d3-force";
import { select } from "d3-selection";
import { zoom, type D3ZoomEvent } from "d3-zoom";
import {
  FileText,
  Hammer,
  Maximize2,
  Minimize2,
  Tag,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GraphNode, ProjectGraph } from "@/lib/graph";
import styles from "./WorkGraph.module.css";

/*
 * First cut of the Work/Archive knowledge graph — plonked onto the Work index
 * so the data model (`lib/graph`) has something to render against. Visual
 * design is explicitly not final; a wider UI pass covers that later.
 *
 * Icon-per-type nodes, the legend, live drag physics, the dot-grid backdrop
 * and pan/zoom all follow the reference build at `drp-graph` (the thesis
 * site's own node graph, `src/graph/GraphCanvas.jsx`) — icon glyphs tinted
 * via `currentColor`, a simulation that stays alive and reacts to dragging
 * rather than a one-shot layout, and a zoomable/pannable viewport.
 */

type GraphDims = { width: number; height: number };
type GraphForces = {
  linkDistance: number;
  linkStrength: number;
  charge: number;
  collidePad: number;
};

/*
 * Two coordinate spaces, not one scaled version of the other. The framed
 * panel (`fill` unset) keeps the original 16:9/900px-tuned proportions; fill
 * mode gets a bigger native canvas so its (fixed-size) project/tool badges
 * get more breathing room than they would packed into 960×540.
 */
const FRAME_DIMS: GraphDims = { width: 960, height: 540 };
const FILL_DIMS: GraphDims = { width: 1600, height: 1200 };

/*
 * Force constants as fractions of `dims.width` rather than fixed numbers —
 * multiply by `dims.width` at use to get the real value. The framed and fill
 * canvases are different absolute sizes, and a distance/charge tuned for one
 * means nothing on the other; a single K-set behaves the same on both.
 * `collidePad` in particular got a real bump over the original 6px/960
 * tuning: domain/skill nodes are text now (see `nodeRadius`), and text
 * blocks that clip each other read far worse than icons that do.
 */
const FORCE_K = {
  linkDistanceK: 58 / 960,
  linkStrength: 0.5,
  chargeK: -130 / 960,
  collidePadK: 14 / 960,
};

const ZOOM_EXTENT: [number, number] = [0.5, 4];

type SimNode = GraphNode & { x: number; y: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null };
type SimLink = { source: string; target: string };
type ZoomState = { x: number; y: number; k: number };

/*
 * Domain/skill render as their own label text now, not an icon — so their
 * "radius" (used for both the pointer hit-circle and the collision force)
 * has to track how wide that text actually runs, or long labels overlap
 * their neighbours. Font size is `dims.width`-relative too (see
 * `tagFontSize`), so this stays correct whether it's rendering into the
 * framed panel's 960 canvas or fill mode's 1600 one.
 */
const DOMAIN_FONT_K = 0.0072;
const SKILL_FONT_K = 0.0084;
/** JetBrains Mono's per-character advance is a near-fixed ~0.6em; the extra
 *  headroom covers domain's uppercase letter-spacing (see `.nodeTagDomain`). */
const TAG_CHAR_WIDTH = 0.64;
const TAG_PADDING_K = 0.008;
const TAG_MIN_RADIUS_K = 0.016;

/** Project and tool badges stay a fixed icon-like size regardless of `dims`
 *  — unlike text, a badge doesn't need a bigger canvas to stay legible, so a
 *  bigger canvas is pure breathing room for them, not a size change. */
const PROJECT_RADIUS = { featured: 15, archive: 11 };
const TOOL_RADIUS = 13;

function tagFontSize(type: "domain" | "skill", dims: GraphDims): number {
  return dims.width * (type === "domain" ? DOMAIN_FONT_K : SKILL_FONT_K);
}

function nodeRadius(node: GraphNode, dims: GraphDims): number {
  if (node.type === "project") {
    return node.featured ? PROJECT_RADIUS.featured : PROJECT_RADIUS.archive;
  }
  if (node.type === "tool") return TOOL_RADIUS;

  const fontSize = tagFontSize(node.type, dims);
  const halfWidth = (node.label.length * fontSize * TAG_CHAR_WIDTH) / 2;
  return Math.max(dims.width * TAG_MIN_RADIUS_K, halfWidth + dims.width * TAG_PADDING_K);
}

/*
 * Real software marks where one exists in Simple Icons (self-hosted under
 * `public/logos/tools/` — see `public/logos/*.svg` for the same pattern
 * already used for institution credits), a plain initials badge everywhere
 * else. Solidworks/Keyshot/Humanify aren't in that icon set (niche
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
 * `colorVar` names a `--node-*` custom property (declared on `.frame` in
 * WorkGraph.module.css, re-pointed by `.frameFill`) rather than a raw
 * `--color-*` token — those get retargeted by IndexShell's `.page` for the
 * rest of the dark-ground index chrome, which collapses featured and
 * archive projects to the same colour. The icons here are the legend's own
 * simplified key — domain/skill/tool nodes on the canvas itself no longer
 * render these glyphs (text and logos instead), but a coloured icon swatch
 * still reads fine as shorthand for "this colour means this category."
 */
const LEGEND: Array<{ icon: LucideIcon; colorVar: string; label: string }> = [
  { icon: FileText, colorVar: "--node-featured", label: "Featured project" },
  { icon: FileText, colorVar: "--node-archive", label: "Archive project" },
  { icon: Tag, colorVar: "--node-domain", label: "Domain" },
  { icon: Wrench, colorVar: "--node-skill", label: "Skill" },
  { icon: Hammer, colorVar: "--node-tool", label: "Tool" },
];

/**
 * Settles an initial layout synchronously and returns plain positions.
 * Deterministic (d3-force seeds missing coordinates from node order, not
 * `Math.random`) so server and client render the same first paint — no
 * pop-in before the live simulation (set up separately, client-only) takes
 * over for dragging.
 */
function layoutGraph(
  graph: ProjectGraph,
  dims: GraphDims,
  forces: GraphForces
): SimNode[] {
  // x/y start undefined on purpose — d3-force only auto-seeds its
  // deterministic spiral start position for coordinates that are still
  // unset. Pre-filling them (even with 0) skips that and stacks every node
  // on the same point, which the repulsion force then blows up from.
  const nodes = graph.nodes.map((n) => ({ ...n }) as SimNode);
  const links: SimLink[] = graph.edges.map((e) => ({ ...e }));

  forceSimulation(nodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(forces.linkDistance)
        .strength(forces.linkStrength)
    )
    .force("charge", forceManyBody().strength(forces.charge))
    .force("center", forceCenter(dims.width / 2, dims.height / 2))
    .force(
      "collide",
      forceCollide<SimNode>((d) => nodeRadius(d, dims) + forces.collidePad)
    )
    .stop()
    .tick(300);

  return fitToBounds(nodes, dims);
}

/**
 * Rescales the settled layout to fit the viewBox, however far the simulation
 * spread it — a fixed force strength doesn't stay tuned to the box as more
 * projects and tags join the graph, but a fit-to-bounds pass always does.
 * Uniform scale (not stretched per axis) and padded so edge nodes clear the
 * radius and label instead of touching the frame.
 */
function fitToBounds(nodes: SimNode[], dims: GraphDims): SimNode[] {
  const padding = 48;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min(
    (dims.width - padding * 2) / spanX,
    (dims.height - padding * 2) / spanY
  );

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  for (const node of nodes) {
    // Rounded to 2dp: the simulation's own floating-point results diverge in
    // the trailing digits between the server's V8 and the browser's — same
    // algorithm and seed, but hundreds of accumulated ticks don't reproduce
    // bit-for-bit across engines. Unrounded, that's a hydration mismatch on
    // every x/y attribute; rounded well above that noise floor, server and
    // client agree.
    node.x = round2((node.x - midX) * scale + dims.width / 2);
    node.y = round2((node.y - midY) * scale + dims.height / 2);
  }

  return nodes;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function detailLines(node: GraphNode): string[] {
  if (node.type !== "project") return [];
  const lines: string[] = [];
  if (node.place) lines.push(node.place);
  if (node.role) lines.push(node.role);
  if (node.team) lines.push(node.team);
  if (node.timeline) lines.push(node.timeline);
  else if (node.term) lines.push(node.term);
  return lines;
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

export default function WorkGraph({
  graph,
  fill = false,
}: {
  graph: ProjectGraph;
  /**
   * Renders borderless and edge-to-edge instead of the framed 16:9 panel —
   * for sitting behind the masthead as the Work index header's texture
   * rather than in the flow of the page.
   */
  fill?: boolean;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);

  const dims = fill ? FILL_DIMS : FRAME_DIMS;
  const forces: GraphForces = {
    linkDistance: FORCE_K.linkDistanceK * dims.width,
    linkStrength: FORCE_K.linkStrength,
    charge: FORCE_K.chargeK * dims.width,
    collidePad: FORCE_K.collidePadK * dims.width,
  };

  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomState>({ x: 0, y: 0, k: 1 });
  const [, forceRerender] = useState(0);

  // Seeded once from the deterministic settle above (lazy initializer runs
  // once); the live simulation (below) mutates these same objects' x/y in
  // place from then on, and a tick re-render (via `forceRerender`) is what
  // makes React read the new positions — the setter here is never called
  // again, only the array's contents change.
  const [nodes] = useState<SimNode[]>(() => layoutGraph(graph, dims, forces));
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Live physics: same forces as the initial settle, but left running (at
  // rest, alphaTarget 0) so a drag can wake it up locally instead of
  // replaying the whole layout.
  useEffect(() => {
    const links: SimLink[] = graph.edges.map((e) => ({ ...e }));
    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(forces.linkDistance)
          .strength(forces.linkStrength)
      )
      .force("charge", forceManyBody().strength(forces.charge))
      .force("center", forceCenter(dims.width / 2, dims.height / 2))
      .force(
        "collide",
        forceCollide<SimNode>((d) => nodeRadius(d, dims) + forces.collidePad)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // Pan/zoom on the SVG itself — a plain translate/scale transform applied
  // to the group wrapping the background, edges and nodes.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .filter((event: MouseEvent | WheelEvent | TouchEvent) => {
        // d3-zoom listens for the native mousedown itself, ahead of React's
        // delegated dispatch — a node's own `stopPropagation()` can't reach
        // it in time, so panning is switched off here instead whenever the
        // gesture starts on a node (its own pointer handlers own that drag).
        if ("button" in event && event.button) return false;
        if ("ctrlKey" in event && event.ctrlKey && event.type !== "wheel") return false;
        const target = event.target;
        return !(target instanceof Element && target.closest(`.${styles.node}`));
      })
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });

    const selection = select(svg);
    selection.call(behavior);
    selection.on("dblclick.zoom", null);

    return () => {
      selection.on(".zoom", null);
    };
  }, []);

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

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const activeNode = activeId ? nodeById.get(activeId) : undefined;

  function handleActivate(node: SimNode) {
    if (node.type === "project") {
      router.push(`/${node.featured ? "projects" : "archive"}/${node.slug}`);
      return;
    }
    setSelectedId((current) => (current === node.id ? null : node.id));
  }

  function handlePointerDown(event: ReactPointerEvent<SVGGElement>, node: SimNode) {
    // The zoom behavior's own filter (above) is what keeps this from also
    // starting a pan — stopPropagation here wouldn't reach d3-zoom's native
    // mousedown listener in time to matter.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: node.id, moved: false };
  }

  function handlePointerMove(event: ReactPointerEvent<SVGGElement>, node: SimNode) {
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

  function handlePointerUp(event: ReactPointerEvent<SVGGElement>, node: SimNode) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== node.id) return;

    if (drag.moved) {
      simRef.current?.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    } else {
      handleActivate(node);
    }
  }

  return (
    <div
      className={cn(
        styles.frame,
        fill && !expanded && styles.frameFill,
        expanded && styles.frameExpanded,
      )}
    >
      <button
        type="button"
        className={styles.expandButton}
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Exit fullscreen" : "View graph fullscreen"}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        // Fill mode bleeds edge to edge like the rest of the header
        // background slot (`object-fit: cover`); the framed panel instead
        // letterboxes to keep the whole 16:9 graph in view.
        preserveAspectRatio={fill ? "xMidYMid slice" : "xMidYMid meet"}
        role="img"
        aria-label="Graph connecting projects to their domains, skills and tools — drag nodes, scroll to zoom, drag the background to pan"
      >
        <defs>
          <pattern id="work-graph-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.1" className={styles.dot} />
          </pattern>

          {/* Dots fade approaching the left/right edges of the intended
              canvas (0..dims.width) — a horizontal fade, not a full
              vignette, since only "the sides" were asked for. */}
          <linearGradient id="work-graph-dot-sides" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" />
            <stop offset="18%" stopColor="white" />
            <stop offset="82%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>

          {/* One definition, reused on every node's own circle below —
              `objectBoundingBox` (the default) scales it to whatever radius
              each circle is drawn at, so it doesn't need per-node values. */}
          <radialGradient id="work-graph-dot-node-clear">
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>

          <mask
            id="work-graph-dot-mask"
            maskUnits="userSpaceOnUse"
            x={-1.5 * dims.width}
            y={-1.5 * dims.height}
            width={4 * dims.width}
            height={4 * dims.height}
          >
            {/* Invisible by default outside the intended canvas — the dot
                rect itself is drawn 4x oversized so panning never scrolls
                into a hard edge, but only the 0..dims box should ever show
                dots. */}
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
              fill="url(#work-graph-dot-sides)"
            />
            {nodes.map((node) => (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={nodeRadius(node, dims) * 2.4}
                fill="url(#work-graph-dot-node-clear)"
              />
            ))}
          </mask>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          <rect
            className={styles.dotBackground}
            mask="url(#work-graph-dot-mask)"
            x={-1.5 * dims.width}
            y={-1.5 * dims.height}
            width={4 * dims.width}
            height={4 * dims.height}
            fill="url(#work-graph-dots)"
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
              const label = node.type === "project" ? node.title : node.label;
              const r = nodeRadius(node, dims);
              const tool = node.type === "tool" ? toolIcon(node.label) : null;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={styles.node}
                  data-type={node.type}
                  data-featured={node.type === "project" ? node.featured : undefined}
                  data-dim={dimmed || undefined}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                  onPointerEnter={() => setHoveredId(node.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(node.id)}
                  onBlur={() => setHoveredId(null)}
                  onPointerDown={(event) => handlePointerDown(event, node)}
                  onPointerMove={(event) => handlePointerMove(event, node)}
                  onPointerUp={(event) => handlePointerUp(event, node)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleActivate(node);
                    }
                  }}
                >
                  <circle className={styles.nodeHit} r={r + 6} />

                  {node.type === "project" && (
                    <>
                      {/* Colour lives on the outer `g` (`.node[data-type=…]`)
                          so this glow and the icon below both read it via
                          `currentColor`/`color: inherit`. */}
                      <circle className={styles.nodeGlow} r={r + 5} />
                      <g transform={`translate(${-(r * 1.7) / 2}, ${-(r * 1.7) / 2})`}>
                        <FileText
                          className={styles.nodeIcon}
                          width={r * 1.7}
                          height={r * 1.7}
                          strokeWidth={2}
                        />
                      </g>
                      <text className={styles.nodeLabel} y={r + 15}>
                        {node.title}
                      </text>
                    </>
                  )}

                  {(node.type === "domain" || node.type === "skill") && (
                    <text
                      className={cn(
                        styles.nodeTagText,
                        node.type === "domain" && styles.nodeTagDomain,
                      )}
                      style={{ fontSize: tagFontSize(node.type, dims) }}
                    >
                      {node.label}
                    </text>
                  )}

                  {tool &&
                    (tool.kind === "logo" ? (
                      <>
                        {/* Simple Icons ship with a plain black fill and no
                            `currentColor` hook — an opaque light chip behind
                            keeps the mark legible on both the framed panel's
                            white background and fill mode's dark ground,
                            instead of trying to recolour a referenced image. */}
                        <circle className={styles.nodeLogoChip} r={r} />
                        <image
                          href={tool.src}
                          x={-r * 0.62}
                          y={-r * 0.62}
                          width={r * 1.24}
                          height={r * 1.24}
                        />
                      </>
                    ) : (
                      <>
                        <circle className={styles.nodeToolBadge} r={r} />
                        <text className={styles.nodeToolInitials}>{tool.text}</text>
                      </>
                    ))}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className={styles.legend}>
        {LEGEND.map(({ icon: Icon, colorVar, label }) => (
          <span key={label} className={styles.legendItem}>
            <Icon size={fill ? 15 : 12} style={{ color: `var(${colorVar})` }} />
            {label}
          </span>
        ))}
      </div>

      {activeNode && (
        <div className={styles.detail}>
          <p className={styles.detailTitle}>
            {activeNode.type === "project" ? activeNode.title : activeNode.label}
          </p>
          {detailLines(activeNode).map((line, i) => (
            <p key={i} className={styles.detailLine}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
