"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./IndexCard.module.css";

/**
 * One document on the `/writing` index.
 *
 * A row rather than a card: ordinal and title on one line with the arrow at the
 * far edge, the description under it, and the date and length pushed to the two
 * margins. No rules between them — the ordinals already do that work, and the
 * page reads as a list of pieces instead of a stack of boxes.
 */
export default function IndexCard({
  slug,
  title,
  description,
  date,
  readingMinutes,
  recommended,
  index,
}: {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  recommended?: boolean;
  index: number;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.li
      // Target for the corner note's "start with…" pointer.
      id={`piece-${slug}`}
      className={styles.item}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 4) * 0.07,
        ease: "easeOut",
      }}
    >
      {recommended && <p className={styles.flag}>Recommended</p>}

      <Link href={`/writing/${slug}`} className={styles.link}>
        <span className={styles.head}>
          <span className={styles.ordinal} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.title}>{title}</span>
          <span className={styles.arrow} aria-hidden="true">
            &rarr;
          </span>
        </span>

        <span className={styles.description}>{description}</span>

        <span className={styles.meta}>
          <time dateTime={date}>{date}</time>
          <span>[{readingMinutes} min]</span>
        </span>
      </Link>
    </motion.li>
  );
}
