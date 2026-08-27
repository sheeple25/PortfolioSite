import type { Metadata } from "next";

/** Title only — the noindex rule is inherited from the (labs) group layout. */
export const metadata: Metadata = {
  title: "Pixel lab",
};

export default function PixelLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
