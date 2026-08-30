import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./case.module.css";

/**
 * The closing row — two neighbouring projects and a way back to the index.
 *
 * A neighbour without cover art renders as the frames' charcoal plate carrying
 * the project's name, at the same card ratio, so dropping a real still in later
 * changes nothing but the fill.
 */

export type Neighbour = {
  title: string;
  href: string;
  blurb: string;
  /** Studio or institution, printed bottom-left. */
  studio: string;
  /** Term, printed bottom-right. */
  term: string;
  cover?: string;
};

export default function MoreProjects({
  projects,
  indexHref = "/projects",
}: {
  projects: readonly Neighbour[];
  indexHref?: string;
}) {
  return (
    <section className={styles.more}>
      <div className={styles.moreHead}>
        <h2 className={styles.moreHeading}>See more projects</h2>
        <Link href={indexHref} aria-label="All projects">
          <ArrowRight size={24} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.moreGrid}>
        {projects.map((p) => (
          <Link key={p.href} href={p.href} className={styles.moreCard}>
            <div className={styles.moreThumb}>
              {p.cover ? (
                <Image
                  src={p.cover}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 380px"
                  className={styles.moreThumbCover}
                />
              ) : null}
              <p className={styles.moreThumbLabel}>{p.title}</p>
            </div>
            <p className={styles.cardNote}>{p.blurb}</p>
            <div className={styles.moreMeta}>
              <span>{p.studio}</span>
              <span>{p.term}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
