"use client";

import styles from "../board.module.css";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import ProblemSelector from "../ProblemSelector";
import { type Anchor } from "../parts";

/**
 * Beat 2 — one horizontal beat, read left to right: observation, turn, claim,
 * then the interactive "why" directly underneath.
 *
 * The board's tagline here ("We Ourselves" / technology + dating / byline) is
 * deliberately gone: it added a scroll beat carrying nothing the reader needs
 * before they know what the project is.
 */
export default function Problem({ anchor }: { anchor: Anchor }) {
  /*
   * This beat reveals on scroll rather than on mount — the board mounts
   * everything at once, so an on-mount reveal this far down the page would
   * already be finished by the time a reader scrolls to it. `once: true`
   * matches `Stat`'s pattern: it should land, not replay on scroll-back.
   */
  const problemRef = useRef<HTMLDivElement>(null);
  const problemInView = useInView(problemRef, {
    once: true,
    margin: "-20% 0px -20% 0px",
  });

  return (
    <>
      <section className={styles.light} {...anchor("s-problem")}>
        <div className={styles.problemRow} ref={problemRef}>
          <div className={styles.problemBeat}>
            <p className={styles.problemKicker}>Observation</p>
            <TextEffect
              as="p"
              per="word"
              preset="fade-in-blur"
              className={styles.problemText}
              trigger={problemInView}
            >
              people are lonely
            </TextEffect>
          </div>

          <span className={styles.problemArrow} aria-hidden="true">
            →
          </span>

          <motion.p
            className={styles.problemText}
            initial={{ opacity: 0, y: 8 }}
            animate={problemInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
          >
            dating apps do exist, but
          </motion.p>

          <span className={styles.problemArrow} aria-hidden="true">
            →
          </span>

          <div className={styles.problemBeat}>
            <p className={styles.problemKicker}>Claim</p>
            <TextEffect
              as="p"
              per="word"
              preset="fade-in-blur"
              className={styles.problemText}
              delay={1.1}
              trigger={problemInView}
            >
              they suck
            </TextEffect>
          </div>
        </div>

        <h2 className={styles.reasonHeading}>Why do they suck?</h2>
        <ProblemSelector />
      </section>
    </>
  );
}
