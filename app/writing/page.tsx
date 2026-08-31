import type { Metadata } from "next";
import IndexCard from "@/components/writing/IndexCard";
import TypedGround from "@/components/writing/TypedGround";
import { getWritingProse, getWritingSummaries } from "@/lib/writing";
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

  /*
   * The header's texture types the selected essay out across the whole window
   * — the recommended one, which is what the corner note already points at, so
   * the ground and the aside agree on what to read first. Falls back to the
   * newest piece if nothing is marked, and to no texture at all if the section
   * is empty.
   *
   * The shell's scrim goes with it. That wash exists to keep the masthead
   * readable over a busy background, and this one is a field of type at 12%
   * ink that was never going to fight it — leaving it on would only have
   * muted the top half of a background whose whole point is filling the
   * window.
   */
  const featured = pick ?? documents[0];
  const prose = featured ? getWritingProse(featured.slug) : null;

  return (
    <IndexShell
      title={TITLE}
      intro={INTRO}
      note={pick ? <>Start with {pick.meta.title}&hellip;</> : null}
      background={prose ? <TypedGround text={prose} /> : undefined}
      scrim={false}
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
