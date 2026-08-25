"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./SvgDiagram.module.css";

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

export function SvgDiagram({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label?: string;
}) {
  // Remounting the image is what replays a `whileInView` animation — once it
  // has fired, the trigger below won't fire again on its own.
  const [replayCount, setReplayCount] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={styles.wrap}>
      <motion.img
        key={replayCount}
        src={src}
        alt={label || alt}
        // Deferred loading meant these popped in at full height as a reader
        // scrolled — or jumped — past them, growing the page mid-scroll and
        // throwing off exactly where a smooth scroll lands. Loading eagerly
        // gets their real dimensions settled before anyone scrolls that far.
        loading="eager"
        decoding="async"
        className={styles.image}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
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
