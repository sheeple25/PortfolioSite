"use client";

import { Fragment, useState } from "react";
import styles from "@/components/case-study/case.module.css";
import { CASE_ASSETS, Disclosure, Stat } from "@/components/case-study";
import { FAILURES } from "./problem.data";

/**
 * Beat 01 — "Why do they suck?"
 *
 * Three modes of failure, and for each one the figures and the chart behind it.
 *
 * One piece of state runs the whole beat. Selecting a failure swaps its three
 * statistics and its figure, and lights the condition it produces in the
 * summary line at the foot — high pressure, low trust, detached from real life,
 * in the same order as the cards above them. That pairing is the argument the
 * section is making: each failure is where one of the three conditions comes
 * from, and reading them apart loses it.
 *
 * The frame draws this as three dimmed cards over a single charcoal slot, which
 * is the selector at rest with its first card chosen.
 */

/** Renders a claim with one word italicised, when the frame calls for it. */
function Claim({ text, emphasis }: { text: string; emphasis?: string }) {
  if (!emphasis) return <p className={styles.cardTitle}>{text}</p>;

  const [before, after] = text.split(emphasis);
  return (
    <p className={styles.cardTitle}>
      {before}
      <em className={styles.cardTitleItalic}>{emphasis}</em>
      {after}
    </p>
  );
}

export default function Problem({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  const [active, setActive] = useState(0);
  const failure = FAILURES[active];

  /*
   * Selection is by click, not hover.
   *
   * The other stepped rows on this page only change opacity, so moving them on
   * hover costs nothing. This one swaps a chart, and a chart that re-renders
   * every time the pointer crosses a card is unreadable. Focus selects too, so
   * the whole thing is reachable by keyboard alone.
   */
  const select = (i: number) => ({
    onClick: () => setActive(i),
    onFocus: () => setActive(i),
  });

  return (
    <Disclosure title="Why do they suck?" id={id} anchorRef={anchorRef}>
      <div className={styles.focusRow} role="tablist" aria-label="Modes of failure">
        {FAILURES.map((f, i) => (
          <button
            key={f.num}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="failure-evidence"
            className={`${styles.focusCard} ${
              i === active ? styles.focusCardActive : ""
            }`}
            {...select(i)}
          >
            <span className={`${styles.label} ${styles.labelPink}`}>{f.num}</span>
            <Claim text={f.claim} emphasis={f.emphasis} />
            <span className={`${styles.label} ${styles.labelPink}`}>{f.kind}</span>
          </button>
        ))}
      </div>

      {/*
       * Deliberately *not* keyed on the active failure.
       *
       * Remounting the row on every switch looked right — each set counts up
       * from zero — but `Stat` reveals on `useInView`, and a fresh observer on
       * an element that is already on screen doesn't reliably report before the
       * next scroll, so switching often left the figures sitting at 0.
       *
       * Keeping them mounted and keying by position instead means NumberFlow
       * sees a changed `value` and rolls from the old failure's figure to the
       * new one — 80 to 62 to 78 — which is both sturdier and a better read of
       * what the switch is doing.
       */}
      <div id="failure-evidence" role="tabpanel">
        <div className={styles.stats}>
          {failure.stats.map((s, i) => (
            <Stat key={i} {...s} />
          ))}
        </div>
        {failure.figure}
      </div>

      {/*
       * The three conditions the failures add up to. Lit by the same state, so
       * choosing a failure above says which condition it produces.
       */}
      <div className={styles.focusRow}>
        {FAILURES.map((f, i) => (
          <Fragment key={f.condition}>
            {i > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element -- local SVG
              <img
                src={`${CASE_ASSETS}/plus-inline.svg`}
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                className={styles.conditionPlus}
              />
            ) : null}
            <button
              type="button"
              className={`${styles.focusCard} ${
                i === active ? styles.focusCardActive : ""
              }`}
              aria-label={`Show the ${f.kind.toLowerCase()} behind “${f.condition}”`}
              {...select(i)}
            >
              <span className={styles.cardTitle}>{f.condition}</span>
            </button>
          </Fragment>
        ))}
      </div>
    </Disclosure>
  );
}
