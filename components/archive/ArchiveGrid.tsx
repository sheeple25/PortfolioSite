"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./ArchiveGrid.module.css";

export type ArchiveTile = {
  slug: string;
  title: string;
  description: string;
  place?: string;
  /** `Fall 2024`-style label, already resolved by the page. */
  term: string;
  cover?: string;
  coverAlt?: string;
};

/**
 * The archive index.
 *
 * Two columns of equal width with tile heights that vary, so the columns flow
 * out of step and the rows stop lining up. Widths stay identical — the
 * asymmetry is carried by height alone.
 *
 * At rest a card is only its cover. The name and the one-line description are
 * held back until hover, which keeps the grid quiet enough to scan as a set of
 * images and puts the words where the cursor already is. Place and term stay
 * visible underneath, because those are what you sort by when nothing is
 * hovered.
 */

/**
 * Cover aspect ratios, cycled by index — taken off the mockup, where no two
 * adjacent cards share a height. Six values rather than four so a column runs
 * a full pass before it repeats.
 */
const RATIOS = [1.73, 1.72, 2.08, 1.7, 1.84, 1.92];

export default function ArchiveGrid({ items }: { items: ArchiveTile[] }) {
  const reducedMotion = usePrefersReducedMotion();

  /*
   * Split into two columns by parity, so reading order runs left, right, left.
   * Each card also carries its true index as a CSS `order`, which is what the
   * single-column breakpoint uses to put them back in sequence — see the
   * `display: contents` rule in the stylesheet.
   */
  const columns: Array<Array<{ item: ArchiveTile; index: number }>> = [[], []];
  items.forEach((item, index) => columns[index % 2].push({ item, index }));

  return (
    <div className={styles.grid}>
      {columns.map((column, columnIndex) => (
        <div className={styles.column} key={columnIndex}>
          {column.map(({ item, index }) => (
            <motion.article
              key={item.slug}
              className={styles.cell}
              style={{ order: index }}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/archive/${item.slug}`} className={styles.tile}>
                <div
                  className={styles.frame}
                  style={{ aspectRatio: RATIOS[index % RATIOS.length] }}
                >
                  {item.cover ? (
                    <Image
                      src={item.cover}
                      alt={item.coverAlt ?? ""}
                      fill
                      className={styles.image}
                      sizes="(max-width: 52rem) 100vw, (max-width: 76rem) 50vw, 37rem"
                      priority={index < 2}
                    />
                  ) : (
                    <div className={styles.placeholder} aria-hidden="true" />
                  )}

                  {/*
                    Everything below is revealed together on hover. `aria-hidden`
                    on the name because the link already carries the title as its
                    accessible name — a screen reader shouldn't hear it twice.
                  */}
                  <div className={styles.overlay}>
                    <span className={styles.name} aria-hidden="true">
                      {item.title}
                    </span>
                    <span className={styles.blurb}>{item.description}</span>
                  </div>
                </div>

                <div className={styles.caption}>
                  <span className={styles.place}>{item.place}</span>
                  <span className={styles.term}>{item.term}</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      ))}
    </div>
  );
}
