import styles from "@/components/case-study/case.module.css";
import { Chain, Disclosure, type ChainStep } from "@/components/case-study";
import Fig031 from "@/components/projects/figures/Fig031";

/**
 * Beat 01 — "Problem".
 *
 * The diagnosis, the figure that carries it, and the three claims that answer
 * it. The frame puts the claims *inside* this beat rather than in a beat of
 * their own, which is the right call: the proposition only reads as a response
 * if the problem is still on screen above it.
 */

/*
 * The proposition, verbatim from the frame, which in turn matches the three
 * claims in the markdown. Rendered as a chain rather than a card row because
 * they are sequential — each claim is only available once the one before it has
 * been granted.
 *
 * The frame labels them "CLaim 01" (a typo), "CLAIM 02", "CLAIM 03"; the chain
 * upper-cases its labels in CSS, so all three are written plainly here.
 */
/*
 * `grow` levels the row. The three claims are 41, 137 and 88 characters, so at
 * equal widths the middle column runs to something like three times the height
 * of the first and the row reads as one broken column between two short ones.
 * Wrap height falls as width rises, so the widths are weighted towards the
 * text each column carries — softened rather than strictly proportional,
 * because a column narrow enough to be "correct" for the first claim can't set
 * a word like "contextually" without looking cramped.
 */
const CLAIMS: readonly ChainStep[] = [
  {
    label: "Claim 01",
    text: "Science Fiction is contextually critical.",
    grow: 1,
  },
  {
    label: "Claim 02",
    text: "Indian SF, rooted in a postcolonial, non-Western empirical environment, offers critique that is structurally unavailable in Western SCD.",
    grow: 2.2,
  },
  {
    label: "Claim 03",
    text: "We can use Indian SF narratives as sites for speculative design — and thereby unflatten.",
    grow: 1.6,
  },
];

export default function Problem({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Problem" id={id} anchorRef={anchorRef}>
      {/*
       * The frame leaves this line as a designer's note — "4 problems + 3
       * crises from PDF" — pointing at the figure below rather than saying
       * anything itself. Replaced with the actual diagnosis from
       * `content/projects/unflattening.md`.
       *
       * Listed in the compounding order the source gives them rather than as a
       * set: designing for a generic user is what makes a design scalable
       * across markets, which is what makes extraction efficient, which
       * requires a future imported from wherever the capital already is.
       */}
      <p className={styles.proseSmall}>
        Four mandates run through design as it is dominantly practiced — the
        homogenization mandate, the fiction of neutrality, complicity in
        extraction, and the outsourced imagination. Downstream of them sit three
        crises: of imagination, of relevance, of agency. This is{" "}
        <span className={styles.proseMark}>flattening</span>.
      </p>

      {/*
       * Fig 0.3.1 — the same diagram the long-form markdown renders as
       * `diagram:fig-0-3-1`, imported directly rather than through that
       * registry since this beat isn't markdown-driven.
       */}
      <Fig031 label="Fig 0.3.1 — Four mandates and three crises" />

      {/* Top-aligned: three parallel claims, read across from a shared line. */}
      <Chain steps={CLAIMS} align="top" />
    </Disclosure>
  );
}
