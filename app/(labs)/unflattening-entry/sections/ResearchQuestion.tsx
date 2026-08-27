import styles from "@/components/case-study/case.module.css";
import { Disclosure, Slot } from "@/components/case-study";

/**
 * Beat 02 — "Research Question".
 *
 * The frame gives this beat nothing but a charcoal band labelled "FROM PDF":
 * the question is typeset in the thesis document and the plan is to lift that
 * typesetting rather than reset it.
 *
 * The band is kept, and the question itself is printed above it. A beat that is
 * only a placeholder reads as unfinished; a beat that states its question and
 * *then* shows the figure reads as one where the figure is a treatment of
 * something already said. The text is verbatim from
 * `content/projects/unflattening.md`, so the two versions of this page cannot
 * drift into asking different questions.
 */
export default function ResearchQuestion({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Research Question" id={id} anchorRef={anchorRef}>
      <p className={styles.proseSmall}>
        How can the latent design logics within Indian Science Fiction be
        formalized into a{" "}
        <span className={styles.proseMark}>critical methodology</span> for
        reimagining the practice, pedagogy, and purpose of design, generating
        culturally coherent alternatives to its global, homogenized present?
      </p>

      <Slot label="Research question — from PDF" tall />
    </Disclosure>
  );
}
