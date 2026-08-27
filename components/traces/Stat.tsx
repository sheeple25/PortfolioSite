"use client";

import NumberFlow from "@number-flow/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import styles from "./board.module.css";

type StatProps = {
  /** The number to count to. */
  value: number;
  /** Rendered flush against the digits — "%", "$", "B". */
  suffix?: string;
  prefix?: string;
  /** Digits after the decimal point. 1.96% needs two; everything else needs none. */
  decimals?: number;
  /** The caption under the figure. */
  label: string;
  /** Footnote marker from the board's source list. */
  note?: string;
  /** The board sets one stat per group in magenta — usually the damning one. */
  accent?: boolean;
};

/**
 * A single figure from the board, counting up when it scrolls into view.
 *
 * The board sets these as static type; on the web the count-up is the whole
 * point of the section, so the number holds at zero until it is actually seen
 * rather than animating past off-screen. `once` keeps it from re-running every
 * time the reader scrolls back up.
 */
export default function Stat({
  value,
  suffix,
  prefix,
  decimals = 0,
  label,
  note,
  accent,
}: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  /*
   * Derived, not stored. `useInView` already flips exactly once, so the figure
   * can simply *be* zero until then — NumberFlow sees the prop change from 0 to
   * the target on that render and animates the difference itself. Holding a
   * duplicate copy in state and syncing it from an effect would buy nothing and
   * cost a cascading render.
   */
  const n = inView ? value : 0;

  return (
    <div className={styles.stat} ref={ref}>
      <div className={accent ? styles.statFigureAccent : styles.statFigure}>
        {prefix && <span className={styles.statAffix}>{prefix}</span>}
        <NumberFlow
          value={n}
          format={{
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }}
          /*
            The board's transition is a hard cut between sections, so the
            figures should land rather than drift — a short spring with no
            bounce reads closest to type snapping into place.
          */
          transformTiming={{ duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" }}
          spinTiming={{ duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" }}
          opacityTiming={{ duration: 300, easing: "ease-out" }}
        />
        {suffix && <span className={styles.statAffix}>{suffix}</span>}
      </div>
      <p className={styles.statLabel}>
        {label}
        {note && <sup className={styles.statNote}>{note}</sup>}
      </p>
    </div>
  );
}
