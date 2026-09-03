"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, type PanInfo } from "motion/react";
import { track } from "@vercel/analytics";
import { Pixel, SAY_ATTRIBUTE, usePixel, type Expression } from "@/components/pixel";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import styles from "./StickerVote.module.css";

type VoteType = "up" | "down";

/** Below this, a release reads as mouse wobble during an intended click, not a placement — the badge snaps back and no vote is spent. */
const MIN_DRAG_DISTANCE = 20;

/*
 * How far the badge slides out on hover, in px. Negative because the rail
 * hangs off the *right* edge now, so "out" is leftward, into the page. Pinned
 * to the rail's tuck in the module CSS (`.rail { right: -2.4rem }` = -38.4px
 * at 16px root): the slide has to clear the whole hidden width plus a few px
 * of breathing room, so the sticker reads as "stepping out to be picked up"
 * rather than half-emerging. Change one, change the other.
 */
const HOVER_SLIDE_X = -42;

type PlantedVote = {
  type: VoteType;
  /** Page coordinates (not viewport) of the original drop/click — the CSS anchor, never rewritten. */
  x: number;
  y: number;
  /** Cumulative pixel offset from any dragging since — starts at 0,0, grows with each reposition. */
  dx: number;
  dy: number;
};

const VOTE_COPY: Record<VoteType, { ariaVote: string }> = {
  up: { ariaVote: "good" },
  down: { ariaVote: "bad" },
};

/*
 * Everything that makes the two stickers *different* lives in one table, so
 * the rail badge and the planted mark can't drift apart. The colours are
 * literal, not theme tokens — see the note above `.sticker` in the module CSS:
 * a sticker is fixed material laid onto the page, and the mini Pixel's ink and
 * eyes are part of that print run. `eyeColor` matches the face so the eyes
 * read as punched through the white sprite, one ink per sticker.
 */
const STICKER_COPY: Record<
  VoteType,
  { label: string; expression: Expression; eyeColor: string; say: string }
