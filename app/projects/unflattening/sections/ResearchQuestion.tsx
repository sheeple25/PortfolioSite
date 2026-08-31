"use client";

import { useState } from "react";
import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";

/**
 * Beat 02 — "Research Question".
 *
 * The frame gives this beat nothing but a charcoal band labelled "FROM PDF":
 * the question is typeset in the thesis document and the frame's plan was to
 * lift that typesetting rather than reset it.
 *
 * That band is gone. The question is set here in the page's own type, which
 * says the whole thing — leaving an empty placeholder underneath only read as
 * a beat that hadn't been finished. The typeset original is a click away in
 * the thesis PDF at the foot of the page. The text is verbatim from
 * `content/projects/unflattening.md`, so the two versions of this page cannot
 * drift into asking different questions.
 *
 * The five subquestions used to render as a stacked list, all five sentences
 * at once. That was the actual complaint about this beat: too much text to
 * take in in one place. They're a tab strip now — one sentence on screen at a
 * time, the other four sitting in the strip as their number and name only.
 */

/*
 * The five subquestions, verbatim from the source. They're lenses operating
 * simultaneously rather than sequential steps — subquestions 1–3 map onto the
 * three framework stages (story analysis, profile making, brief making); 4
 * and 5 are testing and reflection. The tab strip doesn't assert an order
 * either: it opens on the first, but any of the five is a click away from any
 * other.
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
  const [active, setActive] = useState(0);
  const current = SUBQUESTIONS[active];

  return (
    <Disclosure title="Research Question" id={id} anchorRef={anchorRef}>
      <p className={styles.proseSmall}>
        How can the latent design logics within Indian Science Fiction be
        formalized into a{" "}
        <span className={styles.proseMark}>critical methodology</span> for
        reimagining the practice, pedagogy, and purpose of design, generating
        culturally coherent alternatives to its global, homogenized present?
      </p>

      <div className={styles.subquestionBox}>
        <div className={styles.subquestionTabs} role="tablist" aria-label="Subquestions">
          {SUBQUESTIONS.map((q, i) => (
            <button
              key={q.num}
              type="button"
              role="tab"
              id={`subq-tab-${q.num}`}
              aria-selected={i === active}
              aria-controls="subq-panel"
              className={`${styles.subquestionTab} ${
                i === active ? styles.subquestionTabActive : ""
              }`}
              onClick={() => setActive(i)}
            >
              <span>{q.num}</span>
              <span>{q.name}</span>
            </button>
          ))}
        </div>

        <p
          id="subq-panel"
          role="tabpanel"
          aria-labelledby={`subq-tab-${current.num}`}
          className={`${styles.proseSmall} ${styles.subquestionPanel}`}
        >
          {current.text}
        </p>
      </div>
    </Disclosure>
  );
}
