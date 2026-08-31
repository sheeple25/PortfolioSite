import type { Metadata } from "next";
import { getEntry } from "@/lib/entries";
import VashiEntry from "./VashiEntry";

/**
 * Vashi ISL — a hand-built case study on the same chassis as Traces, Loco and
 * Unflattening, kept deliberately short (see the comment on its registry
 * entry). Metadata comes from `lib/entries/registry.ts`; see the note in
 * `app/projects/traces/page.tsx`.
 */

const study = getEntry("vashi");

export const metadata: Metadata = {
  title: study?.meta.title,
  description: study?.meta.description,
  openGraph: {
    type: "article",
    title: study?.meta.title,
    description: study?.meta.description,
    url: "/projects/vashi",
    publishedTime: study?.meta.date,
    images: study?.meta.cover ? [{ url: study.meta.cover }] : undefined,
  },
};

export default function VashiPage() {
  return <VashiEntry />;
}
