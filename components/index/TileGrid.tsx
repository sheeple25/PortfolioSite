"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useShutterLink } from "@/components/chrome/Shutter";
import PeekCard, { type PeekSubject } from "./PeekCard";
import type { EntryMode, PeekContent } from "@/lib/entries/types";
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

  /*
   * What the tile does, resolved in `lib/entries`. The grid deliberately does
   * no routing arithmetic of its own — it used to take a `basePath` and glue a
   * slug onto it, which quietly assumed a project's URL followed the index it
   * appeared on. That is no longer true: an entry keeps `/projects/<slug>`
   * whether it is listed under Work or the Archive, so moving it between them
   * never breaks a link.
   */
  mode: EntryMode;
  /** Resolved destination. `null` for a peek, which opens in place. */
  href: string | null;
  peek: PeekContent;
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
 * One tile's clickable shell.
 *
 * Three modes, three elements — and the element has to change with the mode
 * rather than being faked, because they mean different things to a browser and
 * to a screen reader. A case study is a `Link` (prefetched, navigable, opens
 * in a new tab on middle-click); an external document is a plain anchor that
 * says where it goes; a peek is a `button`, because nothing is being navigated
 * to and announcing it as a link would be a lie.
 */
function TileShell({
  tile,
  onPeek,
  children,
}: {
  tile: Tile;
  onPeek: (tile: Tile) => void;
  children: React.ReactNode;
}) {
  /* Closes the index header before the route changes. */
  const onClick = useShutterLink(tile.href ?? "");

  if (tile.mode === "peek" || !tile.href) {
    return (
      <button
        type="button"
        className={styles.tile}
        onClick={() => onPeek(tile)}
        aria-haspopup="dialog"
      >
        {children}
      </button>
    );
  }

  if (tile.mode === "link") {
    return (
      <a
        href={tile.href}
        className={styles.tile}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={tile.href} className={styles.tile} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function TileGrid({ items }: { items: Tile[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [peeking, setPeeking] = useState<PeekSubject | null>(null);

  const openPeek = useCallback((tile: Tile) => {
    setPeeking({
      slug: tile.slug,
      cover: tile.cover,
      coverAlt: tile.coverAlt,
      place: tile.place,
      term: tile.term,
      peek: tile.peek,
    });
  }, []);

  const closePeek = useCallback(() => setPeeking(null), []);

  /*
   * Split into two columns by parity, so reading order runs left, right, left.
   * Each card also carries its true index as a CSS `order`, which is what the
   * single-column breakpoint uses to put them back in sequence — see the
   * `display: contents` rule in the stylesheet.
   */
  const columns: Array<Array<{ item: Tile; index: number }>> = [[], []];
  items.forEach((item, index) => columns[index % 2].push({ item, index }));

  return (
    <>
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
                <TileShell tile={item} onPeek={openPeek}>
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

                    {item.coverVideo && (
                      <div className={styles.videoScrim} aria-hidden="true" />
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
                      Everything below is revealed together on hover. The name
                      is no longer `aria-hidden`: a peek tile is a button whose
                      only accessible name is what sits inside it, so hiding
                      the title would leave it announced as "button".
                    */}
                    <div className={styles.overlay}>
                      <span className={styles.name}>{item.title}</span>
                      <span className={styles.blurb}>{item.description}</span>
                    </div>
                  </div>

                  <div className={styles.caption}>
                    <span className={styles.place}>{item.place}</span>
                    <span className={styles.term}>{item.term}</span>
                  </div>
                </TileShell>
              </motion.article>
            ))}
          </div>
        ))}
      </div>

      <PeekCard subject={peeking} onClose={closePeek} />
    </>
  );
}
