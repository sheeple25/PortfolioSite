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
 * The ground is likewise the root layout's job now (`SectionGround`); adding
 * and removing it with this component's own lifecycle flashed white on every
 * index-to-index move. It tracks light/dark mode the same as the rest of the
 * site (`--index-header-ground`/`--index-header-ink` in globals.css), which is
 * also why the header no longer needs its own scroll-linked `hero-chrome`
 * retint of the nav bar: that class forced the bar's text to a literal white,
 * which only worked back when this ground was always dark regardless of
 * theme. Now that the ground and `--color-charcoal` swap together, the nav's
 * own unforced colour already matches it at every scroll position, in both
 * themes — the case-study banner (`CaseShell`, still always dark) is the one
 * surface left that still sets `hero-chrome` itself.
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
  /**
   * The wash that fades the ground back in over the top of the header so the
   * masthead keeps its contrast. On by default, because it is what makes a
   * busy background (the Work index's force graph) safe to put type on.
   *
   * `/writing` turns it off: its texture is a field of near-invisible type
   * that was never going to fight the title, and the scrim would have muted
   * the whole top half of it for nothing.
   */
  scrim?: boolean;
  /**
   * A full-width band directly under the masthead, still inside the header.
   * `/about` puts its logo marquee here. Omit and the header keeps the empty
   * ground the other indexes have.
   */
  banner?: ReactNode;
  /**
   * Handed the header section's element as it mounts, and `null` as it goes.
   *
   * Exists for `/about`, whose cursor trail is scoped to the header band and
   * therefore needs the node itself — the trail attaches its listener to that
   * element rather than to the window. A callback rather than a ref object
   * because the consumer holds it in state; see `CursorImageTrail`'s `bounds`.
   */
  onHeaderElement?: (el: HTMLElement | null) => void;
  children: ReactNode;
};

export default function IndexShell({
  title,
  intro,
  note,
  background,
  scrim = true,
  banner,
  onHeaderElement,
  children,
}: IndexShellProps) {
  const shutter = useShutter();
  const headerRef = shutter?.panelRef;

  /*
   * Hand the header element out to a consumer that needs it — `/about`, whose
   * cursor trail is scoped to this band.
   *
   * Read from the shutter's ref in an effect rather than by attaching a second
   * `ref` callback to the header: the ref object belongs to `useShutter`, and
   * writing to a hook's return value is both a lint error and a real hazard
   * (the hook, not this component, owns when that slot is valid). By the time
   * effects run the node is attached, so reading it here is equivalent.
   */
  useEffect(() => {
    onHeaderElement?.(headerRef?.current ?? null);
    return () => onHeaderElement?.(null);
  }, [headerRef, onHeaderElement]);

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
            {scrim ? <div className={styles.scrim} aria-hidden="true" /> : null}
          </>
        ) : null}

        <div className={styles.masthead}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
        </div>

        {banner ? <div className={styles.banner}>{banner}</div> : null}
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
