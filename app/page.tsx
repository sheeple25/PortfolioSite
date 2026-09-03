import HomeHero from "@/components/home/HomeHero";

/**
 * The front door.
 *
 * `/` used to be a bare redirect to `/projects` — "Work is the home page" —
 * which meant the site's first impression was its densest working surface,
 * and the mascot's first appearance was a 24px dot in a corner. This page
 * splits those jobs (Vidush's call, 2026-09-02): one viewport of arrival, and
 * the work index goes back to being purely the work index.
 *
 * Built to a Figma frame: a full-bleed field of site blue, the nav bar
 * included, carrying nothing but a name and three small blocks of type around
 * it — who I am, what I do, and Pixel offering the two ways on. The whole
 * thing deals itself out in one authored sequence on arrival. See `HomeHero`.
 *
 * `/projects` remains the canonical URL for the work; every deep link and
 * share target is unchanged. The wordmark in the nav points here; the nav
 * tabs still point straight at the sections, so this page costs a visitor
 * exactly one glance and zero extra clicks on the way to anything.
 *
 * Metadata is inherited from the root layout on purpose — the layout's
 * default title/description/OG card were always written for the site as a
 * whole, and `/` is now the page that *is* the site as a whole.
 */
export default function HomePage() {
  return <HomeHero />;
}
