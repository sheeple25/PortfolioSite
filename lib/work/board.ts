import { getEntries } from "@/lib/entries";
import { getProjectGraph } from "@/lib/graph";
import { formatDate } from "@/lib/format";
import type { EntryMode, PeekContent } from "@/lib/entries/types";

/*
 * The work board — the same pool the graph reads, shaped for rows and a rail.
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
  /** Listed under Work. Drives order and tile size, nothing else. */
  featured: boolean;
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
 * Work first, then everything else, each newest-first inside its group.
 *
 * `getEntries()` already returns the pool date-sorted, so this only has to be a
 * stable partition — which is what keeps "which is newest" a property of the
 * data and "which comes first" a property of the section, rather than one sort
 * that half-answers both.
 */
function workFirst(a: BoardProject, b: BoardProject): number {
  return Number(b.featured) - Number(a.featured);
}

export function getWorkBoard(): WorkBoardData {
  const graph = getProjectGraph();

  /* The graph's own project nodes carry two things the registry doesn't
     resolve on its own — `featured`, and the measured `coverInk`. Read them
     from there rather than recomputing either. */
  const graphProjects = new Map(
    graph.nodes
      .filter((node) => node.type === "project")
      .map((node) => [node.id, node] as const)
  );

  const facets: BoardFacet[] = [];
  const matches: Record<string, string[]> = {};

  for (const node of graph.nodes) {
    if (node.type === "project") continue;
    facets.push({ type: node.type, id: node.id, label: node.label, count: 0 });
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
        featured: node.featured,
        mode: entry.mode,
        href: entry.href,
        peek: entry.peek,
      };
    })
    .filter((project): project is BoardProject => project !== null)
    .sort(workFirst);

  return { projects, facets: facets.sort(byCountThenLabel), matches };
}
