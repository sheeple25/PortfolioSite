"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./InlineSvgDiagram.module.css";

function ReplayIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" aria-hidden="true">
      <path
        d="M12 7A5 5 0 1 1 10.6 3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 2.5V6h-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The inline-SVG counterpart to the old `SvgDiagram`: renders the figure's
 * markup directly into the page (rather than as an `<img src>`) so its
 * `var(--fig-*)` colours and the per-element `pathLength`/`fillOpacity`
 * variants on its children can actually take effect — neither works across
 * an `<img>` boundary. `initial`/`whileInView` here are plain variant
 * *labels*; every generated child only declares `variants` and `custom`, and
 * picks up "hidden"/"visible" by Motion's normal parent-to-child
 * propagation, which is what lets `svg2jsx` emit one line per shape instead
 * of repeating orchestration props on every element.
 */
export function InlineSvgDiagram({
  viewBox,
  label,
  children,
}: {
  viewBox: string;
  label?: string;
  children: ReactNode;
}) {
  // Same trick `SvgDiagram` used: remounting is what replays a `whileInView`
  // animation once it has already fired once.
  const [replayCount, setReplayCount] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={styles.stage}>
      <motion.svg
        key={replayCount}
        viewBox={viewBox}
        fill="none"
        role={label ? "img" : undefined}
        aria-label={label}
        className={styles.svg}
        initial={reducedMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {children}
      </motion.svg>
      {!reducedMotion && (
        <button
          type="button"
          className={styles.replay}
          onClick={() => setReplayCount((count) => count + 1)}
          aria-label="Replay entrance animation"
          title="Replay animation"
        >
          <ReplayIcon />
        </button>
      )}
    </div>
  );
}
