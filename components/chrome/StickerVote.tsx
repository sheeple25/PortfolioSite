"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { track } from "@vercel/analytics";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import styles from "./StickerVote.module.css";

type Vote = "up" | "down";

/** Vertical drag distance (px) that counts as a vote rather than a fidget. */
const VOTE_THRESHOLD = 64;
/** How long the confirmed state holds before the tab returns to idle. */
const CONFIRM_MS = 1600;

function storageKey(pathname: string) {
  return `sticker-vote:${pathname}`;
}

function readVote(pathname: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(pathname)) !== null;
  } catch {
    // sessionStorage can throw in locked-down browser contexts — fail open
    // rather than block the widget.
    return false;
  }
}

/**
 * A small tab that peeks from the left edge of the viewport. Pixel's chat
 * sidebar and companion both live fixed on the right (see
 * `PixelSidebar.module.css` and `PixelCompanion.module.css`), so the left
 * edge is the one side left free for more fixed-position chrome.
 *
 * Drag the tab up toward the thumbs-up zone or down toward thumbs-down —
 * both fade in only while dragging — to rate the current page. Crossing
 * `VOTE_THRESHOLD` and releasing sends the vote through `@vercel/analytics`'s
 * `track()`, holds a brief confirmation, then the tab springs back to rest
 * (`dragSnapToOrigin`). One vote per page per browser session, guarded with
 * `sessionStorage` so re-dragging can't inflate the count.
 */
export default function StickerVote() {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  // `sessionStorage` doesn't exist during the server render, so `hasVoted`
  // has to start `false` (matching the server-rendered markup) and only pick
  // up the real, possibly-`true` value after mount — reading it any earlier
  // would make the client's first render disagree with the server's and
  // trip a hydration mismatch. Re-read whenever the route changes, since a
  // session can rate more than one page.
  const [hasVoted, setHasVoted] = useState(false);
  useEffect(() => {
    // Same indirection `useMediaQuery` uses (lib/hooks.ts) for syncing from
    // a browser-only source in an effect.
    const sync = () => setHasVoted(readVote(pathname));
    sync();
  }, [pathname]);

  const [dragging, setDragging] = useState(false);
  const [armedZone, setArmedZone] = useState<Vote | null>(null);
  const [confirmed, setConfirmed] = useState<Vote | null>(null);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, []);

  const handleDragStart = useCallback(() => setDragging(true), []);

  const handleDrag = useCallback((_event: unknown, info: PanInfo) => {
    if (info.offset.y <= -VOTE_THRESHOLD) setArmedZone("up");
    else if (info.offset.y >= VOTE_THRESHOLD) setArmedZone("down");
    else setArmedZone(null);
  }, []);

  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      setDragging(false);
      setArmedZone(null);

      const vote: Vote | null =
        info.offset.y <= -VOTE_THRESHOLD
          ? "up"
          : info.offset.y >= VOTE_THRESHOLD
            ? "down"
            : null;

      if (!vote || hasVoted) return;

      track("sticker_vote", { value: vote, path: pathname });

      try {
        sessionStorage.setItem(storageKey(pathname), vote);
      } catch {
        // Vote still fires above even if the session guard can't persist.
      }

      setHasVoted(true);
      setConfirmed(vote);
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setConfirmed(null), CONFIRM_MS);
    },
    [hasVoted, pathname],
  );

  return (
    <div className={styles.wrap} data-chrome="rail">
      <AnimatePresence>
        {dragging && (
          <motion.div
            key="up"
            className={cn(styles.zone, armedZone === "up" && styles.zoneArmed)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            aria-hidden="true"
          >
            <ThumbsUp size={15} strokeWidth={1.75} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={cn(styles.tab, hasVoted && styles.tabVoted)}
        drag={hasVoted || reducedMotion ? false : "y"}
        dragConstraints={{ top: -96, bottom: 96 }}
        dragElastic={0.4}
        dragSnapToOrigin
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        disabled={hasVoted}
        aria-label={
          hasVoted
            ? "Thanks for rating this page"
            : "Rate this page — drag up to like, down to dislike"
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {confirmed ? (
            <motion.span
              key="confirmed"
              className={styles.icon}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {confirmed === "up" ? (
                <ThumbsUp size={15} strokeWidth={1.75} />
              ) : (
                <ThumbsDown size={15} strokeWidth={1.75} />
              )}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              className={styles.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              Rate
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {dragging && (
          <motion.div
            key="down"
            className={cn(styles.zone, armedZone === "down" && styles.zoneArmed)}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            aria-hidden="true"
          >
            <ThumbsDown size={15} strokeWidth={1.75} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
