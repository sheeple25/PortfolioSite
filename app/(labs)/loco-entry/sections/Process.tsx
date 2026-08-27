import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";

/**
 * The two process teasers at the foot of the frame, drawn collapsed with an
 * EXPAND control on each.
 *
 * These are the doors onto the `[Process]` rows in the contents rail. Neither
 * write-up exists yet, so they are exactly what the frame draws: real
 * disclosures, shut, saying plainly what is behind them rather than opening
 * onto nothing.
 *
 * The first carries the `s-process` anchor, which is where both rail rows
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
        title="Research Process and Live Interviews"
        tone="sub"
        defaultOpen={false}
        id={id}
        anchorRef={anchorRef}
      >
        <p className={styles.teaserLabel}>
          The full research write-up — the FRS, the desk research, the loco shed
          visit and the interview transcripts the insights were drawn from — is
          not published here yet.
        </p>
      </Disclosure>

      <Disclosure title="Design Iterations" tone="sub" defaultOpen={false}>
        <p className={styles.teaserLabel}>
          Sketching, the moodboard the airiness concept came out of, and the
          form development between it and the final unit are still being written
          up.
        </p>
      </Disclosure>
    </>
  );
}
