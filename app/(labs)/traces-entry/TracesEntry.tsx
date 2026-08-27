"use client";

import Banner, {
  type Institution,
  type MetaField,
} from "@/components/case-study/Banner";
import {
  CaseShell,
  Carousel,
  MoreProjects,
  type ContentsRow,
} from "@/components/case-study";
import Wall from "./Wall";
import Context from "./sections/Context";
import Fix from "./sections/Fix";
import { INTERFACE_SLIDES } from "./sections/interface.data";
import Outcome from "./sections/Outcome";
import Problem from "./sections/Problem";
import Process from "./sections/Process";
import Why from "./sections/Why";

/**
 * The Traces case study, rebuilt from the Figma frame `Traces_Attempt`
 * (node 230:10461).
 *
 * The chassis — banner, three-margin layout, contents rail, disclosures, and
 * the shared type and spacing — lives in `components/case-study`, and is the
 * same one Loco Lavatory and Unflattening are built on. Everything below is
 * what is genuinely Traces': its magenta, its wall of failure modes, its beats.
 *
 * The old board translation is still rendered, untouched, at `/traces-board`.
 */

/** Traces' magenta. Every accent on the page reads through these four tokens. */
const PALETTE = {
  accent: "#ee15a5",
  tint: "rgba(238, 21, 165, 0.04)",
  deep: "#9a2f77",
  stage: "#f3e7ef",
};

const META: MetaField[] = [
  { value: "Design Research", label: "Proj Type" },
  { value: "Solo", label: "Role" },
  /*
   * The full stack was Figma, After Effects and Humanify (the survey platform
   * the research ran on). Only the first two are listed: the row is five fields
   * across a 772px block, and a third tool crowds its neighbours. Humanify is
   * recorded here rather than dropped.
   */
  { value: "Figma, After Effects", label: "Tools" },
  { value: "1 Week", label: "Timeline" },
  { value: "Fall 2025", label: "Term" },
];

const INSTITUTIONS: Institution[] = [
  {
    name: "Future Factory",
    role: "Studio",
    // TODO: confirm — expected subdomain, not verified against the live site.
    href: "https://futurefactory.cept.ac.in",
    tilt: -5,
  },
  {
    name: "CEPT University",
    role: "Institution",
    href: "https://cept.ac.in",
    tilt: 3.5,
  },
];

/**
 * The spine.
 *
 * The frame numbers these 00–08 but skips 05; that is a slip rather than a
 * statement, so the numbering here is sequential. The four `[PROCESS]` rows all
 * point at the teaser standing in for the unwritten research write-up, which is
 * where a reader following them should actually land.
 */
const CONTENTS: ContentsRow[] = [
  { num: "00", title: "Context", target: "s-context" },
  { num: "01", title: "Dating Apps Suck", target: "s-problem" },
  { num: "02", title: "I Found Out Why", target: "s-why" },
  { num: "03", title: "The Fix: Traces", target: "s-traces" },
  { num: "04", title: "What Came Of It", target: "s-outcome" },
  { num: "05", title: "Research", tag: "[Process]", target: "s-process" },
  { num: "06", title: "Findings", tag: "[Process]", target: "s-process" },
  { num: "07", title: "Analysis", tag: "[Process]", target: "s-process" },
  { num: "08", title: "Briefcraft", tag: "[Process]", target: "s-process" },
];

const NEIGHBOURS = [
  {
    title: "Unflattening",
    href: "/projects/unflattening",
    blurb: "Reading a comics thesis as an interface rather than a document.",
    studio: "Thesis",
    term: "2026",
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

export default function TracesEntry() {
  return (
    <CaseShell
      palette={PALETTE}
      contents={CONTENTS}
      banner={
        <Banner title="Traces" meta={META} institutions={INSTITUTIONS}>
          <Wall />
        </Banner>
      }
      marginNote="I recommend you start with the Design Manifesto — ask Pixel if you want the short version."
    >
      {(at) => (
        <>
          <Context {...at("s-context")} />
          <Problem {...at("s-problem")} />
          <Why {...at("s-why")} />
          <Fix {...at("s-traces")} />
          <Carousel heading="Explore the Interface" slides={INTERFACE_SLIDES} />
          <Outcome {...at("s-outcome")} />
          <Process {...at("s-process")} />
          <MoreProjects projects={NEIGHBOURS} />
        </>
      )}
    </CaseShell>
  );
}
