import { Fragment } from "react";
import styles from "@/components/case-study/case.module.css";
import { CASE_ASSETS, Disclosure } from "@/components/case-study";

/**
 * Beat 00 — the lede and the observation chain under it.
 *
 * The lede and chain carry no fold of their own — this is the page's opening
 * statement, always visible. The formal design brief sits underneath them in
 * its own collapsed sub-disclosure, the same pattern Fix.tsx uses for "How
 * does it work?": the informal version is what a reader passing through
 * gets, the brief is for one who stops to ask.
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

      {/*
       * The design brief, condensed from the board's own Project Brief /
       * Product Brief pair (`source/traces-extract/traces_extract.txt`).
       * Folded by default, the same way Fix.tsx tucks "How does it work?"
       * under the three refusals — the lede above already carries the page's
       * opening statement, so this is the formal version for a reader who
       * stops to ask, not a replacement for it.
       */}
      <Disclosure title="Read the design brief" tone="sub" defaultOpen={false}>
        <p className={styles.proseSmall}>
          <strong className={styles.proseStrong}>Problem area.</strong>{" "}
          Initiating romantic connections online feels high-pressure,
          low-trust and detached from how relationships naturally begin
          offline.
        </p>
        <p className={styles.proseSmall}>
          <strong className={styles.proseStrong}>Intervention.</strong> The
          intervention aims to augment — not replace — the natural ways
          relationships begin in real life, weaving technology in as a
          scaffold rather than a substitute.
        </p>
      </Disclosure>
    </section>
  );
}
