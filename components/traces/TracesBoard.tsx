"use client";

import Problem from "./sections/Problem";
import Analysis from "./sections/Analysis";
import Brief from "./sections/Brief";
import Features from "./sections/Features";
import Flow from "./sections/Flow";
import InShort from "./sections/InShort";
import Introducing from "./sections/Introducing";
import QA from "./sections/QA";
import Research from "./sections/Research";
import Synthesis from "./sections/Synthesis";
import Themes from "./sections/Themes";
import Ui from "./sections/Ui";
import Wall from "./sections/Wall";
import type { Anchor, RuleAnchor } from "./parts";
import styles from "./board.module.css";

/**
 * The nav spine. Exported so the shelled variant can build a table of contents
 * from the same list the sections are keyed by — there is one source for both,
 * so a renamed beat can't drift out of sync with its nav row.
 *
 * `registered` marks a beat that exists on the board but has no nav row. Those
 * are anchored and handed to the reader like any other, they just aren't
 * offered as a destination: the board still carries its original Synthesis and
 * Design Brief sections, and the UI screens close it out, but the confirmed nav
 * structure is the six titled rows below. Keeping them in one list — rather
 * than leaving them implicit in the JSX, which is where they used to live — is
 * what makes that a stated decision instead of a discrepancy to rediscover.
 */
export const BOARD_SECTIONS = [
  { id: "s-problem", title: "Dating Apps Suck" },
  { id: "s-research", title: "I Find Out Why" },
  { id: "s-traces", title: "The Fix: Traces" },
  { id: "s-analysis", title: "Analysis [Process]" },
  { id: "s-flow", title: "User Flow [Process]" },
  { id: "s-features", title: "Features v Research [Process]" },
] as const;

/**
 * Anchored on the board, deliberately absent from the nav above.
 *
 * The nav names are final; two of the sections they point at are not, and
 * these three are the remainder of the board's original structure that hasn't
 * had its pass yet.
 */
export const UNLISTED_SECTIONS = ["s-synthesis", "s-brief", "s-ui"] as const;

export type BoardProps = {
  /**
   * `bleed` is the board on its own — the full window, no chrome.
   * `shell` is the board inside the archive reading frame: contents rail on the
   * left, Pixel's margin on the right, plates still running full width beneath
   * both.
   */
  variant?: "bleed" | "shell";
  /**
   * Supplied by the shelled variant so the contents rail can highlight the beat
   * currently under the reading line. `ReaderContext` tracks by measurement
   * rather than IntersectionObserver, so it needs the elements themselves.
   */
  register?: (id: string, element: HTMLElement | null) => void;
};

/**
 * A straight web translation of the Traces board PDF — same content, same
 * order, same argument. Nothing here is the new content model; this exists to
 * answer one question, which is how the board's structure actually flows when
 * it stops being a 36,000px image and becomes a page.
 *
 * What changed in translation, deliberately:
 *  - every figure counts up when it scrolls into view (the board sets them as
 *    static type, and the count-up is the thing being tested)
 *  - the section rhythm is full-bleed light/dark alternation rather than one
 *    continuous scroll, so each argument beat gets an edge
 *  - the diagrams stay as extracted crops; the typography is rebuilt as real
 *    text so it reflows
 *
 * The board's display face is a marker hand we don't have. No custom font
 * stands in for it — the marker-hand classes (`.hand`, `.handLarge`,
 * `.introKicker`, `.introTitle`, `.introLine`) fall back to the system
 * `cursive` face.
 *
 * This file is the running order and nothing else. Each beat is its own file
 * under `./sections`, owning its own markup and its own content; what they
 * share is in `./parts`. It was previously one 861-line component with all
 * thirteen beats inline and their data arrays below them, which meant editing
 * any one of them meant loading all of it.
 */
export default function TracesBoard({
  variant = "bleed",
  register,
}: BoardProps) {
  /*
   * One ref callback per beat. In `bleed` there is no reader to register with,
   * so this collapses to `undefined` and the sections carry a plain id.
   */
  const anchor: Anchor = (id) =>
    register
      ? { id, ref: (el: HTMLElement | null) => register(id, el) }
      : { id };

  const ruleAnchor: RuleAnchor = (id) =>
    register
      ? { id, anchorRef: (el: HTMLElement | null) => register(id, el) }
      : { id };

  return (
    <main
      className={
        variant === "shell" ? `${styles.board} ${styles.inShell}` : styles.board
      }
    >
      <Wall />
      <Problem anchor={anchor} />
      <InShort />
      <Research ruleAnchor={ruleAnchor} />
      <Themes />
      <Analysis ruleAnchor={ruleAnchor} />
      <Synthesis ruleAnchor={ruleAnchor} />
      <Brief ruleAnchor={ruleAnchor} />
      <Introducing anchor={anchor} />
      <Flow anchor={anchor} />
      <QA />
      <Features anchor={anchor} />
      <Ui anchor={anchor} />
    </main>
  );
}
