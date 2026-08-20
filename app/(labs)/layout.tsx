import type { Metadata } from "next";

/**
 * Route group for the dev sandboxes. It adds no URL segment — the labs stay at
 * /pixel-lab and /text-lab — it exists to give them one shared stylesheet and
 * one shared rule: never index a lab. Each lab's own layout adds only its title,
 * which is the one piece of metadata that genuinely differs.
 *
 * The labs are client components and so can't export metadata themselves.
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
