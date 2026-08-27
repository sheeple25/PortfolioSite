import styles from "../board.module.css";
import Image from "next/image";
import { IMG, type Anchor } from "../parts";

/**
 * Beat 13 — the full screen flow map.
 */
export default function Ui({ anchor }: { anchor: Anchor }) {
  return (
    <>
      <section className={styles.uiSection} {...anchor("s-ui")}>
        <h3 className={styles.handLarge}>UI Screens and Flows</h3>
        <Image
          src={`${IMG}/ui-flow-map.webp`}
          alt="The full screen flow map — onboarding, Situations, creating a Trace, viewing Traces, matches, co-op activities and date planning."
          width={1920}
          height={3242}
          className={styles.uiMap}
        />
      </section>
    </>
  );
}
