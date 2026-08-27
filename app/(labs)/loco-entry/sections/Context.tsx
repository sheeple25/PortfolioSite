import styles from "@/components/case-study/case.module.css";
import { Chain, type ChainStep } from "@/components/case-study";

/**
 * Beat 00 — the lede and the observation chain under it.
 *
 * As in the Traces frame, the one beat with no COLLAPSE control: it is the
 * page's opening statement, so there is nothing to fold away.
 */

/*
 * Observation → observation → claim, verbatim from the frame.
 *
 * The middle label is drawn at zero opacity there — it exists to hold the
 * three columns on a shared baseline, not to be read — so it is rendered as a
 * hidden spacer rather than deleted, which would drop the middle column's text
 * by the height of a label.
 */
const CHAIN: readonly ChainStep[] = [
  { label: "Observation", text: "long train journeys require in-cabin bathrooms" },
  {
    label: "Observation",
    text: "there is a retrofitted solution currently, but…",
    spacer: true,
  },
  { label: "Claim", text: "it sucks. like really badly." },
] as const;

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
       * The frame's lede, with its own emphasis kept — the frame sets
       * "selected by the Indian Railways" in Newsreader SemiBold.
       *
       * Marked with `<strong>` rather than the chassis' `proseMark`: that
       * class emphasises by colour, and on a page with no accent its colour
       * resolves to the body ink, so the phrase would come out identical to
       * the text around it. Weight is the only channel left, and `<strong>`
       * carries it without needing a new class.
       */}
      <p className={styles.lede}>
        An internship project redesigning a waterless lavatory unit for female
        locomotive pilots, <strong>selected by the Indian Railways</strong> for
        their WAG9 engines.
      </p>

      <Chain steps={CHAIN} />
    </section>
  );
}
