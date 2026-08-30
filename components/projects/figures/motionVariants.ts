import type { Variants } from "motion/react";

/*
 * Shared "draw in" variants for the generated figures in
 * `components/projects/figures/generated`. Every stroked path/circle/rect in
 * those files gets one of these three, keyed by what the source element
 * actually had: a stroke only, a stroke plus a translucent fill, or a fill
 * alone (see `svg2jsx`'s `classify`).
 *
 * `custom` carries the element's position in source order as a stagger
 * index, capped so a 60-element diagram (the framework map, the double
 * diamond) still finishes its reveal in a couple of seconds rather than
 * dragging on for ten — the point is a diagram that's unmistakably drawing
 * itself in, slow enough to actually watch happen.
 */
const STAGGER_STEP = 0.035;
const STAGGER_CAP = 1.6;
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

function staggerDelay(i: number) {
  return Math.min(i * STAGGER_STEP, STAGGER_CAP);
}

export const STROKE_VARIANTS: Variants = {
  hidden: { pathLength: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    transition: { duration: 1.1, ease: EASE, delay: staggerDelay(i) },
  }),
};

export const STROKE_FILL_VARIANTS: Variants = {
  hidden: { pathLength: 0, fillOpacity: 0 },
  visible: ({ i, fillOpacity }: { i: number; fillOpacity: number }) => ({
    pathLength: 1,
    fillOpacity,
    transition: {
      pathLength: { duration: 1.1, ease: EASE, delay: staggerDelay(i) },
      fillOpacity: { duration: 0.6, ease: "easeOut", delay: staggerDelay(i) + 0.5 },
    },
  }),
};

export const FILL_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: staggerDelay(i) },
  }),
};
