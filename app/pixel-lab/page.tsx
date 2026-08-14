"use client";

/**
 * Dev-only sprite sheet for Pixel — every expression, every gaze cell, and a
 * size ramp to check that edges stay hard as it scales. Safe to delete.
 */

import { useState } from "react";
import { EXPRESSIONS, Pixel, usePixel, type Expression } from "@/components/pixel";
import styles from "./page.module.css";

const GAZE: Array<{ x: number; y: number; label: string }> = [
  { x: -1, y: -1, label: "left + up" },
  { x: 0, y: -1, label: "up" },
  { x: 1, y: -1, label: "right + up" },
  { x: -1, y: 0, label: "left" },
  { x: 0, y: 0, label: "straight" },
  { x: 1, y: 0, label: "right" },
  { x: -1, y: 1, label: "left + down" },
  { x: 0, y: 1, label: "down" },
  { x: 1, y: 1, label: "right + down" },
];

const SIZES = [24, 48, 72, 120, 192];

export default function PixelLab() {
  const { mood, setMood } = usePixel();
  const [hero, setHero] = useState<Expression>("default");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Pixel</h1>
        <p className={styles.subheading}>
          24&times;24 hand-authored grid &middot; one path per layer &middot; crispEdges
        </p>
      </header>

      <section className={styles.section}>
        <h2>Expressions</h2>
        <div className={styles.grid}>
          {EXPRESSIONS.map((expression) => (
            <button
              key={expression}
              className={
                hero === expression ? `${styles.cell} ${styles.cellActive}` : styles.cell
              }
              onClick={() => setHero(expression)}
            >
              <Pixel expression={expression} size={72} decorative />
              <span className={styles.caption}>{expression}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Gaze &mdash; {hero}</h2>
        <div className={styles.gazeGrid}>
          {GAZE.map((cell) => (
            <div key={cell.label} className={styles.cell}>
              <Pixel expression={hero} lookX={cell.x} lookY={cell.y} size={72} decorative />
              <span className={styles.caption}>{cell.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Scale</h2>
        <div className={styles.ramp}>
          {SIZES.map((size) => (
            <div key={size} className={styles.cell}>
              <Pixel expression={hero} size={size} decorative />
              <span className={styles.caption}>{size}px</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Companion override</h2>
        <p className={styles.note}>
          Pins the corner mascot&apos;s mood, the same call a 404 page would make via{" "}
          <code>usePixelMood(&quot;dead&quot;)</code>.
        </p>
        <div className={styles.chips}>
          <button
            className={mood === null ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            onClick={() => setMood(null)}
          >
            auto
          </button>
          {EXPRESSIONS.map((expression) => (
            <button
              key={expression}
              className={
                mood === expression ? `${styles.chip} ${styles.chipActive}` : styles.chip
              }
              onClick={() => setMood(expression)}
            >
              {expression}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
