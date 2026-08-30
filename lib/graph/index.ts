import { getProjectSummaries } from "@/lib/projects";
import { getArchiveSummaries } from "@/lib/archive";
import type { WritingSummary } from "@/lib/writing/types";

/*
 * Data model for the Work/Archive knowledge graph.
 *
 * Four node types: Projects, Domain tags (`tags:`), Skill tags (`skills:`)
 * and Tool tags (`tools:`) — what a project *is about*, what it *demonstrates
 * you can do*, and what you *used to make it*, kept as three separate tag
 * types since a label can plausibly appear in more than one column ("CAD" as
 * a skill, "SolidWorks" as the tool) without meaning the same node.
 * Location/collaborator metadata is deliberately *not* a node type — it rides
 * along on the project node for a hover/click detail panel to read.
 *
 * Pulls from both `getProjectSummaries()` (the featured Work set) and
 * `getArchiveSummaries()` (the catch-all), so the graph is always built from
 * every project that exists, not just the curated four — that's what lets
 * Work read as "subselection of a broader pool."
 */

export type ProjectGraphNode = {
  type: "project";
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  /** In `content/projects` (the curated set) rather than `content/archive`. */
  featured: boolean;
  place?: string;
  role?: string;
  team?: string;
  timeline?: string;
  term?: string;
  cover?: string;
  coverAlt?: string;
};

export type TagGraphNode = {
  type: "domain" | "skill" | "tool";
  id: string;
  label: string;
};

export type GraphNode = ProjectGraphNode | TagGraphNode;

export type GraphEdge = {
  source: string;
  target: string;
};

export type ProjectGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/**
 * Same label collapses to the same node however it was cased or spaced across
 * files (e.g. "Textile Design" on both Vortex and Lumex) — this is the
 * dedup key, not what's displayed. Display keeps the first-seen label.
 */
function tagSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toProjectNode(summary: WritingSummary, featured: boolean): ProjectGraphNode {
  const { meta } = summary;
  return {
    type: "project",
    id: `project:${summary.slug}`,
    slug: summary.slug,
    title: meta.title,
    subtitle: meta.subtitle,
    featured,
    place: meta.place,
    role: meta.role,
    team: meta.team,
    timeline: meta.timeline,
    term: meta.term,
    cover: meta.cover,
    coverAlt: meta.coverAlt,
  };
}

function addTagEdges(
  project: ProjectGraphNode,
  labels: string[] | undefined,
  type: "domain" | "skill" | "tool",
  tagNodes: Map<string, TagGraphNode>,
  edges: GraphEdge[]
) {
  for (const label of labels ?? []) {
    const slug = tagSlug(label);
    if (!slug) continue;

    const id = `${type}:${slug}`;
    if (!tagNodes.has(id)) tagNodes.set(id, { type, id, label });
    edges.push({ source: project.id, target: id });
  }
}

/** Builds the full graph dataset. Cheap — runs over already-parsed summaries. */
export function getProjectGraph(): ProjectGraph {
  const tagNodes = new Map<string, TagGraphNode>();
  const edges: GraphEdge[] = [];
  const projectNodes: ProjectGraphNode[] = [];

  const collections: Array<{ summaries: WritingSummary[]; featured: boolean }> = [
    { summaries: getProjectSummaries(), featured: true },
    { summaries: getArchiveSummaries(), featured: false },
  ];

  for (const { summaries, featured } of collections) {
    for (const summary of summaries) {
      const node = toProjectNode(summary, featured);
      projectNodes.push(node);
      addTagEdges(node, summary.meta.tags, "domain", tagNodes, edges);
      addTagEdges(node, summary.meta.skills, "skill", tagNodes, edges);
      addTagEdges(node, summary.meta.tools, "tool", tagNodes, edges);
    }
  }

  return {
    nodes: [...projectNodes, ...tagNodes.values()],
    edges,
  };
}
