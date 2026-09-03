"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { SAY_ATTRIBUTE } from "@/components/pixel";
import { useShutterLink } from "@/components/chrome/Shutter";
import PeekCard, { type PeekSubject } from "@/components/index/PeekCard";
import type {
  BoardFacet,
  BoardFacetType,
  BoardProject,
  WorkBoardData,
} from "@/lib/work/board";
import styles from "./WorkBoard.module.css";

/**
 * `/projects` — the work, and the requirements it answers.
 *
 * This replaced the knowledge graph as the page's navigation. The graph's one
 * genuinely valuable behaviour was that pointing at a skill, a tool or a domain
 * told you which projects demonstrate it — a recruiter arrives with a
 * requirement, not a curiosity, and that is the question they came to ask. What
 * the graph could not do was be looked at: it needed a four-row legend to
 * explain its own encoding, and its tag nodes were `tabIndex={-1}` (see the
 * comment at `WorkGraph.tsx:1019` — a reasoned trade, since 26 tags scattered
 * across a canvas in no order would have meant tabbing past all of them to
 * reach a project). So the one thing worth keeping had no keyboard or touch
 * path at all.
 *
 * Columns fix exactly that. A facet in a labelled group has an order, so it can
 * be arrow-navigated and skipped in a single Tab — which is why the pointing
 * mechanism here is a real button in a real toolbar rather than a hover target.
 * Hover is an enhancement layered on top for pointer devices; it is not how
 * this works. See `FacetColumn`.
 *
 * The graph is not gone — it returns in the expanded view, where being a
 * second, relational read of the whole body of work is a job it is actually
 * good at. See `app/projects/page.tsx`.
 *
 * **One window, and it never grows downward.** This is the owner's rule for
 * the page, not a layout preference: the masthead and the band are exactly one
 * viewport at arrival, every project is in the band at once, and if the pool
 * ever outgrows the width the rail scrolls *sideways*. A version of this board
 * that let the page scroll — a grid as tall as the work — was built and
 * rejected. So the tiles are packed into two rows that take whatever height
 * the facet columns leave — the three lead case studies across the top, the
 * rest of the pool evenly across the bottom — and the rail only becomes a
 * scroller (chevrons, edge fades) once the tiles' minimum widths add up to
 * more than the window. See `splitRows` and the module CSS.
 *
 * **Nothing is ever removed from the rail.** A facet dims what does not match
 * rather than filtering it out. Removing tiles would reflow the rows under the
 * pointer and move the very tile the reader was about to compare against; and
 * the honest answer to "do you do X" is the whole set with the matches lit, not
 * a shorter set — the visitor can still see what else is there, which is the
 * entire argument for Work and the Archive being one pool.
 *
 * Every count is read off the data (`lib/work/board.ts`): there are nine
 * projects today and the layout has no opinion about that.
 */

/** The three columns, in the order they are read — which is also their order
 *  of importance: what the work is about, then what made it, then the named
 *  competencies. The CSS keys a matching visual hierarchy off `data-type`.
 *  `Tools` is the owner's label; it replaced `Software` (chosen for being the
 *  job-description word) because three one-word headings read as one row and
 *  "Software" was the one that didn't. The heading is painted as "Sort by
 *  <label>" — see `FacetColumn`, where it is also the reveal. */
const COLUMNS: Array<{ type: BoardFacetType; label: string }> = [
  { type: "domain", label: "Domain" },
  { type: "tool", label: "Tools" },
  { type: "skill", label: "Skills" },
];

/** Every cloud, since pressing any one heading opens all three. Written off
 *  `COLUMNS` so a fourth column would be included by existing. */
const CLOUD_IDS = COLUMNS.map((column) => `facet-cloud-${column.type}`).join(" ");

/**
 * What a chip costs beyond its label, in label-characters — the padding, the
 * icon on a tool, the gap, the count. A crude unit on purpose: it only has to
 * rank three columns against each other. See `columnTracks`.
 */
const CHIP_CHROME = 7;

