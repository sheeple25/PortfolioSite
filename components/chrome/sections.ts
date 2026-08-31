import { ENTRIES } from "@/lib/entries/registry";

/**
 * Which routes are index pages, and which render a shutter panel.
 *
 * One module because two separate things read it and they must not drift: the
 * document ground (`SectionGround`, and the inline script in `app/layout.tsx`
 * that sets it before first paint) and the shutter's decision about whether a
 * close is worth playing.
 */

/** The section indexes, all built on `IndexShell`. */
export const INDEX_ROUTES = ["/projects", "/archive", "/writing", "/about"] as const;

/** Carries the dark index ground, and renders a full-window header section. */
export function isIndexRoute(pathname: string) {
  return (INDEX_ROUTES as readonly string[]).includes(pathname);
}

/**
 * Slugs whose page is a hand-built `CaseShell` — the only project pages with a
 * banner for the shutter to open.
 *
 * Taken from the registry rather than assumed, because `/projects/<slug>` no
 * longer implies a case study: Work and Archive share that URL space, and the
 * markdown-backed entries render `DocumentHeader` inside the reading shell
 * instead. `lib/entries/registry.ts` imports nothing but types, so pulling it
 * in here doesn't drag the content loader into the client bundle.
 */
const CASE_SHELL_SLUGS = new Set(
  ENTRIES.filter((entry) => entry.source.kind === "page").map(
    (entry) => entry.slug
  )
);

/**
 * Whether the page at this route renders something the shutter can open.
 *
 * The indexes do (`IndexShell`'s header section), and so do the hand-built
 * case studies under `/projects/<slug>` (`CaseShell`'s banner). Nothing else
 * does: markdown entries and `/writing/<slug>` are `DocumentHeader` pages
 * inside the reading shell, and `/contact` has no header of its own at all.
 *
 * A route matched here that turns out to have no panel is not an error — the
 * close simply plays and the destination arrives without opening. The list only
 * needs to be right often enough to be useful.
 */
export function hasShutterPanel(pathname: string) {
  if (isIndexRoute(pathname)) return true;

  const slug = /^\/projects\/([^/]+)$/.exec(pathname)?.[1];
  return slug !== undefined && CASE_SHELL_SLUGS.has(slug);
}
