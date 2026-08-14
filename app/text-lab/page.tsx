"use client";

/**
 * Dev-only sandbox for text-morph transitions — candidate lines cycling
 * through different "roll" variants so one can be picked for real copy.
 * Safe to delete once a variant is chosen and wired into production copy.
 */

import { useEffect, useState } from "react";
import RollingText, { type RollMode } from "@/components/RollingText";
import styles from "./page.module.css";

const PREVIEW_LINES = [
  "Portfolio",
  "Case studies",
  "Selected work",
  "Vidush Gupta",
  "Coming soon",
];

const ROLL_MODES: { value: RollMode; label: string }[] = [
  { value: "line", label: "Line roll" },
  { value: "letters", label: "Letters, together" },
  { value: "letters-wave", label: "Letters, wave" },
];

export default function TextLab() {
  const [lineIndex, setLineIndex] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>("line");
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLineIndex((i) => (i + 1) % PREVIEW_LINES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Text morph</h1>
        <p className={styles.subheading}>
          Candidate &ldquo;roll&rdquo; transitions between lines &middot; not wired into any real page
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.modeToggle}>
          {ROLL_MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                rollMode === option.value
                  ? `${styles.chip} ${styles.chipActive}`
                  : styles.chip
              }
              onClick={() => setRollMode(option.value)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.chip}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "pause" : "play"}
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() =>
              setLineIndex((i) => (i + 1) % PREVIEW_LINES.length)
            }
          >
            next
          </button>
        </div>

        <div className={styles.stage}>
          <RollingText
            text={PREVIEW_LINES[lineIndex]}
            mode={rollMode}
            className={styles.stageText}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Lines</h2>
        <div className={styles.lineList}>
          {PREVIEW_LINES.map((line, i) => (
            <button
              key={line}
              className={
                lineIndex === i ? `${styles.chip} ${styles.chipActive}` : styles.chip
              }
              onClick={() => setLineIndex(i)}
            >
              {line}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
