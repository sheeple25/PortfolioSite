import type { Metadata } from "next";

/** Title only — the noindex rule is inherited from the (labs) group layout. */
export const metadata: Metadata = {
  title: "Text lab",
};

export default function TextLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
