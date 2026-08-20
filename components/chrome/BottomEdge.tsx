"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./BottomEdge.module.css";

/*
 * The bottom edge of the viewport: a fade-and-blur over whatever is still
 * below, and the clearance that keeps the fixed corner furniture off the footer.
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

  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let lift = -1;

    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight;

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
      if (next !== lift) {
        lift = next;
        root.style.setProperty("--corner-lift", `${next}px`);
      }

      const remaining = root.scrollHeight - window.scrollY - viewport;
      setOverflowing(remaining > SETTLED_PX);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // Deferred rather than called straight away: a synchronous setState in an
    // effect body is a cascading render, and the first frame is soon enough.
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // Sections expanding change the document height without any scrolling.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      root.style.removeProperty("--corner-lift");
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
