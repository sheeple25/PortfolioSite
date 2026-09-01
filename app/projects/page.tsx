import type { Metadata } from "next";
import { getEntries } from "@/lib/entries";
import { getProjectGraph } from "@/lib/graph";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import Rebus, { RebusEmoji, RebusLogo } from "@/components/index/Rebus";
import WorkGraph from "@/components/graph/WorkGraph";

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
 * Every project, on one page, navigated by the graph.
 *
 * This used to be one of two filtered views over the entry registry, with a
 * separate `/archive` holding the rest and a tile grid on each. The split is
 * gone: `getProjectGraph()` had always been built from the unfiltered registry
 * — it was the one thing on the site that already knew Work and the Archive
 * were one pool — and promoting it from the header's texture to the page's
 * navigation is what let the second index go. Curation did not go with it; it
 * moved into the layout, where `section: "work"` still decides which nodes are
 * larger, warmer and held in the middle. See `docs/INDEX_NAV_REDESIGN.md`.
 *
 * No `children`, so `IndexShell` renders no sheet: the masthead and the graph
 * are one window, and the only thing below them is the site footer.
 */
export default function ProjectsIndexPage() {
  const entries = getEntries();
  const pick = entries.find((entry) => entry.meta.recommended);
  const graph = getProjectGraph();

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
      background={<WorkGraph graph={graph} />}
      backgroundInteractive
    />
  );
}
