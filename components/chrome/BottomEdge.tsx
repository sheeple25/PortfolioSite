"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  nudgeScrollFrame,
  useScrollFrame,
  type ScrollSnapshot,
} from "@/lib/useScrollFrame";
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

export default function BottomEdge() {
  const [overflowing, setOverflowing] = useState(false);

  /** Last value written to `--corner-lift`; `-1` means never written. */
  const lift = useRef(-1);

  const onScrollFrame = useCallback(({ y, viewport }: ScrollSnapshot) => {
    const root = document.documentElement;

    /*
     * How far the footer has risen into the viewport. Anything pinned to the
     * bottom-right is pushed up by exactly that much, so it comes to rest on
     * the footer's top edge instead of sitting on top of it.
     */
    const footer = document.getElementById("site-footer");
    const next = footer
      ? Math.max(0, Math.round(viewport - footer.getBoundingClientRect().top))
      : 0;

    // Writing the property is a style recalculation; only pay for it on change.
    if (next !== lift.current) {
      lift.current = next;
      root.style.setProperty("--corner-lift", `${next}px`);
    }

    const remaining = root.scrollHeight - y - viewport;

    // `next` is how far the footer has risen into the viewport, so a zero
    // there is precisely "the footer has not appeared yet". Reusing it
    // keeps this to the one `getBoundingClientRect` already taken above.
    const footerHidden = next === 0;

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
