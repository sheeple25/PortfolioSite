import styles from "@/components/case-study/case.module.css";
import { Disclosure, StatRow, StepList } from "@/components/case-study";
import { ARCHETYPES, ICEBERG, POEM, RESEARCH_STATS, THEMES } from "./process.data";

/**
 * The two process disclosures near the foot of the frame — Research and
 * Analysis. These stand in for what was four `[PROCESS]` rows in the frame
 * (Research, Findings, Analysis, Briefcraft): Findings is folded into Research
 * rather than kept as its own stop, and Briefcraft is dropped rather than left
 * as an empty tab — see the note on `CONTENTS` in `TracesEntry.tsx`.
 *
 * Both disclosures carry the `s-process` anchor via the first one, which is
 * where both `[Process]` rail rows point.
 */
export default function Process({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <>
      <Disclosure
        title="Research"
        tone="sub"
        defaultOpen={false}
        id={id}
        anchorRef={anchorRef}
      >
        <p className={styles.proseSmall}>
          The first step was talking to people — sixteen structured interviews,
          then a live experiment to test whether the matching logic actually
          held up.
        </p>

        <StatRow stats={RESEARCH_STATS} />

        <p className={styles.proseSmall}>
          Seven themes recurred across the interviews:
        </p>

        <div className={styles.processGrid}>
          {THEMES.map((t) => (
            <div key={t.num} className={styles.processCard}>
              <span className={styles.processCardHead}>
                <span>{t.num}</span>
              </span>
              <p className={styles.processCardTitle}>{t.title}</p>
              <p className={styles.cardNote}>{t.note}</p>
            </div>
          ))}
        </div>
      </Disclosure>

      <Disclosure title="Analysis" tone="sub" defaultOpen={false}>
        <p className={styles.proseSmall}>
          Sensemaking on the interviews kept landing on the same thing under
          every complaint: a basic desire for companionship nothing else was
          meeting. That behaviour sorted into nine archetypes, a POEM framework
          split by gender, and an iceberg model that pushed past behaviour to
          cause.
        </p>

        <div className={styles.processGrid}>
          {ARCHETYPES.map((a) => (
            <div key={a.num} className={styles.processCard}>
              <span className={styles.processCardHead}>
                <span>{a.num}</span>
              </span>
              <p className={styles.processCardTitle}>{a.title}</p>
              <p className={styles.cardNote}>{a.note}</p>
            </div>
          ))}
        </div>

        <p className={styles.proseSmall}>
          Two of them can enter a zero-sum game: the Validation Seeker getting
          compliments with no intent to meet is, by the same action, the Goody
          Two Shoes being denied the thing they came for.
        </p>

        <p className={styles.label}>POEM — women vs. men, Gen Z</p>
        <div className={styles.processGrid}>
          {POEM.map((p) => (
            <div key={p.label} className={styles.processCard}>
              <span className={styles.processCardHead}>
                <span>{p.label}</span>
              </span>
              <p className={styles.cardNote}>{p.note}</p>
            </div>
          ))}
        </div>

        <p className={styles.label}>Iceberg model</p>
        <StepList steps={ICEBERG.map((l) => ({ num: l.num, text: l.text }))} />
        <p className={styles.proseSmall}>
          The iceberg is what pushed the project past behaviour to cause — the
          loop on “So what of it?”, above, is built directly on its bottom
          layer.
        </p>
      </Disclosure>
    </>
  );
}
