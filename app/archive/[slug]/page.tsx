import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectMeta from "@/components/archive/ProjectMeta";
import DocumentHeader from "@/components/writing/DocumentHeader";
import { ReaderProvider } from "@/components/writing/ReaderContext";
import SectionCard from "@/components/writing/SectionCard";
import Toc from "@/components/writing/Toc";
import AnnotationPanel from "@/components/writing/notes/AnnotationPanel";
import { NotesProvider } from "@/components/writing/notes/NotesContext";
import prose from "@/components/writing/prose.module.css";
import { getArchiveDocument, getArchiveSlugs } from "@/lib/archive";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import styles from "./page.module.css";

type PageProps = { params: Promise<{ slug: string }> };

/** Every entry is known at build time, so an unknown slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getArchiveSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getArchiveDocument(slug);
  if (!doc) return {};

  const { title, description, date, cover } = doc.meta;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/archive/${slug}`,
      publishedTime: date || undefined,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function ArchiveEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getArchiveDocument(slug);
  if (!doc) notFound();

  const sectionIds = doc.sections.map((section) => section.id);

  return (
    <article className={styles.page}>
      <NotesProvider notes={doc.notes}>
        <ReaderProvider sectionIds={sectionIds}>
          {/*
            The same three-column reading frame as `/projects` — contents left,
            fixed measure in the middle, right margin held open for the mascot
            and any annotations. Moving between the two sections shouldn't feel
            like moving between two sites.
          */}
          <div className={styles.shell}>
            <Toc toc={doc.toc} />

            <div className={styles.column}>
              <DocumentHeader
                title={doc.meta.title}
                subtitle={doc.meta.subtitle}
                /*
                  `term` is the human label — "Fall 2024" — and `date` stays
                  ISO for the sitemap, OG tags and sorting. Showing the term
                  here as well as on the index card means there is exactly one
                  field to edit when the wording changes.
                */
                date={doc.meta.term ?? formatDate(doc.meta.date)}
                dateTime={doc.meta.date}
                version={doc.meta.version}
                readingMinutes={doc.readingMinutes}
                showsPrivate={doc.showsPrivate}
                backHref="/archive"
                backLabel="Archive"
                /* Each entry has a title animation of its own — see TitleEffect. */
                titleEffect={doc.meta.titleEffect}
              />

              <ProjectMeta
                role={doc.meta.role}
                timeline={doc.meta.timeline}
                team={doc.meta.team}
                skills={doc.meta.skills}
              />

              {doc.lead && (
                <div className={cn(prose.prose, styles.lead)}>{doc.lead}</div>
              )}

              {/*
                Archive entries set `expandable: false`, so every section here
                arrives fully open and `SectionCard` draws no toggle — the text
                is already as short as it goes.
              */}
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
                <Link href="/archive" className={styles.endLink}>
                  Back to the archive
                </Link>
              </div>
            </div>
          </div>

          <AnnotationPanel />
        </ReaderProvider>
      </NotesProvider>
    </article>
  );
}
