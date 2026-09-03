"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isHomeRoute, isIndexRoute } from "./sections";

/**
 * Keeps the page grounds on `<html>` in step with the route — the index ground
 * on `/projects`, `/writing` and `/about`, and the home page's full-bleed blue
 * on `/`.
 *
 * Renders nothing. It exists because the ground used to be added and removed by
 * `IndexShell`'s own mount and unmount, and that produced a white flash on
 * every index-to-index navigation: the outgoing shell's cleanup removed the
 * class before the incoming one's effect put it back, so `--color-bg` fell
 * through to the light default for the gap between them — which is also what
 * `app/loading.tsx` paints on, since it has no ground of its own.
 *
 * Mounted once in the root layout, this never unmounts. It *toggles* on a
 * pathname change instead of removing and re-adding, so there is no moment when
 * the ground is absent, and moving between two dark indexes changes nothing at
 * all.
 *
 * First paint is handled separately, by the inline script in `app/layout.tsx` —
 * an effect necessarily runs after the first frame, which would flash on a cold
 * load of an index.
 */
export default function SectionGround() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("index-ground", isIndexRoute(pathname));
    /* Mutually exclusive with the above by construction — `/` is not an index
       route — but toggled independently so neither has to know about the
       other. Both write `--color-bg`; only one can ever be on. */
    root.classList.toggle("home-ground", isHomeRoute(pathname));
  }, [pathname]);

  return null;
}
