import type { Metadata } from "next";
import ArchiveGrid, { type ArchiveTile } from "@/components/archive/ArchiveGrid";
import IndexShell from "@/components/chrome/IndexShell";
import { getArchiveSummaries } from "@/lib/archive";
import { formatDate } from "@/lib/format";
import styles from "./page.module.css";

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

  const tiles: ArchiveTile[] = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.meta.title,
    description: entry.meta.description,
    place: entry.meta.place,
    // `term` is the display label; the exact date stands in until one is set.
    term: entry.meta.term ?? formatDate(entry.meta.date),
    cover: entry.meta.cover,
    coverAlt: entry.meta.coverAlt,
  }));

  return (
    <main className={styles.page}>
      <IndexShell title={TITLE} intro={INTRO}>
        {tiles.length === 0 ? (
          <p className={styles.empty}>
            Nothing here yet. Entries live in <code>content/archive</code> and
            appear the moment one lands.
          </p>
        ) : (
          <ArchiveGrid items={tiles} />
        )}
      </IndexShell>
    </main>
  );
}
