import type { Metadata } from "next";
import IndexCard from "@/components/writing/IndexCard";
import { getWritingSummaries } from "@/lib/writing";
import { formatDate } from "@/lib/format";
import IndexShell, {
  IndexEmpty,
  IndexList,
} from "@/components/chrome/IndexShell";

const TITLE = "Writing.";
const INTRO = "My personal musings on a variety of topics.";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays, manifestos and process notes on design, interfaces and the things they shape.",
  openGraph: {
    title: "Writing",
    description:
      "Essays, manifestos and process notes on design, interfaces and the things they shape.",
    url: "/writing",
  },
};

export default function WritingIndexPage() {
  const documents = getWritingSummaries();
  const pick = documents.find((doc) => doc.meta.recommended);

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
    >
      {documents.length === 0 ? (
        <IndexEmpty noun="Documents" dir="content/writing" />
      ) : (
        <IndexList>
          {documents.map((doc, i) => (
            <IndexCard
              key={doc.slug}
              index={i}
              slug={doc.slug}
              title={doc.meta.title}
              description={doc.meta.description}
              date={formatDate(doc.meta.date)}
              readingMinutes={doc.readingMinutes}
              recommended={doc.meta.recommended}
              basePath="/writing"
            />
          ))}
        </IndexList>
      )}
    </IndexShell>
  );
}
