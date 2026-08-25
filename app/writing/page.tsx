import type { Metadata } from "next";
import IndexCard from "@/components/writing/IndexCard";
import { getWritingSummaries } from "@/lib/writing";
import { formatDate } from "@/lib/format";
import IndexShell from "@/components/chrome/IndexShell";
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
      <IndexShell title={TITLE} intro={INTRO}>
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
                basePath="/writing"
              />
            ))}
          </ul>
        )}
      </IndexShell>

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
