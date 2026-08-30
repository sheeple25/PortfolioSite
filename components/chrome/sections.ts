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
 * Whether the page at this route renders something the shutter can open.
 *
 * The indexes do (`IndexShell`'s header section), and so do the hand-built
 * case studies under `/projects/<slug>` (`CaseShell`'s banner). Nothing else
 * does: `/archive/<slug>` and `/writing/<slug>` are `DocumentHeader` pages
 * inside the reading shell, and `/contact` has no header of its own at all.
 *
 * A route matched here that turns out to have no panel is not an error — the
 * close simply plays and the destination arrives without opening. The list only
 * needs to be right often enough to be useful.
 */
export function hasShutterPanel(pathname: string) {
  if (isIndexRoute(pathname)) return true;

  // Every project page is currently a case study; `content/projects` is empty,
  // so there are no markdown projects on `/projects/[slug]` yet. If one lands,
  // it will close without opening rather than break.
  return /^\/projects\/[^/]+$/.test(pathname);
}
