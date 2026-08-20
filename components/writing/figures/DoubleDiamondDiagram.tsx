"use client";

import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./diagram.module.css";

/*
 * The double diamond, shaded by how much of each stage the author wants to own,
 * drawn to match the supplied artwork.
 *
 * The shading is the whole point of the figure and the one value here that is
 * opinion rather than geometry, so it lives in a table you can edit. The
 * defaults follow the essay: "primarily in the Define phase where the right
 * brief is made, secondarily in the Develop and Discover phases. The Deliver
 * phase is where I feel the least affinity."
 */
const AFFINITY = {
  discover: 0.28,
  define: 0.85,
  develop: 0.5,
  deliver: 0.1,
} as const;

/** Each quarter as a triangle, in the order they're read left to right. */
const QUARTERS = [
  { key: "discover", points: "75,238 275,92 275,385", fill: AFFINITY.discover },
  { key: "define", points: "275,92 478,238 275,385", fill: AFFINITY.define },
  { key: "develop", points: "478,238 680,92 680,385", fill: AFFINITY.develop },
  { key: "deliver", points: "680,92 880,238 680,385", fill: AFFINITY.deliver },
] as const;

/** The outer stage boundaries, marked in accent. */
const BOUNDARIES = [75, 478, 880] as const;

/** The diamond spines, which are the midpoint of each phase. */
const SPINES = [275, 680] as const;

const STAGES = [
  { x: 175, label: "DISCOVER" },
  { x: 378, label: "DEFINE" },
  { x: 578, label: "DEVELOP" },
  { x: 782, label: "DELIVER" },
] as const;

/** `diverge` on every upslope, `converge` on every downslope. */
const EDGE_LABELS = [
  { x: 158, y: 152, angle: -36, text: "diverge" },
  { x: 392, y: 152, angle: 36, text: "converge" },
  { x: 562, y: 152, angle: -36, text: "diverge" },
  { x: 795, y: 152, angle: 36, text: "converge" },
] as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: "easeInOut" },
      opacity: { duration: 0.12 },
    },
  },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const pop: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function DoubleDiamondDiagram({ label }: { label?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  const motionProps = reducedMotion
    ? { initial: false as const, animate: "visible" }
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.3 },
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
      {/* Affinity shading sits under the outlines so strokes stay crisp. */}
      {QUARTERS.map((quarter) => (
        <motion.polygon
          key={quarter.key}
          points={quarter.points}
          fill="var(--color-accent)"
          fillOpacity={quarter.fill}
          variants={fade}
        />
      ))}

      {/* The spine the whole process runs along. */}
      <motion.path className={styles.stroke} d="M 12 238 H 920" variants={draw} />
      <motion.g variants={fade}>
        <circle className={styles.dot} cx={10} cy={238} r={9} />
        <path
          className={styles.arrow}
          d="M -8 12 L 0 0 L 8 12"
          transform="translate(936 238) rotate(90)"
        />
      </motion.g>

      {/* The two diamonds. */}
      <motion.path
        className={styles.stroke}
        d="M 75 238 L 275 92 L 478 238 L 275 385 Z"
        variants={draw}
      />
      <motion.path
        className={styles.stroke}
        d="M 478 238 L 680 92 L 880 238 L 680 385 Z"
        variants={draw}
      />

      {EDGE_LABELS.map((edge) => (
        <motion.text
          key={`${edge.text}-${edge.x}`}
          className={styles.edgeLabel}
          x={edge.x}
          y={edge.y}
          textAnchor="middle"
          transform={`rotate(${edge.angle} ${edge.x} ${edge.y})`}
          variants={fade}
        >
          {edge.text}
        </motion.text>
      ))}

      <motion.g variants={fade}>
        {/* Each diamond's own midline, in ink: the diverge/converge turn. */}
        {SPINES.map((x) => (
          <g key={`spine-${x}`}>
            <path className={styles.dashedInk} d={`M ${x} 92 V 385`} />
            <circle className={styles.dot} cx={x} cy={385} r={7} />
          </g>
        ))}

        {/* The outer boundaries between stages, in accent. */}
        {BOUNDARIES.map((x) => (
          <g key={`boundary-${x}`}>
            <path className={styles.dashed} d={`M ${x} 240 V 352`} />
            <circle className={styles.dotAccent} cx={x} cy={368} r={7} />
          </g>
        ))}
      </motion.g>

      <motion.text
        className={styles.phaseLabel}
        x={275}
        y={50}
        textAnchor="middle"
        variants={pop}
      >
        DESIGNING THE RIGHT THING
      </motion.text>
      <motion.text
        className={styles.phaseLabel}
        x={680}
        y={50}
        textAnchor="middle"
        variants={pop}
      >
        DESIGNING THE THING RIGHT
      </motion.text>

      {STAGES.map((stage) => (
        <motion.text
          key={stage.label}
          className={styles.stageLabel}
          x={stage.x}
          y={374}
          textAnchor="middle"
          variants={pop}
        >
          {stage.label}
        </motion.text>
      ))}

      <motion.text
        className={styles.phaseLabel}
        x={275}
        y={442}
        textAnchor="middle"
        variants={pop}
      >
        RESEARCH
      </motion.text>
      <motion.text
        className={styles.phaseLabel}
        x={680}
        y={442}
        textAnchor="middle"
        variants={pop}
      >
        DESIGN
      </motion.text>
    </motion.svg>
  );
}
