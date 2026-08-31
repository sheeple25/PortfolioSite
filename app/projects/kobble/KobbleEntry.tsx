"use client";

import {
  Banner,
  BannerVideo,
  CaseShell,
  Disclosure,
  MoreProjects,
  StatRow,
  type ContentsRow,
  type MetaField,
} from "@/components/case-study";
import styles from "@/components/case-study/case.module.css";

/**
 * Kobble — the same chassis as Traces, Loco and Unflattening, carrying far
 * less content on purpose.
 *
 * There is no decision-log spine here because there isn't one to publish: the
 * mechanism the whole product runs on — matching and scoring — is held back
 * from every public surface (see `cv/Vidush_CV_Master_Source.md` §7.1). Three
 * short beats instead of the usual five-plus: what this is, what's off the
 * page, and what actually is mine to show. Nothing here should grow past that
 * without the confidentiality line itself moving first.
 *
 * **Palette sampled off `kobble-hero.webp` via sharp** (average of an 8×8
 * downsample) rather than guessed — the asset's gradient runs orange into
 * magenta, and `#ee6e3b` landed on the orange end, clear of Traces' own
 * `#ee15a5` pink so the two don't read as the same brand.
 */

const PALETTE = {
  accent: "#ee6e3b",
  tint: "rgba(238, 110, 59, 0.05)",
  deep: "#a8451f",
  stage: "#f7ede3",
};

const META: MetaField[] = [
  { value: "Product Design", label: "Proj Type" },
  { value: "Product Designer", label: "Role" },
  { value: "Figma", label: "Tools" },
  { value: "Apr 2024 – Present", label: "Timeline" },
  { value: "Ongoing", label: "Term" },
];

const CONTENTS: ContentsRow[] = [
  { num: "00", title: "Context", target: "s-context" },
  { num: "01", title: "What's Confidential", target: "s-confidential" },
  { num: "02", title: "What I Can Show", target: "s-show" },
];

const NEIGHBOURS = [
  {
    title: "Vashi ISL",
    href: "/projects/vashi",
    blurb: "A B2B marketplace revamp, done inside a shared team file.",
    studio: "PwC India",
    term: "Spring 2025",
    cover: "/archive/vashi-hero.webp",
  },
  {
    title: "Traces",
    href: "/projects/traces",
    blurb: "A week of design research into why dating apps fail, and one fix.",
    studio: "Future Factory",
    term: "Fall 2025",
    cover: "/archive/traces-hero.webp",
  },
];

export default function KobbleEntry() {
  return (
    <CaseShell
      contents={CONTENTS}
      palette={PALETTE}
      backHref="/archive"
      backLabel="Archive"
      banner={
        <Banner title="Kobble" meta={META}>
          <BannerVideo
            src="/archive/kobble-loop.mp4"
            poster="/archive/kobble-hero.webp"
            alt="A warm orange-to-magenta gradient, Kobble's brand texture, looping."
          />
        </Banner>
      }
      marginNote="Ask Pixel what's actually off-limits here, and why."
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
              Kobble is a consumer dating product I&rsquo;ve been the only
              designer on since joining at concept stage — most of what
              actually runs it can&rsquo;t go on this page.
            </p>
          </section>

          <Disclosure title="What's Confidential" {...at("s-confidential")}>
            <p className={styles.prose}>
              The <span className={styles.proseMark}>matching and scoring
              logic</span> sits behind a hard line — not summarised, not
              described in general terms, not gestured at.
            </p>
            <p className={styles.proseSmall}>
              That holds regardless of where the product goes next. Ask me
              directly and I can talk you through how I think about it.
            </p>
          </Disclosure>

          <Disclosure title="What I Can Show" {...at("s-show")}>
            <p className={styles.prose}>
              The <span className={styles.proseMark}>421-category
              taxonomy</span> the entire data model runs on is mine, start to
              finish.
            </p>
            <p className={styles.proseSmall}>
              So is the interaction/dismissal reframe — I removed the
              like/dislike binary and rebuilt the core gesture around
              &ldquo;I want to know more about you&rdquo; versus
              &ldquo;you&rsquo;re not my type,&rdquo; a change the product
              restructured around. Feature specs, onboarding copy, and the
              in-app illustration and motion work are mine too.
            </p>

            <StatRow stats={[{ value: 421, label: "Taxonomy categories" }]} />
          </Disclosure>

          <MoreProjects projects={NEIGHBOURS} indexHref="/archive" />
        </>
        );
      }}
    </CaseShell>
  );
}
