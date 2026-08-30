import { CardRow, Disclosure, type Card } from "@/components/case-study";
import ReadingListShelf from "@/components/projects/figures/ReadingListShelf";

/**
 * Beat 03 — "Theoretical Foundation".
 *
 * Three positions the thesis stands on, then the shelf of texts behind them.
 *
 * The frame draws all three cards at full strength on the orange tint — they
 * are one position in three parts, not three findings taken in turn, so nothing
 * here dims and nothing is selectable. That is the same distinction the Traces
 * frame makes between its stepped archetype row and its three refusals.
 */

/*
 * Theorist to the right of the index, the concept below — the format the frame
 * uses, and the reason the index and the name are a single mono row.
 *
 * `display` sets the concept in the sans face. The frame sets it at 24px in
 * sentence case; `fixClaim` is the only sans option the shared stylesheet
 * offers on a tinted card and it upper-cases at a larger size. Taken as the
 * closer match anyway — the face is the more distinctive of the two properties,
 * and the alternative (`outcomeHeadline`) is the page's serif, which these are
 * emphatically not.
 */
const POSITIONS: readonly Card[] = [
  {
    num: "01",
    name: "Darko Suvin",
    title: "Science Fiction",
    face: "sans",
  },
  {
    num: "02",
    name: "Dunne + Raby",
    title: "Speculative Critical Design",
    face: "sans",
  },
  {
    num: "03",
    name: "Anne Marie Willis",
    title: "Ontological Design",
    face: "sans",
  },
];

export default function Foundation({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Theoretical Foundation" id={id} anchorRef={anchorRef}>
      <CardRow cards={POSITIONS} tinted />

      {/*
       * The frame calls this "DRP READING LIST COMPONENT" — the shelf of six
       * foundational texts plus the four anthology covers behind the corpus
       * decision. The same `ReadingListShelf` the Work tab's long-form page
       * renders, imported directly rather than duplicated, so the corpus can't
       * drift between the two.
       */}
      <ReadingListShelf />
    </Disclosure>
  );
}
