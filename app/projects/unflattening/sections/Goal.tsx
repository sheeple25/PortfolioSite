import { Disclosure, StepList, type Step } from "@/components/case-study";

/**
 * Beat 05 — "Goal".
 *
 * The framework's two functions. `StepList` rather than `CardRow` because the
 * frame stacks them vertically with an arrow between, which is the difference
 * between a sequence and a set — and these genuinely are sequential in reading
 * order even though the source insists they are simultaneous in operation.
 */

/*
 * Verbatim from the frame, which matches the "01 Procedural expansion / 02
 * Situated practice" pair in `content/projects/unflattening.md`.
 *
 * The frame drops the two-word names and prints only the descriptions; kept
 * that way, because at 24px the name and the description say the same thing
 * twice and the description is the half that carries the argument.
 */
const GOALS: readonly Step[] = [
  {
    num: "01",
    text: "Procedurally expanding Indian science fiction narratives into sites for critique through speculative design",
  },
  {
    num: "02",
    text: "Creating varied, unique and provocative contexts for designers, educators and students to develop the skill of inhabiting speculative realities and designing for them through repetition and practise in varied speculative scenarios.",
  },
];

export default function Goal({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Disclosure title="Goal" id={id} anchorRef={anchorRef}>
      <StepList steps={GOALS} />
    </Disclosure>
  );
}
