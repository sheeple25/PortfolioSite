import type { Metadata } from "next";
import TileGrid, { type Tile } from "@/components/index/TileGrid";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";
import { getArchiveSummaries } from "@/lib/archive";
import { formatDate } from "@/lib/format";

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

export default function ArchiveIndexPage() {
  const entries = getArchiveSummaries();
  const pick = entries.find((entry) => entry.meta.recommended);

  const tiles: Tile[] = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.meta.title,
    description: entry.meta.description,
    place: entry.meta.place,
    // `term` is the display label; the exact date stands in until one is set.
    term: entry.meta.term ?? formatDate(entry.meta.date),
    cover: entry.meta.cover,
    coverAlt: entry.meta.coverAlt,
    coverVideo: entry.meta.coverVideo,
    logo: entry.meta.logo,
    logoInvert: entry.meta.logoInvert,
    logoWidth: entry.meta.logoWidth,
  }));

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
    >
      {tiles.length === 0 ? (
        <IndexEmpty noun="Entries" dir="content/archive" />
      ) : (
        <TileGrid items={tiles} basePath="/archive" />
      )}
    </IndexShell>
  );
}
