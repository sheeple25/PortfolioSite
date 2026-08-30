import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";
import FigMethodology from "@/components/projects/figures/FigMethodology";

/**
 * Beat 04 — "Method".
 *
 * The line above the figure is condensed from
 * `content/projects/unflattening.md` — the oscillation between narrative work
 * and theoretical grounding, and the three stages the framework runs in. Both
 * are in the source; neither is invented. `FigMethodology` renders
 * `Fig Methodolgy.svg` from `public/projects`, the framework diagram itself.
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

      <FigMethodology />
    </Disclosure>
  );
}
