"use client";

import { useState } from "react";
import IndexShell from "@/components/chrome/IndexShell";
import CursorImageTrail from "./CursorImageTrail";
import InterestBand from "./InterestBand";
import MorphTitle from "./MorphTitle";

/*
 * The About page's body.
 *
 * Split out of `app/about/page.tsx` so that the page file can stay a server
 * component and keep exporting `metadata`, while this side holds the header
 * element in state — `onHeaderElement` is a function, and functions can't
 * cross the server/client boundary as props.
 *
 * The page is two acts, and they are now the shell's two regions rather than a
 * header and a sheet scrolled to. Act I is the **stage**: title and standfirst,
 * and nothing else — the logo marquee that used to run under them is gone, and
 * the places it named are now rows in the desktop's experience widget, with
 * their role and dates attached. Act II is the desktop, in the **band** below
 * — the same slot the graph fills on `/projects` and the typed list on
 * `/writing`, on the same slightly darker ground, so all three indexes are one
 * screen with their interactive half at the bottom of it.
 *
 * That is what `IndexShell` with no `children` gives: the page is exactly one
 * window and the only thing under it is the footer.
 *
 * Dropping the marquee makes the stage shorter, and because the shell splits
 * these two regions with flex rather than a fixed boundary, the band grows by
 * exactly that much. That height is spent on the desktop — the experience
 * widget and the wallpaper around it — and explicitly not on the window, which
 * is capped so it stays the size it was. See `--window-max-*` in
 * `InterestBand.module.css`.
 *
 * The cursor trail belongs to Act I alone and is scoped to the stage element,
 * so it falls silent at the band — two layers of scattered images competing
 * for the same job is exactly what the pixel cutouts are already doing there.
 */
export default function AboutView({
  intro,
  trailImages,
  selves,
}: {
  intro: React.ReactNode;
  trailImages: string[];
  /** The words the title steps through: `Vidush the [designer]`, then the rest. */
  selves: readonly string[];
}) {
  const [stage, setStage] = useState<HTMLElement | null>(null);

  return (
    <>
      <CursorImageTrail images={trailImages} bounds={stage} />
      <IndexShell
        /* Still "About." underneath: the fitter's signature, the expand
           button's label and the `expandedFor` key all read the string, and
           "View About full screen" is the sentence they should make. What is
           painted is the morphing title. */
        title="About."
        heading={<MorphTitle lead="Vidush the" words={selves} />}
        intro={intro}
        onStageElement={setStage}
        background={<InterestBand />}
        backgroundInteractive
      />
    </>
  );
}
