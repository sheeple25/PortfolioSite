"use client";

import Image from "next/image";
import { useState } from "react";
import { CASE_ASSETS } from "./primitives";
import styles from "./case.module.css";

/**
 * A one-at-a-time walk through a set of screens or views — a title, the copy
 * for that step, and the image it produces.
 *
 * The frames draw a single slide with a caret either side, which is a carousel
 * shown at rest. Steps with no image yet render an outlined placeholder rather
 * than being dropped, so the walk keeps the length it actually has.
 */

export type Slide = {
  kicker: string;
  title: string;
  body: string;
  /** `null` until the screen has been captured. */
  image: string | null;
};

export default function Carousel({
  heading,
  slides,
}: {
  heading?: string;
  slides: readonly Slide[];
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <section className={styles.beat}>
      {heading ? <h2 className={styles.prose}>{heading}</h2> : null}

      <div className={styles.carousel}>
        <button
          type="button"
          className={styles.carouselNav}
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          aria-label="Previous"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local SVG */}
          <img src={`${CASE_ASSETS}/caret-left.svg`} alt="" width={24} height={24} />
        </button>

        {/*
         * The slide is swapped in place rather than translated, so `aria-live`
         * is what tells a screen reader the content changed — there is no
         * scroll position for it to infer that from.
         */}
        <div className={styles.carouselSlide} aria-live="polite">
          <div className={styles.carouselCopy}>
            <div>
              <p className={styles.carouselKicker}>{slide.kicker}</p>
              <p className={styles.carouselTitle}>{slide.title}</p>
            </div>
            <p className={styles.carouselBody}>{slide.body}</p>
          </div>

          <div className={styles.carouselShot}>
            {slide.image ? (
              <Image
                src={slide.image}
                alt={`${slide.title}`}
                width={240}
                height={500}
                className={styles.carouselShotImage}
              />
            ) : (
              <div className={styles.carouselShotPending}>Image TK</div>
            )}
          </div>
        </div>

        <button
          type="button"
          className={styles.carouselNav}
          onClick={() => setIndex((i) => i + 1)}
          disabled={index === slides.length - 1}
          aria-label="Next"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local SVG */}
          <img src={`${CASE_ASSETS}/caret-right.svg`} alt="" width={24} height={24} />
        </button>
      </div>
    </section>
  );
}
