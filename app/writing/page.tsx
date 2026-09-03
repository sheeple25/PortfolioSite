import type { Metadata } from "next";
import TypedIndex, { type TypedIndexItem } from "@/components/writing/TypedIndex";
import { getWritingSummaries } from "@/lib/writing";
import { formatDate } from "@/lib/format";
import IndexShell, { IndexEmpty } from "@/components/chrome/IndexShell";

const TITLE = "Musings and ramblings.";
const INTRO =
  "I’ve been trying to pick up writing again recently, here are some of my early forays into picking the medium back up.";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "I’ve been trying to pick up writing again recently, here are some of my early forays into picking the medium back up.",
  openGraph: {
    title: "Writing",
    description:
      "I’ve been trying to pick up writing again recently, here are some of my early forays into picking the medium back up.",
    url: "/writing",
  },
};

export default function WritingIndexPage() {
  const documents = getWritingSummaries();
  const pick = documents.find((doc) => doc.meta.recommended);

  if (documents.length === 0) {
    return (
      <IndexShell title={TITLE} intro={INTRO}>
        <IndexEmpty noun="Documents" dir="content/writing" />
      </IndexShell>
    );
  }

  /*
   * The recommended piece leads, then the rest in the order the removed list
   * used — the collection's own, newest first. It reads first and is typed
   * first, which is the same thing the corner note is pointing at.
   */
  const ordered = pick
    ? [pick, ...documents.filter((doc) => doc.slug !== pick.slug)]
    : documents;

  /*
   * `meta.description` is the sentence, rather than a first paragraph pulled
   * out of the markdown body. Two reasons: it is already a short, deliberately
   * written one-liner on every piece — it is what the `<meta description>` and
   * the OG card use — and it is a fixed, known length, which a first paragraph
   * is not. The index is one block of type sized to fill the band exactly once;
   * a stray six-sentence opening paragraph would overflow it and take every
   * piece after it off screen.
   */
  const items: TypedIndexItem[] = ordered.map((doc) => ({
    slug: doc.slug,
    title: doc.meta.title,
    blurb: doc.meta.description,
    date: formatDate(doc.meta.date),
    dateTime: doc.meta.date,
    readingMinutes: doc.readingMinutes,
    recommended: doc.meta.recommended,
  }));

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
      background={<TypedIndex items={items} />}
      backgroundInteractive
    />
  );
}
