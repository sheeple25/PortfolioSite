import type { Metadata } from "next";
import { getEntries } from "@/lib/entries";
import { getProjectGraph } from "@/lib/graph";
import { getWorkBoard } from "@/lib/work/board";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import AskPixelNote from "@/components/work/AskPixelNote";
import Rebus, { RebusLogo } from "@/components/index/Rebus";
import WorkGraph from "@/components/graph/WorkGraph";
import WorkBoard from "@/components/work/WorkBoard";

const TITLE = "Work.";
/*
 * The standfirst, written as a rebus: the marks are standing in for the words
 * rather than decorating them, which is why they carry real `alt` text.
 *
 * Three lines, never more — the masthead's ceiling is the band's floor, and
 * `useMastheadFit` enforces the line count on top of the height budget. So
 * the copy is what Vidush is doing *now* and one sentence of intent, and the
 * rest of the work is left to the board to introduce itself.
 */
const INTRO = (
  <Rebus>
    Reinventing dating at{" "}
    <RebusLogo src="/logos/Kobble.svg" alt="Kobble" /> and building brand
    strategy for <RebusLogo src="/logos/IFTC.svg" alt="In For The Cause" />, an
    NGO working with People with Disabilities. I&rsquo;m currently looking for
    full time roles.
  </Rebus>
);

export const metadata: Metadata = {
  title: "Work",
  description:
    "Design research and speculative projects — the briefs behind them and what came out, mapped against the domains, skills and tools they share.",
  openGraph: {
    title: "Work",
    description:
      "Design research and speculative projects — the briefs behind them and what came out, mapped against the domains, skills and tools they share.",
    url: "/projects",
  },
};

/**
 * Every project, on one page, navigated by what it demonstrates.
 *
 * This used to be one of two filtered views over the entry registry, with a
 * separate `/archive` holding the rest and a tile grid on each. The split is
 * gone: `getProjectGraph()` had always been built from the unfiltered registry
 * — it was the one thing on the site that already knew Work and the Archive
 * were one pool — and promoting it out of the header's texture is what let the
 * second index go. See `docs/INDEX_NAV_REDESIGN.md`.
 *
 * **Two views of that one pool, and the band swaps between them.** Collapsed it
 * is `WorkBoard` — three columns of domains, tools and skills over a two-row
 * rail of every project, where pointing at a requirement lights the work that
 * answers it. Expanded it is `WorkGraph`, the same data as a relational map.
 *
 * The board is the one that greets people, because this page is also the
 * landing page (`app/page.tsx` redirects here) and the graph needed a legend to
 * explain itself. The graph is better as the second read a visitor chooses than
 * as the first thing they are handed. `docs/WORK_GRAPH_DEMOTION.md` records why
 * and what the graph was.
 *
 * Both are built from the same registry and neither is filtered by section, so
 * curation is presentation only: `section: "work"` orders those projects first
 * and gives them a wider tile, and that is the whole of it.
 *
 * No `children`, so `IndexShell` renders no sheet: the masthead and the band
 * are exactly one window, every project is in the band at once, and the only
 * thing below them is the site footer. That is the owner's rule for this page
 * — if the pool ever outgrows the width, the board's rail scrolls sideways,
 * and the band never grows down. See `WorkBoard`.
 */
export default function ProjectsIndexPage() {
  const entries = getEntries();
  const pick = entries.find((entry) => entry.meta.recommended);
  const graph = getProjectGraph();
  const board = getWorkBoard();

  if (entries.length === 0) {
    return (
      <IndexShell title={TITLE} intro={INTRO}>
        <IndexEmpty noun="Projects" dir="content/projects" />
      </IndexShell>
    );
  }

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={<AskPixelNote pickTitle={pick?.meta.title} />}
      background={<WorkBoard board={board} />}
      backgroundExpanded={<WorkGraph graph={graph} />}
      backgroundInteractive
    />
  );
}
