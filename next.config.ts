import type { NextConfig } from "next";

/**
 * Route resolution.
 *
 * Per the Next docs (`03-api-reference/05-config/01-next-config-js/
 * pageExtensions.md`), this list governs *all* route resolution, so it has to
 * name every extension any route file in the project uses. Every route file
 * here is `.tsx`; `js`/`jsx` are deliberately absent, and adding a `.js` route
 * would mean adding it back.
 *
 * This used to carry a `dev.tsx` extension in development only, which is what
 * kept the `app/(labs)` sandboxes out of production builds. The labs are gone,
 * so the split is too — but the mechanism is worth remembering if a dev-only
 * route is ever wanted again: naming an extension here is what makes a route
 * file resolve at all, so dropping it drops the route and everything
 * downstream of it from the module graph.
 */
const ROUTE_EXTENSIONS = ["tsx", "ts"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ROUTE_EXTENSIONS,

  /**
   * Every project now lives at `/projects/<slug>`, whichever index lists it.
   *
   * An entry's section — Work or Archive — is a curation decision that can
   * change (see `lib/entries/registry.ts`), so it can't also decide the URL:
   * promoting a project would silently break every link to it. One canonical
   * address, and the old archive paths redirect to it permanently.
   *
   * `/archive` itself is untouched — `:slug` requires a segment — and remains
   * the Archive index.
   */
  async redirects() {
    return [
      {
        // `[^./]+` excludes filenames — anything with a dot in it, like
        // `traces-loop.mp4` — so this only catches page slugs and leaves
        // `public/archive/*` assets to be served normally.
        source: "/archive/:slug([^./]+)",
        destination: "/projects/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
