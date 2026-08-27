/**
 * Site-level constants shared by metadata, the chrome, the sitemap and robots.
 */

/**
 * Absolute origin, used to resolve `metadataBase` and the sitemap entries.
 * Set `NEXT_PUBLIC_SITE_URL` in the deployment environment — the localhost
 * fallback keeps dev working but must not be what ships.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Vidush Gupta";

/** The wordmark carries a full stop; the metadata title must not. */
export const WORDMARK = "Vidush Gupta.";

/** Sits under the wordmark in the footer. Placeholder from the mockup. */
export const SITE_DESIGNATION = "Design Strategist + Researcher";

export const CONTACT_EMAIL = "vidush.gupta25@gmail.com";

/**
 * The primary navigation, in bar order. Home is reached through the wordmark
 * rather than a link of its own, which is why it isn't in this list.
 */
export const NAV_LINKS = [
  { href: "/projects", label: "Work" },
  { href: "/archive", label: "Archive" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export type ExternalLink = {
  label: string;
  href: string;
  /** Filename the browser saves the download as, if it should differ from the source file's name. */
  downloadAs?: string;
};

/**
 * Profiles linked from the footer.
 *
 * An entry with an empty `href` is a reminder, not a link: the footer renders
 * it greyed out in development so you can see what's still unfilled, and drops
 * it from the production build entirely. Fill the URLs in and they go live.
 */
export const SOCIAL_LINKS: ReadonlyArray<ExternalLink> = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vidushgupta/" },
  { label: "Behance", href: "https://www.behance.net/vidushgupta" },
  { label: "Instagram", href: "" },
];

/**
 * Downloads offered in the footer. These point at files that must exist in
 * `public/` — until they're added the links will 404, so they follow the same
 * empty-href rule as the socials above.
 */
export const DOCUMENT_LINKS: ReadonlyArray<ExternalLink> = [
  { label: "Portfolio", href: "" },
  { label: "Resume", href: "", downloadAs: "Vidush Gupta CV.pdf" },
];

/**
 * Static public routes, in nav order. `app/sitemap.ts` is generated from this
 * list plus the documents found in `content/writing`. The sandboxes under
 * `app/(labs)` are deliberately absent — they are noindex and shouldn't appear.
 */
export const ROUTES = [
  "/",
  "/projects",
  "/archive",
  "/writing",
  "/about",
  "/contact",
] as const;

/**
 * The dev sandboxes under `app/(labs)`, in menu order.
 *
 * One list, three consumers: `components/dev/LabMenu.tsx` renders it,
 * `app/robots.ts` disallows it, and the route files themselves are named
 * `page.dev.tsx` so `pageExtensions` in next.config.ts drops them from a
 * production build entirely. Adding a lab means adding it here — the previous
 * arrangement kept the menu and the robots list separately by hand, and they
 * had already drifted three routes apart.
 */
export const LAB_ROUTES = [
  { href: "/pixel-lab", label: "Pixel" },
  { href: "/text-lab", label: "Text" },
  { href: "/effects-lab", label: "Effects" },
  { href: "/stl-lab", label: "STL" },
  { href: "/traces-board", label: "Traces board" },
  { href: "/traces-entry", label: "Traces shelled" },
  { href: "/loco-entry", label: "Loco shelled" },
  { href: "/unflattening-entry", label: "Unflattening shelled" },
] as const;
