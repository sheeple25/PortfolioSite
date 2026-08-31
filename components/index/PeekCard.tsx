"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import type { EntryLink, PeekContent } from "@/lib/entries/types";
import styles from "./peek.module.css";

/*
 * The peek — a large picture-in-picture card that slides in over the index.
 *
 * The middle setting of the three presentation modes: more than a tile, less
 * than a page, and crucially not a navigation. It exists for two kinds of
 * project — the ones without enough depth to carry a full case study, and the
 * ones that live somewhere else entirely and aren't worth rebuilding here.
 *
 * Its content is resolved in `lib/entries` and arrives already filled in from
 * the entry's own metadata, so a project can be flipped to `peek` without
 * anyone writing anything for it. See `resolvePeek`.
 *
 * `onward` is what stops this being a dead end. A peek over a project that
 * does have a page ends in "read the case study"; a peek over an external
 * document ends in a link to it. The modes aren't really exclusive in the UI,
 * only in what the tile does first.
 */

export type PeekSubject = {
  slug: string;
  cover?: string;
  coverAlt?: string;
  place?: string;
  term: string;
  peek: PeekContent;
};

const isExternal = (link: EntryLink) =>
  link.external ?? /^[a-z][a-z0-9+.-]*:/i.test(link.href);

function Onward({ link }: { link: EntryLink }) {
  if (isExternal(link)) {
    return (
      <a
        className={styles.onward}
        href={link.href}
        target="_blank"
        rel="noreferrer"
      >
        {link.label}
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link className={styles.onward} href={link.href}>
      {link.label}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export default function PeekCard({
  subject,
  onClose,
}: {
  subject: PeekSubject | null;
  onClose: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  /* Whatever the visitor was on before the card opened, so focus can go home. */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = subject !== null;

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    /*
     * Hold the page still underneath. The scrollbar is replaced with padding
     * of the same width so the index doesn't jump sideways as it locks.
     */
    const { body } = document;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, padding: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.padding;
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {subject && (
        <motion.div
          className={styles.scrim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`peek-${subject.slug}-title`}
            className={styles.card}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
            transition={{
              duration: reducedMotion ? 0 : 0.42,
              ease: [0.22, 1, 0.36, 1],
            }}
            /* The scrim closes on click; the card itself must not. */
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className={styles.body}>
              {subject.cover && (
                <div className={styles.plate}>
                  <Image
                    src={subject.cover}
                    alt={subject.coverAlt ?? ""}
                    fill
                    sizes="(max-width: 60rem) 100vw, 46rem"
                    className={styles.plateImage}
                  />
                </div>
              )}

              <div className={styles.text}>
                <div className={styles.eyebrow}>
                  <span>{subject.place}</span>
                  <span className={styles.term}>{subject.term}</span>
                </div>

                <h2 className={styles.headline} id={`peek-${subject.slug}-title`}>
                  {subject.peek.headline}
                </h2>

                <p className={styles.blurb}>{subject.peek.blurb}</p>

                {subject.peek.facts && subject.peek.facts.length > 0 && (
                  <dl className={styles.facts}>
                    {subject.peek.facts.map((fact) => (
                      <div className={styles.fact} key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {subject.peek.onward && <Onward link={subject.peek.onward} />}
              </div>

              {/*
                Extra plates, only where an entry actually supplied them. A
                peek with none is the intended resting state, not a gap — the
                cover and the words above are the whole of what most of these
                projects have.
              */}
              {subject.peek.images?.map((image) => (
                <figure className={styles.figure} key={image.src}>
                  <div className={styles.plate}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 60rem) 100vw, 46rem"
                      className={styles.plateImage}
                    />
                  </div>
                  {image.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
