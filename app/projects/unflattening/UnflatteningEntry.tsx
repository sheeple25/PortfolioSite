"use client";

import Banner, { type MetaField } from "@/components/case-study/Banner";
import {
  CaseShell,
  MoreProjects,
  type ContentsRow,
} from "@/components/case-study";
import Grid from "./Grid";
import Context from "./sections/Context";
import Foundation from "./sections/Foundation";
import Goal from "./sections/Goal";
import Method from "./sections/Method";
import Problem from "./sections/Problem";
import ResearchQuestion from "./sections/ResearchQuestion";

/**
 * The Unflattening thesis, rebuilt from the Figma frame `Unflattening_Attempt 2`
 * (node 232:12450).
 *
 * The chassis — banner, three-margin layout, contents rail, disclosures, and
 * the shared type and spacing — lives in `components/case-study`, and is the
 * same one Traces and Loco Lavatory are built on. Everything below is what is
 * genuinely Unflattening's: its orange, its six beats, its theorists.
 *
 * This is the Work tab's Unflattening. It replaced the markdown long-form that
 * used to render at this URL, and its copy was drawn from that file before it
 * was removed — so the argument here is the one the thesis made, compressed to
 * six beats rather than rewritten.
 */

/**
 * Unflattening's orange, read off the frame.
 *
 * `accent` is the mark colour on the lede (#ffa554) and `tint` the 8% wash the
 * theoretical-foundation cards sit on — both taken from the frame rather than
 * chosen. `deep` and `stage` are not set: nothing on this page puts type on the
 * tint at a size where the accent stops being legible, and there is no carousel
 * here to need a stage, so the chassis' neutral defaults stand.
 */
const PALETTE = {
  accent: "#ffa554",
  tint: "rgba(255, 165, 84, 0.08)",
};

/**
 * The spec row, verbatim from the frame.
 *
 * Four fields rather than Traces' five. "Location" carries CEPT rather than a
 * sticker: the frame draws no institution marks on this banner, so `Banner`
 * gets no `institutions` and renders none.
 */
const META: MetaField[] = [
  { value: "CEPT University", label: "Location" },
  { value: "Thesis", label: "Proj Type" },
  { value: "4 Months", label: "Timeline" },
  { value: "Spring 2026", label: "Term" },
];

/**
 * The spine.
 *
 * Six rows, none tagged — unlike Traces there is no `[PROCESS]` tail here,
 * because the process *is* the project. The framework, the profiles and the
 * briefs are all downstream of Method, and the frame folds them into the long
 * document rather than teasing them as separate beats.
 */
const CONTENTS: ContentsRow[] = [
  { num: "00", title: "Context", target: "s-context" },
  { num: "01", title: "Problem", target: "s-problem" },
  { num: "02", title: "Research Question", target: "s-question" },
  { num: "03", title: "Theoretical Foundation", target: "s-foundation" },
  { num: "04", title: "Method", target: "s-method" },
  { num: "05", title: "Goal", target: "s-goal" },
];

/**
 * The frame draws two identical placeholder cards here. Filled with the two
 * projects that actually neighbour this one in the Work tab.
 */
const NEIGHBOURS = [
  {
    title: "Traces",
    href: "/projects/traces",
    blurb: "A low-pressure way of connecting in the real world. No swiping.",
    studio: "Future Factory",
    term: "Fall 2025",
    cover: "/archive/traces-hero.webp",
  },
  {
    title: "Loco Lavatory",
    href: "/projects/loco",
    blurb:
      "A waterless lavatory for the locomotive pilots the original forgot.",
    studio: "Desmania",
    term: "Fall 2024",
    cover: "/archive/loco-hero.webp",
  },
];

export default function UnflatteningEntry() {
  return (
    <CaseShell
      palette={PALETTE}
      contents={CONTENTS}
      banner={
        <Banner title="Unflattening." meta={META}>
          <Grid />
        </Banner>
      }
      marginNote="Interested? Check out the full document. It's a fun read!"
    >
      {(at) => (
        <>
          <Context {...at("s-context")} />
          <Problem {...at("s-problem")} />
          <ResearchQuestion {...at("s-question")} />
          <Foundation {...at("s-foundation")} />
          <Method {...at("s-method")} />
          <Goal {...at("s-goal")} />

          {/*
           * The frame's "See the full document / DOWNLOAD PDF" row is not
           * rendered yet, and deliberately so.
           *
           * It used to point at `/projects/unflattening` — the long-form
           * markdown translation of the thesis. This page *is* that URL now,
           * so the row would link to itself. There is still no thesis PDF
           * under `public/` (`public/cv` holds only the CV), which leaves the
           * row with nowhere true to go.
           *
           * The moment the PDF lands, this comes back as an `ActionRow` with
           * that path and `icon="download"`, and nothing else moves.
           */}

          <MoreProjects projects={NEIGHBOURS} />
        </>
      )}
    </CaseShell>
  );
}