/**
 * The three column widths, as a `grid-template-columns` value.
 *
 * Not equal thirds. The sets are different sizes — eight domains, six tools,
 * twelve skills today — and equal columns meant the longest of them wrapped to
 * twice the depth of the shortest while the shortest sat on width it had no
 * use for. Weighted, all three bottom out at about the same line, which is
 * what makes the revealed block read as one shape rather than three.
 *
 * The weight is a column's *ink*, not its chip count: "Information
 * Architecture" and "Figma" are one chip each and four times the width apart,
 * so counting chips alone would still leave the tools column oversized. Read
 * off the data like every other number on this board — a new skill widens its
 * own column by existing.
 *
 * The floor is what stops a small set being squeezed to less than its own
 * heading, which is the one thing the weighting could otherwise do: "Sort by
 * Domain" plus its count and chevron is about ten characters of mono at this
 * size. Handed to the stylesheet as a custom property rather than set on
 * `grid-template-columns` directly, so the phone breakpoint — which stacks the
 * three into one — can still override the property that reads it.
 */
function columnTracks(facetsByType: Map<BoardFacetType, BoardFacet[]>): string {
  return COLUMNS.map((column) => {
    const ink = (facetsByType.get(column.type) ?? []).reduce(
      (sum, facet) => sum + facet.label.length + CHIP_CHROME,
      0
    );
    return `minmax(10.5rem, ${Math.max(ink, 1)}fr)`;
  }).join(" ");
}

/**
 * The frame a tile shows at rest — the same value, and the same reasoning, as
 * the graph's cards. A loop's first frame is often a fade from black, which is
 * the one frame least worth showing; a fraction of a second in, the composition
 * has arrived.
 */
const STILL_TIME = 0.35;

/** How much of the rail a chevron press travels. Short of a full page so a
 *  column stays on screen across the jump and the move reads as continuous. */
const PAGE_FRACTION = 0.8;

/**
 * The top row, in this order — the three built-out case studies.
 *
 * Authored rather than derived. The rows used to be packed by weight
 * (`balanceRows`, a greedy pass over the emphasis tiers) so that nothing here
 * was per-project; what that bought in tidiness it lost at the top of the
 * band, where the first thing a visitor reads was whichever three or four
 * tiles happened to balance. These three are the work the page is for, they
 * are named in the order they should be read, and the rest of the pool sits
 * under them.
 *
 * A slug that isn't in the pool is simply skipped, so this list can name work
 * that hasn't shipped yet without leaving a hole in the row.
 */
const LEAD_SLUGS = ["traces", "unflattening", "loco"] as const;

/**
 * Two rows: the lead three, then everything else.
 *
 * Widths are uniform within a row — every tile is `flex: 1`, so three tiles
 * stretch across the top and the remainder divide the bottom evenly. Emphasis
 * still ranks a tile's *type* (its title size, its image `sizes`); it no
 * longer decides its width, which is what the lead row is now for.
 */
function splitRows(projects: BoardProject[]): [BoardProject[], BoardProject[]] {
  const lead: BoardProject[] = [];
  for (const slug of LEAD_SLUGS) {
    const project = projects.find((candidate) => candidate.slug === slug);
    if (project) lead.push(project);
  }
  const rest = projects.filter((project) => !lead.includes(project));
  return [lead, rest];
}

/**
 * Once per page load, not once per mount.
 *
 * The board unmounts whenever the band expands to the graph and remounts when
 * it collapses back, and replaying the entrance on every collapse would turn
 * an arrival into a tic. A module-scope flag survives the remount; a fresh
 * load (the actual arrival, and the only moment the entrance is *for*) resets
 * it.
 */
let entrancePlayed = false;

/**
 * A tile's cover loop — always mounted, paused unless the tile is hovered.
 *
 * Lifted wholesale from `WorkGraph`'s `CardVideo`, including the reason: a
 * video that mounts on hover leaves the tile a blank plate until pointed at,
 * which reads as a missing image rather than as restraint. A paused video *is*
 * the still, and it is the right still by construction — no separate poster to
 * export and keep in step.
 */
