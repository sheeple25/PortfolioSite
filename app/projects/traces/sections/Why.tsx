"use client";

import { useState } from "react";
import styles from "@/components/case-study/case.module.css";
import { Disclosure } from "@/components/case-study";
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
 *
 * Index order is the cycle order — mask (0), poker chip (1), sword (2) — and
 * `ARCHETYPES` below shares it, so a node index picks out the same figure in
 * both the diagram and the card row underneath it.
 */
const ICONS = [
  { src: "mask-happy.svg", left: "14.49%", top: "63.49%" },
  { src: "poker-chip.svg", left: "51.75%", top: "29.63%" },
  { src: "sword.svg", left: "89.00%", top: "61.90%" },
] as const;

/*
 * One entry per edge of the triangle, each carrying the two node indices it
 * connects — that pairing is what lets a click on a node light up exactly the
 * two edges touching it. `aspect` is each arrow asset's own width/height
 * (their source SVGs share one height, 29.4558, so only the width varies);
 * masked elements need it spelled out because, unlike an `<img>`, they have no
 * intrinsic size of their own to size `height: auto` against.
 */
const EDGES = [
  {
    nodes: [0, 1] as const,
    arrow: { src: "cycle-arrow-a.svg", left: "34.74%", top: "44.44%", width: "18.17%", rotate: "154.71deg", aspect: 4.9043 },
    note: {
      text: "Curated profiles fuel the cycle of odds, swipes, and addiction.",
      left: "22.38%",
      top: "26.85%",
      width: "16.82%",
    },
  },
  {
    nodes: [2, 0] as const,
    arrow: { src: "cycle-arrow-b.svg", left: "51.75%", top: "64.29%", width: "47.74%", rotate: "0deg", aspect: 12.663 },
    note: {
      text: "Fear of exposure pushes people to stay masked, safe, curated.",
      left: "50.06%",
      top: "81.48%",
      width: "38.81%",
      wide: true,
    },
  },
  {
    nodes: [1, 2] as const,
    arrow: { src: "cycle-arrow-c.svg", left: "70.50%", top: "44.44%", width: "20.18%", rotate: "-157.38deg", aspect: 5.4319 },
    note: {
      text: "The more rigged the system, the more frequent rejection, invisibility, or humiliation.",
      left: "83.31%",
      top: "26.85%",
      width: "24.58%",
    },
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

/** Whether `active` is one of an edge's two endpoints — widens the tuple's
 * literal `0 | 1 | 2` element type to plain `number` so it can be compared
 * against state without a cast. */
const isOnEdge = (nodes: readonly number[], active: number) =>
  nodes.includes(active);

export default function Why({
  id,
  anchorRef,
}: {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  /*
   * One selection drives both halves of the beat: which node is "on" decides
   * which icon and archetype card sit at full strength and which two edges
   * (arrow + note) of the triangle light up around it. Starts on the mask, in
   * keeping with every other stepped row on the page opening on its first
   * item.
   */
  const [active, setActive] = useState(0);

  return (
    <Disclosure title="So what of it?" id={id} anchorRef={anchorRef}>
      <p className={styles.prose}>
        It’s a vicious cycle where{" "}
        <span className={styles.proseMark}>users feel the need to perform</span>{" "}
        (curation), to play a rigged game (dating apps), and then feel pressure
        (judgement) which in turn feeds their need to perform.
      </p>

      <figure className={styles.cycle}>
        {EDGES.map(({ arrow: a, nodes }) => (
          <span
            key={a.src}
            aria-hidden="true"
            className={`${styles.cycleArrow} ${
              isOnEdge(nodes, active) ? styles.cycleArrowActive : ""
            }`}
            style={{
              left: a.left,
              top: a.top,
              width: a.width,
              aspectRatio: a.aspect,
              rotate: a.rotate,
              WebkitMaskImage: `url(${TRACES_ASSETS}/${a.src})`,
              maskImage: `url(${TRACES_ASSETS}/${a.src})`,
            }}
          />
        ))}
        {ICONS.map((icon, i) => (
          <button
            key={icon.src}
            type="button"
            className={`${styles.cycleIcon} ${
              i === active ? styles.cycleIconActive : ""
            }`}
            style={{
              left: icon.left,
              top: icon.top,
              WebkitMaskImage: `url(${TRACES_ASSETS}/${icon.src})`,
              maskImage: `url(${TRACES_ASSETS}/${icon.src})`,
            }}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`Highlight ${ARCHETYPES[i].title}`}
          />
        ))}
        {EDGES.map(({ note, nodes }) => (
          <p
            key={note.left}
            className={`${styles.cycleNote} ${
              "wide" in note && note.wide ? styles.cycleNoteWide : ""
            } ${isOnEdge(nodes, active) ? styles.cycleNoteActive : ""}`}
            style={{ left: note.left, top: note.top, width: note.width }}
          >
            {note.text}
          </p>
        ))}
      </figure>

      <div className={styles.focusRow}>
        {ARCHETYPES.map((a, i) => (
          <button
            key={a.num}
            type="button"
            className={`${styles.focusCard} ${styles.focusCardDim} ${
              i === active ? styles.focusCardActive : ""
            } ${styles.archetypeCard}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
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
