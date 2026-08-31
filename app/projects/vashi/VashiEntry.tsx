"use client";

import {
  Banner,
  BannerImage,
  CaseShell,
  Disclosure,
  MoreProjects,
  StatRow,
  type ContentsRow,
  type Institution,
  type MetaField,
} from "@/components/case-study";
import styles from "@/components/case-study/case.module.css";

/**
 * Vashi ISL — the same chassis as Traces, Loco and Unflattening, carrying far
 * less content on purpose.
 *
 * There's no decision-log spine here because the work isn't individually
 * attributable: two designers shared one Figma file for the whole engagement,
 * and there was never a reconstruction of who did which screen (see
 * `cv/Vidush_CV_Master_Source.md` §3.3, open action #3). Three short beats
 * instead of the usual five-plus: what this is, why it's thin, and the shape
 * of the engagement as a whole rather than a screen-by-screen account.
 *
 * The logo is baked into `cover` server-side (sharp), not a live `logo:`
 * overlay like Kobble's — that overlay showed a ghosted double image in
 * Chrome for this specific asset (a single, correctly-decoded `<img>`,
 * confirmed by DOM/pixel/hash inspection, that still painted doubled on
 * screen; cause unresolved). Regenerate via a sharp composite onto a
 * `#3D79BB` canvas if the mark or its size needs to change.
 *
 * Sized down to 72% and recentred at y=320 (of the 1920×1100 canvas) rather
 * than dead centre (y=550) — `.bannerImage` crops with `object-position: 50%
 * 35%` and only the top slice of the frame clears `.bannerPlate`'s
 * bottom-anchored title/meta block at typical viewport widths, so a
 * centred mark sat under the plate's text.
 *
 * **Palette confirmed off `vashi-hero.webp`** (average of an 8×8 downsample
 * via sharp) — a flat `#3d79bb` fill, Vashi's own brand blue.
 */

const PALETTE = {
  accent: "#3d79bb",
  tint: "rgba(61, 121, 187, 0.05)",
  deep: "#274f79",
  stage: "#e9eef5",
};

const META: MetaField[] = [
  { value: "Digital / UI Design", label: "Proj Type" },
  { value: "UI/UX Intern", label: "Role" },
  { value: "Figma", label: "Tools" },
  { value: "Mar – Jun 2025", label: "Timeline" },
  { value: "Spring 2025", label: "Term" },
];

/*
 * Vashi's own domain, confirmed via search (vashiisl.com) rather than
 * guessed — the company also runs a separate corp.vashiisl.com, but the
 * consumer-facing root is the one worth linking a reader out to.
 */
const INSTITUTIONS: Institution[] = [
  { name: "PwC", role: "Studio", href: "https://www.pwc.in", tilt: -4 },
  { name: "Vashi", role: "Client", href: "https://vashiisl.com", tilt: 3.5 },
];

const CONTENTS: ContentsRow[] = [
  { num: "00", title: "Context", target: "s-context" },
  { num: "01", title: "Why This Stays Short", target: "s-attribution" },
  { num: "02", title: "The Shape Of The Engagement", target: "s-shape" },
];

const NEIGHBOURS = [
  {
    title: "Kobble",
    href: "/projects/kobble",
    blurb: "A pre-launch dating product, still mostly under wraps.",
    studio: "Srivco",
    term: "2024 – Present",
    cover: "/archive/kobble-hero.webp",
  },
  {
    title: "Loco Lavatory",
    href: "/projects/loco",
    blurb: "A retrofittable waterless lavatory for Indian Railways, designed around the pilots the existing fleet forgot.",
    studio: "Desmania",
    term: "Fall 2024",
    cover: "/archive/loco-hero.webp",
  },
];

export default function VashiEntry() {
  return (
    <CaseShell
      contents={CONTENTS}
      palette={PALETTE}
      backHref="/archive"
      backLabel="Archive"
      banner={
        <Banner title="Vashi ISL" meta={META} institutions={INSTITUTIONS}>
          <BannerImage
            src="/archive/vashi-hero.webp"
            alt="The Vashi Integrated Solutions logo in white, over solid brand blue."
          />
        </Banner>
      }
      marginNote="Ask Pixel what I remember doing, screen by screen — the honest version, not the tidy one."
    >
      {(at) => {
        const context = at("s-context");
        return (
        <>
          {/*
           * No COLLAPSE control, matching Context.tsx on every other case
           * study — it's the page's opening statement, so there's nothing to
           * fold away. `.lede` (full `--ink`) rather than `.prose`
           * (`--ink-soft`) is also what puts this line at the same weight as
           * Traces' and Loco's own opening lines.
           */}
          <section className={styles.beat} id={context.id} ref={context.anchorRef}>
            <p className={styles.lede}>
              Vashi Integrated Solutions runs a B2B industrial-goods
              marketplace — I worked its redesign as one of four PwC client
              projects, in a shared Figma file with one other designer.
            </p>
          </section>

          <Disclosure title="Why This Stays Short" {...at("s-attribution")}>
            <p className={styles.prose}>
              There&rsquo;s no clean way to{" "}
              <span className={styles.proseMark}>attribute individual
              screens</span> after the fact.
            </p>
            <p className={styles.proseSmall}>
              Two of us worked this in one file. Rather than claim specific
              work that might not be mine, this stays a summary of scope and
              role — ask and I&rsquo;ll walk you through what I remember
              doing.
            </p>
          </Disclosure>

          <Disclosure title="The Shape Of The Engagement" {...at("s-shape")}>
            <p className={styles.prose}>
              I reviewed{" "}
              <span className={styles.proseMark}>20+ competitors</span> to
              ground the direction.
            </p>
            <p className={styles.proseSmall}>
              Then worked across components, cards, buttons, pages and flows
              through a roughly weekly revision cycle. The client steered
              toward a competitor-led look and pushed back on more
              exploratory directions — one of four client projects across
              three commercial sectors plus government, run in the same four
              months.
            </p>

            <StatRow stats={[{ value: 20, suffix: "+", label: "Competitors reviewed" }]} />
          </Disclosure>

          <MoreProjects projects={NEIGHBOURS} indexHref="/archive" />
        </>
        );
      }}
    </CaseShell>
  );
}
