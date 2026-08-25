"use client";

import { useMemo, type CSSProperties } from "react";
import {
  BODY,
  EYES,
  EYE_ORIGIN,
  GRID,
  mirrorRuns,
  rowsToRuns,
  runsToPath,
  tracksCursor,
  translateRuns,
  type Expression,
} from "./sprites";
import styles from "./Pixel.module.css";

/** The body never changes, so its path is built once for the whole app. */
const BODY_PATH = runsToPath(rowsToRuns(BODY));

const clampLook = (n: number) => Math.max(-1, Math.min(1, Math.round(n)));

export type PixelProps = {
  expression?: Expression;
  /** -1..1 on each axis; snapped to the nine gaze cells from the sprite sheet. */
  lookX?: number;
  lookY?: number;
  /** Rendered edge length in px. Whole multiples of 24 land exactly on cells. */
  size?: number;
  color?: string;
  eyeColor?: string;
  bob?: boolean;
  /** Staggers the bob so a row of Pixels doesn't move in lockstep. */
  bobDelay?: number;
  /** Decorative instances are hidden from assistive tech instead of labelled. */
  decorative?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export default function Pixel({
  expression = "default",
  lookX = 0,
  lookY = 0,
  size = 120,
  color = "var(--color-accent, #0047ff)",
  eyeColor = "var(--color-charcoal, #1e1e1e)",
  bob = false,
  bobDelay = 0,
  decorative = false,
  label,
  className,
  style,
}: PixelProps) {
  const dx = tracksCursor(expression) ? clampLook(lookX) : 0;
  const dy = tracksCursor(expression) ? clampLook(lookY) : 0;

  const eyePath = useMemo(() => {
    const left = rowsToRuns(EYES[expression], EYE_ORIGIN.x, EYE_ORIGIN.y);
    // Mirror before offsetting, so both eyes end up looking the same way
    // rather than symmetrically cross-eyed.
    const pair = [...left, ...mirrorRuns(left)];
    return runsToPath(translateRuns(pair, dx, dy));
  }, [expression, dx, dy]);

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={{ ["--pixel-size" as string]: `${size}px`, ...style }}
    >
      <svg
        className={bob ? `${styles.sprite} ${styles.bob}` : styles.sprite}
        style={bob && bobDelay ? { animationDelay: `${bobDelay}s` } : undefined}
        viewBox={`0 0 ${GRID} ${GRID}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : (label ?? `Pixel, looking ${expression}`)}
      >
        <path d={BODY_PATH} fill={color} />
        <path d={eyePath} fill={eyeColor} />
      </svg>
    </div>
  );
}
