import type { Metadata } from "next";
import TileGrid from "@/components/index/TileGrid";
import { toTile } from "@/components/index/toTile";
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
 */
const INTRO = (
  <Rebus>
    A dating product for{" "}
    <RebusLogo src="/logos/Kobble.svg" alt="Kobble" />, livelihoods for{" "}
    <RebusLogo src="/logos/IFTC.svg" alt="In For The Cause" />, four client
    briefs in four months at <RebusLogo src="/logos/PwC.svg" alt="PwC" />, and a
    lavatory for an <RebusLogo src="/logos/IndianRailways.svg" alt="Indian Railways" />{" "}
    <RebusEmoji label="locomotive">🚆</RebusEmoji>.
  </Rebus>
);

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

/**
 * The Work index — one of two filtered views over the entry registry.
 *
 * `section: "work"` is what puts a project here rather than in the Archive,
 * and it is a curation decision held in `lib/entries/registry.ts`, not a
 * consequence of where a file lives or how built-out it is. See the note at
 * the top of `lib/entries/types.ts`.
 */
export default function ProjectsIndexPage() {
  const entries = getEntries("work");
  const pick = entries.find((entry) => entry.meta.recommended);
  const graph = getProjectGraph();

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
      background={<WorkGraph graph={graph} fill />}
    >
      {entries.length === 0 ? (
        <IndexEmpty noun="Projects" dir="content/projects" />
      ) : (
        <TileGrid items={entries.map(toTile)} />
      )}
    </IndexShell>
  );
}
