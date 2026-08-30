"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useShutterLink } from "@/components/chrome/Shutter";
import styles from "./TileGrid.module.css";

export type Tile = {
  slug: string;
  title: string;
  description: string;
  place?: string;
  /** `Fall 2024`-style label, already resolved by the page. */
  term: string;
  cover?: string;
  coverAlt?: string;
  /** Looping background video; autoplays on load with `cover` as its poster. */
  coverVideo?: string;
  /** A mark centered over the cover/video, its color and size set here. */
  logo?: string;
  logoInvert?: boolean;
  /** Percent of the tile's width. Defaults to 20. */
  logoWidth?: number;
};

/**
 * The tile grid shared by `/archive` and `/projects`.
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

/**
 * One tile's link, wired to the shutter so clicking it closes the index header
 * before the route changes. Its own component because that needs a hook, and
 * the tiles are rendered inside a `map`.
 */
function TileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const onClick = useShutterLink(href);

  return (
    <Link href={href} className={styles.tile} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function TileGrid({
  items,
  basePath,
}: {
  items: Tile[];
  /**
   * Section the slug hangs off — `/archive` or `/projects`. Passed rather than
   * hard-coded because both indexes render this same grid.
   */
  basePath: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  /*
   * Split into two columns by parity, so reading order runs left, right, left.
   * Each card also carries its true index as a CSS `order`, which is what the
   * single-column breakpoint uses to put them back in sequence — see the
   * `display: contents` rule in the stylesheet.
   */
  const columns: Array<Array<{ item: Tile; index: number }>> = [[], []];
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
              <TileLink href={`${basePath}/${item.slug}`}>
                <div
                  className={styles.frame}
                  style={{ aspectRatio: RATIOS[index % RATIOS.length] }}
                >
                  {item.coverVideo ? (
                    <video
                      className={styles.image}
                      src={item.coverVideo}
                      poster={item.cover}
                      autoPlay={!reducedMotion}
                      loop={!reducedMotion}
                      muted
                      playsInline
                      aria-hidden="true"
                    />
                  ) : item.cover ? (
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

                  {item.logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- decorative mark, sized as a % of the tile rather than known intrinsic dimensions
                    <img
                      src={item.logo}
                      alt=""
                      aria-hidden="true"
                      className={styles.logoMark}
                      style={{
                        width: `${item.logoWidth ?? 20}%`,
                        filter: item.logoInvert ? "invert(1)" : undefined,
                      }}
                    />
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
              </TileLink>
            </motion.article>
          ))}
        </div>
      ))}
    </div>
  );
}
