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
  { href: "/about", label: "About" },
  { href: "/writing", label: "Writing" },
  { href: "/archive", label: "Archive" },
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
 * list plus the documents found in `content/writing`.
 */
export const ROUTES = [
  "/",
  "/projects",
  "/archive",
  "/writing",
  "/about",
  "/contact",
] as const;
