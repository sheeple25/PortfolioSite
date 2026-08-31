import type { Metadata } from "next";
import TileGrid from "@/components/index/TileGrid";
import { toTile } from "@/components/index/toTile";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import { getEntries } from "@/lib/entries";

const TITLE = "Archive.";
const INTRO =
  "Some of my other work, which might also pique your interest. Objects, materials and research from before the current focus — kept because the thinking still holds.";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Product, transport, furniture, textile and research projects — earlier work kept for the thinking behind it.",
  openGraph: {
    title: "Archive",
    description:
      "Product, transport, furniture, textile and research projects — earlier work kept for the thinking behind it.",
    url: "/archive",
  },
};

/**
 * The Archive index — the second filtered view over the entry registry.
 *
 * Ordered by `rank` rather than date, because this is a curated shortlist
 * rather than a feed: the entries that best survive being pulled out of
 * context lead. That ordering is applied in `getEntries`, which is also why
 * the two indexes can share one content pool.
 *
 * An entry appearing here says nothing about how built-out it is. A full case
 * study can sit in the Archive because it is older work outside the current
 * story, and a Work project can be a peek while it waits to be written.
 */
export default function ArchiveIndexPage() {
  const entries = getEntries("archive");
  const pick = entries.find((entry) => entry.meta.recommended);

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
    >
      {entries.length === 0 ? (
        <IndexEmpty noun="Entries" dir="content/projects" />
      ) : (
        <TileGrid items={entries.map(toTile)} />
      )}
    </IndexShell>
  );
}
