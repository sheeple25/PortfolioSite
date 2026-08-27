import type { Metadata } from "next";

/**
 * Route group for the dev sandboxes. It adds no URL segment — the labs stay at
 * /pixel-lab, /text-lab and so on — it exists to give them one shared rule:
 * never index a lab.
 *
 * The labs are client components and so can't export metadata themselves.
 *
 * There is no longer a `notFound()` gate here. Every route file in this group
 * is named `*.dev.tsx`, and `pageExtensions` in next.config.ts only recognises
 * that extension in development — so in production these routes do not exist
 * at all. That is a real 404 from the router rather than a 404 body served
 * with a 200, and it keeps the labs' dependencies out of the build, which the
 * runtime guard could not do.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
