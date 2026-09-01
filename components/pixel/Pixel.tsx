"use client";

import { useMemo, type CSSProperties } from "react";
import {
  ACCESSORIES,
  BODY,
  EYES,
  EYE_ORIGIN,
  GRID,
  mirrorRuns,
  rowsToRuns,
  runsToPath,
  tracksCursor,
  translateRuns,
  type Accessory,
  type Expression,
} from "./sprites";
import styles from "./Pixel.module.css";

/** The body never changes, so its path is built once for the whole app. */
const BODY_PATH = runsToPath(rowsToRuns(BODY));

/**
 * Costume paths are fixed too — an accessory doesn't blink, track the cursor or
 * change with the mood — so all five are built once at module load rather than
 * per instance. `originY` is applied here; it may be negative, which puts the
 * path above the body's box on purpose (see `AccessorySprite.originY`).
 */
const ACCESSORY_PATHS = Object.fromEntries(
  Object.entries(ACCESSORIES).map(([key, { rows, originY }]) => [
    key,
    runsToPath(rowsToRuns(rows, 0, originY)),
  ]),
) as Record<Accessory, string>;

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
  /** A costume piece worn over the sprite. `null` is the bare mascot. */
  accessory?: Accessory | null;
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
  color = "var(--nav-pixel-accent, #0047ff)",
  eyeColor = "var(--color-charcoal, #1e1e1e)",
  accessory = null,
  bob = false,
  bobDelay = 0,
  decorative = false,
  label,
  className,
  style,
}: PixelProps) {
  const dx = tracksCursor(expression) ? clampLook(lookX) : 0;
  const dy = tracksCursor(expression) ? clampLook(lookY) : 0;

  const worn = accessory ? ACCESSORIES[accessory] : null;

  const eyePath = useMemo(() => {
    const left = rowsToRuns(EYES[expression], EYE_ORIGIN.x, EYE_ORIGIN.y);
    // Mirror before offsetting, so both eyes end up looking the same way
    // rather than symmetrically cross-eyed.
    const pair = [...left, ...mirrorRuns(left)];
    return runsToPath(translateRuns(pair, dx, dy));
  }, [expression, dx, dy]);

  const described = worn ? `${label ?? `Pixel, looking ${expression}`}, wearing ${worn.label.toLowerCase()}` : label ?? `Pixel, looking ${expression}`;

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
        aria-label={decorative ? undefined : described}
      >
        <path d={BODY_PATH} fill={color} />
        {/* Opaque lenses own the eye region; drawing eyes under them muddies it. */}
        {!worn?.hidesEyes && <path d={eyePath} fill={eyeColor} />}
        {worn && accessory && (
          <path d={ACCESSORY_PATHS[accessory]} fill={worn.fill ?? eyeColor} />
        )}
      </svg>
    </div>
  );
}
