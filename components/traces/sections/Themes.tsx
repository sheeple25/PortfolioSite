import styles from "../board.module.css";
import { THEMES } from "./themes.data";

/**
 * Beat 5 — the interview themes, as the board grouped them.
 */
export default function Themes() {
  return (
    <>
      <section className={styles.light}>
        <div className={styles.stack}>
          <p className={styles.kicker}>Themes, Findings, Observations</p>
          <div className={styles.themeGrid}>
            {THEMES.map((t) => (
              <div key={t.title} className={styles.theme}>
                <h4 className={styles.themeTitle}>{t.title}</h4>
                <ol className={styles.themeList}>
                  {t.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
