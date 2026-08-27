import type { Metadata } from "next";

/** Title only — the noindex rule is inherited from the (labs) group layout. */
export const metadata: Metadata = {
  title: "Effects lab",
};

export default function EffectsLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
