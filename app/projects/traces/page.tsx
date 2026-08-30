import type { Metadata } from "next";
import { getCaseStudy } from "@/lib/caseStudies";
import TracesEntry from "./TracesEntry";

/**
 * Traces — a hand-built case study rather than a markdown document.
 *
 * The page is `TracesEntry` and the chassis under it is
 * `components/case-study`. Its index-card and graph metadata lives in
 * `lib/caseStudies.ts`, which is also what this route's `metadata` is built
 * from, so the share card and the Work index can never disagree.
 */

const study = getCaseStudy("traces");

export const metadata: Metadata = {
  title: study?.meta.title,
  description: study?.meta.description,
  openGraph: {
    type: "article",
    title: study?.meta.title,
    description: study?.meta.description,
    url: "/projects/traces",
    publishedTime: study?.meta.date,
    images: study?.meta.cover ? [{ url: study.meta.cover }] : undefined,
  },
};

export default function TracesPage() {
  return <TracesEntry />;
}
