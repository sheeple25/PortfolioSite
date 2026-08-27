import styles from "../board.module.css";
import Image from "next/image";
import { IMG } from "../parts";
import { QA } from "./qa.data";

/**
 * Beat 11 — the board's own FAQ, alternating side to side.
 */
export default function QaBeat() {
  return (
    <>
      <section className={styles.tint}>
        <div className={styles.qaStack}>
          {QA.map((q, i) => (
            <div
              key={q.q}
              className={i % 2 === 0 ? styles.qaRow : styles.qaRowReverse}
            >
              <div className={styles.qaBody}>
                <h4 className={styles.qaTitle}>{q.q}</h4>
                <p className={styles.noteTint}>{q.a}</p>
              </div>
              <Image
                src={`${IMG}/${q.img}.webp`}
                alt={q.alt}
                width={1008}
                height={760}
                className={styles.img}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
