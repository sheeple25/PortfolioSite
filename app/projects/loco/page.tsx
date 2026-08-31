import type { Metadata } from "next";
import { getEntry } from "@/lib/entries";
import LocoEntry from "./LocoEntry";

/**
 * Loco Lavatory — a hand-built case study on the same chassis as Traces and
 * Unflattening. Metadata comes from `lib/entries/registry.ts`; see the note in
 * `app/projects/traces/page.tsx`.
 */

const study = getEntry("loco");

export const metadata: Metadata = {
  title: study?.meta.title,
  description: study?.meta.description,
  openGraph: {
    type: "article",
    title: study?.meta.title,
    description: study?.meta.description,
    url: "/projects/loco",
    publishedTime: study?.meta.date,
    images: study?.meta.cover ? [{ url: study.meta.cover }] : undefined,
  },
};

export default function LocoPage() {
  return <LocoEntry />;
}
