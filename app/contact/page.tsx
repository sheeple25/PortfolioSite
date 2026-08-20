import type { Metadata } from "next";
import UnderConstruction from "@/components/UnderConstruction";

export const metadata: Metadata = {
  title: "Contact",
};

export default function Contact() {
  return (
    <UnderConstruction
      heading="Contact"
      subtext="The contact form is being wired up. Check back soon."
    />
  );
}
