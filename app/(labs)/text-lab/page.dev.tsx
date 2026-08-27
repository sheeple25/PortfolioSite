"use client";

/**
 * Dev-only sandbox for Motion Primitives' text components, one row per
 * effect so they're easy to compare side by side. Safe to delete once a
 * variant is chosen and wired into production copy.
 */

import { useEffect, useState } from "react";
import { TextRoll } from "@/components/motion-primitives/text-roll";
import { TextLoop } from "@/components/motion-primitives/text-loop";
import { TextMorph } from "@/components/motion-primitives/text-morph";
import { TextScramble } from "@/components/motion-primitives/text-scramble";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import { TextShimmerWave } from "@/components/motion-primitives/text-shimmer-wave";
import lab from "../lab.module.css";
import styles from "./page.module.css";

const PREVIEW_LINES = [
  "Portfolio",
  "Case studies",
  "Selected work",
  "Vidush Gupta",
  "Coming soon",
];

const CYCLE_MS = 2200;

/**
 * Tuned for speed and a seamless handoff between words: a tight per-letter
 * stagger and a short gap between each letter's roll-away and roll-in half
 * (vs. the library defaults of a 0.1s stagger and a 0.2s gap, which read as
 * slow and produced a visible pause mid-flip), plus an easeInOut curve so
 * the rotation itself starts and ends at zero velocity instead of snapping.
 */
const FAST_ROLL_DURATION = 0.3;
const FAST_ROLL_STAGGER = 0.02;
const FAST_ROLL_EXIT_OFFSET = 0.04;
const FAST_ROLL_TRANSITION = { ease: "easeInOut" as const };

export default function TextLab() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex((i) => (i + 1) % PREVIEW_LINES.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const line = PREVIEW_LINES[lineIndex];

  return (
    <main className={lab.page}>
      <header className={lab.header}>
        <h1>Text morph</h1>
        <p className={lab.subheading}>
          Motion Primitives&rsquo; text effects, side by side &middot; not wired into any real page
        </p>
      </header>

      <section className={lab.section}>
        <div className={styles.list}>
          <div className={styles.row}>
            <span className={styles.label}>Text Loop</span>
            <TextLoop className={styles.demo} interval={2}>
              {PREVIEW_LINES.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </TextLoop>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Text Roll</span>
            <TextLoop
              className={styles.demo}
              interval={2}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              variants={{
                initial: { y: 10, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -10, opacity: 0 },
              }}
            >
              {PREVIEW_LINES.map((l) => (
                <TextRoll
                  key={l}
                  duration={FAST_ROLL_DURATION}
                  getEnterDelay={(i) => i * FAST_ROLL_STAGGER}
                  getExitDelay={(i) => i * FAST_ROLL_STAGGER + FAST_ROLL_EXIT_OFFSET}
                  transition={FAST_ROLL_TRANSITION}
                >
                  {l}
                </TextRoll>
              ))}
            </TextLoop>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Text Morph</span>
            <TextMorph as="span" className={styles.demo}>
              {line}
            </TextMorph>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Text Scramble</span>
            <TextScramble key={lineIndex} as="span" className={styles.demo}>
              {line}
            </TextScramble>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Text Effect</span>
            <TextEffect
              as="span"
              per="char"
              preset="fade-in-blur"
              className={styles.demo}
            >
              {line}
            </TextEffect>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Text Shimmer</span>
            <TextShimmer as="span" className={styles.demo}>
              {line}
            </TextShimmer>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Shimmer Wave</span>
            <TextShimmerWave as="span" className={styles.demo}>
              {line}
            </TextShimmerWave>
          </div>
        </div>
      </section>
    </main>
  );
}
