import styles from "../board.module.css";
import Image from "next/image";
import { IMG, type Anchor } from "../parts";
import { FEATURES } from "./features.data";

/**
 * Beat 12 — each feature paired with the research finding behind it.
 */
export default function Features({ anchor }: { anchor: Anchor }) {
  return (
    <>
      <section className={styles.tint} {...anchor("s-features")}>
        <div className={styles.stack}>
          <h3 className={styles.hand}>Features vs. Research</h3>
          <div className={styles.featGrid}>
            {FEATURES.map((f) => (
              <div key={f.feature} className={styles.feat}>
                <Image
                  src={`${IMG}/${f.img}.webp`}
                  alt={`${f.feature} screen`}
                  width={461}
                  height={961}
                  className={styles.featPhone}
                />
                <div className={styles.featBody}>
                  <p className={styles.featLabel}>Problem</p>
                  <p className={styles.featProblem}>{f.problem}</p>
                  <p className={styles.featLabel}>Solution Feature</p>
                  <h4 className={styles.featName}>{f.feature}</h4>
                  <p className={styles.featNote}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
