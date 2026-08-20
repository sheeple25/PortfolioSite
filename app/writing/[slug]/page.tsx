import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocumentHeader from "@/components/writing/DocumentHeader";
import { ReaderProvider } from "@/components/writing/ReaderContext";
import SectionCard from "@/components/writing/SectionCard";
import Toc from "@/components/writing/Toc";
import AnnotationPanel from "@/components/writing/notes/AnnotationPanel";
import { NotesProvider } from "@/components/writing/notes/NotesContext";
import prose from "@/components/writing/prose.module.css";
import { getWritingDocument, getWritingSlugs } from "@/lib/writing";
import { cn, formatDate } from "@/lib/utils";
import styles from "./page.module.css";

type PageProps = { params: Promise<{ slug: string }> };

/** Every document is known at build time, so an unknown slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getWritingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getWritingDocument(slug);
  if (!doc) return {};

  const { title, description, date } = doc.meta;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/writing/${slug}`,
      publishedTime: date || undefined,
    },
  };
}

export default async function WritingDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getWritingDocument(slug);
  if (!doc) notFound();

  const sectionIds = doc.sections.map((section) => section.id);

  return (
    <article className={styles.page}>
      <NotesProvider notes={doc.notes}>
        <ReaderProvider sectionIds={sectionIds}>
          {/*
            Three columns: contents pinned left, a fixed reading measure in the
            middle, and a margin held open on the right. Nothing is rendered
            into that third track — the annotation panel below and the sitewide
            mascot are both fixed to the bottom-right corner, and the track is
            what stops the text running underneath them.
          */}
          <div className={styles.shell}>
            <Toc toc={doc.toc} />

            <div className={styles.column}>
              <DocumentHeader
                title={doc.meta.title}
                subtitle={doc.meta.subtitle}
                date={formatDate(doc.meta.date)}
                version={doc.meta.version}
                readingMinutes={doc.readingMinutes}
                showsPrivate={doc.showsPrivate}
              />

              {/*
                `preview` and `body` are React trees rendered on the server and
                handed to a client component as props — the markdown never
                reaches the browser, only the elements it produced.
              */}
              {doc.lead && (
                <div className={cn(prose.prose, styles.lead)}>{doc.lead}</div>
              )}

              {doc.sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  id={section.id}
                  ordinal={i + 1}
                  title={section.title}
                  preview={section.preview}
                  body={section.body}
                  isPrivate={section.private}
                />
              ))}

              <div className={styles.end}>
                <p className={styles.endMark} aria-hidden="true">
                  &lowast;
                </p>
                <Link href="/writing" className={styles.endLink}>
                  More writing
                </Link>
              </div>
            </div>
          </div>

          {/* One home for every annotation: the corner, above Pixel. */}
          <AnnotationPanel />
        </ReaderProvider>
      </NotesProvider>
    </article>
  );
}