function TileVideo({ src, playing }: { src: string; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (playing) {
      // A rejected autoplay is not worth surfacing — the still stays, which is
      // a perfectly good outcome.
      void el.play().catch(() => {});
      return;
    }

    el.pause();
    try {
      el.currentTime = STILL_TIME;
    } catch {
      // Seeking before metadata arrives throws; the `#t=` fragment already
      // asked for the same frame, so there is nothing to do.
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      className={styles.media}
      src={`${src}#t=${STILL_TIME}`}
      preload="metadata"
      muted
      loop
      playsInline
      aria-hidden="true"
    />
  );
}

/**
 * One tile's clickable shell — three modes, three elements.
 *
 * The element changes with the mode rather than being faked, because these mean
 * different things to a browser and to a screen reader: a case study is a
 * `Link` (prefetched, middle-clickable, with a destination in the status bar),
 * an external document is a plain anchor that says where it goes, and a peek is
 * a `button`, because nothing is navigated to and announcing it as a link would
 * be a lie. This is `TileGrid`'s rule, kept.
 */
function TileShell({
  project,
  className,
  onPeek,
  children,
  ...rest
}: {
  project: BoardProject;
  className: string;
  onPeek: (project: BoardProject) => void;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  /* Closes the index header before the route changes. */
  const onShutterClick = useShutterLink(project.href ?? "");

  if (project.mode === "peek" || !project.href) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onPeek(project)}
        aria-haspopup="dialog"
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (project.mode === "link") {
    return (
      <a
        href={project.href}
        className={className}
        target="_blank"
        rel="noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={project.href} className={className} onClick={onShutterClick} {...rest}>
      {children}
    </Link>
  );
}

/**
 * One column of facets, as a toolbar.
 *
 * **Roving tabindex.** Exactly one button in the column is in the tab order at
 * a time and the arrow keys move between them; Home and End jump to the ends.
 * This is the whole reason the redesign can afford to show every facet rather
 * than a curated handful — twelve skills cost a keyboard user one Tab, not
 * twelve, and the column stays honest about how much there is as the work
 * grows.
 *
 * **Focus previews, the same as hover.** Moving along the column with the
 * arrow keys lights the matching tiles exactly as pointing at it does, so the
 * mechanism the page is built around has a keyboard path rather than a
 * keyboard-shaped hole. That was the graph's actual failure.
 *
 * The chips wrap into a cloud rather than a line, so "next" and "previous" are
 * reading order rather than a compass direction — all four arrows move
 * linearly, which is what a wrapped toolbar is supposed to do.
 *
 * **Pixel does the explaining.** The board used to carry a line of its own
 * ("Point at what you need…", then "Domain — 3 of 9 projects") and it cost a
 * line of the band on a page that is not allowed to grow. The same words now
 * ride on `data-pixel-say`: the toolbar carries the instruction, each chip
 * carries its own count, and `IndexShell` already speaks whichever the pointer
 * is resting on in the corner note. The innermost attribute wins, so a chip
 * says its count and the gaps between chips say the instruction.
 *
 * **Shut by default, and the heading is the reveal.** At rest a column is its
 * heading and nothing else — "Sort by Skills", the size of the set, and a
 * chevron; the chips are laid out but clipped to no height at all. The state
 * is the *board's*, not the column's, so all three open and shut together:
 * three clouds at three different heights would put the three headings on a
 * shared line and their chips on none, which is the one thing the
 * labelled-columns reading depends on.
 *
 * The point is the rail underneath. This page may not grow downward, so the
 * facets and the work are in direct competition for one window and every line
 * of chips is a line of thumbnail. Shut, the whole index costs one line; the
 * chips are a question the visitor asks rather than a wall the page opens
 * with, and the count on each heading is what tells them there is something to
 * ask for.
 *
 * A shut cloud is `inert`, so its chips are out of the tab order and out of
 * the accessibility tree — clipped-but-focusable is the classic version of
 * this control, and it sends a keyboard user to a chip nobody can see. Its
 * open height is **measured**, because chips are content-width and wrap where
 * they wrap: a `max-height` eased toward a generous guess would spend most of
 * its duration crossing empty space.
 */
function FacetColumn({
  type,
  label,
  facets,
  total,
  activeId,
  selectedId,
  expanded,
  onPreview,
  onSelect,
  onToggle,
}: {
  type: BoardFacetType;
  label: string;
  facets: BoardFacet[];
  /** How many projects there are in all — the denominator Pixel quotes. */
  total: number;
  activeId: string | null;
  selectedId: string | null;
  /** Shared across all three columns — see the note above. */
  expanded: boolean;
  onPreview: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggle: () => void;
}) {
  /*
   * Which button holds the column's tab stop. Kept as an index rather than an
   * id so that a column whose facets change length still has a valid stop, and
   * seeded to 0 so a column that has never been touched is entered at its
   * most-used facet — the columns are ranked by count, so that is the useful
   * default.
   */
  const [focusIndex, setFocusIndex] = useState(0);
  const cloudRef = useRef<HTMLDivElement>(null);

  /*
   * How tall the cloud is with nothing clipped — the height the reveal opens
   * to. `null` until it has been measured, which is the one frame the cloud is
   * left to the stylesheet's `max-height: 0`.
   */
  const [openHeight, setOpenHeight] = useState<number | null>(null);

  /*
   * Rects rather than `scrollHeight`, which disagrees with itself across
   * browsers about whether a clipped box's bottom padding is part of it — and
   * that padding is real here, it is the slack the focus rings live in (see
   * `.cloud`). Clipping doesn't move a chip either way: `overflow: hidden`
   * paints less, it doesn't lay out less, so the open height is measurable
   * while the cloud is shut.
   *
   * `useLayoutEffect`, so a reveal that is already open across a resize
   * re-measures before the paint rather than showing a stale height for a
   * frame.
   */
  useLayoutEffect(() => {
    const el = cloudRef.current;
    if (!el) return;

    const measure = () => {
      const slack = Number.parseFloat(getComputedStyle(el).paddingBottom) || 0;
      const top = el.getBoundingClientRect().top;
      const bottoms = Array.from(
        el.querySelectorAll<HTMLButtonElement>("[data-facet]")
      ).map((button) => button.getBoundingClientRect().bottom - top);
      if (bottoms.length === 0) return;

      const height = Math.ceil(Math.max(...bottoms) + slack);
      setOpenHeight((current) => (current === height ? current : height));
    };

    measure();
    /* The cloud's width is the column's, so this fires on every reflow that
       could change where the chips wrap. */
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [facets]);

  const moveTo = useCallback((next: number) => {
    setFocusIndex(next);
    const buttons = cloudRef.current?.querySelectorAll<HTMLButtonElement>(
      "[data-facet]"
    );
    buttons?.[next]?.focus();
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const last = facets.length - 1;
    const current = Math.min(focusIndex, last);

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(current === last ? 0 : current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(current === 0 ? last : current - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(last);
        break;
      default:
        break;
    }
  }

  if (facets.length === 0) return null;

  const heading = `Sort by ${label}`;

  return (
    <div className={styles.column} data-type={type}>
      <button
        type="button"
        className={styles.columnLabel}
        id={`facet-column-${type}`}
        onClick={onToggle}
        aria-expanded={expanded}
        /* All three, because pressing any one of them opens all three. */
        aria-controls={CLOUD_IDS}
        {...{
          [SAY_ATTRIBUTE]: `${facets.length} ${label.toLowerCase()} across the work. Click to open all three lists.`,
        }}
      >
        <span className={styles.columnHeading}>{heading}</span>
        {/* How big the set is. Shut, this is the only thing saying there is
            anything behind the heading at all; open, it stops the chevron
            walking sideways as the count appears and disappears. */}
        <span className={styles.columnMore}>{facets.length}</span>
        <ChevronDown
          className={styles.columnChevron}
          size={13}
          aria-hidden="true"
        />
      </button>

      <div
        className={styles.cloud}
        id={`facet-cloud-${type}`}
        ref={cloudRef}
        role="toolbar"
        aria-orientation="horizontal"
        aria-labelledby={`facet-column-${type}`}
        data-open={expanded || undefined}
        /* Shut is the stylesheet's `0`; open is the measured height, or — for
           the frame before the measurement lands — nothing, which lets the
           cloud size to its own content rather than flashing shut. */
        inert={!expanded}
        style={
          expanded && openHeight !== null
            ? { maxHeight: openHeight }
            : expanded
              ? { maxHeight: "none" }
              : undefined
        }
        onKeyDown={onKeyDown}
        {...{
          [SAY_ATTRIBUTE]:
            "Point at a domain, tool or skill — the work that shows it lights up.",
        }}
      >
        {facets.map((facet, index) => (
          <button
            key={facet.id}
            type="button"
            data-facet={facet.id}
            className={styles.facet}
            /* `aria-pressed` and not `aria-selected`: this is a toggle, and the
               column is a toolbar rather than a listbox. */
            aria-pressed={selectedId === facet.id}
            data-active={activeId === facet.id || undefined}
            tabIndex={index === Math.min(focusIndex, facets.length - 1) ? 0 : -1}
            {...{
              [SAY_ATTRIBUTE]: `${facet.label}: ${facet.count} of ${total} projects. Click to keep it lit.`,
            }}
            onFocus={() => {
              setFocusIndex(index);
              onPreview(facet.id);
            }}
            onBlur={() => onPreview(null)}
            onPointerEnter={() => onPreview(facet.id)}
            onPointerLeave={() => onPreview(null)}
            onClick={() => onSelect(facet.id)}
          >
            {facet.icon ? (
              /* The mark is the SVG used as a mask over `currentColor` — one
                 asset, every palette, the same trick as the Traces chain
                 arrows — so it follows the chip through hover, selected and
                 dark mode with no second file. It sits beside the name rather
                 than replacing it: a logo alone asks the visitor to know the
                 mark, and a chip that says "do you know our stack" cannot
                 afford to be a quiz. */
              <span
                className={styles.facetLogo}
                style={{
                  WebkitMaskImage: `url(${facet.icon})`,
                  maskImage: `url(${facet.icon})`,
                }}
                aria-hidden="true"
              />
            ) : null}
            <span className={styles.facetLabel}>{facet.label}</span>
            <span className={styles.facetCount} aria-hidden="true">
              {facet.count}
            </span>
            {/* The count is decorative above — repeated here as real text so it
                is announced as a quantity rather than as a bare numeral run
                onto the end of the label. */}
            <span className={styles.srOnly}>{`, ${facet.count} project${
              facet.count === 1 ? "" : "s"
            }`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WorkBoard({ board }: { board: WorkBoardData }) {
  const reducedMotion = usePrefersReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);

  /*
   * The arrival. One authored moment — the three columns, then the work, each
   * rising a few pixels into place with a crisp tail — and then the board is
   * inert markup again:
   *
   * - `clearProps` on every tween, because the resting styles belong to the
   *   stylesheet: a leftover inline `opacity: 1` would silently outrank
   *   `.tile[data-dim]`'s fade and break the facet mechanism the page is
   *   built around.
   * - `data-entering` suspends `.tile`'s own CSS transitions for the duration
   *   (see the module CSS): a transition chasing a tween that writes transform
   *   every frame smears the motion.
   * - `matchMedia` read directly rather than through `usePrefersReducedMotion`,
   *   whose state is still syncing on the first effect pass — the one pass
   *   this runs in.
   * - The tiles stagger in DOM order, which is the top row then the bottom,
   *   each in emphasis order — so the sweep runs left to right along the top
   *   and again along the bottom, the way the rows are read.
   */
  useEffect(() => {
    if (entrancePlayed) return;
    entrancePlayed = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = boardRef.current;
    if (!el) return;
    el.setAttribute("data-entering", "");
    const clear = () => el.removeAttribute("data-entering");

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" }, onComplete: clear })
        .from(`.${styles.column}`, {
          y: 12,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          clearProps: "opacity,transform",
        })
        .from(
          `.${styles.tile}`,
          {
            y: 22,
            opacity: 0,
            duration: 0.65,
            ease: "expo.out",
            stagger: 0.05,
            clearProps: "opacity,transform",
          },
          "-=0.4"
        );
    }, el);

    return () => {
      clear();
      ctx.revert();
    };
  }, []);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [peeking, setPeeking] = useState<PeekSubject | null>(null);

  /*
   * A preview outranks the selection, and reverts the moment the pointer or
   * focus leaves. Same rule the graph used for `hoveredId ?? selectedId`: a
   * selection is a state you left behind, a preview is what you are asking
   * about right now.
   */
  const activeId = previewId ?? selectedId;
  const activeFacet = useMemo(
    () => board.facets.find((facet) => facet.id === activeId) ?? null,
    [board.facets, activeId]
  );

  const matched = useMemo(() => {
    if (!activeId) return null;
    return new Set(board.matches[activeId] ?? []);
  }, [activeId, board.matches]);

  const facetsByType = useMemo(() => {
    const groups = new Map<BoardFacetType, BoardFacet[]>();
    for (const facet of board.facets) {
      const list = groups.get(facet.type);
      if (list) list.push(facet);
      else groups.set(facet.type, [facet]);
    }
    return groups;
  }, [board.facets]);

  const rows = useMemo(() => splitRows(board.projects), [board.projects]);

  /*
   * The reveal, shared by all three columns — see `FacetColumn`. Shut on
   * arrival: the work is what the page is for, and three headings over a full
   * band of it is the arrangement that says so. The chips are the answer to a
   * question, and the question has to be asked first.
   */
  const [facetsOpen, setFacetsOpen] = useState(false);
  const toggleFacets = useCallback(() => setFacetsOpen((open) => !open), []);

  const openPeek = useCallback((project: BoardProject) => {
    setPeeking({
      slug: project.slug,
      cover: project.cover,
      coverAlt: project.coverAlt,
      place: project.place,
      term: project.term,
      peek: project.peek,
    });
  }, []);

  /* ------------------------------------------------------------------ rail */

  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  /*
   * Which way the rail can still travel.
   *
   * Drives both the chevrons' disabled state and the edge fades, so a rail that
   * fits its band entirely shows neither — the affordance appears only when
   * there is something off-screen to go and get, which today, with nine
   * projects at a desktop width, is never. `scrollWidth` is compared with a
   * pixel of slack because sub-pixel layout leaves a fractional remainder at
   * the far end on most zoom levels, which would otherwise leave the forward
   * chevron live at a rail that has nowhere left to go.
   */
  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      start: el.scrollLeft > 1,
      end: max > 1 && el.scrollLeft < max - 1,
    });
  }, []);

  /*
   * Re-measured when the rail resizes *and* when either row does. The rows
   * are what actually overflow — they are as wide as their tiles' floors add
   * up to, or the rail, whichever is more (see `.rail`'s column track) — and a
   * row can change width while the rail does not: a tile growing under the
   * pointer at a width where its neighbours are already at their floors pushes
   * the row out by the difference. Watching the rail alone would leave the
   * chevron a hover behind.
   */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const row of el.children) observer.observe(row);
    return () => observer.disconnect();
  }, [measure]);

  /*
   * No wheel handling, deliberately.
   *
   * Translating a vertical wheel into `scrollLeft` is the usual trick for a
   * horizontal rail and it is wrong here: the band is one screen with the site
   * footer directly below it, so trapping the wheel would leave the visitor
   * unable to scroll past the work. A trackpad's horizontal gesture and a
   * touch swipe both already work natively, and the chevrons cover a mouse.
   */
  const page = useCallback(
    (direction: 1 | -1) => {
      const el = railRef.current;
      if (!el) return;
      el.scrollBy({
        left: direction * el.clientWidth * PAGE_FRACTION,
        behavior: reducedMotion ? "instant" : "smooth",
      });
    },
    [reducedMotion]
  );

  /*
   * Pointer and keyboard both light a tile; the pointer wins while it is
   * there. The lit tile grows, shows its sentence and plays its loop. The
   * growth is the stylesheet's — `flex-grow` on `[data-lit]`, gated there on
   * `(hover: hover)` and reduced motion — so this only has to say *which*
   * tile, never how much.
   */
  const litSlug = hoveredSlug ?? focusedSlug;

  const enterTile = useCallback((event: ReactPointerEvent, slug: string) => {
    /* A tap reports as a pointer too; hover growth is for one that can leave. */
    if (event.pointerType === "touch") return;
    setHoveredSlug(slug);
  }, []);

  /*
   * Which covers to fetch eagerly: the first few of `board.projects`, which is
   * emphasis order — so it is the largest tiles, whichever row they landed on,
   * that arrive with the page rather than the first four in DOM order.
   */
  const eager = new Set(board.projects.slice(0, 4).map((project) => project.slug));

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.facets}>
        <div
          className={styles.columns}
          style={
            { "--column-tracks": columnTracks(facetsByType) } as CSSProperties
          }
        >
          {COLUMNS.map((column) => (
            <FacetColumn
              key={column.type}
              type={column.type}
              label={column.label}
              facets={facetsByType.get(column.type) ?? []}
              total={board.projects.length}
              activeId={activeId}
              selectedId={selectedId}
              expanded={facetsOpen}
              onPreview={setPreviewId}
              onSelect={(id) =>
                setSelectedId((current) => (current === id ? null : id))
              }
              onToggle={toggleFacets}
            />
          ))}
        </div>

        {/*
          Announced rather than drawn. Pixel says the same thing in the corner
          note, but that is a hover — a screen reader would not read it on a
          press, and this is several nodes away from the button that changed
          it.
        */}
        <p className={styles.srOnly} aria-live="polite">
          {activeFacet
            ? `${activeFacet.label}: ${activeFacet.count} of ${board.projects.length} projects`
            : "No filter — showing all projects"}
        </p>
      </div>

      <div
        className={styles.railWrap}
        data-fade-start={edges.start || undefined}
        data-fade-end={edges.end || undefined}
      >
        <button
          type="button"
          className={cn(styles.chevron, styles.chevronStart)}
          onClick={() => page(-1)}
          disabled={!edges.start}
          aria-label="Scroll the work back"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className={styles.rail} ref={railRef} onScroll={measure}>
          {rows.map((row, rowIndex) => (
            <div className={styles.row} key={rowIndex}>
              {row.map((project) => {
                const dimmed = matched ? !matched.has(project.slug) : false;

                return (
                  <TileShell
                    key={project.slug}
                    project={project}
                    className={styles.tile}
                    onPeek={openPeek}
                    data-slug={project.slug}
                    data-emphasis={project.emphasis}
                    data-dim={dimmed || undefined}
                    data-lit={litSlug === project.slug || undefined}
                    data-ink={project.coverInk}
                    onPointerEnter={(event) => enterTile(event, project.slug)}
                    onPointerLeave={() => setHoveredSlug(null)}
                    onFocus={() => setFocusedSlug(project.slug)}
                    onBlur={() => setFocusedSlug(null)}
                  >
                    <span className={styles.frame}>
                      {project.cover ? (
                        <Image
                          src={project.cover}
                          alt={project.coverAlt ?? ""}
                          fill
                          className={styles.media}
                          /* An even share of the row, rounded up to cover the
                             hover growth; on a phone the rail is one row of
                             taller tiles that scrolls, so every tile is
                             drawn wider than its desktop share. */
                          sizes={`(max-width: 48rem) ${Math.min(
                            80,
                            Math.ceil(160 / row.length)
                          )}vw, ${Math.ceil(160 / row.length)}vw`}
                          priority={eager.has(project.slug)}
                        />
                      ) : (
                        <span className={styles.placeholder} aria-hidden="true" />
                      )}

                      {/* After the cover, not before it: both carry `.media`'s
                          absolute fill, so paint order is DOM order, and the
                          loop has to sit over the cover exactly as the graph's
                          `CardVideo` foreignObject does — under it, it plays
                          to nobody. */}
                      {project.coverVideo ? (
                        <TileVideo
                          src={project.coverVideo}
                          playing={litSlug === project.slug && !reducedMotion}
                        />
                      ) : null}

                      {project.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- decorative mark, sized as a % of the tile rather than by intrinsic dimensions
                        <img
                          src={project.logo}
                          alt=""
                          aria-hidden="true"
                          className={styles.logoMark}
                          style={{
                            width: `${project.logoWidth ?? 20}%`,
                            filter: project.logoInvert ? "invert(1)" : undefined,
                          }}
                        />
                      ) : null}

                      <span className={styles.scrim} aria-hidden="true" />

                      {/* The name at the top, the facts along the bottom edge,
                          and nothing at all until the tile is pointed at —
                          see `.caption` in the module CSS. */}
                      <span className={styles.caption}>
                        <span className={styles.head}>
                          <span className={styles.title}>{project.title}</span>
                          <span className={styles.blurb}>{project.blurb}</span>
                        </span>
                        <span className={styles.footline}>
                          <span className={styles.meta}>{project.place}</span>
                          <span className={styles.meta}>{project.term}</span>
                        </span>
                      </span>
                    </span>
                  </TileShell>
                );
              })}
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cn(styles.chevron, styles.chevronEnd)}
          onClick={() => page(1)}
          disabled={!edges.end}
          aria-label="Scroll the work forward"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <PeekCard subject={peeking} onClose={() => setPeeking(null)} />
    </div>
  );
}
