import type { Metadata } from "next";
import { getCaseStudy } from "@/lib/caseStudies";
import UnflatteningEntry from "./UnflatteningEntry";

/**
 * Unflattening — the thesis, as the six-beat case study rather than the
 * long-form markdown it replaced. Metadata comes from `lib/caseStudies.ts`;
 * see the note in `app/projects/traces/page.tsx`.
 */

const study = getCaseStudy("unflattening");

export const metadata: Metadata = {
  title: study?.meta.title,
  description: study?.meta.description,
  openGraph: {
    type: "article",
    title: study?.meta.title,
    description: study?.meta.description,
    url: "/projects/unflattening",
    publishedTime: study?.meta.date,
  },
};

export default function UnflatteningPage() {
  return <UnflatteningEntry />;
}