> = {
  up: {
    label: "i love this",
    expression: "happy",
    eyeColor: "#0047ff",
    say: "Like the page? Peel this sticker off the edge and drop it anywhere — it sticks where you let go.",
  },
  down: {
    label: "not a fan",
    expression: "unimpressed",
    eyeColor: "#5c5747",
    say: "Not a fan? Drag this one out and drop it — Vidush reads the bad votes first.",
  },
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

/**
 * The shared visual: a square die-cut sticker — white cut edge, colour face,
 * a mini Pixel and a mono caption. Both the rail badges and the planted mark
 * render this, so a vote lands looking exactly like the thing that was picked
 * up. The mini Pixel wears the session costume (`usePixel().accessory`) for
 * the same reason `TitlePixel` does: every Pixel on screen is the same
 * character, and a hat that vanished on the stickers would break that.
 */
function StickerFace({ type }: { type: VoteType }) {
  const { accessory } = usePixel();
  const copy = STICKER_COPY[type];
  return (
    <span
      className={cn(styles.sticker, type === "up" ? styles.stickerUp : styles.stickerDown)}
      aria-hidden="true"
    >
      <Pixel
        expression={copy.expression}
        accessory={accessory}
        decorative
        color="#fdfbf7"
        eyeColor={copy.eyeColor}
        className={styles.stickerPixel}
      />
      <span className={styles.stickerText}>{copy.label}</span>
    </span>
  );
}

/**
 * One of the two rail badges — an "i love this" sticker and a "not a fan"
 * sticker, both peeking from the right edge, high up — above the companion's
 * corner and clear of the reading column; see the rail's note in the CSS.
 * Two independent interaction paths land on the same `onActivate`:
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
 *
 * The resting tilt lives in CSS (`--tilt` on `.sticker`), not in `animate`:
 * the ~30s reminder pulse is a CSS keyframe animation on the inner face, and
 * if Motion also owned `rotate` on this button the two would each write a
 * transform containing rotation and visibly fight. Motion keeps x/y/scale/
 * opacity on the button; CSS keeps rotation and the pulse on the face.
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
      /*
       * Not gated on `reducedMotion`: a drag is direct manipulation — the
       * sticker tracks the pointer 1:1 with no motion of its own — which the
       * reduced-motion preference doesn't ask to remove. Gating it here used
       * to silently take the whole placement gesture away from those readers;
       * only the decorative `whileDrag` flourish below stays gated.
       */
      drag={!voted}
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
          : { x: 0, y: 0, opacity: voted ? 0.5 : 1 }
      }
      // The reveal is functional (the badge is mostly tucked off-screen), so
      // it still happens under reduced motion — just instantly.
      transition={reducedMotion ? { duration: 0 } : undefined}
      whileHover={voted ? undefined : { x: HOVER_SLIDE_X, scale: 1.05 }}
      whileTap={voted ? undefined : { scale: 0.95 }}
      whileDrag={reducedMotion ? undefined : { scale: 1.12, rotate: type === "up" ? 5 : -5 }}
      title={voted ? undefined : "Drag to rate"}
      aria-label={
        voted
          ? "Thanks for rating this page"
          : `Rate this page ${VOTE_COPY[type].ariaVote} — click, or drag the sticker anywhere on the page`
      }
      {...{ [SAY_ATTRIBUTE]: STICKER_COPY[type].say }}
    >
      <StickerFace type={type} />
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
 * of the page. `.plantedLayer` needs the *initial containing block* — the
 * document origin — which it only gets because `StickerVote` mounts as a
 * direct child of `<body>` and neither `body` nor `html` is positioned,
 * transformed or filtered (verified against `app/globals.css`; `body` being a
 * flex column doesn't matter, absolute children leave the flex flow). Keep it
 * mounted there — re-parenting it under any positioned/transformed wrapper
 * would silently offset every planted sticker.
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
        className={cn(styles.badge, styles.badgePlanted)}
        style={{ left: vote.x, top: vote.y }}
        initial={
          reducedMotion
            ? { x: vote.dx, y: vote.dy }
            : { x: vote.dx, y: vote.dy, scale: 0.4, opacity: 0, rotate: vote.type === "up" ? -14 : 14 }
        }
        animate={{ x: vote.dx, y: vote.dy, scale: 1, opacity: 1, rotate: 0 }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 22 }}
        /*
         * Unconditionally draggable — this used to be `drag={!reducedMotion}`,
         * which read "reduced motion" as "no interaction" and left those
         * readers with a sticker they could never reposition. Dragging is
         * direct manipulation (the sticker follows the pointer exactly, no
         * added motion), so the preference doesn't apply; the entrance spring
         * above is what it governs, and that's already flattened to
         * `duration: 0`.
         */
        drag
        dragMomentum={false}
        onDragEnd={(_event, info) => onMove(vote.dx + info.offset.x, vote.dy + info.offset.y)}
        onDoubleClick={onDelete}
        /* `role="button"` without a tab stop or key handling is a control a
           keyboard can see but not reach — Delete/Backspace (and Enter, which
           is what a screen reader will try first) all remove the vote, the
           same as a pointer's double-click. */
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace" || event.key === "Enter") {
            event.preventDefault();
            onDelete();
          }
        }}
        title="Drag to move, double-click to remove"
        aria-label={`You rated this page ${VOTE_COPY[vote.type].ariaVote} — drag to move; press Enter or Delete to remove`}
        role="button"
        {...{ [SAY_ATTRIBUTE]: "That one's yours — drag it to move it, double-click to peel it off." }}
      >
        <StickerFace type={vote.type} />
      </motion.div>
    </div>
  );
}

/**
 * The page-rating widget: two die-cut stickers — "i love this" and "not a
 * fan" — peeking from the right edge. Drag either one anywhere on the page and
 * let go, or just click it, to place it there and cast the vote. One vote per
 * page per browser session (`sessionStorage`-guarded); once cast, both rail
 * badges fade and stop responding, and the planted sticker is the only
 * remaining trace — draggable to reposition, and restored at its exact spot
 * (including any repositioning) on every remount, so a mid-session refresh
 * shows the same picture as before. Double-clicking the planted sticker
 * removes it and clears the session's vote — the rail badges un-freeze
 * immediately, letting the visitor place a new one.
 *
 * Mounted inside `PixelProvider` (the mini Pixels wear the session costume)
 * but still as a direct child of `<body>` — the provider renders no wrapper
 * element, and `PlantedBadge`'s page-coordinate anchoring depends on that;
 * see its comment.
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
      // page (leftward, since the rail is on the right edge) rather than
      // dropped right back on the badge that placed it.
      // `getBoundingClientRect()` is viewport-relative, so this addition of
      // `window.scrollX`/`scrollY` (unlike the drag path above) is correct.
      const offsetX = -92;
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
