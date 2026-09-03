import { existsSync } from "node:fs";
import path from "node:path";
import { getEntries } from "@/lib/entries";
import { getProjectGraph } from "@/lib/graph";
import { formatDate } from "@/lib/format";
import type { EntryEmphasis, EntryMode, PeekContent } from "@/lib/entries/types";

/*
 * The work board — the same pool the graph reads, shaped for three facet
 * columns over a two-row rail of the work.
 *
 * This is deliberately a *view over* `getProjectGraph()` rather than a second
 * walk of the registry. The graph module is the one place that knows a domain,
 * a skill and a tool are three separate node types, that "Textile Design" on
 * two projects is one tag however it was cased, and — most importantly — that
 * the pool is unfiltered by section. Rebuilding any of that here would mean two
 * modules with two opinions about what a tag is, and they would drift the first
 * time a label was renamed.
 *
 * So the edges come from the graph and only the *presentation* is new: the
 * facets are grouped by type and ranked by how many projects carry them, and
 * the projects are ordered work-first.
 *
 * Nothing in here is sized, positioned or capped. That is the point — the board
 * has to look right at nine projects and at thirty, and every count below is
 * read off the data rather than authored. Adding a project or tagging an
 * existing one more thoroughly changes the board with no code change.
 */

export type BoardFacetType = "domain" | "skill" | "tool";

export type BoardFacet = {
  type: BoardFacetType;
  /** `skill:wireframing` — the graph's node id, reused as the DOM key. */
  id: string;
  label: string;
  /** How many projects carry it. What the rows are ranked by. */
  count: number;
  /**
   * A monochrome mark for the facet's chip, for tools only. Present exactly
   * when `public/logos/software/<slug>.svg` exists — decided here, where the
   * filesystem can be asked, so the client never renders a chip around an
   * asset that will 404. Absent means the chip falls back to text.
   */
  icon?: string;
};

export type BoardProject = {
  slug: string;
  title: string;
  /** The one-line description shown over the cover. */
  blurb: string;
  place?: string;
  /** `Fall 2024`-style label; the date stands in until one is set. */
  term: string;
  cover?: string;
  coverAlt?: string;
  /** Plays while the tile is hovered. Paused, it *is* the still — see `TileVideo`. */
  coverVideo?: string;
  logo?: string;
  logoInvert?: boolean;
  /** Mark width as a percentage of the tile's width. */
  logoWidth?: number;
  /** Measured, not guessed — see `scripts/measure-cover-ink.mjs`. */
  coverInk: "light" | "dark";
  /** Width tier on the rail — 1 widest, 3 the base — and what the rail is
   *  ordered by. Authored per entry in the registry; see `EntryEmphasis`. */
  emphasis: EntryEmphasis;
  /** What the tile does, and where it goes. Resolved by `lib/entries`. */
  mode: EntryMode;
  href: string | null;
  peek: PeekContent;
};

export type WorkBoardData = {
  projects: BoardProject[];
  facets: BoardFacet[];
  /** Facet id → the slugs that carry it. The whole interaction reads this. */
  matches: Record<string, string[]>;
};

/** Most-used first; alphabetical within a tie so the order is stable across
 *  builds rather than falling out of registry order. */
function byCountThenLabel(a: BoardFacet, b: BoardFacet): number {
  return b.count - a.count || a.label.localeCompare(b.label);
}

/**
 * Largest work first — tier 1, then 2, then 3, each newest-first inside its
 * group.
 *
 * `getEntries()` already returns the pool date-sorted, so this only has to be
 * a stable partition — which is what keeps "which is newest" a property of the
 * data and "which comes first" a property of the tier, rather than one sort
 * that half-answers both. The board no longer sizes a tile by its tier — the
 * top row is named outright (`LEAD_SLUGS` in `WorkBoard.tsx`) and every tile
 * in a row is the same width — but this order still decides the second row's
 * reading order, so it steps down through the tiers left to right rather than
 * arriving in registry order.
 */
function byEmphasis(a: BoardProject, b: BoardProject): number {
  return a.emphasis - b.emphasis;
}

/**
 * The tool's logo, if one was shipped.
 *
 * The lookup key is the graph's own tag slug (`tool:after-effects` →
 * `after-effects.svg`), so a logo lands on its facet by being named after it
 * and nothing has to map the two. The SVGs are Simple Icons (CC0), recoloured
 * at render time as CSS masks — see `.facetLogo` in `WorkBoard.module.css` —
 * which is why any monochrome mark works and no per-theme variants exist.
 */
function toolIconFor(facetId: string): string | undefined {
  const slug = facetId.slice("tool:".length);
  const file = path.join(process.cwd(), "public", "logos", "software", `${slug}.svg`);
  return existsSync(file) ? `/logos/software/${slug}.svg` : undefined;
}

export function getWorkBoard(): WorkBoardData {
  const graph = getProjectGraph();

  /* The graph's own project nodes carry one thing the registry doesn't
     resolve on its own — the measured `coverInk` (and the card-specific cover
     choice that goes with it). Read it from there rather than recomputing. */
  const graphProjects = new Map(
    graph.nodes
      .filter((node) => node.type === "project")
      .map((node) => [node.id, node] as const)
  );

  const facets: BoardFacet[] = [];
  const matches: Record<string, string[]> = {};

  for (const node of graph.nodes) {
    if (node.type === "project") continue;
    facets.push({
      type: node.type,
      id: node.id,
      label: node.label,
      count: 0,
      icon: node.type === "tool" ? toolIconFor(node.id) : undefined,
    });
    matches[node.id] = [];
  }

  for (const edge of graph.edges) {
    const project = graphProjects.get(edge.source);
    const carriers = matches[edge.target];
    if (!project || project.type !== "project" || !carriers) continue;
    carriers.push(project.slug);
  }

  for (const facet of facets) facet.count = matches[facet.id].length;

  const projects = getEntries()
    .map((entry): BoardProject | null => {
      const node = graphProjects.get(`project:${entry.slug}`);
      if (!node || node.type !== "project") return null;

      return {
        slug: entry.slug,
        title: entry.meta.title,
        /* The subtitle, not the description: this sits on a thumbnail, and the
           description is written to be read in a list with room for it. */
        blurb: entry.meta.subtitle ?? entry.meta.description,
        place: entry.meta.place,
        term: entry.meta.term ?? formatDate(entry.meta.date),
        cover: node.cover,
        coverAlt: node.coverAlt,
        coverVideo: node.coverVideo,
        logo: node.logo,
        logoInvert: node.logoInvert,
        logoWidth: node.logoWidth,
        coverInk: node.coverInk,
        emphasis: entry.emphasis,
        mode: entry.mode,
        href: entry.href,
        peek: entry.peek,
      };
    })
    .filter((project): project is BoardProject => project !== null)
    .sort(byEmphasis);

  return { projects, facets: facets.sort(byCountThenLabel), matches };
}
