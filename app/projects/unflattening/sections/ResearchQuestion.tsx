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

/*
 * The five subquestions, verbatim from the source. They're lenses operating
 * simultaneously rather than sequential steps — subquestions 1–3 map onto the
 * three framework stages (story analysis, profile making, brief making); 4
 * and 5 are testing and reflection. That's why they're rendered as a plain
 * stacked list rather than `Chain`, whose arrows would assert an order these
 * explicitly refuse.
 */
const SUBQUESTIONS: readonly { num: string; name: string; text: string }[] = [
  {
    num: "01",
    name: "Analysis",
    text: "How does design manifest within each selected narrative — through what objects, interfaces or systems, and what do they imply about the world?",
  },
  {
    num: "02",
    name: "Extrapolation",
    text: "What new forms of designer agency and expertise are required for this world to function?",
  },
  {
    num: "03",
    name: "Briefcraft",
    text: "How can a functional design brief be generated from within this world logic, using its constraints as creative parameters?",
  },
  {
    num: "04",
    name: "Testing",
    text: "How can the core proposition of such a brief be materialized through prototype or scenario?",
  },
  {
    num: "05",
    name: "Synthesis",
    text: "What does this process reveal about current design frameworks and the potential for culturally specific practices?",
  },
];
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

      <div className={styles.subquestionList}>
        {SUBQUESTIONS.map((q) => (
          <div className={styles.subquestion} key={q.num}>
            <p className={styles.label}>
              {q.num} — {q.name}
            </p>
            <p className={styles.proseSmall}>{q.text}</p>
          </div>
        ))}
      </div>

      <Slot label="Research question — from PDF" tall />
    </Disclosure>
  );
}
