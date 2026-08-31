"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./split-flap-text.module.css";

/*
 * Split-flap display, vendored from React Bits' `SplitFlapText`
 * (github.com/DavidHDev/react-bits, MIT) and changed in three ways:
 *
 * 1. **`text` is controlled.** Upstream, `text` renders a static board and
 *    only `words` animates, on the component's own internal timer. On a
 *    departure board that is the wrong shape: every cell would run its own
 *    timer, and since upstream re-schedules with `cycleDelay + duration` — a
 *    duration that depends on how many characters happened to change — the
 *    cells would drift apart within a few cycles and the board would stop
 *    flipping as one machine. Here a change to `text` animates to the new
 *    value, so a single timer belonging to the *board* drives every cell.
 *
 * 2. **One target, one animation effect.** `words` cycling now only advances
 *    an index, and both modes funnel into the same "animate towards target"
 *    effect. Upstream had cycling and animation entangled in one effect,
 *    which is why `text` couldn't animate.
 *
 * 3. Ported to TypeScript and CSS modules, and onto the site's own
 *    `usePrefersReducedMotion` rather than a second copy of that hook.
 */

const CHARSETS = {
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  numeric: "0123456789",
} as const;

type Tile = { current: string; next: string; flipping: boolean; tick: number };

const toCssUnit = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

const resolveCharset = (charset: string) =>
  charset in CHARSETS
    ? CHARSETS[charset as keyof typeof CHARSETS]
    : charset.length > 0
      ? charset
      : CHARSETS.alphanumeric;

const normalize = (phrase: string, width: number) =>
  String(phrase ?? "")
    .padEnd(width, " ")
    .slice(0, width);

const createTiles = (phrase: string): Tile[] =>
  phrase.split("").map((char) => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0,
  }));

const sampleChar = (charset: string) =>
  charset.charAt(Math.floor(Math.random() * charset.length)) || " ";

/** The characters a tile riffles through on its way to the target. */
const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) steps.push(sampleChar(charset));
  steps.push(target);
  return steps;
};

/** A blank cell has to be a non-breaking space or the tile collapses. */
const show = (char: string) => (char === " " ? " " : char);

export type SplitFlapTextProps = {
  /** A single value. Changing it flips the board to the new one. */
  text?: string;
  /** Several values, cycled on `cycleDelay`. Ignored when `text` is set. */
  words?: string[];
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: string;
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  /** Minimum tile count. Matching these is what lines the board's columns up. */
  padTo?: number;
  className?: string;
  /** What a screen reader hears. Defaults to the settled text. */
  label?: string;
};

