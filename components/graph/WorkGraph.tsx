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
import { FileText, Maximize2, Minimize2, Tag, Wrench } from "lucide-react";
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

const WIDTH = 960;
const HEIGHT = 540;
const ZOOM_EXTENT: [number, number] = [0.5, 4];

type SimNode = GraphNode & { x: number; y: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null };
type SimLink = { source: string; target: string };
type ZoomState = { x: number; y: number; k: number };

function nodeRadius(node: GraphNode): number {
  if (node.type !== "project") return 7;
  return node.featured ? 15 : 11;
}

function nodeIcon(node: GraphNode): LucideIcon {
  if (node.type === "domain") return Tag;
  if (node.type === "skill") return Wrench;
  return FileText;
}

const LEGEND: Array<{ icon: LucideIcon; colorVar: string; label: string }> = [
  { icon: FileText, colorVar: "--color-accent", label: "Featured project" },
  { icon: FileText, colorVar: "--color-charcoal", label: "Archive project" },
  { icon: Tag, colorVar: "--color-border-strong", label: "Domain" },
  { icon: Wrench, colorVar: "--color-muted", label: "Skill / tool" },
];

/**
 * Settles an initial layout synchronously and returns plain positions.
 * Deterministic (d3-force seeds missing coordinates from node order, not
 * `Math.random`) so server and client render the same first paint — no
 * pop-in before the live simulation (set up separately, client-only) takes
 * over for dragging.
 */
function layoutGraph(graph: ProjectGraph): SimNode[] {
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
        .distance(58)
        .strength(0.5)
    )
    .force("charge", forceManyBody().strength(-95))
    .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
    .force(
      "collide",
      forceCollide<SimNode>((d) => nodeRadius(d) + 6)
    )
    .stop()
    .tick(300);

  return fitToBounds(nodes);
}

/**
 * Rescales the settled layout to fit the viewBox, however far the simulation
 * spread it — a fixed force strength doesn't stay tuned to the box as more
 * projects and tags join the graph, but a fit-to-bounds pass always does.
 * Uniform scale (not stretched per axis) and padded so edge nodes clear the
 * radius and label instead of touching the frame.
 */
function fitToBounds(nodes: SimNode[]): SimNode[] {
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
    (WIDTH - padding * 2) / spanX,
    (HEIGHT - padding * 2) / spanY
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
    node.x = round2((node.x - midX) * scale + WIDTH / 2);
    node.y = round2((node.y - midY) * scale + HEIGHT / 2);
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

export default function WorkGraph({ graph }: { graph: ProjectGraph }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);

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
  const [nodes] = useState<SimNode[]>(() => layoutGraph(graph));
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
          .distance(58)
          .strength(0.5)
      )
      .force("charge", forceManyBody().strength(-95))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        forceCollide<SimNode>((d) => nodeRadius(d) + 6)
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
    <div className={cn(styles.frame, expanded && styles.frameExpanded)}>
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
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Graph connecting projects to their domains and skills — drag nodes, scroll to zoom, drag the background to pan"
      >
        <defs>
          <pattern id="work-graph-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.1" className={styles.dot} />
          </pattern>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          <rect
            className={styles.dotBackground}
            x={-1.5 * WIDTH}
            y={-1.5 * HEIGHT}
            width={4 * WIDTH}
            height={4 * HEIGHT}
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
              const r = nodeRadius(node);
              const iconSize = r * 1.7;
              const Icon = nodeIcon(node);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={styles.node}
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
                  <g transform={`translate(${-iconSize / 2}, ${-iconSize / 2})`}>
                    <Icon
                      className={styles.nodeIcon}
                      data-type={node.type}
                      data-featured={node.type === "project" ? node.featured : undefined}
                      width={iconSize}
                      height={iconSize}
                      strokeWidth={2}
                    />
                  </g>
                  {node.type === "project" && (
                    <text className={styles.nodeLabel} y={r + 15}>
                      {node.title}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className={styles.legend}>
        {LEGEND.map(({ icon: Icon, colorVar, label }) => (
          <span key={label} className={styles.legendItem}>
            <Icon size={12} style={{ color: `var(${colorVar})` }} />
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
