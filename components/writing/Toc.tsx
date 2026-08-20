"use client";

import { useState } from "react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { cn } from "@/lib/utils";
import type { TocEntry } from "@/lib/writing/types";
import { useReader } from "./ReaderContext";
import styles from "./Toc.module.css";

/*
 * Jump-to-heading navigation for one document.
 *
 * Rendered twice — a rail pinned to the left of the text on wide screens, a
 * collapsible bar above it on narrow ones — because the two need genuinely
 * different furniture, not the same list at a different width. Both share every
 * row component below.
 */

function Chevron({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 8" width={size} height={(size * 8) / 12} fill="none">
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

function Row({
  entry,
  ordinal,
  onNavigate,
}: {
  entry: TocEntry;
  ordinal: number;
  onNavigate?: () => void;
}) {
  const { activeId, isOpen, jumpTo } = useReader();
  const active = activeId === entry.id;
  const open = isOpen(entry.id);

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={cn(styles.row, active && styles.rowActive)}
        onClick={() => {
          jumpTo(entry.id);
          onNavigate?.();
        }}
        aria-current={active ? "location" : undefined}
      >
        <span className={styles.rowOrdinal} aria-hidden="true">
          {String(ordinal).padStart(2, "0")}
        </span>
        <span className={styles.rowTitle}>{entry.title}</span>
        {entry.private && (
          <span className={styles.rowPrivate} title="Hidden in production">
            draft
          </span>
        )}
      </button>

      {/* Subheadings only earn their space once you're in or have opened the section. */}
      {entry.children.length > 0 && (
        <AnimatePresence initial={false}>
          {(active || open) && (
            <motion.ul
              className={styles.subList}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {entry.children.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    className={styles.subRow}
                    onClick={() => {
                      // Passing the owner lets the reader open this section
                      // first — the target may not be laid out yet.
                      jumpTo(child.id, entry.id);
                      onNavigate?.();
                    }}
                  >
                    {child.title}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}

function List({
  toc,
  onNavigate,
}: {
  toc: TocEntry[];
  onNavigate?: () => void;
}) {
  return (
    <ol className={styles.list}>
      {toc.map((entry, i) => (
        <Row
          key={entry.id}
          entry={entry}
          ordinal={i + 1}
          onNavigate={onNavigate}
        />
      ))}
    </ol>
  );
}

export default function Toc({ toc }: { toc: TocEntry[] }) {
  const { activeId } = useReader();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const current = toc.find((entry) => entry.id === activeId);

  return (
    <>
      <nav className={styles.rail} aria-label="Document contents">
        <div className={styles.railInner}>
          <p className={styles.eyebrow}>Contents</p>
          <div className={styles.railBody}>
            <List toc={toc} />
          </div>
        </div>
      </nav>

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.barToggle}
          onClick={() => setSheetOpen((o) => !o)}
          aria-expanded={sheetOpen}
          aria-controls="toc-sheet"
        >
          <span className={styles.barEyebrow}>Contents</span>
          <span className={styles.barCurrent}>
            {current?.title ?? toc[0]?.title}
          </span>
          <motion.span
            className={styles.barChevron}
            aria-hidden="true"
            animate={{ rotate: sheetOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <Chevron />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {sheetOpen && (
            <motion.div
              id="toc-sheet"
              className={styles.sheet}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.sheetInner}>
                <List toc={toc} onNavigate={() => setSheetOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className={styles.barProgress}
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      </div>
    </>
  );
}
