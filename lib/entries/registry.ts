import type { Entry } from "./types";

/*
 * The registry — every project on the site, in one list.
 *
 * This is the file you edit to change how a project is presented. Two fields
 * do that, and neither requires touching content, moving a file or changing a
 * URL (see the design note in `./types.ts`):
 *
 *   mode:    "case-study" | "peek" | "link"   — what its tile does
 *   section: "work" | "archive"               — which index it's listed on
 *
 * Promoting Flux from an archive entry to a Work case study is two words on
 * one line. Dropping Matchbox to a peek is one. Nothing else moves.
 *
 * `source` is the one thing that isn't a free switch, because it's a statement
 * of fact rather than a preference: a slug is either a hand-built React page
 * under `app/projects/<slug>/` or a markdown file in `content/projects/`. It
 * describes where the words are, not how they're shown.
 *
 * On the three `page` entries: their metadata is inline because the markdown
 * they replaced is gone. It was lifted verbatim from the frontmatter of
 * `content/projects/unflattening.md`, `content/archive/traces.md` and
 * `content/archive/loco.md` when those pages were built, so nothing the graph
 * or the indexes knew about this work was lost in the move.
 */

export const ENTRIES: readonly Entry[] = [
  {
    slug: "unflattening",
    section: "work",
    mode: "case-study",
    source: {
      kind: "page",
      readingMinutes: 12,
      sectionTitles: [
        "Context",
        "Problem",
        "Research Question",
        "Theoretical Foundation",
        "Method",
        "Goal",
      ],
      meta: {
        title: "Unflattening",
        subtitle: "Indian science fiction as a site for speculative design.",
        description:
          "My design research thesis — a framework that turns Indian SF short stories into working design environments, by reading the designers those worlds would produce and writing the briefs those worlds would issue.",
        date: "2026-05-30",
        version: "v1",
        recommended: true,
        place: "Thesis",
        term: "2026",
        cover: "/projects/unflattening-cover.webp",
        coverAlt:
          "The Unflattening thesis lying open on a desk, its title spread lit from above.",
        coverVideo: "/projects/unflattening-loop.mp4",
        tags: ["thesis", "speculative design", "science fiction", "research"],
        // DRAFT — no tools row exists on the page itself to confirm against
        // (unlike Traces/Loco below). Figma is a guess based on every other
        // case study's build process; verify and correct.
        tools: ["Figma"],
      },
    },
  },
  {
    slug: "traces",
    section: "work",
    mode: "case-study",
    source: {
      kind: "page",
      readingMinutes: 10,
      sectionTitles: [
        "Context",
        "Dating Apps Suck",
        "I Found Out Why",
        "The Fix: Traces",
        "What Came Of It",
        "Research",
        "Findings",
        "Analysis",
        "Briefcraft",
      ],
      meta: {
        title: "Traces",
        subtitle:
          "Low-pressure connection in the real world. No swiping, no profiles.",
        description:
          "A design research studio on how technology mediates romance — 16 interviews, 9 user archetypes, and an intervention that replaces profiles with fragments of the people behind them.",
        date: "2025-09-30",
        rank: 1,
        category: "research",
        place: "Future Factory",
        term: "Fall 2025",
        role: "Solo — research, synthesis, concept, interface",
        skills: [
          "Design Research",
          "User Interviews",
          "Synthesis",
          "Concept Design",
        ],
        cover: "/archive/traces-hero.webp",
        coverAlt:
          'The Traces title card — "technology + dating" set over a wall of user-reported frustrations.',
        coverVideo: "/archive/traces-loop.mp4",
        logo: "/logos/Traces.svg",
        // Traces' mark fills more of its own 120×120 canvas than Kobble's
        // does (~84% vs. ~68%), so it needs a smaller `logoWidth` than
        // Kobble's 17 to land at the same rendered/optical size on the tile.
        logoWidth: 14,
        tags: ["research", "speculative"],
        // Confirmed — matches `TracesEntry.tsx`'s own META row verbatim, plus
        // Humanify (the survey platform), which that row's comment says was
        // deliberately recorded even though the banner only has room for two.
        tools: ["Figma", "After Effects", "Humanify"],
      },
    },
  },
  {
    slug: "loco",
    section: "work",
    mode: "case-study",
    source: {
      kind: "page",
      readingMinutes: 9,
      sectionTitles: [
        "Context",
        "Loco Pilot Bathrooms Suck",
        "I Found Out Why",
        "The Fix: Waterless Lavatory Unit",
        "Research",
        "Design Iterations",
      ],
      meta: {
        title: "Loco Lavatory",
        subtitle:
          "Redesigning the WAG-9 pilots' lavatory around the people it forgot.",
        description:
          "A retrofittable waterless urinal for Indian Railways locomotives, designed around the needs of female loco pilots — 90 days between services, no water, 1050 × 600mm.",
        date: "2024-09-30",
        rank: 2,
        category: "transport",
        place: "Desmania",
        term: "Fall 2024",
        role: "Transport Design Intern",
        timeline: "Jul – Sept 2024",
        team: "Desmania Design studio team",
        skills: ["Transport Design", "User Research", "Live Client Project"],
        cover: "/archive/loco-hero.webp",
        coverAlt:
          "Three renders of the redesigned waterless urinal unit, shown side by side in blue, green and red status lighting.",
        tags: ["transport", "internship"],
        // Confirmed — matches `LocoEntry.tsx`'s own META row verbatim.
        tools: ["Rhino", "Solidworks", "Keyshot"],
      },
    },
  },

  /*
   * Two hand-built stub case studies, on the same `CaseShell` chassis as
   * Unflattening, Traces and Loco above — not the markdown pipeline the four
   * entries below use. Both are deliberately short: Kobble's central
   * mechanism is confidential, and Vashi's individual attribution can't be
   * reconstructed (shared Figma file, no access). A stub on the *same*
   * chassis, three short beats instead of a full decision-log spine, is the
   * emmiwu.com move for NDA'd work — a real page beats a dead card, but it
   * doesn't pretend to be more finished than it is.
   */
  {
    slug: "kobble",
    section: "archive",
    mode: "case-study",
    source: {
      kind: "page",
      readingMinutes: 2,
      sectionTitles: ["Context", "What's Confidential", "What I Can Show"],
      meta: {
        title: "Kobble",
        subtitle: "A pre-launch dating product, still mostly under wraps.",
        description:
          "A consumer dating product I've been the only designer on since concept stage — most of what runs it is confidential.",
        date: "2024-04-01",
        rank: 1,
        category: "product",
        place: "Remote / Delhi NCR",
        term: "2024 – Present",
        role: "Product Designer",
        timeline: "Apr 2024 – Present",
        team: "Two-person team — sole designer",
        skills: ["Product Design", "Information Architecture", "Interaction Design"],
        cover: "/archive/kobble-hero.webp",
        coverAlt: "A warm orange-to-magenta gradient, Kobble's brand texture.",
        coverVideo: "/archive/kobble-loop.mp4",
        logo: "/logos/Kobble.svg",
        logoInvert: true,
        logoWidth: 17,
        tags: ["product", "consumer"],
        tools: ["Figma"],
      },
    },
  },
  {
    slug: "vashi",
    section: "archive",
    mode: "case-study",
    source: {
      kind: "page",
      readingMinutes: 2,
      sectionTitles: ["Context", "Why This Stays Short", "The Shape Of The Engagement"],
      meta: {
        title: "Vashi ISL",
        subtitle: "A B2B marketplace revamp, done inside a shared team file.",
        description:
          "A B2B industrial-goods marketplace redesign, one of four client projects during a PwC internship — done in a shared file, so this stays scope and role rather than a screen-by-screen account.",
        date: "2025-03-01",
        rank: 2,
        category: "product",
        place: "PwC India · Remote",
        term: "Spring 2025",
        role: "UI/UX Intern, PwC India",
        timeline: "Mar – Jun 2025",
        team: "5–6 person client team, 2 designers sharing one file",
        skills: ["Product Design", "Interface Design", "Competitive Audit"],
        cover: "/archive/vashi-hero.webp",
        // The logo is baked into `cover` server-side (sharp), not a live
        // `logo:` overlay like Kobble's — see the sharp-composite note in
        // `VashiEntry.tsx`.
        coverAlt: "The Vashi Integrated Solutions logo in white, over solid brand blue.",
        tags: ["product", "consulting"],
        tools: ["Figma"],
      },
    },
  },

  /*
   * The markdown-backed entries. Metadata for these stays in the frontmatter
   * of `content/projects/<slug>.md` — that's still the right home for it, and
   * duplicating it here would only give it somewhere to drift to.
   *
   * All four published ones are `case-study` because all four have a written
   * body today. `source/Proposed Structure for Projects..md` says Matchbox,
   * Mizan and Vortex should eventually become redirects to the CEPT portfolio
   * site instead — that's a one-word change to `mode` plus a `link` block, but
   * it needs the actual CEPT URL, which isn't recorded anywhere in the repo.
   * Left as-is rather than guessed at.
   */
  { slug: "flux", section: "archive", mode: "case-study", source: { kind: "document" } },
  { slug: "mizan", section: "archive", mode: "case-study", source: { kind: "document" } },
  { slug: "vortex", section: "archive", mode: "case-study", source: { kind: "document" } },
  { slug: "matchbox", section: "archive", mode: "case-study", source: { kind: "document" } },
];
