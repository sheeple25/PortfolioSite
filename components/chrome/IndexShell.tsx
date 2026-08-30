"use client";

import { type ReactNode, useEffect } from "react";
import { motion } from "motion/react";
import { useShutter } from "./Shutter";
import styles from "./IndexShell.module.css";

/**
 * The shared frame for `/projects`, `/archive`, `/writing` and `/about`.
 *
 * Two bands. The **header section** is a full window tall — the masthead sits
 * at its top, the rest is deliberately empty so a background can carry it. The
 * **sheet** holding the list or grid is then pulled back up over the header's
 * bottom band by `--index-peek`, so the first row of content is already showing
 * before a single scroll. The header does not stop where the content starts: it
 * runs on underneath, and the tiles sit directly on it.
 *
 * The header section is also the shutter's panel — the thing that rolls up when
 * a card is clicked and back down as whatever was clicked. The shutter itself
 * is provided by the root layout, not here, so the nav bar can drive it too.
 *
 * The dark ground is likewise the root layout's job now (`SectionGround`);
 * adding and removing it with this component's own lifecycle flashed white on
 * every index-to-index move.
 *
 * This exists as a component rather than as a stylesheet each page imports
 * because the three indexes have already drifted apart once. What is left in a
 * page is only what is genuinely its own — the tile grid on `/archive` and
 * `/projects`, the list on `/writing`.
 *
 * Document pages keep the three-track reading shell — see
 * `app/projects/[slug]/page.module.css`. Only indexes use this.
 */

type IndexShellProps = {
  /** Page title, left half of the masthead. Written with its full stop. */
  title: string;
  /** Standfirst, right half. */
  intro: ReactNode;
  /**
   * Pixel's aside, in the same corner a document's annotations open in. Static
   * on an index — there is nothing here to ask about, so this is the one thing
   * the mascot has to say. Omitted when the section has no recommended piece.
   */
  note?: ReactNode;
  /**
   * The header's texture, behind the masthead and bled to all four edges. A
   * slot rather than a prop with a fixed shape, so a page can put a video, a
   * canvas or an animated gradient here without this component knowing. Omit
   * for the flat ground.
   */
  background?: ReactNode;
  children: ReactNode;
};

export default function IndexShell({
  title,
  intro,
  note,
  background,
  children,
}: IndexShellProps) {
  const shutter = useShutter();
  const headerRef = shutter?.panelRef;

  /*
   * The site bar's colour. The header runs to the top of the window under the
   * bar, on a ground dark enough that the bar's charcoal type disappears into
   * it, so `hero-chrome` retints it white — the same class a case study's
   * banner uses, so both surfaces behave identically.
   *
   * `rootMargin` pulls the top edge down by the bar's own height, which makes
   * "intersecting" mean "still behind the bar" rather than "still on screen
   * somewhere".
   */
  useEffect(() => {
    const el = headerRef?.current;
    if (!el) return;

    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>('[data-chrome="header"]');
    const navHeight = nav?.offsetHeight ?? 0;

    /*
     * Set once up front rather than waiting for the observer's first callback.
     * That callback lands a frame or so after paint, which is long enough to
     * show a flash of charcoal type on the dark ground before it corrects.
     */
    root.classList.toggle(
      "hero-chrome",
      window.scrollY < el.offsetHeight - navHeight,
    );

    const observer = new IntersectionObserver(
      ([entry]) => root.classList.toggle("hero-chrome", entry.isIntersecting),
      { threshold: 0, rootMargin: `-${navHeight}px 0px 0px 0px` },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      // Leaving an index must not strand the rest of the site with white chrome.
      root.classList.remove("hero-chrome");
    };
  }, [headerRef]);

  return (
    <main className={styles.page}>
      {/* The shutter's panel: this is what rolls up and back down. */}
      <motion.header
        className={styles.headerSection}
        ref={headerRef}
        {...shutter?.panelProps}
      >
        {background ? (
          <>
            <div className={styles.background} aria-hidden="true">
              {background}
            </div>
            {/* Fades the texture out behind the masthead so it can't fight
                the title/intro for contrast — the slot's contract says
                nothing about what it renders, so this covers video/canvas
                fills too, not just the graph. */}
            <div className={styles.scrim} aria-hidden="true" />
          </>
        ) : null}

        <div className={styles.masthead}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
        </div>
      </motion.header>

      {/*
        The sheet leaves downward, out of the bottom of the frame, while the
        header closes upward — the screen clears from the middle outward rather
        than everything travelling the same way.
      */}
      <motion.div className={styles.sheet} {...shutter?.sheetProps}>
        {children}
      </motion.div>

      {note ? <aside className={styles.note}>{note}</aside> : null}
    </main>
  );
}

/**
 * The list of pieces on an index that reads as prose — `/writing`. `/projects`
 * and `/archive` are grids of tiles instead and bring their own.
 */
export function IndexList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

/**
 * Stands in for the list when a section has nothing published. One sentence
 * across all three, so the three indexes read the same when they are empty as
 * when they are full.
 */
export function IndexEmpty({
  noun,
  dir,
}: {
  /** What this section holds, capitalised: `Documents`, `Projects`, `Entries`. */
  noun: string;
  /** Where the files live, e.g. `content/writing`. */
  dir: string;
}) {
  return (
    <p className={styles.empty}>
      Nothing here yet. {noun} live in <code>{dir}</code> and appear the moment
      one lands.
    </p>
  );
}
