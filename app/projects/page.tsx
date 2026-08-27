import type { Metadata } from "next";
import IndexCard from "@/components/writing/IndexCard";
import { getProjectSummaries } from "@/lib/projects";
import { getProjectGraph } from "@/lib/graph";
import { formatDate } from "@/lib/format";
import IndexShell from "@/components/chrome/IndexShell";
import WorkGraph from "@/components/graph/WorkGraph";
import styles from "./page.module.css";

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

  return (
    <main className={styles.page}>
      <IndexShell title={TITLE} intro={INTRO}>
        <WorkGraph graph={graph} />

        {projects.length === 0 ? (
          <p className={styles.empty}>
            Nothing published yet. Projects live in{" "}
            <code>content/projects</code> and appear here the moment one lands.
          </p>
        ) : (
          <ul className={styles.list}>
            {projects.map((project, i) => (
              <IndexCard
                key={project.slug}
                index={i}
                slug={project.slug}
                title={project.meta.title}
                description={project.meta.description}
                date={formatDate(project.meta.date)}
                readingMinutes={project.readingMinutes}
                recommended={project.meta.recommended}
                basePath="/projects"
              />
            ))}
          </ul>
        )}
      </IndexShell>

      {/*
        Pixel's aside, in the same corner a document's annotations open in. It is
        static here — there is nothing on this page to ask about, so this is the
        one thing the mascot has to say.
      */}
      {pick && (
        <aside className={styles.cornerNote}>
          Start with {pick.meta.title}&hellip;
        </aside>
      )}
    </main>
  );
}
