"use client";

import { type CSSProperties } from "react";
import { motion, type Transition, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import styles from "./TitleEffect.module.css";

/**
 * Per-project title animations for `/archive`.
 *
 * Every entry gets its own, and the choice isn't decorative: the effect is the
 * first thing that says what the project is about, before a word of the text
 * has been read. Flux's letters coalesce out of blobs because that is literally
 * what the object does to ferrofluid; Bamboo's split into strips the way the
 * material is prepared; Lumex's bend and stay bent, which is the entire finding.
 *
 * All eight animate per glyph on mount and never loop. A heading that keeps
 * moving while you try to read under it is a cost with no return — these play
 * once, settle, and leave the page alone.
 *
 * Everything here is transform and opacity, so each one composites on the GPU
 * and none of them trigger layout. `usePrefersReducedMotion` drops the whole
 * mechanism and renders plain text.
 */

export type TitleEffectName =
  | "ferrofluid"
  | "rails"
  | "scatter"
  | "assemble"
  | "weave"
  | "split"
  | "glow"
  | "bend";

const EFFECTS = new Set<string>([
  "ferrofluid",
  "rails",
  "scatter",
  "assemble",
  "weave",
  "split",
  "glow",
  "bend",
]);

export function isTitleEffect(value: string): value is TitleEffectName {
  return EFFECTS.has(value);
}

/**
 * A stable pseudo-random in [0, 1) from the glyph's index.
 *
 * `scatter` needs each letter thrown somewhere different, and `Math.random()`
 * would produce one set of offsets on the server and another in the browser —
 * a hydration mismatch on the largest text on the page. Hashing the index gives
 * scatter that is arbitrary to look at and identical on both sides.
 */
function jitter(index: number, salt: number): number {
  const n = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/*
 * The motion components this can render, built once at module scope.
 *
 * `motion.create()` returns a new component *type* on every call, and a new
 * type remounts its subtree — so building one during render restarts the
 * animation on every pass and the title never settles. A fixed table of the
 * three tags a title could plausibly use avoids the problem entirely, and is
 * what `react-hooks/static-components` is asking for.
 */
const HEADINGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type HeadingTag = keyof typeof HEADINGS;

/** Per-glyph delay, in seconds. Long titles tighten so the last letter isn't late. */
function stagger(count: number, base: number): number {
  return count > 10 ? (base * 10) / count : base;
}

function variantsFor(effect: TitleEffectName, index: number): Variants {
  switch (effect) {
    /*
     * Flux. Letters arrive as oversized, blurred, over-spaced blobs and pull
     * together into glyphs — the nameplate's own cycle, in reverse. The blur
     * is what the goo filter below acts on, so the merge reads as liquid
     * rather than as a crossfade.
     */
    case "ferrofluid":
      return {
        hidden: {
          opacity: 0,
          scale: 1.9,
          y: 10,
          filter: "blur(14px)",
        },
        shown: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: EASE_OUT },
        },
      };

    /* Loco. Letters run in from the left, stretched, and couple up. */
    case "rails":
      return {
        hidden: { opacity: 0, x: -90, scaleX: 2.6 },
        shown: {
          opacity: 1,
          x: 0,
          scaleX: 1,
          transition: { duration: 0.62, ease: EASE_OUT },
        },
      };

    /*
     * Traces. Fragments scattered across the page converge into a name — which
     * is the product's whole thesis: you assemble a person out of pieces rather
     * than reading them off a profile.
     */
    case "scatter":
      return {
        hidden: {
          opacity: 0,
          x: (jitter(index, 1) - 0.5) * 220,
          y: (jitter(index, 2) - 0.5) * 160,
          rotate: (jitter(index, 3) - 0.5) * 90,
          scale: 0.6,
        },
        shown: {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          transition: { duration: 0.9, ease: EASE_OUT },
        },
      };

    /* Mizan. Letters slide in from alternating sides and snap, like tab into slot. */
    case "assemble":
      return {
        hidden: { opacity: 0, y: index % 2 === 0 ? -54 : 54 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 620, damping: 17, mass: 0.7 },
        },
      };

    /* Vortex. Letters turn in on alternating axes, over and under each other. */
    case "weave":
      return {
        hidden: {
          opacity: 0,
          rotateY: index % 2 === 0 ? -88 : 88,
          x: index % 2 === 0 ? -26 : 26,
        },
        shown: {
          opacity: 1,
          rotateY: 0,
          x: 0,
          transition: { duration: 0.7, ease: EASE_OUT },
        },
      };

    /* Bamboo. Letters open from a hairline the way a cane splits into strips. */
    case "split":
      return {
        hidden: { opacity: 0, scaleY: 0.04, scaleX: 0.86 },
        shown: {
          opacity: 1,
          scaleY: 1,
          scaleX: 1,
          transition: { duration: 0.66, ease: EASE_OUT },
        },
      };

    /* Matchbox. Letters rise dim and warm up, as a filament does. */
    case "glow":
      return {
        hidden: { opacity: 0, y: 18, filter: "brightness(0.25)" },
        shown: {
          opacity: 1,
          y: 0,
          filter: "brightness(1)",
          transition: { duration: 0.8, ease: EASE_OUT },
        },
      };

    /* Lumex. Letters arrive bent and keep a trace of the bend. */
    case "bend":
      return {
        hidden: { opacity: 0, rotate: -22, skewX: 26, y: 26 },
        shown: {
          opacity: 1,
          rotate: 0,
          skewX: 0,
          y: 0,
          transition: { type: "spring", stiffness: 210, damping: 14, mass: 0.9 },
        },
      };
  }
}

export default function TitleEffect({
  children,
  effect,
  as: Tag = "h1",
  className,
}: {
  children: string;
  effect: TitleEffectName;
  as?: HeadingTag;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) return <Tag className={className}>{children}</Tag>;

  const glyphs = Array.from(children);
  const step = stagger(glyphs.length, effect === "scatter" ? 0.055 : 0.042);

  const container: Transition = {
    delayChildren: 0.08,
    staggerChildren: step,
  };

  const MotionTag = HEADINGS[Tag];

  return (
    <>
      {/*
        `ferrofluid` is the one effect that needs more than transforms. The
        filter raises alpha contrast on blurred glyphs so neighbouring blurs
        snap together into one shape as they overlap, instead of fading through
        each other — the standard "gooey" trick, and the only way to get letters
        that read as liquid merging. Rendered only for that effect, since the
        filter forces the heading onto its own compositing layer.
      */}
      {effect === "ferrofluid" && (
        <svg className={styles.defs} aria-hidden="true" focusable="false">
          <defs>
            <filter id="archive-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
      )}

      <MotionTag
        className={cn(styles.title, styles[effect], className)}
        initial="hidden"
        animate="shown"
        transition={container}
        /* The accessible name, since the glyphs below are split and aria-hidden. */
        aria-label={children}
      >
        <span className={styles.glyphs} aria-hidden="true">
          {glyphs.map((glyph, i) => (
            <motion.span
              key={`${glyph}-${i}`}
              className={styles.glyph}
              variants={variantsFor(effect, i)}
              style={
                {
                  // `split` opens from alternating edges rather than the middle.
                  transformOrigin:
                    effect === "split"
                      ? i % 2 === 0
                        ? "bottom center"
                        : "top center"
                      : undefined,
                } as CSSProperties
              }
            >
              {/* A space collapses to nothing once it is inline-block. */}
              {glyph === " " ? " " : glyph}
            </motion.span>
          ))}
        </span>
      </MotionTag>
    </>
  );
}