export default function SplitFlapText({
  text,
  words,
  flipDuration = 0.12,
  stagger = 0.06,
  cycleDelay = 2400,
  charset = "alphanumeric",
  flipsPerChar = 8,
  tileColor = "#111827",
  textColor = "#f8fafc",
  tileRadius = 8,
  gap = 6,
  fontSize = 52,
  loop = true,
  padTo = 12,
  className = "",
  label,
}: SplitFlapTextProps) {
  const reducedMotion = usePrefersReducedMotion();
  const currentTextRef = useRef("");

  /*
   * Phrases are joined and re-split through a separator rather than depended
   * on as an array: a caller writing `words={["A","B"]}` inline passes a new
   * array every render, which as a dependency would restart the animation on
   * every parent render.
   */
  const phrasesKey =
    typeof text === "string" ? text : (words ?? []).map(String).join("");
  const phrases = useMemo(
    () => (phrasesKey === "" ? [""] : phrasesKey.split("")),
    [phrasesKey],
  );

  const width = useMemo(
    () =>
      Math.max(1, Math.ceil(Number(padTo) || 0), ...phrases.map((p) => p.length)),
    [padTo, phrases],
  );

  const normalized = useMemo(
    () => phrases.map((p) => normalize(p, width)),
    [phrases, width],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);

  /*
   * Tiles are state only while a flip is in flight; `null` between flips.
   */
  const [anim, setAnim] = useState<Tile[] | null>(null);

  /*
   * The value the board is actually *showing* at rest, which is not the same
   * thing as `target`.
   *
   * Deriving the resting tiles from `target` directly caused a one-frame
   * flash on every change: React renders the new value, and only afterwards
   * does the effect start the flip from the old one — so the board showed the
   * new second, snapped back to the old, then flipped to the new. Visible
   * once a second on a clock.
   *
   * Holding the settled value in its own state fixes the ordering. It only
   * advances when a flip finishes, inside the animation frame, so the render
   * between `target` changing and the flip starting still shows the old
   * value — which is what the flip is about to animate away from.
   */
  const [settled, setSettled] = useState(() => normalize("", padTo));

  /* Cycling, for `words` mode. Nothing but an index advancing on a timer. */
  useEffect(() => {
    if (normalized.length <= 1 || !loop || reducedMotion) return;
    const id = setInterval(
      () => setPhraseIndex((i) => (i + 1) % normalized.length),
      Math.max(400, cycleDelay),
    );
    return () => clearInterval(id);
  }, [normalized.length, loop, cycleDelay, reducedMotion]);

  const target = normalized[phraseIndex % normalized.length] ?? normalized[0];

  /*
   * Reduced motion reads `target` directly — there is no flip to be out of
   * step with, so the board should simply show the current value. `settled` is
   * re-normalised because `width` can change under it when `padTo` does, and a
   * tile count that disagrees with the columns would break their alignment.
   */
  const tiles =
    anim ?? createTiles(normalize(reducedMotion ? target : settled, width));

  /* The one animation path: ride the tiles from wherever they are to `target`. */
  useEffect(() => {
    const from = normalize(currentTextRef.current, width);

    /*
     * Nothing to animate: settle the ref and let the render show `target`.
     * On the very first paint `from` is all blanks, so a board powers on by
     * flipping up from empty — which is what a real one does.
     */
    if (from === target || reducedMotion) {
      currentTextRef.current = target;
      return;
    }

    const flipMs = Math.max(40, (Number(flipDuration) || 0.12) * 1000);
    const staggerMs = Math.max(0, (Number(stagger) || 0) * 1000);
    const flips = Math.max(0, Math.floor(Number(flipsPerChar) || 0));
    const active = resolveCharset(charset);

    const plans = target
      .split("")
      .map((targetChar, index) => {
        if ((from[index] || " ") === targetChar) return null;
        return {
          index,
          from: from[index] || " ",
          target: targetChar,
          sequence: buildSequence(targetChar, flips, active),
          start: index * staggerMs,
          step: -1,
          done: false,
        };
      })
      .filter((plan): plan is NonNullable<typeof plan> => plan !== null);

    /*
     * `plans` cannot be empty here: `from !== target` was established above,
     * so at least one index differs. Nothing guards it for that reason.
     */

    let cancelled = false;
    let raf: number | null = null;
    /* The board's working copy, mutated in place and snapshotted per frame. */
    const working = createTiles(from);
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startedAt;
      let more = false;
      let changed = false;

      plans.forEach((plan) => {
        const local = elapsed - plan.start;
        if (local < 0) {
          more = true;
          return;
        }
        const step = Math.floor(local / flipMs);
        if (step < plan.sequence.length) {
          more = true;
          if (step !== plan.step) {
            plan.step = step;
            working[plan.index] = {
              current: step === 0 ? plan.from : plan.sequence[step - 1],
              next: plan.sequence[step],
              flipping: true,
              tick: working[plan.index].tick + 1,
            };
            changed = true;
          }
        } else if (!plan.done) {
          plan.done = true;
          working[plan.index] = {
            current: plan.target,
            next: plan.target,
            flipping: false,
            tick: working[plan.index].tick + 1,
          };
          changed = true;
        }
      });

      if (changed) setAnim([...working]);

      if (more) {
        raf = requestAnimationFrame(tick);
      } else {
        currentTextRef.current = target;
        // Advance the resting value and hand the board back to the derived
        // render. Batched together, so there is no frame showing one without
        // the other.
        setSettled(target);
        setAnim(null);
        raf = null;
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [target, width, reducedMotion, flipDuration, stagger, flipsPerChar, charset]);

  /** What the flaps currently read, for the accessible name. */
  const settledText = tiles
    .map((tile) => tile.current)
    .join("")
    .trimEnd();

  return (
    <span
      className={`${styles.board} ${className}`.trim()}
      style={
        {
          "--split-flap-tile-color": tileColor,
          "--split-flap-text-color": textColor,
          "--split-flap-radius": toCssUnit(tileRadius),
          "--split-flap-gap": toCssUnit(gap),
          "--split-flap-font-size": toCssUnit(fontSize),
          "--split-flap-flip-duration": `${Math.max(
            0.04,
            Number(flipDuration) || 0.12,
          )}s`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={label ?? settledText}
    >
      {tiles.map((tile, index) => (
        <span className={styles.tile} aria-hidden="true" key={index}>
          <span className={`${styles.half} ${styles.halfTop}`}>
            <span className={styles.char}>{show(tile.current)}</span>
          </span>
          <span className={`${styles.half} ${styles.halfBottom}`}>
            <span className={styles.char}>
              {show(tile.flipping ? tile.next : tile.current)}
            </span>
          </span>

          {tile.flipping && (
            <>
              <span
                className={`${styles.flap} ${styles.flapFront}`}
                key={`front-${tile.tick}`}
              >
                <span className={styles.char}>{show(tile.current)}</span>
              </span>
              <span
                className={`${styles.flap} ${styles.flapBack}`}
                key={`back-${tile.tick}`}
              >
                <span className={styles.char}>{show(tile.next)}</span>
              </span>
            </>
          )}
        </span>
      ))}
    </span>
  );
}
