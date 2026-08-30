import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";

/**
 * The two process teasers near the foot of the frame.
 *
 * These are the doors onto the `[PROCESS]` rows in the contents rail —
 * Research, Findings, Analysis, Briefcraft. None of that is written yet, so the
 * frame draws them collapsed and that is what they are: real disclosures, shut,
 * saying plainly what is behind them rather than opening onto nothing.
 *
 * The first carries the `s-process` anchor, which is where all four rail rows
 * point.
 */
export default function Process({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <>
      <Disclosure
        title="Interested in the research process?"
        tone="sub"
        defaultOpen={false}
        id={id}
        anchorRef={anchorRef}
      >
        <p className={styles.teaserLabel}>
          The research write-up — interviews, findings and the analysis that
          produced the three archetypes — is not published here yet.
        </p>
      </Disclosure>

      <Disclosure
        title="More process work to be found"
        tone="sub"
        defaultOpen={false}
      >
        <p className={styles.teaserLabel}>
          Briefcraft and the studio work around it are still being written up.
        </p>
      </Disclosure>
    </>
  );
}
