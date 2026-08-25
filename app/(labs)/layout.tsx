import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Route group for the dev sandboxes. It adds no URL segment — the labs stay at
 * /pixel-lab, /text-lab and /effects-lab — it exists to give them one shared
 * stylesheet and one shared rule: never index a lab. Each lab's own layout adds
 * only its title, which is the one piece of metadata that genuinely differs.
 *
 * The labs are client components and so can't export metadata themselves.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * `LabMenu` is already dev-gated in the root layout, but that only hides the
 * link — the routes themselves were still prerendered into the production
 * build and served to anyone who typed the URL. `noindex` keeps them out of
 * search results; it does not make them private. This closes the group off in
 * production so the labs exist only where the menu that opens them does.
 */
const LABS_ENABLED = process.env.NODE_ENV === "development";

/*
 * Caveat, measured rather than assumed: a `notFound()` reached from a *layout*
 * renders the 404 body but the response still carries a 200, and forcing the
 * group dynamic does not change that — so this hides the labs, it does not make
 * them return a real 404. That is fine here (the group is already `noindex`,
 * and no lab markup or lab client bundle reaches the browser). If a hard 404 is
 * ever wanted, the route files have to be absent from the production build
 * rather than guarded inside it.
 */

export default function LabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!LABS_ENABLED) notFound();

  return children;
}
