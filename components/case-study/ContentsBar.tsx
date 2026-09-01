"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { useReader } from "@/components/writing/ReaderContext";
import { useScrollFrame, type ScrollSnapshot } from "@/lib/useScrollFrame";
import { ContentsList, activeRowIndex, type ContentsRow } from "./Contents";
import styles from "./case.module.css";

/**
 * Contents on a narrow screen.
 *
 * The left margin collapses below 1280px, and until now the rail collapsed
 * with it into an ordinary block above the first beat — which meant that on a
 * phone the contents existed only for as long as you hadn't started reading.
 * Every case study is a dozen beats long, so past the first screenful there
 * was no way to see where you were or jump anywhere without scrolling all the
 * way back to the top.
 *
 * So the same rows get different furniture down here: a sticky bar naming the
 * beat you're in, which opens into the full list. This is the shape
 * `components/writing/Toc` already uses for exactly this breakpoint, and it is
 * deliberately the same shape — the two pages read the same way on a phone.
 *
 * Shown and hidden by CSS (`.contentsBar` is `display: none` above 1280px)
 * rather than a media-query hook, so it never renders one frame at the wrong
 * width on the way in.
 */

function Chevron() {
  return (
    <svg viewBox="0 0 12 8" width="12" height="8" fill="none" aria-hidden="true">
      <path
        d="M1 1.5 L6 6.5 L11 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContentsBar({ rows }: { rows: readonly ContentsRow[] }) {
  const { activeId } = useReader();
  const [open, setOpen] = useState(false);
  const progress = useMotionValue(0);

  const current = rows[Math.max(0, activeRowIndex(rows, activeId))];

  // The sheet covers the text it is opened over, so it needs the escape every
  // other overlay has — the toggle is the only other way back out.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /*
   * How far down the page you are, drawn as a hairline under the bar. The one
   * thing the wide rail gets for free from its own length and this bar can't:
   * a sense of how much is left.
   *
   * Shares the page's existing scroll loop rather than motion's `useScroll` —
   * that hook remeasures by jumping the window to (0, 0) and back, which
   * strands any jump that happens to be mid-flight (see the same note in
   * `writing/Toc`).
   */
  const onScrollFrame = useCallback(
    ({ y, max }: ScrollSnapshot) => {
      progress.set(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    },
    [progress],
  );

  useScrollFrame(onScrollFrame);

  return (
    <nav className={styles.contentsBar} aria-label="Contents">
      <button
        type="button"
        className={styles.contentsBarToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="case-contents-sheet"
      >
        <span className={styles.contentsBarLabel}>Contents</span>
        <span className={styles.contentsBarNum}>{current?.num}</span>
        <span className={styles.contentsBarCurrent}>{current?.title}</span>
        <motion.span
          className={styles.contentsBarChevron}
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <Chevron />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="case-contents-sheet"
            className={styles.contentsSheet}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.contentsSheetInner}>
              <ContentsList rows={rows} onNavigate={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.contentsBarProgress}
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
    </nav>
  );
}
