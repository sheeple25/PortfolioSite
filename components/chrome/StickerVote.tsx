"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, type PanInfo } from "motion/react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { track } from "@vercel/analytics";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { scallopedCirclePath } from "@/lib/scallopedCirclePath";
import styles from "./StickerVote.module.css";

type VoteType = "up" | "down";

/** Below this, a release reads as mouse wobble during an intended click, not a placement — the badge snaps back and no vote is spent. */
const MIN_DRAG_DISTANCE = 20;

type PlantedVote = {
  type: VoteType;
  /** Page coordinates (not viewport) of the original drop/click — the CSS anchor, never rewritten. */
  x: number;
  y: number;
  /** Cumulative pixel offset from any dragging since — starts at 0,0, grows with each reposition. */
  dx: number;
  dy: number;
};

const VOTE_COPY: Record<VoteType, { label: string; ariaVote: string }> = {
  up: { label: "Good", ariaVote: "good" },
  down: { label: "Bad", ariaVote: "bad" },
};

function storageKey(pathname: string) {
  return `sticker-vote:${pathname}`;
}

function readVote(pathname: string): PlantedVote | null {
  try {
    const raw = sessionStorage.getItem(storageKey(pathname));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.type === "up" || parsed.type === "down") &&
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.dx === "number" &&
      typeof parsed.dy === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    // sessionStorage/JSON can throw in locked-down browser contexts — fail
    // open rather than block the widget.
    return null;
  }
}

function writeVote(pathname: string, vote: PlantedVote) {
  try {
    sessionStorage.setItem(storageKey(pathname), JSON.stringify(vote));
  } catch {
    // The vote still fires via analytics even if the session guard can't persist.
  }
}

const BADGE_VIEWBOX = 100;
const BADGE_PATH = scallopedCirclePath(46, 15, 4.5);

function BadgeFace({ type }: { type: VoteType }) {
  const Icon = type === "up" ? ThumbsUp : ThumbsDown;
  return (
    <>
      <svg viewBox={`0 0 ${BADGE_VIEWBOX} ${BADGE_VIEWBOX}`} className={styles.badgeShape} aria-hidden="true">
        <path d={BADGE_PATH} className={styles.badgeFace} />
      </svg>
      <span className={styles.badgeContent} aria-hidden="true">
        <Icon size={16} strokeWidth={1.75} />
        <span className={styles.badgeLabel}>{VOTE_COPY[type].label}</span>
      </span>
    </>
  );
}

/**
 * One of the two rail badges — a "good" seal and a "bad" seal, both peeking
 * from the left edge (the right edge is Pixel's, see `components/pixel/chat/PixelSidebar.module.css`
 * / `PixelCompanion.module.css`). Two independent interaction paths land on
 * the same `onActivate`:
 *
 * - Drag it anywhere on screen and release — a free `drag`, not the old
 *   constrained up/down gesture.
 * - Click/tap it (no drag) — the same `onActivate`, at a default spot offset
 *   from the badge's resting position. This is the accessibility fix: a
 *   pointer-drag-only control leaves a keyboard user tabbing to it and
 *   pressing Enter/Space (which fires a native `click`) with no way to vote
 *   at all. It doubles as the safer touch-device path — see the rail's CSS
 *   for why an edge-anchored drag risks fighting the OS back-swipe gesture.
 *
 * Position is driven entirely by `animate`'s target, not `dragSnapToOrigin`:
 * a release that *doesn't* clear `MIN_DRAG_DISTANCE` falls through to the
 * resting target (`x:0,y:0`), which Motion animates back to — a deliberate
 * "didn't take" bounce. A release that *does* place a vote instead freezes
 * `frozenOffset` at wherever the drag ended and folds it into the target for
 * `votedByThis`, so the badge just fades out exactly where it was let go —
 * no flight back to the rail, which is what actually breaks the "you picked
 * this up and put it down over there" read.
 */
