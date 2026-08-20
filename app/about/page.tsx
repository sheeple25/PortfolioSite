import type { Metadata } from "next";
import UnderConstruction from "@/components/UnderConstruction";

export const metadata: Metadata = {
  title: "About",
};

export default function About() {
  return (
    <UnderConstruction
      heading="About"
      subtext="My story is still being written. Check back soon."
    />
  );
}
