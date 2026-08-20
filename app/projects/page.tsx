import type { Metadata } from "next";
import UnderConstruction from "@/components/UnderConstruction";

export const metadata: Metadata = {
  title: "Projects",
};

export default function Projects() {
  return (
    <UnderConstruction
      heading="Projects"
      subtext="The showcase is being assembled piece by piece. Check back soon."
    />
  );
}
