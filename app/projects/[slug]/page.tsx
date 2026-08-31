import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectMeta from "@/components/archive/ProjectMeta";
import DocumentHeader from "@/components/writing/DocumentHeader";
import { ReaderProvider } from "@/components/writing/ReaderContext";
import SectionCard from "@/components/writing/SectionCard";
import Toc from "@/components/writing/Toc";
import { AnnotationPanel, NotesProvider } from "@/components/pixel";
import { ProcessNote } from "@/components/pixel/server";
import prose from "@/components/writing/prose.module.css";
import { getEntry, getEntryDocument, getEntryDocumentSlugs } from "@/lib/entries";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import styles from "@/components/writing/documentPage.module.css";

type PageProps = { params: Promise<{ slug: string }> };

/*
 * The reading page for every markdown-backed entry, Work and Archive alike.
 *
 * There used to be two of these — `app/projects/[slug]` and
 * `app/archive/[slug]` — differing only in which fields they drew. That split
 * made an entry's URL a function of its section, which meant moving a project
 * between the two changed its address. Both routes are now this one, and
 * `/archive/<slug>` permanently redirects here, so `section` is free to change.
 *
 * The fields that used to be the archive route's alone — the credits block,
 * the `term` masthead, the per-entry title animation — are all frontmatter, so
 * they simply render when present. A Work entry that fills them in gets them.
 */

/** Every entry is known at build time, so an unknown slug is a 404. */
export const dynamicParams = false;

/**
 * Markdown entries only. The three hand-built case studies are static routes
 * of the same name (`app/projects/loco` and friends) and would collide.
 */
export function generateStaticParams() {
  return getEntryDocumentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getEntryDocument(slug);
  if (!doc) return {};

  const { title, description, date, cover } = doc.meta;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${slug}`,
      publishedTime: date || undefined,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getEntryDocument(slug);
  const entry = getEntry(slug);
  if (!doc || !entry) notFound();

  const sectionIds = doc.sections.map((section) => section.id);

  /* Back to whichever index actually lists this entry. */
  const backHref = entry.section === "work" ? "/projects" : "/archive";
  const backLabel = entry.section === "work" ? "Work" : "Archive";

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
                backHref={backHref}
                backLabel={backLabel}
                /* Falls back to the sitewide default when none is named. */
                titleEffect={doc.meta.titleEffect ?? "particles"}
              />

              {/* Renders nothing when an entry has no credits recorded. */}
              <ProjectMeta
                role={doc.meta.role}
                timeline={doc.meta.timeline}
                team={doc.meta.team}
                skills={doc.meta.skills}
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
                <Link href={backHref} className={styles.endLink}>
                  {entry.section === "work"
                    ? "More work"
                    : "Back to the archive"}
                </Link>
              </div>
            </div>

            {/*
              The third track's first real occupant: what Vidush actually did on
              this project, in Pixel's margin, without being asked. Renders
              nothing while the project's DecisionLog is still a placeholder.
            */}
            <ProcessNote slug={slug} />
          </div>

          {/* One home for every annotation: the corner, above Pixel. */}
          <AnnotationPanel />
        </ReaderProvider>
      </NotesProvider>
    </article>
  );
}
