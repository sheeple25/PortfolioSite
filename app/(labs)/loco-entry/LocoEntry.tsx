"use client";

import Banner, {
  BannerImage,
  type Institution,
  type MetaField,
} from "@/components/case-study/Banner";
import {
  CaseShell,
  MoreProjects,
  type ContentsRow,
} from "@/components/case-study";
import Context from "./sections/Context";
import Fix from "./sections/Fix";
import Insights from "./sections/Insights";
import Problem from "./sections/Problem";
import Process from "./sections/Process";

/**
 * Loco Lavatory, rebuilt from the Figma frame `LocoLav_Attempt`
 * (node 232:11647).
 *
 * Same chassis as Traces — banner, three-margin layout, contents rail,
 * disclosures — from `components/case-study`. Everything below is Loco's:
 * its photograph, its beats, and the fact that it has no accent colour.
 *
 * **No `palette` prop, deliberately.** `case.module.css` declares the full
 * token set on `.page` with neutral defaults, so passing nothing renders the
 * page monochrome. That is the design: Loco is a locomotive lavatory in sheet
 * metal and there is no brand here to borrow a colour from. The absence is a
 * decision, not an unfinished palette — hence this comment, so nobody
 * "fixes" it later.
 */

/*
 * The spec row.
 *
 * The frame's row and `content/archive/loco.md` disagree, and the markdown
 * wins: it is the maintained content that the live `/archive/loco` page is
 * built from, and it matches the CV (Desmania, Jul – Sept 2024). The frame
 * says "1 Month" / "Fall 2025", which are Traces' values left behind when the
 * frame was duplicated, and files "Lead Designer" under PROJ TYPE — a role in
 * a slot meant for the kind of project. So the role gets its own `Role` label
 * here, exactly as Traces does, and PROJ TYPE carries the discipline.
 *
 * Tools are the frame's, which nothing else in the repo records.
 */
const META: MetaField[] = [
  { value: "Transport Design", label: "Proj Type" },
  { value: "Transport Design Intern", label: "Role" },
  { value: "Rhino, Solidworks, Keyshot", label: "Tools" },
  { value: "Jul – Sept 2024", label: "Timeline" },
  { value: "Fall 2024", label: "Term" },
];

/**
 * Two marks: the studio the internship was at, and the client the brief came
 * from. Loco is the one project on the site with an external client, and
 * saying so in the banner is most of what makes it read differently from the
 * studio work around it.
 */
const INSTITUTIONS: Institution[] = [
  {
    name: "Desmania",
    role: "Studio",
    // TODO: confirm — the studio's own domain, not verified against the site.
    href: "https://www.desmania.com",
    tilt: -4.5,
  },
  {
    name: "Indian Railways",
    role: "Client",
    href: "https://indianrailways.gov.in",
    tilt: 3,
  },
];

/**
 * The spine.
 *
 * The frame numbers these 00–04 and then jumps to 06, the same slip Traces'
 * frame makes; numbered sequentially here. The frame's two mid-page
 * disclosures are "Why does it suck?" and "Research Insights", which are the
 * page bodies of rail rows 01 and 02 — the rail states them as claims and the
 * sections ask them as questions.
 *
 * Both `[Process]` rows point at the same teaser: neither write-up exists yet,
 * and that teaser is where a reader following either row should actually land.
 */
const CONTENTS: ContentsRow[] = [
  { num: "00", title: "Context", target: "s-context" },
  { num: "01", title: "Loco Pilot Bathrooms Suck", target: "s-problem" },
  { num: "02", title: "I Found Out Why", target: "s-insights" },
  { num: "03", title: "The Fix: Waterless Lavatory Unit", target: "s-fix" },
  { num: "04", title: "Research", tag: "[Process]", target: "s-process" },
  { num: "05", title: "Design Iterations", tag: "[Process]", target: "s-process" },
];

const NEIGHBOURS = [
  {
    title: "Traces",
    href: "/archive/traces",
    blurb: "A week of design research into why dating apps fail, and one fix.",
    studio: "Future Factory",
    term: "Fall 2025",
    cover: "/archive/traces-hero.webp",
  },
  {
    title: "Unflattening",
    href: "/projects/unflattening",
    blurb: "Reading a comics thesis as an interface rather than a document.",
    studio: "Thesis",
    term: "2026",
  },
];

export default function LocoEntry() {
  return (
    <CaseShell
      contents={CONTENTS}
      banner={
        <Banner title="Loco Lavatory" meta={META} institutions={INSTITUTIONS}>
          {/*
           * The banner texture. The frame fills it with a photograph rather
           * than Traces' scrolling wall, which is what `BannerImage` is for —
           * the cover already used by `/archive/loco`, so the two pages open
           * on the same image.
           */}
          <BannerImage src="/archive/loco-hero.webp" />
        </Banner>
      }
      marginNote="Ask Pixel about the loco shed visit — that is where the brief stopped being a document."
    >
      {(at) => (
        <>
          <Context {...at("s-context")} />
          <Problem {...at("s-problem")} />
          <Insights {...at("s-insights")} />
          <Fix {...at("s-fix")} />
          <Process {...at("s-process")} />
          <MoreProjects projects={NEIGHBOURS} />
        </>
      )}
    </CaseShell>
  );
}
