"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  nudgeScrollFrame,
  useScrollFrame,
  type ScrollSnapshot,
} from "@/lib/useScrollFrame";
import { isHomeRoute, isIndexRoute } from "@/components/chrome/sections";
import { cn } from "@/lib/utils";
import styles from "./BottomEdge.module.css";

/*
 * The bottom edge of the viewport: a fade-and-blur over whatever is still
 * below, and the clearance that keeps the fixed corner furniture off the footer.
 *
 * The fade is for page content running past the bottom of the screen. The
 * footer is not that: it's the end of the document and its own dark panel, so
 * washing it in the page background colour just dirties its top edge. The fade
 * is therefore held back until the footer is entirely below the viewport —
 * the moment any of it is showing, there is nothing left worth hinting at.
 *
 * Both come from one measurement — how far the document still has to go — so
 * they live in one component rather than two listeners racing on every scroll
 * frame. The clearance is published as a custom property on the root element
 * instead of React state, because its consumers are stylesheets (the mascot,
 * the annotation panel, the index's corner note) rather than components.
 */

/** Below this much left to scroll, treat it as arrived and clear the fade. */
const SETTLED_PX = 24;

/*
 * Which pages get a fade, and which do not.
 *
 * The fade is for documents — a case study, a piece of writing — where content
 * really does run past the bottom of the screen and the band is telling you so.
 *
 * The main pages are not that. The front door and the three indexes are each
 * composed to exactly one window: the only thing under the fold is the footer,
 * and `/projects` even runs its own overflow sideways (see `WorkBoard`). On all
 * four the band was never hinting at content — it just sat over the bottom of a
 * finished composition at rest, muddying the last row of it.
 *
 * Named off `sections.ts` rather than a list of its own, so a fifth main page
 * inherits the rule by being a main page instead of by being remembered here.
 *
 * Only the fade is held back. The clearance measurement below still runs on
 * every page — the mascot and the corner note need `--corner-lift` regardless.
 */
function fadesBottom(pathname: string) {
  return !isHomeRoute(pathname) && !isIndexRoute(pathname);
}

export default function BottomEdge() {
  const [overflowing, setOverflowing] = useState(false);
  const pathname = usePathname();

  /** Last value written to `--corner-lift`; `-1` means never written. */
  const lift = useRef(-1);

  const onScrollFrame = useCallback(({ y, viewport }: ScrollSnapshot) => {
    const root = document.documentElement;

    /*
     * How far up the fixed corner furniture has to sit to clear the footer.
     *
     * Measured from the footer's bottom row, not its top edge. The panel opens
     * to 70svh as you reach the end of the page (see Footer.module.css), so its
     * top edge ends up halfway up the screen — resting the mascot on that would
     * fling it into the middle of the viewport. The bottom row sticks to the
     * bottom of the viewport instead, which is the thing the furniture actually
     * has to avoid overlapping; everything above it is the open panel.
     */
    const bar = document.querySelector("[data-footer-baseline]");
    const next = bar
      ? Math.max(0, Math.round(viewport - bar.getBoundingClientRect().top))
      : 0;

    const footer = document.getElementById("site-footer");
    const footerTop = footer
      ? footer.getBoundingClientRect().top
      : Number.POSITIVE_INFINITY;

    // Writing the property is a style recalculation; only pay for it on change.
    if (next !== lift.current) {
      lift.current = next;
      root.style.setProperty("--corner-lift", `${next}px`);
    }

    const remaining = root.scrollHeight - y - viewport;

    // The lift above can be zero while a sliver of the panel is already
    // showing — its bottom row has further to travel than its top edge — so
    // the fade has to ask the panel itself whether it has appeared.
    const footerHidden = footerTop >= viewport;

    setOverflowing(remaining > SETTLED_PX && footerHidden);
  }, []);

  useScrollFrame(onScrollFrame);

  useEffect(() => {
    // Sections expanding change the document height without any scrolling, so
    // this nudges the shared scroll frame rather than scheduling its own.
    const observer = new ResizeObserver(nudgeScrollFrame);
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--corner-lift");
    };
  }, []);


  if (!fadesBottom(pathname)) return null;

  return (
    <div
      className={cn(styles.edge, overflowing && styles.visible)}
      aria-hidden="true"
    >
      <div className={styles.blur} />
      <div className={styles.wash} />
    </div>
  );
}
