import styles from "@/components/case-study/case.module.css";
import { Chain, type ChainStep } from "@/components/case-study";

/**
 * Beat 00 — the lede and the observation chain under it.
 *
 * The one beat in the frame with no COLLAPSE control on it: it is the page's
 * opening statement, so there is nothing to fold away. Same shape as the
 * opening of Traces and Loco Lavatory — all three frames start here.
 */

/*
 * Observation → observation → claim, verbatim from the frame.
 *
 * The middle step's label is drawn at zero opacity there. It exists to hold the
 * three columns on a shared baseline, not to be read: deleting it instead of
 * hiding it drops the middle column's text by the height of a label. `spacer`
 * is the chassis' name for that.
 */
const CHAIN: readonly ChainStep[] = [
  { label: "Observation", text: "we import futures from the West" },
  { label: "Observation", text: "but we aren’t the West, so", spacer: true },
  { label: "Claim", text: "it sucks. like really badly." },
];

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
       * The frame marks the middle clause of the lede in the accent — the
       * thesis stated in one phrase, with the sentence around it as scaffolding.
       * `proseMark` is the chassis' accent span, so the highlight follows the
       * palette rather than repeating the hex.
       */}
      <p className={styles.lede}>
        My undergraduate thesis project, where I attempt to create{" "}
        <span className={styles.proseMark}>
          a framework to procedurally expand Indian Science Fiction
        </span>{" "}
        into inhabitable context for speculative designers.
      </p>

      <Chain steps={CHAIN} />
    </section>
  );
}
