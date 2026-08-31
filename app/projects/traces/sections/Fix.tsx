import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";
import FigTracesFlow from "@/components/projects/figures/FigTracesFlow";

/**
 * Beat 03 — "The Fix: Traces".
 *
 * The proposal stated as three refusals, the flow that follows from them, and a
 * nested disclosure explaining how the thing actually works.
 */

/*
 * Three cards, each a principle and the thing it rules out.
 *
 * Unlike the earlier rows these are not stepped — the frame draws all three at
 * full strength on a magenta tint, because they are one statement in three
 * parts rather than three findings taken in turn.
 *
 * The frame numbers the second and third both "02"; corrected to 02 and 03, the
 * same slip as the archetype row in the previous beat.
 */
const PRINCIPLES = [
  { num: "01", name: "More Intention", claim: "No swiping." },
  { num: "02", name: "Less Curation", claim: "No profiles." },
  { num: "03", name: "Deeper Connection", claim: "No cold starts." },
] as const;

export default function Fix({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="The Fix: Traces" id={id} anchorRef={anchorRef}>
      <p className={styles.prose}>
        A low pressure way of connecting in the real world.
      </p>

      <div className={styles.fixRow}>
        {PRINCIPLES.map((p) => {
          /*
           * Forced onto two lines rather than left to wrap naturally: "No
           * cold starts." wraps to two on its own at this card width while
           * "No swiping." and "No profiles." sit on one, so the three cards
           * held mismatched heights. Breaking every claim after its first
           * word gives all three the same two-line shape.
           */
          const [firstWord, ...rest] = p.claim.split(" ");
          return (
            <div key={p.num} className={styles.fixCard}>
              <span className={styles.fixHead}>
                <span>{p.num}</span>
                <span>{p.name}</span>
              </span>
              <p className={styles.fixClaim}>
                {firstWord}
                <br />
                {rest.join(" ")}
              </p>
            </div>
          );
        })}
      </div>

      <FigTracesFlow label="User flow — you, your Trace, the system, and the pool of others" />

      {/*
       * A disclosure inside a disclosure. The frame gives this its own smaller
       * head and its own COLLAPSE control, so it folds independently of the
       * beat around it — the mechanics are for readers who want them, and the
       * three refusals above are the answer for readers who don't.
       *
       * Collapsed by default: the three refusals above already answer the
       * beat for a reader passing through, and this is the mechanics for one
       * who stops to ask.
       */}
      <Disclosure title="How does it work?" tone="sub" defaultOpen={false}>
        <p className={styles.proseSmall}>
          You as a user either play a situation (game like hypothetical) or
          upload a Trace (any piece of media that represents you). Based on your
          personality (which is derived from situation answers), you are matched
          with synergetic people. You gradually see their Traces (in AR). If you
          like someone’s Traces, you can either request a date or a co-op
          activity to build chemistry.
        </p>
      </Disclosure>
    </Disclosure>
  );
}
