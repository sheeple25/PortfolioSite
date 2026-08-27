import styles from "../board.module.css";
import { type Anchor } from "../parts";
import { NEGATIONS } from "./negations.data";

/**
 * Beat 9 — the reveal, and the three things Traces deliberately does not do.
 */
export default function Introducing({ anchor }: { anchor: Anchor }) {
  return (
    <>
      <section className={styles.introSection} {...anchor("s-traces")}>
        <div className={styles.introInner}>
          <p className={styles.heart} aria-hidden="true">
            ♡
          </p>
          <p className={styles.introKicker}>introducing</p>
          <h2 className={styles.introTitle}>Traces</h2>
          <p className={styles.introLine}>
            Traces is a <span className={styles.pink}>low pressure</span> way of
            connecting <span className={styles.pink}>in the real world.</span>
          </p>
          <div className={styles.negations}>
            {NEGATIONS.map((n) => (
              <div key={n.title} className={styles.negation}>
                <h4 className={styles.negationTitle}>{n.title}</h4>
                <p className={styles.negationBody}>{n.body}</p>
                <p className={styles.negationGain}>{n.gain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
