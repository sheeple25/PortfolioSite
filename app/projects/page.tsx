import type { Metadata } from "next";
import { getEntries } from "@/lib/entries";
import { getProjectGraph } from "@/lib/graph";
import { getWorkBoard } from "@/lib/work/board";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import Rebus, { RebusEmoji, RebusLogo } from "@/components/index/Rebus";
import WorkGraph from "@/components/graph/WorkGraph";
import WorkBoard from "@/components/work/WorkBoard";

const TITLE = "Work.";
/*
 * The standfirst, written as a rebus: the marks are standing in for the words
 * rather than decorating them, which is why they carry real `alt` text.
 *
 * Deliberately shorter than the sentence it replaces. At this size a line of
 * prose would push the masthead's right column down past the fold, and the
 * point of the rebus is that it is read at a glance rather than parsed.
 *
 * The trailing clause is the one concession to the merge: the four marks name
 * the curated work, and the page now holds everything else as well, so it has
 * to say so or the graph looks like it has wandered off the brief.
 */
const INTRO = (
  <Rebus>
    A dating product for{" "}
    <RebusLogo src="/logos/Kobble.svg" alt="Kobble" />, livelihoods for{" "}
    <RebusLogo src="/logos/IFTC.svg" alt="In For The Cause" />, four client
    briefs in four months at <RebusLogo src="/logos/PwC.svg" alt="PwC" />, and a
    lavatory for an <RebusLogo src="/logos/IndianRailways.svg" alt="Indian Railways" />{" "}
    <RebusEmoji label="locomotive">🚆</RebusEmoji>. Everything else I have made
    is in here too.
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
 * is `WorkBoard` — three rows of domains, skills and software over a two-row
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
 * are one window, and the only thing below them is the site footer.
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
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
      background={<WorkBoard board={board} />}
      backgroundExpanded={<WorkGraph graph={graph} />}
      backgroundInteractive
    />
  );
}
