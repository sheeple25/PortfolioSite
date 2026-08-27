import styles from "@/components/case-study/case.module.css";
import { Disclosure, Slot } from "@/components/case-study";

/**
 * Beat 04 — "Method".
 *
 * Like Research Question, the frame gives this beat a single charcoal band and
 * nothing else. The band is kept and a line is put above it, for the same
 * reason: the figure is a treatment of a claim, and the claim should be
 * readable without it.
 *
 * The line is condensed from `content/projects/unflattening.md` — the
 * oscillation between narrative work and theoretical grounding, and the three
 * stages the framework runs in. Both are in the source; neither is invented.
 */
export default function Method({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Method" id={id} anchorRef={anchorRef}>
      <p className={styles.proseSmall}>
        Theory and practice run{" "}
        <span className={styles.proseMark}>simultaneously</span>, not in
        alternating steps: every chapter carries both the narrative work and the
        research grounding for it. Three stages come out of that — story
        analysis, profile making, brief making — read the world, read the
        designer that world produces, then commission from inside it.
      </p>

      <Slot label="Method figure" tall />
    </Disclosure>
  );
}