function RatingBadge({
  type,
  voted,
  votedByThis,
  dragging,
  reducedMotion,
  innerRef,
  onDragStart,
  onDragEnd,
  onActivate,
}: {
  type: VoteType;
  voted: boolean;
  votedByThis: boolean;
  dragging: boolean;
  reducedMotion: boolean;
  innerRef: React.RefObject<HTMLButtonElement | null>;
  onDragStart: () => void;
  onDragEnd: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => boolean;
  onActivate: () => void;
}) {
  const [frozenOffset, setFrozenOffset] = useState({ x: 0, y: 0 });
  const baseRotate = type === "up" ? -9 : 9;

  const handleDragEnd = (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const placed = onDragEnd(event, info);
    if (placed) setFrozenOffset({ x: info.offset.x, y: info.offset.y });
  };

  return (
    <motion.button
      ref={innerRef}
      type="button"
      className={cn(
        styles.badge,
        type === "up" ? styles.badgeUp : styles.badgeDown,
        dragging && styles.badgeDragging
      )}
      drag={voted || reducedMotion ? false : true}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onClick={onActivate}
      disabled={voted}
      // The "voted, but by the other badge" case dims to a quiet "thanks"
      // state via opacity here (not a CSS class) — Motion's inline style
      // always wins over a stylesheet rule for the same property, so a
      // CSS-only opacity would just get silently masked once `animate` also
      // touches this element's opacity for the `votedByThis` case below.
      animate={
        votedByThis
          ? { x: frozenOffset.x, y: frozenOffset.y, opacity: 0 }
          : { x: 0, y: 0, rotate: baseRotate, opacity: voted ? 0.5 : 1 }
      }
      whileHover={voted ? undefined : { scale: 1.14, x: 6 }}
      whileTap={voted ? undefined : { scale: 0.94 }}
      whileDrag={reducedMotion ? undefined : { scale: 1.18, rotate: type === "up" ? 8 : -8 }}
      title={voted ? undefined : "Drag to rate"}
      aria-label={
        voted
          ? "Thanks for rating this page"
          : `Rate this page ${VOTE_COPY[type].ariaVote} — click, or drag the sticker anywhere on the page`
      }
    >
      <BadgeFace type={type} />
    </motion.button>
  );
}

/**
 * The permanent, decorative mark a vote leaves behind — planted at the exact
 * page position it was dropped (or, for a click vote, a default spot clear of
 * the rail), restored there on every remount for the rest of the session, and
 * still draggable afterward to reposition.
 *
 * Rendered as a sibling of the fixed rail rather than inside it: `.rail` is
 * `position: fixed`, which would make it the containing block for an
 * absolutely-positioned child and anchor `top`/`left` to the viewport instead
 * of the page. `.plantedLayer` is a zero-size, unpositioned anchor at the
 * document origin so its child's `top`/`left` (in page px, already including
 * scroll offset at the moment it was placed) land on the actual page
 * coordinate and scroll with the content, like a sticker really left there.
 *
 * `left`/`top` fix the *original* drop point and never change; any dragging
 * since is expressed purely as Motion's own `x`/`y` (`vote.dx`/`vote.dy`),
 * which Motion already tracks cumulatively across repeated drags on its own —
 * a further drag just continues adding to wherever it currently sits, so
 * re-declaring `animate`'s target at the new total is a zero-distance
 * "animation" (the drag already visually left it there), not a jump.
 * Centering on that point uses a CSS margin (`.badgePlanted` in the module),
 * not a transform — `x`/`y` here are genuine pixel drag offsets, and mixing
 * those with a percentage-based centering transform doesn't compose reliably.
 */
function PlantedBadge({
  vote,
  reducedMotion,
  onDelete,
  onMove,
}: {
  vote: PlantedVote;
  reducedMotion: boolean;
  onDelete: () => void;
  onMove: (dx: number, dy: number) => void;
}) {
  return (
    <div className={styles.plantedLayer}>
      <motion.div
        className={cn(styles.badge, styles.badgePlanted, vote.type === "up" ? styles.badgeUp : styles.badgeDown)}
        style={{ left: vote.x, top: vote.y }}
        initial={
          reducedMotion
            ? { x: vote.dx, y: vote.dy }
            : { x: vote.dx, y: vote.dy, scale: 0.4, opacity: 0, rotate: vote.type === "up" ? -14 : 14 }
        }
        animate={{ x: vote.dx, y: vote.dy, scale: 1, opacity: 1, rotate: 0 }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 22 }}
        drag={!reducedMotion}
        dragMomentum={false}
        onDragEnd={(_event, info) => onMove(vote.dx + info.offset.x, vote.dy + info.offset.y)}
        onDoubleClick={onDelete}
        title="Drag to move, double-click to cancel"
        aria-label={`You rated this page ${VOTE_COPY[vote.type].ariaVote} — drag to move, double-click to remove`}
        role="button"
      >
        <BadgeFace type={vote.type} />
      </motion.div>
    </div>
  );
}

/**
 * The page-rating widget: two badges — "Good" and "Bad" — peeking from the
 * left edge. Drag either one anywhere on the page and let go, or just click
 * it, to place a sticker there and cast the vote. One vote per page per
 * browser session (`sessionStorage`-guarded); once cast, both rail badges
 * fade and stop responding, and the planted sticker is the only remaining
 * trace — draggable to reposition, and restored at its exact spot (including
 * any repositioning) on every remount, so a mid-session refresh shows the
 * same picture as before. Double-clicking the planted sticker removes it and
 * clears the session's vote — the rail badges un-freeze immediately, letting
 * the visitor place a new one.
 */
