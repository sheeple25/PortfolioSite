import type { Metadata } from "next";

/**
 * The lab itself is a client component and so can't export metadata directly.
 * This layout exists only to keep the text sandbox out of search results — it
 * ships with the site for convenience, but it isn't part of the portfolio.
 */
export const metadata: Metadata = {
  title: "Text lab",
  robots: { index: false, follow: false },
};

export default function TextLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
