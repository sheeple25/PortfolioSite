import type { Metadata } from "next";
import IndexCard from "@/components/writing/IndexCard";
import { getWritingSummaries } from "@/lib/writing";
import { formatDate } from "@/lib/utils";
import styles from "./page.module.css";

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
    <main className={styles.page}>
      {/*
        The document layout's three columns, with the contents rail left empty —
        the index has no headings to jump between, but keeping the track holds
        the reading column in the same place on both pages, so moving from the
        list into a piece doesn't shift the text sideways.
      */}
      <div className={styles.shell}>
        <div className={styles.rail} aria-hidden="true" />

        <div className={styles.column}>
          <header className={styles.header}>
            <h1 className={styles.title}>{TITLE}</h1>
            <p className={styles.intro}>{INTRO}</p>
          </header>

          {documents.length === 0 ? (
            <p className={styles.empty}>
              Nothing published yet. Documents live in{" "}
              <code>content/writing</code> and appear here the moment one lands.
            </p>
          ) : (
            <ul className={styles.list}>
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
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/*
        Pixel's aside, in the same corner a document's annotations open in. It is
        static here — there is nothing on this page to ask about, so this is the
        one thing the mascot has to say.
      */}
      {pick && (
        <aside className={styles.cornerNote}>
          I recommend you start with the {pick.meta.title}&hellip;
        </aside>
      )}
    </main>
  );
}
