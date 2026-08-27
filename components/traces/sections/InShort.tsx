import styles from "../board.module.css";
import { TextScramble } from "@/components/motion-primitives/text-scramble";

/**
 * Beat 3 — the three-word verdict, sitting directly under the selector as in
 * the reference mockup.
 *
 * The board's static "Three failures" section that used to follow is
 * deliberately gone — it was three more copies of the same stats and charts
 * that `ProblemSelector` above now shows interactively.
 */
export default function InShort() {
  return (
    <>
      <section className={styles.tint}>
        <div className={styles.inShort}>
          <p className={styles.inShortLead}>In short, current solutions are:</p>
          <div className={styles.qualities}>
            <TextScramble as="span" className={styles.quality} duration={1} speed={0.03}>
              HIGH PRESSURE
            </TextScramble>
            <TextScramble as="span" className={styles.quality} duration={1.2} speed={0.03}>
              LOW TRUST
            </TextScramble>
            <TextScramble as="span" className={styles.quality} duration={1.4} speed={0.03}>
              DETACHED FROM IRL
            </TextScramble>
          </div>
          <ol className={styles.sources}>
            <li>Cross River Therapy</li>
            <li>DR Research</li>
            <li>Forbes</li>
            <li>Pew Research Center</li>
            <li>Grand View Research</li>
            <li>Match Group</li>
          </ol>
        </div>
      </section>
    </>
  );
}
