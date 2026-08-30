import type { WritingSummary } from "@/lib/writing/types";

/*
 * The hand-built case studies.
 *
 * Traces, Loco Lavatory and Unflattening are no longer markdown documents run
 * through the `/writing` reader — each is a React page under `app/projects/`,
 * built on the `components/case-study` chassis. That makes the page itself the
 * source of truth for its *content*.
 *
 * It does not make it a source of truth for its *metadata*, and this file is
 * why. Four surfaces need to know a project exists without rendering it:
 *
 *   - the Work index (`app/projects/page.tsx`) and its cards
 *   - the Work/Archive knowledge graph (`lib/graph`), built from tags
 *   - the sitemap (`app/sitemap.ts`)
 *   - Pixel's system prompt (`lib/pixel/system-prompt.ts`), which describes
 *     every project and its path so the chat can link to it
 *
 * All four read `getProjectSummaries()`. Rather than teach each of them about a
 * second kind of project, the entries are published as `WritingSummary` values
 * — exactly the shape the markdown collection returns — and merged into that
 * one function. Every consumer keeps working unchanged, Pixel included.
 *
 * The metadata below is lifted verbatim from the frontmatter of the three
 * markdown files these pages replaced (`content/projects/unflattening.md`,
 * `content/archive/traces.md`, `content/archive/loco.md`), so nothing the
 * graph or the index knew about this work was lost in the move.
 */

export type CaseStudy = WritingSummary & {
  /**
   * Beats in the contents rail, mirroring the page's own `CONTENTS`. Kept in
   * step by hand — the rail is a client constant inside a `"use client"` page
   * and can't be imported into the server-side index without dragging the
   * whole page into the graph.
   */
  sectionTitles: string[];
};

/**
 * Reading time is hand-set rather than counted. There is no prose file left to
 * measure, and every one of these pages is half figures, so a word count would
 * read short in a way the markdown estimate never did.
 */
export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: "unflattening",
    readingMinutes: 12,
    wordCount: 0,
    noteCount: 0,
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
      tags: ["thesis", "speculative design", "science fiction", "research"],
      // DRAFT — no tools row exists on the page itself to confirm against
      // (unlike Traces/Loco below). Figma is a guess based on every other
      // case study's build process; verify and correct.
      tools: ["Figma"],
    },
  },
  {
    slug: "traces",
    readingMinutes: 10,
    wordCount: 0,
    noteCount: 0,
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
      tags: ["research", "speculative"],
      // Confirmed — matches `TracesEntry.tsx`'s own META row verbatim, plus
      // Humanify (the survey platform), which that row's comment says was
      // deliberately recorded even though the banner only has room for two.
      tools: ["Figma", "After Effects", "Humanify"],
    },
  },
  {
    slug: "loco",
    readingMinutes: 9,
    wordCount: 0,
    noteCount: 0,
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
        "Render of the redesigned waterless urinal unit inside the locomotive cabin.",
      tags: ["transport", "internship"],
      // Confirmed — matches `LocoEntry.tsx`'s own META row verbatim.
      tools: ["Rhino", "Solidworks", "Keyshot"],
    },
  },
];

/** Index-card view of every hand-built case study. Newest first. */
export const getCaseStudySummaries = (): WritingSummary[] =>
  [...CASE_STUDIES].sort((a, b) => b.meta.date.localeCompare(a.meta.date));

/** `undefined` for an unknown slug. Used by each page to build its metadata. */
export const getCaseStudy = (slug: string): CaseStudy | undefined =>
  CASE_STUDIES.find((study) => study.slug === slug);
