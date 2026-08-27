import styles from "@/components/case-study/case.module.css";
import { CardRow, Disclosure, Slot, type Card } from "@/components/case-study";

/**
 * Beat 01 — "Why does it suck?" (rail row "Loco Pilot Bathrooms Suck").
 *
 * The frame draws this as a titled disclosure over a single charcoal block
 * reading FILL CONTENT FROM PDF. The content is now filled, from the
 * evaluation pages of the Spring 25 portfolio (pp. 11–13) and from
 * `content/archive/loco.md`; the block itself survives as the photograph of
 * the current unit, which does not exist as an asset yet.
 */

/*
 * The eight faults of the existing unit, from the portfolio's "Evaluation of
 * Current Solution".
 *
 * Set as prose rather than as a numbered list on purpose. The chassis' only
 * numbered vertical form is `StepList`, which threads an arrow between its
 * entries and so reads as a sequence — these are eight simultaneous faults of
 * one object, not eight steps. Marked lead-ins keep the scannability the
 * numbering was doing.
 */
const FAULTS: readonly { lead: string; rest: string }[] = [
  {
    lead: "A sheet metal box on a raised platform.",
    rest: "Nothing about it signals that it is a urinal, so nobody arrives with an expectation of what state it will be in.",
  },
  {
    lead: "Light and sanitiser both out of reach.",
    rest: "Positioned where a user standing in the unit cannot get to them.",
  },
  {
    lead: "Cramped to the point of claustrophobia.",
    rest: "And too short for anyone above about 176cm.",
  },
  {
    lead: "The combination Indo-Western pan fights its own ergonomics.",
    rest: "Footrests sit at the wrong width and height relative to the seat, and the pilots dislike combination units outright.",
  },
  {
    lead: "It is not suited to menstrual needs.",
    rest: "Which is the group the brief singled out.",
  },
  {
    lead: "It does fit its footprint.",
    rest: "And leaves space wasted beside the unit and above the deadweight that nobody had claimed.",
  },
];

/*
 * Underneath the eight faults sit two problems that produce them.
 *
 * Tinted cards, the treatment the chassis uses for a statement rather than a
 * finding — these are the diagnosis the rest of the project is answering, so
 * they are one claim in two parts rather than two more observations.
 */
const ROOTS: readonly Card[] = [
  {
    num: "01",
    name: "Maintainability",
    title: "Filth outlasts the service interval",
    display: true,
    note: "Excess touchpoints, no water, and nowhere to keep cleaning materials — so dirt accumulates across the full 90 days and the unit gets less usable the longer it goes.",
  },
  {
    num: "02",
    name: "Splashback",
    title: "Standing urination in a tight geometry",
    display: true,
    note: "Aiming, careless use and the unit's own geometry, accumulating between cleans on a vehicle that is moving the whole time.",
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
    <Disclosure title="Why does it suck?" id={id} anchorRef={anchorRef}>
      <p className={styles.prose}>
        The existing unit is a sheet metal box retrofitted into the cabin. What
        the pilots described was avoidance, not usage — they plan their water
        intake around the timetable so they can use a station instead.
      </p>

      {/*
       * The frame's charcoal block. Kept as a labelled slot: the portfolio has
       * the annotated photograph of the current unit on p. 13, but it has not
       * been extracted as an asset, and closing the hole would quietly lose a
       * figure the design asks for.
       */}
      <Slot label="Current unit — annotated photo" />

      {FAULTS.map((fault) => (
        <p key={fault.lead} className={styles.prose}>
          <strong>{fault.lead}</strong> {fault.rest}
        </p>
      ))}

      <p className={styles.prose}>Two problems sit underneath all of it.</p>

      <CardRow cards={ROOTS} tinted />
    </Disclosure>
  );
}
