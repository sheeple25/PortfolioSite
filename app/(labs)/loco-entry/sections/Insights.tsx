import styles from "@/components/case-study/case.module.css";
import { CardRow, Disclosure, type Card } from "@/components/case-study";

/**
 * Beat 02 — "Research Insights" (rail row "I Found Out Why").
 *
 * The frame draws this as a charcoal block reading FILL CONTENT FROM PDF with
 * a second line under it: SHOULD INCLUDE WHERE INSIGHTS ARE FROM (LIVE USER
 * INTERVIEWS). That second note is a requirement, not a caption — so the
 * provenance is stated in the beat itself rather than left to be inferred, and
 * the block is gone because the content it was holding open now exists.
 */

/*
 * What the pilots do, from the site visit at Tughlaqabad loco shed.
 *
 * Plain cards, not tinted: these are findings taken one at a time, and the
 * chassis reserves the tint for a statement.
 */
const BEHAVIOUR: readonly Card[] = [
  {
    num: "01",
    name: "Avoidance",
    title: "They don't go while moving",
    note: "Most squat or hover rather than make contact, and would rather wait than use the unit under way.",
  },
  {
    num: "02",
    name: "The stop",
    title: "15–20 minutes at a station",
    note: "They plan their water intake around the timetable. That window, not the cabin, is the real design constraint.",
  },
  {
    num: "03",
    name: "Empty-handed",
    title: "They carry nothing in",
    note: "Everything stays in the cabin, because inside the unit there is nowhere to put anything down.",
  },
];

/*
 * What they asked for, unprompted. The basin and dustbin were stated most
 * strongly of everything on the list, which is why that card leads.
 */
const WANTS: readonly Card[] = [
  {
    num: "01",
    name: "Stated hardest",
    title: "A basin and a dustbin",
    note: "Asked for more strongly than anything else on the list, and absent from the current unit entirely.",
  },
  {
    num: "02",
    name: "The conflict",
    title: "Water, for menstrual sanitation",
    note: "The one place the waterless constraint genuinely collides with the user it was written for.",
  },
  {
    num: "03",
    name: "The feeling",
    title: "Room to turn around",
    note: "Space, a railing, no evidence of prior use, and not having to carry water and pads in themselves.",
  },
];

export default function Insights({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Research Insights" id={id} anchorRef={anchorRef}>
      {/*
       * Provenance first. The frame asks for it explicitly, and it is what
       * separates these findings from a list of assumptions: two pilots, in
       * the shed, standing next to the thing.
       */}
      <p className={styles.teaserLabel}>
        Primary data — a site visit to Tughlaqabad Loco Shed, where we saw the
        current unit in place and interviewed two female locomotive pilots. Both
        chose to remain anonymous and asked not to be quoted directly.
      </p>

      <p className={styles.prose}>
        Every insight below is theirs. The brief had singled out female loco
        pilots as the group the existing design does not account for; the
        interviews are where that stopped being a line in a requirements
        document.
      </p>

      <CardRow cards={BEHAVIOUR} />

      <p className={styles.prose}>
        And when shown existing female waterless urinals, they were neutral.{" "}
        <strong>They couldn’t relate to any of them.</strong>
      </p>

      <CardRow cards={WANTS} />
    </Disclosure>
  );
}
