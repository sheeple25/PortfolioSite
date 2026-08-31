"use client";

import { useState } from "react";
import IndexShell from "@/components/chrome/IndexShell";
import CursorImageTrail from "./CursorImageTrail";
import InterestBand from "./InterestBand";
import LogoMarquee from "./LogoMarquee";

/*
 * The About page's body.
 *
 * Split out of `app/about/page.tsx` so that the page file can stay a server
 * component and keep exporting `metadata`, while this side holds the header
 * element in state — `onHeaderElement` is a function, and functions can't
 * cross the server/client boundary as props.
 *
 * The page is two acts. Act I is the masthead: title, the standfirst, and the
 * marquee of places under it. Act II is the band of interests over a shared
 * panel, below. More is going under the title and standfirst later; that space
 * is deliberately left open rather than filled with something provisional.
 *
 * The cursor trail belongs to Act I alone and is scoped to the header element,
 * so it falls silent at the band — two layers of scattered images competing
 * for the same job is exactly what the pixel cutouts are already doing there.
 */
export default function AboutView({
  intro,
  trailImages,
}: {
  intro: React.ReactNode;
  trailImages: string[];
}) {
  const [header, setHeader] = useState<HTMLElement | null>(null);

  return (
    <>
      <CursorImageTrail images={trailImages} bounds={header} />
      <IndexShell
        title="About."
        intro={intro}
        banner={<LogoMarquee />}
        onHeaderElement={setHeader}
      >
        <InterestBand />
      </IndexShell>
    </>
  );
}
