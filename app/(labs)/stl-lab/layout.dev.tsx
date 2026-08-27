import type { Metadata } from "next";

/** Title only — the noindex rule is inherited from the (labs) group layout. */
export const metadata: Metadata = {
  title: "STL lab",
};

export default function StlLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
