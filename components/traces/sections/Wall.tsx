import styles from "../board.module.css";
import { wallRows } from "../wallText";

/**
 * Beat 1 — the scrolling wall of interview lines, the title plate, and the
 * hook line beneath it.
 *
 * The hook docks at the top of the viewport and holds there while the tail of
 * the wall finishes scrolling out underneath it, then releases into normal
 * flow. See `.leadStage` in the stylesheet for how that hold is built.
 */
/*
 * 16 rows, round-robin — closer together than the original 12 under the same
 * `flex column, space-evenly` container, still few enough that each row reads
 * as a sentence rather than a wrapped paragraph.
 */
const WALL_ROWS = wallRows(16);

/*
 * Per-row duration and delay, deterministic (this renders on the server, so
 * `Math.random()` would mismatch on hydration). The `* 29` step is coprime
 * with the 70s spread, so `(i * 29) % 70` visits a wide, non-repeating set of
 * offsets rather than counting up in lockstep with the row index — no two
 * adjacent rows land on the same speed, and nothing reads as sorted.
 */
const wallRowDuration = (i: number) => 150 + ((i * 29) % 70);
const wallRowDelay = (i: number) => i * 1.2;

/**
 * The lead spec sheet — project type, term, studio, role, timeline, tools.
 * Held here rather than pulled from `content/archive/traces.md` because this
 * lab is a bespoke translation, not the CMS-driven entry — every other string
 * on the board is hardcoded the same way.
 */
const PROJECT_META = [
  { label: "Type", value: "Design Research Studio" },
  { label: "Term", value: "Fall 2025" },
  { label: "Studio", value: "Future Factory, CEPT University" },
  { label: "Role", value: "Solo — research, synthesis, concept, interface" },
  { label: "Timeline", value: "TK" },
  { label: "Tools", value: "TK" },
] as const;
export default function Wall() {
  return (
    <>
      <section id="s-wall" className={styles.wallSection}>
        <div className={styles.wallRows} aria-hidden="true">
          {WALL_ROWS.map((row, i) => (
            <div key={i} className={styles.wallRow}>
              <div
                className={
                  i % 2 === 0
                    ? styles.wallRowTrack
                    : `${styles.wallRowTrack} ${styles.wallRowTrackReverse}`
                }
                style={
                  {
                    "--row-duration": `${wallRowDuration(i)}s`,
                    "--row-delay": `${wallRowDelay(i)}s`,
                  } as React.CSSProperties
                }
              >
                <span>{row}&nbsp; &nbsp;·&nbsp; &nbsp;</span>
                <span>{row}&nbsp; &nbsp;·&nbsp; &nbsp;</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.wallInner}>
          <h1 className={styles.wallHero}>Traces</h1>
          <dl className={styles.wallMeta}>
            {PROJECT_META.map((m) => (
              <div key={m.label} className={styles.wallMetaRow}>
                <dt className={styles.wallMetaLabel}>{m.label}</dt>
                <dd className={styles.wallMetaValue}>{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className={styles.leadStage}>
        <div className={styles.lead}>
          <div className={styles.leadInner}>
            <p className={styles.leadHook}>
              A look into how technology mediates romance, and why dating
              apps don’t work.
            </p>
          </div>
        </div>
        <div className={styles.leadHold} aria-hidden="true" />
      </div>
    </>
  );
}
