import type { Metadata } from "next";
import TileGrid, { type Tile } from "@/components/index/TileGrid";
import { getProjectSummaries } from "@/lib/projects";
import { getProjectGraph } from "@/lib/graph";
import { formatDate } from "@/lib/format";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import WorkGraph from "@/components/graph/WorkGraph";

const TITLE = "Work.";
const INTRO =
  "Projects where the brief mattered as much as the outcome — research, systems and the things they produced.";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Design research and speculative projects — the briefs behind them and what came out.",
  openGraph: {
    title: "Work",
    description:
      "Design research and speculative projects — the briefs behind them and what came out.",
    url: "/projects",
  },
};

export default function ProjectsIndexPage() {
  const projects = getProjectSummaries();
  const pick = projects.find((project) => project.meta.recommended);
  const graph = getProjectGraph();

  const tiles: Tile[] = projects.map((project) => ({
    slug: project.slug,
    title: project.meta.title,
    description: project.meta.description,
    place: project.meta.place,
    // `term` is the display label; the exact date stands in until one is set.
    term: project.meta.term ?? formatDate(project.meta.date),
    cover: project.meta.cover,
    coverAlt: project.meta.coverAlt,
    coverVideo: project.meta.coverVideo,
    logo: project.meta.logo,
    logoInvert: project.meta.logoInvert,
    logoWidth: project.meta.logoWidth,
  }));

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
      background={<WorkGraph graph={graph} fill />}
    >
      {tiles.length === 0 ? (
        <IndexEmpty noun="Projects" dir="content/projects" />
      ) : (
        <TileGrid items={tiles} basePath="/projects" />
      )}
    </IndexShell>
  );
}
