import type { NextConfig } from "next";

/**
 * Route files ending `.dev.tsx` resolve as routes in development and are
 * invisible to a production build.
 *
 * This is what keeps `app/(labs)` out of production. The previous arrangement
 * guarded the group with `notFound()` inside its layout, which hid the labs'
 * markup but left the routes prerendered (they answered 200, not 404) and left
 * their whole dependency tail — three, @react-three, gsap, ogl, matter-js,
 * @visx — in the production module graph. Dropping the extension drops the
 * routes, so nothing downstream of them is reachable to build.
 *
 * Per the Next docs (`03-api-reference/05-config/01-next-config-js/
 * pageExtensions.md`), this list governs *all* route resolution, so it has to
 * name every extension any route file in the project uses. Every route file
 * here is `.tsx`; `js`/`jsx` are deliberately absent, and adding a `.js` route
 * would mean adding it back.
 */
const LAB_EXTENSION = "dev.tsx";
const ROUTE_EXTENSIONS = ["tsx", "ts"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions:
    process.env.NODE_ENV === "development"
      ? [...ROUTE_EXTENSIONS, LAB_EXTENSION]
      : ROUTE_EXTENSIONS,
};

export default nextConfig;
