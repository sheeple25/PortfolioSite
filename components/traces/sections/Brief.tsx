import styles from "../board.module.css";
import { SectionRule, type RuleAnchor } from "../parts";

/**
 * Beat 8 — the project and product briefs, and the requirements they set.
 */
export default function Brief({ ruleAnchor }: { ruleAnchor: RuleAnchor }) {
  return (
    <>
      <SectionRule label="Design Brief" {...ruleAnchor("s-brief")} />

      <section className={styles.light}>
        <div className={styles.briefGrid}>
          <div className={styles.brief}>
            <p className={styles.briefKicker}>Project Brief // Problem Area</p>
            <p className={styles.briefBody}>
              Initiating romantic connections online often feels{" "}
              <span className={styles.pink}>high-pressure, low-trust,</span> and{" "}
              <span className={styles.pink}>detached</span> from the way
              relationships naturally begin offline.
            </p>
          </div>
          <div className={styles.brief}>
            <p className={styles.briefKicker}>Product Brief // Intervention</p>
            <p className={styles.briefBody}>
              The intervention aims to <em>augment</em> — not replace — the
              natural ways relationships begin in real life, by weaving
              technology in as a <span className={styles.pink}>scaffold</span>{" "}
              rather than a substitute.
            </p>
          </div>
        </div>
        <div className={styles.reqs}>
          {["Augments IRL", "Is fun to experience", "Makes starts easier"].map((r) => (
            <span key={r} className={styles.req}>
              <span className={styles.reqMark}>×</span> {r}
            </span>
          ))}
          {["Ambient Discovery", "Anti Judgement", "Enables Friends"].map((r) => (
            <span key={r} className={styles.reqPlus}>
              <span className={styles.reqMark}>+</span> {r}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
