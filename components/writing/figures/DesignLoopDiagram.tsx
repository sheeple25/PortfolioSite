"use client";

import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./diagram.module.css";

/*
 * "ORIGINATOR/CLIENT -> DESIGNER -> DESIGNED THING -> WORLD / SUBJECT", drawn
 * to match the supplied artwork.
 *
 * Black strokes carry intention forwards. Orange dashes are the return half of
 * the ontological loop: the world feeding back into the designed thing, and the
 * person who uses it feeding back into both the thing and the designer. The
 * essay's claim that "design designs" is exactly those dashed lines, so they
 * get their own colour rather than being drawn like the rest.
 */

/** Arrowhead pointing up at the origin; `angle` turns it clockwise from there. */
function Arrow({
  x,
  y,
  angle,
  accent = false,
}: {
  x: number;
  y: number;
  angle: number;
  accent?: boolean;
}) {
  return (
    <path
      className={accent ? styles.arrowAccent : styles.arrow}
      d="M -8 12 L 0 0 L 8 12"
      transform={`translate(${x} ${y}) rotate(${angle})`}
    />
  );
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/** Solid edges draw themselves on; `pathLength` is what makes the ink travel. */
const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.65, ease: "easeInOut" },
      opacity: { duration: 0.12 },
    },
  },
};

/**
 * Dashed edges fade instead of drawing: `pathLength` animates via stroke-dash,
 * which is the same property already spending itself on the dash pattern.
 */
const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function DesignLoopDiagram({ label }: { label?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  // With reduced motion the whole tree is mounted in its resting state and no
  // viewport listener is attached at all.
  const motionProps = reducedMotion
    ? { initial: false as const, animate: "visible" }
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.35 },
      };

  return (
    <motion.svg
      className={styles.svg}
      viewBox="0 0 960 480"
      role="img"
      aria-label={label}
      variants={container}
      {...motionProps}
    >
      {/* ---- forward flow: intention becoming a thing in the world ---- */}

      {/* ORIGINATOR/CLIENT -> DESIGNER */}
      <motion.path className={styles.stroke} d="M 103 88 V 378" variants={draw} />
      <motion.g variants={fade}>
        <Arrow x={103} y={392} angle={180} />
      </motion.g>
      <motion.text
        className={styles.edgeLabel}
        x={86}
        y={240}
        textAnchor="middle"
        transform="rotate(-90 86 240)"
        variants={fade}
      >
        intention
      </motion.text>

      {/* DESIGNER -> DESIGNED THING */}
      <motion.path
        className={styles.stroke}
        d="M 180 392 L 362 268"
        variants={draw}
      />
      <motion.g variants={fade}>
        <Arrow x={372} y={261} angle={56} />
      </motion.g>
      <motion.text
        className={styles.edgeLabel}
        x={252}
        y={318}
        textAnchor="middle"
        transform="rotate(-34 252 318)"
        variants={fade}
      >
        design
      </motion.text>

      {/* DESIGNED THING -> the world, and -> the person who uses it */}
      <motion.path
        className={styles.stroke}
        d="M 600 238 H 880 V 100"
        variants={draw}
      />
      <motion.path className={styles.stroke} d="M 880 238 V 376" variants={draw} />
      <motion.g variants={fade}>
        <Arrow x={880} y={86} angle={0} />
        <Arrow x={880} y={390} angle={180} />
      </motion.g>

      {/* ---- the return half of the loop ---- */}

      {/* The world feeds back into the designed thing */}
      <motion.path
        className={styles.dashed}
        d="M 775 62 H 512 V 200"
        variants={fade}
      />
      <motion.g variants={fade}>
        <Arrow x={512} y={214} angle={180} accent />
      </motion.g>

      {/* The user feeds back into the designer, and into the thing itself */}
      <motion.path className={styles.dashed} d="M 735 414 H 196" variants={fade} />
      <motion.path className={styles.dashed} d="M 478 414 V 278" variants={fade} />
      <motion.g variants={fade}>
        <Arrow x={182} y={414} angle={-90} accent />
        <Arrow x={478} y={264} angle={0} accent />
      </motion.g>

      {/* ---- the four stakeholders ---- */}

      <motion.text className={styles.node} x={40} y={70} variants={pop}>
        ORIGINATOR/CLIENT
      </motion.text>
      <motion.text className={styles.node} x={48} y={422} variants={pop}>
        DESIGNER
      </motion.text>
      <motion.text
        className={styles.node}
        x={482}
        y={246}
        textAnchor="middle"
        variants={pop}
      >
        DESIGNED THING
      </motion.text>
      <motion.text
        className={styles.node}
        x={922}
        y={70}
        textAnchor="end"
        variants={pop}
      >
        WORLD
      </motion.text>
      <motion.text
        className={styles.node}
        x={922}
        y={422}
        textAnchor="end"
        variants={pop}
      >
        SUBJECT/USER
      </motion.text>
    </motion.svg>
  );
}
