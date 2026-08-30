"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { track } from "@vercel/analytics";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useShutterLink } from "@/components/chrome/Shutter";
import styles from "./IndexCard.module.css";

/**
 * One document on a section index — `/writing` or `/projects`.
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
  basePath,
  index,
}: {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  recommended?: boolean;
  /** Section the slug hangs off, e.g. `/writing` or `/projects`. */
  basePath: string;
  index: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const href = `${basePath}/${slug}`;
  const shutterClick = useShutterLink(href);

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

      <Link
        href={href}
        className={styles.link}
        onClick={(event) => {
          // Closes the index header before the route changes; a modified click
          // is left alone and opens a new tab as usual.
          shutterClick(event);
          // Only `/projects` is a "project click" in the analytics sense —
          // the same card renders `/writing`'s index too.
          if (basePath === "/projects") {
            track("project_click", { slug, title });
          }
        }}
      >
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
