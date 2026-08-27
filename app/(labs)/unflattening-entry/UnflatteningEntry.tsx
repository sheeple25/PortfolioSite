"use client";

import Banner, { BannerImage, type MetaField } from "@/components/case-study/Banner";
import {
  ActionRow,
  CaseShell,
  MoreProjects,
  type ContentsRow,
} from "@/components/case-study";
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
 * This is a lab alternative, not a replacement. `/projects/unflattening` still
 * renders the markdown long-form, and the copy here is drawn from that same
 * source (`content/projects/unflattening.md`) rather than written fresh, so the
 * two never drift into saying different things.
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
    href: "/archive/traces",
    blurb: "A low-pressure way of connecting in the real world. No swiping.",
    studio: "Future Factory",
    term: "Fall 2025",
    cover: "/archive/traces-hero.webp",
  },
  {
    title: "Loco Lavatory",
    href: "/archive/loco",
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
          {/*
           * Placeholder texture. `content/projects/unflattening.md` carries no
           * `cover` in its frontmatter and there is no photograph for this
           * project under `public/projects/`, so the banner borrows the cover of
           * the anthology the whole corpus was drawn from — which is at least
           * the right object, if not the right crop. Swap it for the real
           * banner art when one exists; nothing but this line changes.
           */}
          <BannerImage src="/projects/books/gollancz-i.png" />
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
           * The frame's "See the full document / DOWNLOAD PDF" row.
           *
           * There is no thesis PDF under `public/` yet — `public/cv` holds only
           * the CV — and a download link that 404s is worse than one that goes
           * somewhere true, so this points at the long-form the site already
           * renders and takes the arrow rather than the download mark. The
           * moment the PDF lands, this becomes a path to it plus
           * `icon="download"`, and nothing else moves.
           */}
          <ActionRow
            label="See the full document"
            action="Read the full argument"
            href="/projects/unflattening"
            icon="arrow"
          />

          <MoreProjects projects={NEIGHBOURS} />
        </>
      )}
    </CaseShell>
  );
}
