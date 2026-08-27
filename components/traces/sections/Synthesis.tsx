import styles from "../board.module.css";
import Image from "next/image";
import { IMG, SectionRule, type RuleAnchor } from "../parts";
import { LOOP } from "./loop.data";

/**
 * Beat 7 — The House Always Wins, the closed loop the research landed on.
 */
export default function Synthesis({ ruleAnchor }: { ruleAnchor: RuleAnchor }) {
  return (
    <>
      <SectionRule label="Synthesis" {...ruleAnchor("s-synthesis")} />

      <section className={styles.tint}>
        <div className={styles.stack}>
          <h3 className={styles.synthTitle}>“The House Always Wins”</h3>
          <p className={styles.noteTint}>
            A vicious cycle where users feel the{" "}
            <span className={styles.pink}>need to perform</span> (curation), so
            they <span className={styles.pink}>play a rigged game</span> (dating
            apps), and then <span className={styles.pink}>feel pressure</span>{" "}
            (judgement) — which in turn feeds their need to perform.
          </p>
          <Image
            src={`${IMG}/house-always-wins.webp`}
            alt="The closed loop: the Masquerade, the Casino, the Sword of Damocles."
            width={1860}
            height={1180}
            className={styles.imgWide}
          />
          <div className={styles.loopGrid}>
            {LOOP.map((l) => (
              <div key={l.title} className={styles.loopCard}>
                <h4 className={styles.loopTitle}>{l.title}</h4>
                <p className={styles.loopSub}>{l.sub}</p>
                <p className={styles.loopBody}>{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
