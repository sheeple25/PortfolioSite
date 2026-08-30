import styles from "@/components/case-study/case.module.css";
import { Carousel, Disclosure, Slot } from "@/components/case-study";
import { FEATURE_SLIDES } from "./features.data";

/**
 * Beat 03 — "The Fix: Waterless Lavatory".
 *
 * The longest frame in the file: a feature-breakdown figure, the carousel, and
 * a viewer for the model, stacked inside one disclosure. The carousel lives
 * inside this beat rather than beside it — unlike Traces, the frame puts a
 * second figure (the STL viewer) *after* it, so lifting it out would reorder
 * the beat, and folding the section should take the whole argument with it.
 */

/*
 * The five constraints, from `content/archive/loco.md` and the official FRS
 * reproduced in the portfolio (p. 11).
 *
 * Behind a nested fold, the same move Traces makes with "How does it work?":
 * the fix is only legible as a fix once you know what it had to survive, but a
 * reader who wants the object rather than the brief should not have to walk
 * through five requirements to reach it.
 */
const CONSTRAINTS: readonly { lead: string; rest: string }[] = [
  {
    lead: "Waterless.",
    rest: "No supply to draw on, anywhere in the unit.",
  },
  {
    lead: "No storage.",
    rest: "Waste exhausts directly out; nothing can be held on board.",
  },
  {
    lead: "90 days between services.",
    rest: "Between them, upkeep is the pilots' own job.",
  },
  {
    lead: "Self-cleanable.",
    rest: "With whatever is already on board.",
  },
  {
    lead: "1050 × 600mm.",
    rest: "A retrofit into an envelope that already exists, shared across two locomotive classes.",
  },
];

export default function Fix({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="The Fix: Waterless Lavatory" id={id} anchorRef={anchorRef}>
      <p className={styles.prose}>
        The breakthrough was spatial, not mechanical.{" "}
        <strong>
          The cabin layout allowed the lavatory envelope to extend above elbow
          height on one side.
        </strong>{" "}
        That reclaimed volume is what turned a claustrophobic box into something
        with air in it — which is the quality the pilots kept describing when
        asked how the space should feel.
      </p>

      <p className={styles.prose}>
        Roominess wasn’t a comfort feature here. It was the difference between a
        unit that gets used and one that gets planned around.
      </p>

      {/*
       * The frame's FEATURE BREAKDOWN IMAGE block — the exploded view with the
       * ten features called out. Not extracted from the portfolio yet, so it
       * stays a labelled slot at the size the design gives it.
       */}
      <Slot label="Feature breakdown image" />

      <Carousel heading="Explore the Unit" slides={FEATURE_SLIDES} />

      {/*
       * The frame's STL VIEWER FOR DESIGN IN VIEW block.
       *
       * A real 3D viewer is being prototyped separately in `/stl-lab`; until
       * that lands there is nothing to embed, and a still would be a different
       * feature rather than a smaller version of this one. Tall, because the
       * frame draws this block deeper than the others.
       */}
      <Slot label="STL viewer for design in view" tall />

      <Disclosure title="What it had to survive" tone="sub" defaultOpen={false}>
        {CONSTRAINTS.map((c) => (
          <p key={c.lead} className={styles.proseSmall}>
            <strong>{c.lead}</strong> {c.rest}
          </p>
        ))}
      </Disclosure>
    </Disclosure>
  );
}
