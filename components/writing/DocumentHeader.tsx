"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import ParticleText from "@/components/motion-primitives/particle-text";
import TitleEffect, { isTitleEffect } from "@/components/archive/TitleEffect";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./DocumentHeader.module.css";

/**
 * The masthead of a single document.
 *
 * `TextEffect` is used here and nowhere further down the page on purpose: it
 * only renders its words while `trigger` is true, so it suits a heading that is
 * above the fold and animates on mount. Section headings further down have to
 * survive in the HTML whether or not they've been scrolled to, so those animate
 * with plain `whileInView` transforms instead of being rebuilt per word.
 */
export default function DocumentHeader({
  title,
  subtitle,
  date,
  dateTime,
  version,
  readingMinutes,
  showsPrivate,
  backHref,
  backLabel = "Back",
  titleEffect = "words",
}: {
  title: string;
  subtitle?: string;
  /** Human-readable, e.g. `14 Feb 2026` or `Fall 2024`. */
  date: string;
  /**
   * Machine-readable ISO date for the `<time>` element. Defaults to `date`,
   * which is right while the two are the same string — `/archive` shows a term
   * label like "Fall 2024", which is not a date a parser can read, so it passes
   * the real one here.
   */
  dateTime?: string;
  version?: string;
  readingMinutes: number;
  showsPrivate: boolean;
  /** Section index this document belongs to. */
  backHref: string;
  backLabel?: string;
  /**
   * How the title arrives. `words` fades it in a word at a time — the
   * default, and right for a heading that is a sentence. `particles` builds
   * it out of its own glyphs, which only suits a short, single-word title.
   *
   * Any other value is looked up in the `/archive` registry, where each entry
   * has a title animation of its own. An unknown name falls back to `words`
   * rather than throwing, so a typo in frontmatter costs an effect, not a page.
   */
  titleEffect?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <header className={styles.header}>
      <Link href={backHref} className={styles.back}>
        <svg
          className={styles.backIcon}
          viewBox="0 0 20 14"
          width="20"
          height="14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 1.5 L1.5 5.5 L6 9.5 M1.5 5.5 H13 a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {backLabel}
      </Link>

      {reducedMotion ? (
        <h1 className={styles.title}>{title}</h1>
      ) : titleEffect === "particles" ? (
        <ParticleText as="h1" className={styles.title}>
          {title}
        </ParticleText>
      ) : isTitleEffect(titleEffect) ? (
        <TitleEffect as="h1" effect={titleEffect} className={styles.title}>
          {title}
        </TitleEffect>
      ) : (
        <TextEffect
          as="h1"
          per="word"
          preset="fade-in-blur"
          speedReveal={1.6}
          speedSegment={0.9}
          className={styles.title}
        >
          {title}
        </TextEffect>
      )}

      {subtitle && (
        <motion.p
          className={styles.subtitle}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Date on one edge of the reading column, length on the other. */}
      <motion.div
        className={styles.meta}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <p className={styles.metaLeft}>
          <time dateTime={dateTime ?? date}>{date}</time>
          {version && (
            <>
              <span className={styles.sep} aria-hidden="true">
                /
              </span>
              {version}
            </>
          )}
          {/* Only ever rendered in dev — see INCLUDE_PRIVATE in lib/writing. */}
          {showsPrivate && (
            <span className={styles.privateNotice}>includes private sections</span>
          )}
        </p>
        <p className={styles.metaRight}>[{readingMinutes} min]</p>
      </motion.div>
    </header>
  );
}
