"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./MorphTitle.module.css";

gsap.registerPlugin(ScrambleTextPlugin);

/**
 * `Vidush the [designer]` — where the bracketed word keeps changing its mind.
 *
 * The About page's argument is that the designer is one of several people,
 * and the title makes that argument before the standfirst gets a chance to:
 * the word in the brackets steps through a list (`designer`, `cat-haver`,
 * `reader`, …) and the brackets stretch and shrink to fit each one, so they
 * read as a slot the page is filling in rather than as punctuation.
 *
 * **A scramble, not a roll.** Each swap resolves the next word out of a run
 * of random lowercase characters, left to right — the same effect the home
 * page uses for the job description, and for the same reason: a word that
 * *settles* reads as one reading chosen from many, which is the whole point
 * of a title with a slot in it. Under it, the slot's width tweens between the
 * two measured widths, so the closing bracket glides rather than jumping the
 * moment the new word's length lands.
 *
 * **Imperative on purpose.** After the first paint the text inside the slot
 * belongs to GSAP, not React: the swap rewrites it directly. That is safe only
 * because nothing about this element's React tree changes after mount —
 * `lead` and `words` are treated as fixed for the component's lifetime, and
 * the accessible text (a plain sentence for screen readers, the painted word
 * `aria-hidden`) never depends on the animation's state.
 *
 * Reduced motion: the word still changes — the list is the content, not a
 * flourish — but it cuts rather than scrambles.
 */

/** How long each word holds before the next one takes the slot. */
const HOLD_MS = 2400;
/** How long a swap takes: the scramble resolves and the slot resizes together. */
const SWAP_S = 0.8;

export default function MorphTitle({
  lead,
  words,
}: {
  /** The part before the brackets: `Vidush the`. */
  lead: string;
  /** The slot's rotation, starting with the one to paint at rest. At least one. */
  words: readonly string[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const wordRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const word = wordRef.current;
    const measure = measureRef.current;
    if (!word || !measure || words.length < 2) return;

    let index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let flight: gsap.core.Timeline | undefined;

    const widthOf = (text: string) => {
      measure.textContent = text;
      return measure.getBoundingClientRect().width;
    };

    const swap = () => {
      index = (index + 1) % words.length;
      const next = words[index];

      if (reducedMotion) {
        word.textContent = next;
        timer = setTimeout(swap, HOLD_MS);
        return;
      }

      /* Pin the slot at its current width so the tween has a number to start
         from; `clearProps` at the end hands it back to `auto`, which is what
         keeps the title honest across a resize between swaps. */
      const from = word.getBoundingClientRect().width;
      const to = widthOf(next);

      flight = gsap
        .timeline({
          onComplete: () => {
            gsap.set(word, { clearProps: "width" });
            timer = setTimeout(swap, HOLD_MS);
          },
        })
        .set(word, { width: from })
        .to(word, { width: to, duration: SWAP_S, ease: "power3.inOut" }, 0)
        .to(
          word,
          {
            duration: SWAP_S,
            ease: "none",
            scrambleText: {
              text: next,
              chars: "lowerCase",
              speed: 0.45,
              revealDelay: 0.15,
              /* The run of characters is the new word's length from the first
                 frame; the width tween above is what makes that invisible. */
              tweenLength: false,
            },
          },
          0,
        );
    };

    timer = setTimeout(swap, HOLD_MS);

    return () => {
      if (timer) clearTimeout(timer);
      flight?.kill();
      /* Back to the resting word, so a remount (or React Strict Mode's
         double-run) starts from the same place the markup does. */
      gsap.set(word, { clearProps: "width" });
      word.textContent = words[0];
    };
  }, [words, reducedMotion]);

  const first = words[0] ?? "";

  return (
    <>
      <span className="sr-only">
        {lead} {first}.
      </span>
      <span className={styles.morph} aria-hidden="true">
        {lead}{" "}
        <span className={styles.slot}>
          <span className={styles.bracket}>[</span>
          <span className={styles.word} ref={wordRef}>
            {first}
          </span>
          <span className={styles.bracket}>]</span>
        </span>
        {/* Off-screen twin of the slot's word, in the same type, that each
            swap sets to the next word to read its width off. */}
        <span className={styles.measure} ref={measureRef} />
      </span>
    </>
  );
}
