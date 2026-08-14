import type { Metadata } from "next";

/**
 * The lab itself is a client component and so can't export metadata directly.
 * This layout exists only to keep the sprite sheet out of search results — it
 * ships with the site for convenience, but it isn't part of the portfolio.
 */
export const metadata: Metadata = {
  title: "Pixel lab",
  robots: { index: false, follow: false },
};

export default function PixelLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
