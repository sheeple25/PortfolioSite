"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Pixel,
  rowsToRuns,
  runsToPath,
  useBlink,
  useFlash,
  useGaze,
  usePixel,
} from "@/components/pixel";
import { useCompactViewport, usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./UnderConstruction.module.css";

const STATUS_PHRASES = [
  "Sketching wireframes",
  "Hammering pixels into place",
  "Bribing the CSS gremlins",
  "Measuring twice, cutting once",
  "Stacking components",
  "Polishing the finer details",
];

const MOTES = [
  { top: "10%", left: "6%", size: 6, delay: 0 },
  { top: "20%", left: "88%", size: 8, delay: 0.6 },
  { top: "78%", left: "10%", size: 5, delay: 1.1 },
  { top: "85%", left: "82%", size: 7, delay: 0.3 },
  { top: "4%", left: "50%", size: 5, delay: 0.9 },
];

/**
 * Drawn on the same cell grid as Pixel itself rather than as a smooth glyph,
 * so the reward for petting matches the character's own resolution.
 */
const HEART = [
  ".##.##.",
  "#######",
  "#######",
  ".#####.",
  "..###..",
  "...#...",
];
const HEART_PATH = runsToPath(rowsToRuns(HEART));

/** Whole multiples of 24 land exactly on cells, so edges stay hard. */
const HERO_SIZE = 144;
const HERO_SIZE_COMPACT = 96;

/** Every fifth pet lands differently — enough attention to get flustered. */
const BASHFUL_EVERY = 5;

export default function UnderConstruction({
  heading = "Portfolio",
  accent = "Under Construction",
  subtext = "Good things take time. The gooder the thing, the taker the time, or whatever they say. Check back soon!",
}: {
  heading?: string;
  accent?: string;
  subtext?: string;
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number }>>([]);

  const petsRef = useRef(0);
  const heartId = useRef(0);
  const spriteRef = useRef<HTMLDivElement>(null);

  const { setHidden } = usePixel();
  const reducedMotion = usePrefersReducedMotion();
  const compact = useCompactViewport();
  const look = useGaze(spriteRef);
  const [reaction, flash] = useFlash();

  // Pixel is the hero here, so the corner companion stands down for the
  // lifetime of this page rather than doubling the character on screen.
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % STATUS_PHRASES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const pet = useCallback(() => {
    const next = petsRef.current + 1;
    petsRef.current = next;
    setPets(next);
    flash(next % BASHFUL_EVERY === 0 ? "embarrassed" : "happy", 1100);

    if (reducedMotion) return;
    // Alternate sides and keep well off centre: the tooltip sits directly above
    // the head while petting, and a heart drifting through it reads as a glitch.
    const id = heartId.current++;
    const x = (id % 2 === 0 ? -1 : 1) * (30 + ((id * 13) % 28));
    setHearts((current) => [...current, { id, x }]);
  }, [flash, reducedMotion]);

  const expression = reaction ?? "default";
  const blinking = useBlink(!reducedMotion);

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        {MOTES.map((mote, i) => (
          <motion.span
            key={i}
            className={styles.mote}
            style={{
              top: mote.top,
              left: mote.left,
              width: mote.size,
              height: mote.size,
            }}
            animate={{ y: [0, -14, 0], opacity: [0.15, 0.7, 0.15] }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: mote.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        <AnimatePresence>
          {hearts.map((heart) => (
            <motion.svg
              key={heart.id}
              className={styles.heart}
              viewBox="0 0 7 6"
              width={18}
              height={16}
              shapeRendering="crispEdges"
              aria-hidden="true"
              style={{ left: `calc(50% + ${heart.x}px)` }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -78, scale: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              onAnimationComplete={() =>
                setHearts((current) => current.filter((h) => h.id !== heart.id))
              }
            >
              <path d={HEART_PATH} fill="var(--color-accent)" />
            </motion.svg>
          ))}
        </AnimatePresence>

        <motion.button
          type="button"
          className={styles.petButton}
          onClick={pet}
          whileTap={reducedMotion ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          aria-label="Pet Pixel"
        >
          <span className={styles.tip} aria-hidden="true">
            pet
          </span>
          <div ref={spriteRef}>
            <Pixel
              expression={blinking ? "blink" : expression}
              lookX={look.x}
              lookY={look.y}
              size={compact ? HERO_SIZE_COMPACT : HERO_SIZE}
              bob={!reducedMotion}
              decorative
            />
          </div>
        </motion.button>
      </div>

      <p className={styles.petCount} aria-hidden="true">
        {pets === 0 ? "" : pets === 1 ? "petted once" : `petted ${pets} times`}
      </p>

      <p className={styles.eyebrow}>work in progress</p>
      <h1 className={styles.heading}>
        {heading} <span>{accent}</span>
      </h1>
      <p className={styles.subtext}>{subtext}</p>

      <div className={styles.statusRow}>
        <motion.span
          className={styles.statusDot}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={phraseIndex}
            className={styles.statusText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            {STATUS_PHRASES[phraseIndex]}…
          </motion.span>
        </AnimatePresence>
      </div>
    </main>
  );
}
