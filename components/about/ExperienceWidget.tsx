import { EXPERIENCE } from "@/lib/about/experience";
import styles from "./ExperienceWidget.module.css";

/**
 * The CV, as a sticky note pinned to the desktop.
 *
 * This replaces the logo marquee that used to run under the masthead. The
 * marquee was recognition without information — seven marks at equal weight,
 * only four of which were employers — so it could not answer the one question
 * a hiring reader brings to this page. See `lib/about/experience.ts` for what
 * dropped out of that set and why.
 *
 * **Conventional CV layout, not cards.** The first pass laid the four roles
 * out as a row of cards across the desk, which spent the desktop's whole width
 * on four short entries and still had to clamp the descriptions. A stacked
 * list in the ordinary CV shape — employer and dates on one line, title under
 * it — fits the same four roles into a fraction of the space and is the form a
 * reader already knows how to scan. The note takes a corner instead of a
 * band.
 *
 * The logos are gone with the cards. At sticky-note scale a mark would be a
 * 12px smudge next to the name it duplicates, and the names are doing the work
 * here.
 *
 * Deliberately static. Everything else in this sandbox moves; the CV should be
 * the one surface that just sits there and can be read.
 */
export default function ExperienceWidget() {
  return (
    <section className={styles.note} aria-labelledby="experience-heading">
      <h3 id="experience-heading" className={styles.heading}>
        Experience
      </h3>

      <ul className={styles.list}>
        {EXPERIENCE.map((role) => (
          <li key={role.company} className={styles.role}>
            {/*
              Employer and dates share a line, pushed apart — the CV convention,
              and the reason the note can be narrow: the two shortest fields
              take one line between them instead of one each.
            */}
            <p className={styles.line}>
              <span className={styles.company}>{role.company}</span>
              <span className={styles.dates}>{role.dates}</span>
            </p>
            <p className={styles.title}>{role.title}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
