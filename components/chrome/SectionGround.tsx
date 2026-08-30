"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isIndexRoute } from "./sections";

/**
 * Keeps the dark index ground on `<html>` in step with the route.
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
    document.documentElement.classList.toggle(
      "index-ground",
      isIndexRoute(pathname),
    );
  }, [pathname]);

  return null;
}
