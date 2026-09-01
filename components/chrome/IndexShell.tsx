"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePixel, useCornerSlot } from "@/components/pixel";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useShutter } from "./Shutter";
import useMastheadFit from "./useMastheadFit";
import styles from "./IndexShell.module.css";

/**
 * The shared frame for `/projects`, `/writing` and `/about`.
 *
 * Two shapes now, not one.
 *
 * **With a sheet** (`/about`): the **header section** is a full window tall —
 * the masthead sits at its top, the rest is deliberately empty so a background
 * can carry it. The **sheet** holding the list or grid is then pulled back up
 * over the header's bottom band by `--index-peek`, so the first row of content
 * is already showing before a single scroll. The header does not stop where the
 * content starts: it runs on underneath, and the tiles sit directly on it.
 *
 * **Without one** (`/projects`, `/writing`, `/about`): omit `children` and
 * there is no sheet at all. The page is exactly one window, split into two
 * stacked regions — the **stage** (masthead, and the banner if there is one) on
 * top, and the **band** carrying the background below it, running to the bottom
 * edge of that window. The only thing a scroll reveals is the site footer.
 *
 * The split is done with flex rather than a fixed `top`, and that is load
 * bearing. The stage asks for `--index-stage-min` and grows past it if its own
 * contents need more; the band takes everything left over. So the same shell
 * gives `/projects` a band of about 70svh — its masthead is two short blocks —
 * and `/about` a shorter one, because a logo marquee sits under that masthead
 * and has to fit. Pinning the boundary to one viewport fraction would have
 * meant a different magic number per page, each wrong the moment the type
 * reflowed.
 *
 * All three pass `backgroundInteractive`, which is what stops the slot being
 * hidden from assistive tech — see the prop.
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
 * because the indexes have already drifted apart once. What is left in a page
 * is only what is genuinely its own — the graph on `/projects`, the typed index
 * on `/writing`, the interest band on `/about`.
 *
 * Document pages keep the three-track reading shell — see
 * `app/projects/[slug]/page.module.css`. Only indexes use this.
 */

type IndexShellProps = {
  /**
   * Page title, on the window's left edge. Written with its full stop.
   *
   * Also doubles as the fitter's content signature — see `useMastheadFit` —
   * which is fine as long as no two indexes ever share a title.
   */
  title: string;
  /**
   * Standfirst, on the window's right edge.
   *
   * Its column widens itself rather than growing taller when it would otherwise
   * overrun the masthead's ceiling, so a longer one costs width and not the
   * band's height. There is a limit to that — see `useMastheadFit` — and a
   * standfirst several sentences long will still find it.
   */
  intro: ReactNode;
  /**
   * Pixel's aside, in the same corner a document's annotations open in. Static
   * on an index — there is nothing here to ask about, so this is the one thing
   * the mascot has to say. Omitted when the section has no recommended piece.
   *
   * Goes away when Pixel reaches the footer, the same as the document
   * annotation panel: the note is anchored to the mascot, and once he has
   * climbed into the footer it would be left hanging over a room he has already
   * left. Two other things want that corner at the footer too — the wardrobe
   * opens directly above the sprite, and the footer has its own content there —
   * so clearing it resolves all three at once.
   */
  note?: ReactNode;
  /**
   * The header's texture, in the band below the masthead. A slot rather than a
   * prop with a fixed shape, so a page can put a video, a canvas or an animated
   * graph here without this component knowing. Omit for the flat ground.
   */
  background?: ReactNode;
  /**
   * The background is real navigation, not decoration.
   *
   * The slot is `aria-hidden` by default, which is right for a texture and
   * actively wrong for `/projects` and `/writing`: both now put the page's only
   * set of links in here, and focusable elements inside an `aria-hidden`
   * subtree are both unreachable to a screen reader and an accessibility
   * violation in their own right. Setting this drops the attribute; the
   * background is then responsible for its own labelling.
   */
  backgroundInteractive?: boolean;
  /**
   * A full-width band directly under the masthead, still inside the header.
   * `/about` puts its logo marquee here. Omit and the header keeps the empty
   * ground the other indexes have.
   */
  banner?: ReactNode;
  /**
   * Handed the **stage** element as it mounts, and `null` as it goes.
   *
   * Exists for `/about`, whose cursor trail is scoped to the masthead region
   * and therefore needs the node itself — the trail attaches its listener to
   * that element rather than to the window. A callback rather than a ref object
   * because the consumer holds it in state; see `CursorImageTrail`'s `bounds`.
   *
   * The stage rather than the whole header section, which is what this used to
   * hand out. While there was a sheet those were different things and either
   * would have done; now that the header section *is* the page, handing out the
   * header would scope the trail to everything including the band — and the
   * whole point of scoping it was to keep it off the band, where a second layer
   * of scattered images fights the interest cutouts for the same job. Because
   * pointer events bubble, listening on the stage still catches the pointer
   * over the masthead's own type without needing an overlay.
   */
  onStageElement?: (el: HTMLElement | null) => void;
  /**
   * The sheet's contents. Omit entirely and no sheet is rendered: the page is
   * one window and the footer follows it. See the note at the top.
   */
  children?: ReactNode;
};

