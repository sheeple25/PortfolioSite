"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import styles from "./Logo.module.css";

/*
 * The mark: three falling triangles, two up and one settling below them.
 *
 * Two representations of the same artwork, deliberately:
 *
 *   at rest    — inline SVG, so it stays sharp at every size and takes the
 *                accent colour from the palette rather than baking it in.
 *   in motion  — `public/site-loader.webp`, the authored loading animation,
 *                overlaid on the SVG.
 *
 * The animation is a raster, so its colour *is* baked in — which is what made
 * it stay orange in light mode while the resting mark went blue. It is
 * re-tinted at paint time instead of at build time: `TINT_FILTER_ID` below
 * floods the accent colour and composites it into the frame's own alpha, so
 * whatever `--nav-pixel-accent` currently resolves to is what the moving
 * artwork is — the same page-scoped accent the resting mark uses, so the two
 * can never disagree mid-hover. That keeps `scripts/recolor-brand-assets.mjs` for what
 * it's actually needed for (the favicon, and re-authoring the source asset)
 * rather than making the loader's palette a build-time decision.
 *
 * The SVG's geometry is not drawn by eye: it is measured off the animation's
 * own resting frame (the triangles, and the artwork's bounding box within the
 * 512px asset), so the two line up exactly and the swap has nothing to give it
 * away. `LOADER` below records those measurements — change the asset and they
 * need remeasuring, which is why they sit together with the crop in one place.
 *
 * The SVG stays mounted throughout, but it only *shows* until the animation
 * has actually painted a frame — while it's playing, the static triangles
 * disappear so the moving artwork is what's visible, not both layered on top
 * of each other. Mounting it early (rather than swapping on `playing`) means
 * a first hover that has to fetch the file still shows the mark instead of a
 * hole while the request is in flight; `loopReady` is what times the handoff.
 *
 * Corners are rounded by stroking each triangle in its own fill with a round
 * line join, so there is no path arithmetic to keep in step.
 */

/**
 * One id for every mounted `Logo`. The defs below are identical wherever they
 * render, so duplicates across several logos on a page resolve to the same
 * filter — no per-instance id, and no single shared mount to keep alive.
 */
const TINT_FILTER_ID = "logo-loader-tint";

/** Artwork bounds inside the 512x512 loader, from its resting frame. */
const LOADER = { frame: 512, x: 54, y: 104, width: 404, height: 352 } as const;

/**
 * Down-pointing triangles in the loader's own coordinate space, inset by half
 * the stroke width so the rounded outline lands on the measured bounds.
 */
const TRIANGLES = [
  "59,109 175,109 117,210",
  "336,109 452,109 394,210",
  "198,349 313,349 255,450",
] as const;

export type LogoMode = "static" | "loop";

export default function Logo({
  size = 26,
  mode = "static",
  playOnHover = false,
  className,
}: {
  size?: number;
  /** `loop` runs the loading animation — the same one the wait screen shows. */
  mode?: LogoMode;
  /**
   * Run the animation while the pointer is over the mark itself. Callers that
   * want a larger hover target — the header, where the wordmark beside it
   * should count — pass `mode="loop"` from their own handler instead.
   */
  playOnHover?: boolean;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [loopReady, setLoopReady] = useState(false);

  const playing =
    !reducedMotion && (mode === "loop" || (playOnHover && hovered));

  return (
    <span
      className={cn(styles.frame, className)}
      style={{
        width: (size * LOADER.width) / LOADER.height,
        height: size,
      }}
      onPointerEnter={playOnHover ? () => setHovered(true) : undefined}
      onPointerLeave={playOnHover ? () => setHovered(false) : undefined}
    >
      <svg
        className={cn(styles.mark, playing && loopReady && styles.markHidden)}
        viewBox={`${LOADER.x} ${LOADER.y} ${LOADER.width} ${LOADER.height}`}
        aria-hidden="true"
      >
        {TRIANGLES.map((points) => (
          <polygon key={points} className={styles.triangle} points={points} />
        ))}
      </svg>

      {/*
        The tint filter itself. `flood-color` is set from CSS (see the module
        stylesheet) rather than as an attribute here, which is what lets it
        read `--color-accent` and follow the theme without a re-render.
      */}
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <filter id={TINT_FILTER_ID}>
          {/* Flood the whole region, then keep only where the frame is opaque. */}
          <feFlood result="tint" />
          <feComposite in="tint" in2="SourceGraphic" operator="in" />
        </filter>
      </svg>

      {/* Reset in onExitComplete, not an effect: the img remounts each cycle
          (that's what rewinds the loop), so the next hover needs the SVG
          visible again until the fresh mount's own onLoad fires. */}
      <AnimatePresence onExitComplete={() => setLoopReady(false)}>
        {playing && (
          <motion.img
            /* Remounting is what rewinds it: an animated image has no seek. */
            key="loop"
            className={styles.loop}
            src="/site-loader.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            onLoad={() => setLoopReady(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}
