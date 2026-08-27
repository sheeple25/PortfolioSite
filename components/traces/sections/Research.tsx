import styles from "../board.module.css";
import Image from "next/image";
import Stat from "../Stat";
import { IMG, SectionRule, type RuleAnchor } from "../parts";

/**
 * Beat 4 — interviews, methods, and the real-life matchmaking experiment.
 */
export default function Research({ ruleAnchor }: { ruleAnchor: RuleAnchor }) {
  return (
    <>
      <SectionRule label="Research" {...ruleAnchor("s-research")} />

      <section className={styles.light}>
        <div className={styles.researchRow}>
          <div className={styles.researchBody}>
            <p className={styles.kicker}>User Interviews</p>
            <h3 className={styles.researchTitle}>
              The first step was to talk to{" "}
              <span className={styles.pink}>users.</span>
            </h3>
            <div className={styles.statRow}>
              <Stat value={16} label="respondents" />
              <div className={styles.stat}>
                <div className={styles.statFigure}>20–25</div>
                <p className={styles.statLabel}>age group</p>
              </div>
            </div>
            <p className={styles.note}>
              Exhaustive interviews of over 16 interviewees on their thoughts on
              matchmaking solutions, and their experience using them, was the
              primary driving force behind the direction of the intervention.
            </p>
          </div>
          <figure className={styles.researchFig}>
            <Image
              src={`${IMG}/interview-dashboard.webp`}
              alt="The interview analysis dashboard."
              width={679}
              height={816}
              className={styles.img}
            />
          </figure>
        </div>

        <div className={styles.stack}>
          <p className={styles.kicker}>Other Research Methods</p>
          <Image
            src={`${IMG}/method-cards.webp`}
            alt="Four IDEO method cards: Character Profile, Fly on the Wall, Card Sort, Try it Yourself."
            width={1840}
            height={800}
            className={styles.imgWide}
          />
        </div>

        <div className={styles.researchRow}>
          <div className={styles.researchBody}>
            <p className={styles.kicker}>Matchmaking Experiment</p>
            <h3 className={styles.researchTitle}>
              I tried all this out <span className={styles.pink}>in real life.</span>
            </h3>
            <div className={styles.statRow}>
              <Stat value={14} label="respondents" />
              <Stat value={400} prefix="~" label="discrete datapoints" />
              <Stat value={3} decimals={0} prefix="~0" label="matches" accent />
            </div>
            <p className={styles.note}>
              I interviewed 14 male and female students from around the CEPT
              campus. They told me about their fears and hopes, their
              insecurities and their biggest flexes. With all of this
              information, it became clear that value-based matching was the
              only possible solution for my intervention.
            </p>
          </div>
          <figure className={styles.researchFig}>
            <Image
              src={`${IMG}/matchmaking-card.webp`}
              alt="A matchmaking card from the experiment, with a gradient, an audio waveform and a written profile."
              width={679}
              height={960}
              className={styles.img}
            />
          </figure>
        </div>
      </section>
    </>
  );
}
