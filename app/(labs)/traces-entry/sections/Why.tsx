"use client";

import styles from "@/components/case-study/case.module.css";
import { Disclosure, useFocusRow } from "@/components/case-study";
import { TRACES_ASSETS } from "./interface.data";

/**
 * Beat 02 — "So what of it?"
 *
 * The cycle the three failures add up to, drawn as a loop, then named as three
 * archetypes.
 */

/*
 * The loop figure.
 *
 * The frame draws it at absolute offsets inside a 773 x 378 box. Those numbers
 * are kept here as percentages of that box and applied inline, because they are
 * the figure's data — a coordinate list belongs next to the thing it places,
 * not split across a stylesheet as nine single-use rules.
 *
 * Everything is positioned from its own centre; see `.cycleIcon` in the
 * stylesheet for why that matters to the rotated arrows.
 */
const ICONS = [
  { src: "mask-happy.svg", left: "14.49%", top: "63.49%" },
  { src: "poker-chip.svg", left: "51.75%", top: "29.63%" },
  { src: "sword.svg", left: "89.00%", top: "61.90%" },
] as const;

const ARROWS = [
  { src: "cycle-arrow-a.svg", left: "34.74%", top: "44.44%", width: "18.17%", rotate: "154.71deg" },
  { src: "cycle-arrow-b.svg", left: "51.75%", top: "64.29%", width: "47.74%", rotate: "0deg" },
  { src: "cycle-arrow-c.svg", left: "70.50%", top: "44.44%", width: "20.18%", rotate: "-157.38deg" },
] as const;

const NOTES = [
  {
    text: "Curated profiles fuel the cycle of odds, swipes, and addiction.",
    left: "22.38%",
    top: "26.85%",
    width: "16.82%",
  },
  {
    text: "Fear of exposure pushes people to stay masked, safe, curated.",
    left: "50.06%",
    top: "81.48%",
    width: "38.81%",
    wide: true,
  },
  {
    text: "The more rigged the system, the more frequent rejection, invisibility, or humiliation.",
    left: "83.31%",
    top: "26.85%",
    width: "24.58%",
  },
] as const;

/*
 * The three archetypes.
 *
 * The frame numbers the second and third both "02" and sets only the first
 * card's title in Space Grotesk, leaving the other two in the serif. Both look
 * like drift rather than intent — the first card is the one drawn at full
 * strength, so its treatment is the finished one — so the numbering runs
 * 01/02/03 here and all three titles take the display face.
 */
const ARCHETYPES = [
  {
    num: "01",
    name: "The Masquerade",
    title: "Performative Self",
    note: "Everyone wears masks. Curating profiles, playing roles, treating others as less than fully real.",
  },
  {
    num: "02",
    name: "The Casino",
    title: "Broken Slot Machine",
    note: "The system is rigged — moods and impulses keep you coming back, but the house always wins.",
  },
  {
    num: "03",
    name: "Sword of Damocles",
    title: "Fear of Judgement",
    note: "Judgment and rejection always hang above you, the cost of the position of judgment.",
  },
] as const;

export default function Why({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  const cardProps = useFocusRow();

  return (
    <Disclosure title="So what of it?" id={id} anchorRef={anchorRef}>
      <p className={styles.prose}>
        It’s a vicious cycle where{" "}
        <span className={styles.proseMark}>users feel the need to perform</span>{" "}
        (curation), to play a rigged game (dating apps), and then feel pressure
        (judgement) which in turn feeds their need to perform.
      </p>

      <figure
        className={styles.cycle}
        aria-label="A loop between three figures: a mask, a poker chip, and a hanging sword."
        role="img"
      >
        {ARROWS.map((a) => (
          // eslint-disable-next-line @next/next/no-img-element -- local SVG, see parts.tsx
          <img
            key={a.src}
            src={`${TRACES_ASSETS}/${a.src}`}
            alt=""
            aria-hidden="true"
            className={styles.cycleArrow}
            style={{
              left: a.left,
              top: a.top,
              width: a.width,
              rotate: a.rotate,
            }}
          />
        ))}
        {ICONS.map((icon) => (
          // eslint-disable-next-line @next/next/no-img-element -- local SVG, see parts.tsx
          <img
            key={icon.src}
            src={`${TRACES_ASSETS}/${icon.src}`}
            alt=""
            aria-hidden="true"
            className={styles.cycleIcon}
            style={{ left: icon.left, top: icon.top }}
          />
        ))}
        {NOTES.map((note) => (
          <p
            key={note.left}
            className={`${styles.cycleNote} ${
              "wide" in note && note.wide ? styles.cycleNoteWide : ""
            }`}
            style={{ left: note.left, top: note.top, width: note.width }}
          >
            {note.text}
          </p>
        ))}
      </figure>

      <div className={styles.focusRow}>
        {ARCHETYPES.map((a, i) => (
          <button key={a.num} {...cardProps(i, "36", styles.archetypeCard)}>
            <span className={styles.archetypeHead}>
              <span>{a.num}</span>
              <span>{a.name}</span>
            </span>
            <span className={styles.archetypeDisplay}>{a.title}</span>
            <span className={styles.cardNote}>{a.note}</span>
          </button>
        ))}
      </div>
    </Disclosure>
  );
}
