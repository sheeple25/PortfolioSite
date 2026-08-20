"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useReader } from "./ReaderContext";
import prose from "./prose.module.css";
import styles from "./SectionCard.module.css";

/**
 * One section: heading, preview, and the rest behind a toggle.
 *
 * The toggle sits on the heading line rather than under the preview. Below the
 * text it read as a button interrupting the essay, and the reader had to reach
 * the bottom of the preview to find out there was more; on the heading it is
 * part of the section's own furniture, and every section carries an identical
 * one whether or not you have opened it.
 *
 * `preview` and `body` arrive already rendered from the server — this component
 * never sees markdown, only two React trees and the job of showing one or both.
 * The body stays mounted while collapsed rather than unmounting, so the text is
 * in the HTML for crawlers and the height transition has something to measure;
 * `inert` is what keeps it out of the tab order and off screen readers.
 */
export default function SectionCard({
  id,
  ordinal,
  title,
  preview,
  body,
  isPrivate,
}: {
  id: string;
  ordinal: number;
  title: string;
  preview: ReactNode;
  body: ReactNode | null;
  isPrivate: boolean;
}) {
  const { isOpen, toggle, activeId, register } = useReader();
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const open = isOpen(id);
  const active = activeId === id;

  /*
   * The body has to clip while its height animates, or the text spills out of
   * the box on the way open. Once it settles the clip is dropped, so nothing
   * inside an expanded section — a focus ring on a link, a note trigger's
   * outline — gets shaved off at the column edge.
   */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    register(id, ref.current);
    return () => register(id, null);
  }, [id, register]);

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.section
      ref={ref}
      id={id}
      className={cn(styles.section, active && styles.active)}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <header className={styles.header}>
        <span className={styles.ordinal} aria-hidden="true">
          {String(ordinal).padStart(2, "0")}
        </span>
        <h2 className={styles.title}>{title}</h2>

        {isPrivate && (
          <span className={styles.privateTag} title="Hidden in production builds">
            private draft
          </span>
        )}

        {body && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => toggle(id)}
            aria-expanded={open}
            aria-controls={`${id}-body`}
          >
            <span className={styles.toggleLabel}>
              {open ? "Collapse Section" : "Expand Section"}
            </span>
            <motion.span
              className={styles.chevron}
              aria-hidden="true"
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <svg viewBox="0 0 12 8" width="11" height="7" fill="none">
                <path
                  d="M1 1.5 L6 6.5 L11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </button>
        )}
      </header>

      <div className={cn(prose.prose, styles.preview)}>{preview}</div>

      {body && (
        <motion.div
          id={`${id}-body`}
          className={styles.bodyClip}
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={transition}
          style={{ overflow: open && settled ? "visible" : "hidden" }}
          onAnimationStart={() => setSettled(false)}
          onAnimationComplete={() => setSettled(true)}
          inert={!open}
        >
          <div className={cn(prose.prose, styles.body)}>{body}</div>
        </motion.div>
      )}
    </motion.section>
  );
}