export default function IndexShell({
  title,
  intro,
  note,
  background,
  backgroundInteractive = false,
  banner,
  onStageElement,
  children,
}: IndexShellProps) {
  const shutter = useShutter();
  const headerRef = shutter?.panelRef;

  /*
   * The corner note is anchored to the mascot, and the mascot climbs into the
   * footer. `AnnotationPanel` already answers this for a document page; an
   * index has the same problem and now the same answer, read from the same
   * one observer in `PixelContext` rather than a second one here.
   */
  const { atFooter, saying } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  /*
   * An index owns its corner for as long as it is mounted, whether or not it
   * has anything in it this second — the slot below renders the hover line
   * itself, so `PixelSpeech` drawing a second copy would be a duplicate rather
   * than a fallback.
   */
  useCornerSlot();

  /*
   * A hover outranks the standing recommendation. The static note is what Pixel
   * says when there is nothing better; pointing at something specific *is*
   * something better, and it reverts the moment the pointer moves off.
   */
  const line = saying ?? note;

  /*
   * `children` is the switch between the two shapes rather than a separate
   * `variant` prop, because there is no coherent third state: a page either has
   * foreground content below the header or it does not, and a page that passed
   * both a sheet's worth of content and "no sheet please" would be asking for
   * something this component cannot draw.
   */
  const hasSheet = children !== undefined && children !== null;

  /*
   * Hand the stage element out to a consumer that needs it — `/about`, whose
   * cursor trail is scoped to it.
   *
   * A plain state-backed ref callback rather than reading it out of an effect,
   * which is what this did while the node it handed out belonged to the
   * shutter: that ref object is the hook's, and writing to a hook's return
   * value is both a lint error and a real hazard. The stage is this component's
   * own element, so it can simply take the callback.
   */
  const stageEl = useRef<HTMLDivElement | null>(null);
  const stageRef = useCallback(
    (el: HTMLDivElement | null) => {
      stageEl.current = el;
      onStageElement?.(el);
    },
    [onStageElement],
  );

  /*
   * The masthead is full-bleed now — title on the window's left edge,
   * standfirst on its right — which leaves a wide, empty gap between the two
   * that grows with the window. `useMastheadFit` spends that gap when it has
   * to: it keeps the standfirst from growing taller than the stage's floor by
   * widening it instead, so the band below never loses height to a paragraph
   * that happened to wrap one line further at this particular zoom. See the
   * note at the top of that file.
   */
  const mastheadEl = useRef<HTMLDivElement | null>(null);
  const titleEl = useRef<HTMLHeadingElement | null>(null);
  const introEl = useRef<HTMLParagraphElement | null>(null);

  useMastheadFit({
    stage: stageEl,
    masthead: mastheadEl,
    title: titleEl,
    intro: introEl,
    signature: title,
  });

  /*
   * Full screen for the band.
   *
   * This used to live inside `WorkGraph`, which meant it existed on `/projects`
   * and nowhere else — and the graph is not the only band worth filling the
   * screen with. The state belongs to whoever owns the slot, and that is this
   * component: hoisting it here gives `/writing`'s typed index and `/about`'s
   * interest desktop the same affordance without either of them knowing it
   * exists, and there is one copy of the scroll lock and the Escape handler
   * instead of three.
   *
   * Offered only on the one-window shape, and only when the slot is real
   * navigation rather than a texture — expanding a decorative background to fill
   * the screen would be an invitation to look at nothing. The same
   * `backgroundInteractive` test that keeps the slot out of `aria-hidden` is
   * what makes the button safe to put inside it.
   */
  const canExpand = Boolean(background) && !hasSheet && backgroundInteractive;

  /*
   * Which page is expanded, rather than whether this one is.
   *
   * The two are the same thing until you move between indexes, which React
   * serves by reconciling one `IndexShell` into the next rather than remounting
   * it — a plain boolean would survive that and leave `/writing` opened full
   * screen because you left `/projects` that way. Storing the page it was opened
   * for makes the reset fall out of the render instead of needing an effect to
   * chase it, which is the pattern React asks for and the one the lint rules
   * here enforce.
   */
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const expanded = expandedFor === title;
  const setExpanded = useCallback(
    (next: boolean) => setExpandedFor(next ? title : null),
    [title],
  );

  /*
   * "No scroll at all", which takes the top of the page as well as both
   * elements' `overflow`.
   *
   * The band fills the header section and the header section is one window — so
   * it *is* the screen, but only from a scroll position of zero. Anywhere else
   * and the reader would be looking at the footer with a full-screen band above
   * it. Jumping to the top first is what makes locking the scroll mean "the band
   * is all there is" rather than "you are stuck wherever you happened to be".
   * `instant` because `html` sets `scroll-behavior: smooth`, and a half-second
   * glide that ends in a hard lock reads as the page fighting the click.
   *
   * Both elements, not just the body: `overflow: hidden` on the body alone —
   * which is what this did while it lived in `WorkGraph` — relies on the UA
   * propagating that value up to the viewport, and it only does so while the
   * root's own overflow is `visible`. Setting both is unconditional.
   *
   * `band-expanded` is the class that takes the floating chrome — the mascot and
   * the rating rail — off the screen; the rule and the reason it is its own
   * rather than the neighbouring `rails-hidden` are in `app/globals.css`. The
   * nav bar deliberately stays: it is the way back out.
   */
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement;
    const { body } = document;
    const previousRoot = root.style.overflow;
    const previousBody = body.style.overflow;
    const previousPad = body.style.paddingRight;

    /*
     * Locking the scroll takes the scrollbar with it, and on a platform that
     * draws a real one that is a few px of window arriving all at once — the nav
     * bar's contents jump sideways at the exact moment everything else is
     * changing. Measured rather than assumed, because it is zero on every
     * overlay-scrollbar platform and this must not indent the page there.
     */
    const gutter = window.innerWidth - root.clientWidth;

    window.scrollTo({ top: 0, behavior: "instant" });
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    root.classList.add("band-expanded");

    return () => {
      root.style.overflow = previousRoot;
      body.style.overflow = previousBody;
      body.style.paddingRight = previousPad;
      root.classList.remove("band-expanded");
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  return (
    <main
      className={cn(
        styles.page,
        !hasSheet && styles.pageFull,
        expanded && styles.pageExpanded,
      )}
    >
      {/* The shutter's panel: this is what rolls up and back down. */}
      <motion.header
        className={styles.headerSection}
        ref={headerRef}
        {...shutter?.panelProps}
      >
        {/*
          Stage first, band second — in the DOM as well as on screen.

          The background used to be written first, back when it was a texture
          and its position was set by `position: absolute` regardless of where
          it sat in the markup. It is the page's navigation now, so document
          order is reading order: a screen reader should reach "Work." before it
          reaches the list of projects, not the other way round. The sheet shape
          is unaffected — its background is still absolutely positioned, and
          `.masthead`'s own `z-index` keeps it on top.
        */}
        <div className={styles.stage} ref={stageRef}>
          <div className={styles.masthead} ref={mastheadEl}>
            <h1 className={styles.title} ref={titleEl}>
              {title}
            </h1>
            <p className={styles.intro} ref={introEl}>
              {intro}
            </p>
          </div>

          {banner ? <div className={styles.banner}>{banner}</div> : null}
        </div>

        {background ? (
          <div
            className={cn(
              styles.background,
              !hasSheet && styles.backgroundFull,
              expanded && styles.backgroundExpanded,
            )}
            aria-hidden={backgroundInteractive ? undefined : "true"}
          >
            {background}

            {/*
              After the slot in the DOM, not before, so it paints over whatever
              is in there without needing to win a `z-index` argument with it.
            */}
            {canExpand ? (
              <button
                type="button"
                className={styles.expandButton}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? "Exit full screen"
                    : `View ${title.replace(/\.$/, "")} full screen`
                }
              >
                {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            ) : null}
          </div>
        ) : null}
      </motion.header>

      {/*
        The sheet leaves downward, out of the bottom of the frame, while the
        header closes upward — the screen clears from the middle outward rather
        than everything travelling the same way.
      */}
      {hasSheet ? (
        <motion.div className={styles.sheet} {...shutter?.sheetProps}>
          {children}
        </motion.div>
      ) : null}

      {/*
        The corner note goes with the rest of the floating chrome while the band
        is full screen — it is fixed at z-45 and would otherwise be the one thing
        left hovering over an otherwise empty screen.
      */}
      <AnimatePresence>
        {line && !expanded && !atFooter ? (
          <motion.aside
            className={styles.note}
            /*
              A hover line paraphrases something the visitor is already pointing
              at, and that element announces itself — see `PixelSpeech`. The
              standing recommendation is real content and stays readable.
            */
            aria-hidden={saying ? "true" : undefined}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

/**
 * Stands in for the content when a section has nothing published. One sentence
 * across all the indexes, so they read the same when they are empty as when
 * they are full.
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
