import styles from "../board.module.css";
import Image from "next/image";
import { IMG, Plate, SectionRule, type RuleAnchor } from "../parts";

/**
 * Beat 6 — sensemaking, archetypes, POEM and the iceberg.
 */
export default function Analysis({ ruleAnchor }: { ruleAnchor: RuleAnchor }) {
  return (
    <>
      <SectionRule label="Analysis" {...ruleAnchor("s-analysis")} />

      <section className={styles.light}>
        <Plate
          kicker="Sensemaking"
          src="sensemaking-map"
          alt="The mindmap produced from the interview data."
          w={1920}
          h={1520}
          note="In the mindmapping process the original intention of the user, no matter the manifestation in terms of verbiage, seemed to stem from a basal desire for companionship — a hole left unfilled by daily activity."
        />
        <Plate
          kicker="Archetype Modelling"
          src="archetypes"
          alt="Nine user archetypes plotted on five axes."
          w={1860}
          h={2260}
          note="Behaviour was distilled to nine core archetypes. They matter because any given user’s behaviour affects other users — in some scenarios two archetypes enter a zero-sum game, where the Validation Seeker getting compliments with no intent to meet means the Goody Two Shoes is denied the thing they came for."
        />

        <div className={styles.stack}>
          <p className={styles.kicker}>POEM Framework</p>
          <Image
            src={`${IMG}/poem-women.webp`}
            alt="POEM analysis for women aged 19–25."
            width={1820}
            height={1000}
            className={styles.imgWide}
          />
          <p className={styles.note}>
            The POEM analysis for women brought attention to a fundamental issue
            with online dating platforms — that they’re not <em>fun</em>.
            Something as universal and anticipated as romance should be
            enjoyable, and ODPs make the process stressful at multiple points.
          </p>
          <Image
            src={`${IMG}/poem-men.webp`}
            alt="POEM analysis for men aged 20–24."
            width={1820}
            height={885}
            className={styles.imgWide}
          />
          <p className={styles.note}>
            For men the problem set is different. The foremost concern stems
            from the gender imbalance — competition, a felt need to be
            performative, and a self-esteem hit for the majority who struggle to
            get matches.
          </p>
        </div>

        <Plate
          kicker="Iceberg Model"
          src="iceberg"
          alt="Iceberg model: observable behaviours, patterns and trends, structure, mental model."
          w={1860}
          h={1260}
          note="The iceberg helped arrive at the core causes of user behaviour, and shed light on why the current situation is unfulfilling."
        />
      </section>
    </>
  );
}
