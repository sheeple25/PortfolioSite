import styles from "../board.module.css";
import Image from "next/image";
import { IMG, type Anchor } from "../parts";

/**
 * Beat 10 — the user flow, in one diagram and one paragraph.
 */
export default function Flow({ anchor }: { anchor: Anchor }) {
  return (
    <>
      <section className={styles.tint} {...anchor("s-flow")}>
        <div className={styles.stack}>
          <h3 className={styles.hand}>User Flow</h3>
          <p className={styles.noteTint}>
            You either <span className={styles.pink}>play a Situation</span> (a
            game-like hypothetical) or{" "}
            <span className={styles.pink}>upload a Trace</span> (any piece of
            media that represents you). Based on the personality your answers
            describe, you’re matched with{" "}
            <span className={styles.pink}>synergetic people</span>. You gradually
            see their Traces in AR. If you like someone’s Traces you can{" "}
            <span className={styles.pink}>request a date</span> or a{" "}
            <span className={styles.pink}>co-op activity</span> to build
            chemistry.
          </p>
          <Image
            src={`${IMG}/the-flow.webp`}
            alt="The flow: you, your Trace, the daily Situation, the system, and the pool of other users."
            width={1888}
            height={955}
            className={styles.imgWide}
          />
        </div>
      </section>
    </>
  );
}
