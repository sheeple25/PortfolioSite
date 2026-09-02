"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";
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
 * Rows fix exactly that. A facet in a labelled group has an order, so it can be
 * arrow-navigated and skipped in a single Tab — which is why the pointing
 * mechanism here is a real button in a real toolbar rather than a hover target.
 * Hover is an enhancement layered on top for pointer devices; it is not how
 * this works. See `FacetRow`.
 *
 * The graph is not gone — it returns in the expanded view, where being a
 * second, relational read of the whole body of work is a job it is actually
 * good at. See `app/projects/page.tsx`.
 *
 * **Nothing is ever removed from the rail.** A facet dims what does not match
 * rather than filtering it out, for two reasons. The rail scrolls horizontally,
 * so removing tiles would reflow the strip under the pointer and throw away the
 * reader's scroll position mid-comparison. And the honest answer to "do you do
 * X" is the whole set with the matches lit, not a shorter set — the visitor can
 * still see what else is there, which is the entire argument for Work and the
 * Archive being one pool.
 *
 * Sizing is a function of the band's height, and every count is read off the
 * data (`lib/work/board.ts`). There are nine projects today and the layout has
 * no opinion about that: the rail packs into two rows however many there are,
 * and the chevrons and edge fades appear only once there is something past the
 * edge to go and get.
 */

/** The three rows, in the order they are read. `Software` rather than `Tools`
 *  because that is the word on a job description. */
const ROWS: Array<{ type: BoardFacetType; label: string }> = [
  { type: "domain", label: "Domain" },
  { type: "skill", label: "Skills" },
  { type: "tool", label: "Software" },
];

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
 * One row of facets, as a toolbar.
 *
 * **Roving tabindex.** Exactly one button in the row is in the tab order at a
 * time and the arrow keys move between them; Home and End jump to the ends.
 * This is the whole reason the redesign can afford to show every facet rather
 * than a curated handful — twelve skills cost a keyboard user one Tab, not
 * twelve, and the row stays honest about how much there is as the work grows.
 *
 * **Focus previews, the same as hover.** Moving along the row with the arrow
 * keys lights the matching tiles exactly as pointing at it does, so the
 * mechanism the page is built around has a keyboard path rather than a
 * keyboard-shaped hole. That was the graph's actual failure.
 */
function FacetRow({
  label,
  facets,
  activeId,
  selectedId,
  onPreview,
  onSelect,
}: {
  label: string;
  facets: BoardFacet[];
  activeId: string | null;
  selectedId: string | null;
  onPreview: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  /*
   * Which button holds the row's tab stop. Kept as an index rather than an id
   * so that a row whose facets change length still has a valid stop, and seeded
   * to 0 so a row that has never been touched is entered at its most-used
   * facet — the rows are ranked by count, so that is the useful default.
   */
  const [focusIndex, setFocusIndex] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((next: number) => {
    setFocusIndex(next);
    const buttons = rowRef.current?.querySelectorAll<HTMLButtonElement>(
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

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel} id={`facet-row-${label}`}>
        {label}
      </span>

      <div
        className={styles.rowFacets}
        ref={rowRef}
        role="toolbar"
        aria-orientation="horizontal"
        aria-labelledby={`facet-row-${label}`}
        onKeyDown={onKeyDown}
      >
        {facets.map((facet, index) => (
          <button
            key={facet.id}
            type="button"
            data-facet={facet.id}
            className={styles.facet}
            /* `aria-pressed` and not `aria-selected`: this is a toggle, and the
               row is a toolbar rather than a listbox. */
            aria-pressed={selectedId === facet.id}
            data-active={activeId === facet.id || undefined}
            tabIndex={index === Math.min(focusIndex, facets.length - 1) ? 0 : -1}
            onFocus={() => {
              setFocusIndex(index);
              onPreview(facet.id);
            }}
            onBlur={() => onPreview(null)}
            onPointerEnter={() => onPreview(facet.id)}
            onPointerLeave={() => onPreview(null)}
            onClick={() => onSelect(facet.id)}
          >
            {facet.label}
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
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
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
  const [edges, setEdges] = useState({ start: true, end: true });

  /*
   * Which way the rail can still travel.
   *
   * Drives both the chevrons' disabled state and the edge fades, so a rail that
   * fits its band entirely shows neither — the affordance appears only when
   * there is something off-screen to go and get. `scrollWidth` is compared with
   * a pixel of slack because sub-pixel layout leaves a fractional remainder at
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

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
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
  const page = useCallback((direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * PAGE_FRACTION,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }, [reducedMotion]);

  return (
    <div className={styles.board}>
      <div className={styles.facets}>
        {/*
          The zero state is an instruction and every state after it is an
          answer. "Pick what you need" is only true until something is picked;
          from then on the useful line is how much of the work backs it up,
          which is the number the visitor came for.
        */}
        <p className={styles.lede}>
          {activeFacet ? (
            <>
              <strong className={styles.ledeStrong}>{activeFacet.label}</strong>
              {" — "}
              {activeFacet.count} of {board.projects.length} projects
            </>
          ) : (
            <>Point at what you need. The work that shows it lights up.</>
          )}
        </p>

        {ROWS.map((row) => (
          <FacetRow
            key={row.type}
            label={row.label}
            facets={facetsByType.get(row.type) ?? []}
            activeId={activeId}
            selectedId={selectedId}
            onPreview={setPreviewId}
            onSelect={(id) =>
              setSelectedId((current) => (current === id ? null : id))
            }
          />
        ))}

        {/*
          Announced rather than drawn. The lede above says the same thing, but
          it is several nodes away from the button that changed it and a screen
          reader would not read it on a press.
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
          {board.projects.map((project, index) => {
            const dimmed = matched ? !matched.has(project.slug) : false;

            return (
              <TileShell
                key={project.slug}
                project={project}
                className={styles.tile}
                onPeek={openPeek}
                data-featured={project.featured || undefined}
                data-dim={dimmed || undefined}
                data-ink={project.coverInk}
                onPointerEnter={() => setHoveredSlug(project.slug)}
                onPointerLeave={() => setHoveredSlug(null)}
              >
                <span className={styles.frame}>
                  {project.coverVideo ? (
                    <TileVideo
                      src={project.coverVideo}
                      playing={hoveredSlug === project.slug && !reducedMotion}
                    />
                  ) : null}

                  {project.cover ? (
                    <Image
                      src={project.cover}
                      alt={project.coverAlt ?? ""}
                      fill
                      className={styles.media}
                      sizes="(max-width: 40rem) 60vw, 24rem"
                      priority={index < 4}
                    />
                  ) : (
                    <span className={styles.placeholder} aria-hidden="true" />
                  )}

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

                  <span className={styles.caption}>
                    <span className={styles.title}>{project.title}</span>
                    <span className={styles.meta}>
                      {project.place ? `${project.place} · ` : ""}
                      {project.term}
                    </span>
                    <span className={styles.blurb}>{project.blurb}</span>
                  </span>
                </span>
              </TileShell>
            );
          })}
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
