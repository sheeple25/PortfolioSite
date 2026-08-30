import styles from "@/components/case-study/case.module.css";

/**
 * Beat 04 — "What came of it".
 *
 * Not in the Figma frame. Added because the brief
 * (`source/Proposed Structure for Projects..md`) makes outcome the third of its
 * three required beats — "brief description + evidence" — and lists "what were
 * the outcomes / what changed" among the four things the first twenty seconds
 * has to answer. The page previously opened a loop in the banner and never
 * closed it: the argument ended on a mechanic, with nothing saying what was
 * actually produced or how far it got.
 *
 * Deliberately states the ceiling as well as the work. This was a one-week
 * college studio project and the app exists as designed screens, not as
 * something people installed, so there are no adoption figures to show and
 * inventing a proxy for them would be worse than saying so. Naming the scope
 * plainly is also the more confident move — it puts the research and the
 * interface in the frame they were actually made in.
 */
const OUTCOME = [
  {
    num: "01",
    label: "Delivered",
    headline: "Research → concept → interface",
    note: "Desk and field research, synthesis into three archetypes, the concept, the user flow, and the screens that carry it.",
  },
  {
    num: "02",
    label: "Role",
    headline: "Solo, end to end",
    note: "Research, processing, analysis and evaluation, then the build. No team — every decision on the page is mine.",
  },
  {
    num: "03",
    label: "Status",
    headline: "UI mockups",
    note: "A one-week studio project at Future Factory. Traces exists as a designed, testable interface rather than a shipped product.",
  },
] as const;

export default function Outcome({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <section className={styles.beat} id={id} ref={anchorRef}>
      <h2 className={styles.sectionHeading}>What came of it</h2>

      <p className={styles.prose}>
        Traces set out to do one thing:{" "}
        <span className={styles.proseMark}>
          match couples on campus
        </span>{" "}
        — not to grow a user base, but to make one good introduction between two
        people who were already in the same place.
      </p>

      <div className={styles.outcomeRow}>
        {OUTCOME.map((o) => (
          <div key={o.num} className={styles.outcomeCard}>
            <span className={styles.outcomeHead}>
              <span>{o.num}</span>
              <span>{o.label}</span>
            </span>
            <p className={styles.outcomeHeadline}>{o.headline}</p>
            <p className={styles.cardNote}>{o.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
