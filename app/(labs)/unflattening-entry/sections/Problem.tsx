import styles from "@/components/case-study/case.module.css";
import {
  Chain,
  Disclosure,
  Slot,
  type ChainStep,
} from "@/components/case-study";

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
const CLAIMS: readonly ChainStep[] = [
  { label: "Claim 01", text: "Science Fiction is contextually critical." },
  {
    label: "Claim 02",
    text: "Indian SF, rooted in a postcolonial, non-Western empirical environment, offers critique that is structurally unavailable in Western SCD.",
  },
  {
    label: "Claim 03",
    text: "We can use Indian SF narratives as sites for speculative design — and thereby unflatten.",
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
       * The frame's charcoal band, labelled with its own name. The diagram that
       * belongs here already exists as `fig-0-3-1` in
       * `components/projects/figures` — kept as a slot for now so the hole stays
       * the size and shape the frame gives it rather than being quietly closed.
       */}
      <Slot label="Problem figure — four mandates, three crises" tall />

      <Chain steps={CLAIMS} />
    </Disclosure>
  );
}
