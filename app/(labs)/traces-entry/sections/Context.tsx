import { Fragment } from "react";
import styles from "@/components/case-study/case.module.css";
import { CASE_ASSETS } from "@/components/case-study";

/**
 * Beat 00 — the lede and the observation chain under it.
 *
 * The one beat in the frame with no COLLAPSE control on it: it is the page's
 * opening statement, so there is nothing to fold away.
 */

/*
 * Observation → observation → claim, joined by the frame's own arrow.
 *
 * The middle step's label is drawn at zero opacity in the frame — it exists to
 * hold the three columns on a shared baseline, not to be read. Rendered as a
 * hidden spacer rather than deleted, because deleting it drops the middle
 * column's text by the height of a label.
 */
const CHAIN: readonly {
  label: string;
  text: string;
  spacer?: boolean;
}[] = [
  { label: "Observation", text: "people are lonely" },
  { label: "Observation", text: "dating apps exist, but…", spacer: true },
  { label: "Claim", text: "they suck" },
] as const;

/** The frame's exported arrow, sitting in the gaps between steps. */
function ChainArrow() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG, see parts.tsx
    <img
      src={`${CASE_ASSETS}/arrow-straight.svg`}
      alt=""
      aria-hidden="true"
      className={styles.chainArrow}
    />
  );
}

export default function Context({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <section className={styles.beat} id={id} ref={anchorRef}>
      {/*
       * Placeholder copy, verbatim from the frame — the lede has not been
       * written yet. Left in rather than invented so the gap stays obvious.
       */}
      <p className={styles.lede}>
        Design research project exploring how technology shapes relationships, resulting in Traces — a reimagined dating solution tested on campus.
      </p>

      <div className={styles.chain}>
        {CHAIN.map((step, i) => (
          <Fragment key={step.label + i}>
            {i > 0 ? <ChainArrow /> : null}
            <div className={styles.chainStep}>
              <p
                className={styles.label}
                aria-hidden={step.spacer || undefined}
                style={step.spacer ? { opacity: 0 } : undefined}
              >
                {step.label}
              </p>
              <p className={styles.chainStepText}>{step.text}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