export default function StickerVote() {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  // `sessionStorage` doesn't exist during the server render, so `vote` has to
  // start `null` (matching the server-rendered markup) and only pick up the
  // real, possibly-planted value after mount — reading it any earlier would
  // make the client's first render disagree with the server's and trip a
  // hydration mismatch. Re-read whenever the route changes, since a session
  // can rate more than one page.
  const [vote, setVote] = useState<PlantedVote | null>(null);
  useEffect(() => {
    // Same indirection `useMediaQuery` uses (lib/hooks.ts) for syncing from a
    // browser-only source in an effect — satisfies `react-hooks/set-state-in-effect`.
    const sync = () => setVote(readVote(pathname));
    sync();
  }, [pathname]);

  const [draggingType, setDraggingType] = useState<VoteType | null>(null);
  // A real drag can still fire a trailing native `click` on release in some
  // browsers; this suppresses that so a drag doesn't plant two stickers (one
  // from the drag-end handler, one from the click that follows it).
  const suppressNextClick = useRef(false);

  const upRef = useRef<HTMLButtonElement>(null);
  const downRef = useRef<HTMLButtonElement>(null);

  const place = useCallback(
    (type: VoteType, pageX: number, pageY: number) => {
      if (vote) return;

      const planted: PlantedVote = { type, x: pageX, y: pageY, dx: 0, dy: 0 };
      setVote(planted);
      writeVote(pathname, planted);
      track("sticker_vote", { value: type, path: pathname });
    },
    [vote, pathname]
  );

  const handleDragStart = useCallback((type: VoteType) => {
    suppressNextClick.current = true;
    setDraggingType(type);
  }, []);

  const handleDragEnd = useCallback(
    (type: VoteType) => (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo): boolean => {
      setDraggingType(null);
      const placed = Math.hypot(info.offset.x, info.offset.y) >= MIN_DRAG_DISTANCE;
      if (placed) {
        // `info.point` is already `pageX`/`pageY` (page-absolute, scroll
        // included) — adding `window.scrollX`/`scrollY` on top of it double-
        // counted scroll and landed the sticker away from the real drop point.
        place(type, info.point.x, info.point.y);
      }
      // `suppressNextClick` is otherwise only cleared by a trailing click
      // actually landing on `onActivate` — for a sub-threshold drag (not
      // placed above) that click may never fire, which would leave the flag
      // stuck `true` and silently swallow every future click on this badge.
      // Clearing it on a fresh tick guarantees it can't get stuck, while still
      // suppressing a same-gesture trailing click that fires first.
      setTimeout(() => {
        suppressNextClick.current = false;
      }, 0);
      return placed;
    },
    [place]
  );

  const handleActivate = useCallback(
    (type: VoteType) => () => {
      if (suppressNextClick.current) {
        suppressNextClick.current = false;
        return;
      }

      const ref = type === "up" ? upRef : downRef;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      // A default landing spot clear of the rail itself, offset into the
      // page rather than dropped right back on the badge that placed it.
      // `getBoundingClientRect()` is viewport-relative, so this addition of
      // `window.scrollX`/`scrollY` (unlike the drag path above) is correct.
      const offsetX = 92;
      place(type, rect.left + rect.width / 2 + offsetX + window.scrollX, rect.top + rect.height / 2 + window.scrollY);
    },
    [place]
  );

  const handleMoveVote = useCallback(
    (dx: number, dy: number) => {
      setVote((current) => {
        if (!current) return current;
        const moved: PlantedVote = { ...current, dx, dy };
        writeVote(pathname, moved);
        return moved;
      });
    },
    [pathname]
  );

  const handleDeleteVote = useCallback(() => {
    setVote(null);
    try {
      sessionStorage.removeItem(storageKey(pathname));
    } catch {
      // Best-effort — the in-memory state above is what actually un-freezes the rail.
    }
  }, [pathname]);

  const voted = vote !== null;

  return (
    <>
      <div className={styles.rail} data-chrome="rail">
        <RatingBadge
          type="up"
          voted={voted}
          votedByThis={voted && vote?.type === "up"}
          dragging={draggingType === "up"}
          reducedMotion={reducedMotion}
          innerRef={upRef}
          onDragStart={() => handleDragStart("up")}
          onDragEnd={handleDragEnd("up")}
          onActivate={handleActivate("up")}
        />
        <RatingBadge
          type="down"
          voted={voted}
          votedByThis={voted && vote?.type === "down"}
          dragging={draggingType === "down"}
          reducedMotion={reducedMotion}
          innerRef={downRef}
          onDragStart={() => handleDragStart("down")}
          onDragEnd={handleDragEnd("down")}
          onActivate={handleActivate("down")}
        />
      </div>

      {vote && (
        <PlantedBadge
          vote={vote}
          reducedMotion={reducedMotion}
          onDelete={handleDeleteVote}
          onMove={handleMoveVote}
        />
      )}

      <span className="sr-only" role="status">
        {vote ? `Thanks — you rated this page ${VOTE_COPY[vote.type].ariaVote}.` : ""}
      </span>
    </>
  );
}
