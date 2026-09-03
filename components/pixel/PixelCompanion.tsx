"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Pixel from "./Pixel";
import PixelWardrobe from "./PixelWardrobe";
import { usePixel } from "./PixelContext";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useGaze } from "./hooks";
import { useCompanionMind } from "./useCompanionMind";
import type { Accessory } from "./sprites";
import styles from "./PixelCompanion.module.css";

/**
 * The corner body. Everything that makes him *him* — the idle drift, the
 * hover brightening, the click jolt, the route moods, the blink — is
 * `useCompanionMind`, shared with the home page's `PixelStage`; this file is
 * only where he stands and what stands next to him (the wardrobe).
 */
export default function PixelCompanion({ size = 88 }: { size?: number }) {
  const { hidden, chatOpen, accessory, setAccessory, atFooter } = usePixel();
  const reducedMotion = usePrefersReducedMotion();

  const spriteRef = useRef<HTMLDivElement>(null);
  const look = useGaze(spriteRef);
  const { expression, flash, asleep } = useCompanionMind();

  const [hovered, setHovered] = useState(false);

  const onSelectAccessory = (next: Accessory | null) => {
    setAccessory(next);
    flash(next ? "happy" : "embarrassed", 900);
  };

  return (
    <AnimatePresence>
      {!hidden && !chatOpen && (
        <motion.div
          className={styles.companion}
          data-chrome="rail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/*
            The hover surface spans the sprite AND the wardrobe above it, so the
            trigger doesn't vanish as the pointer travels up to press it.

            `aria-hidden` used to sit on this wrapper, since the mascot is pure
            decoration. It cannot any more — the wardrobe underneath it is real,
            operable UI — so it moved down onto the sprite alone.
          */}
          <div
            className={styles.stack}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            {/*
              Mounted only at the footer, and UNMOUNTED when you leave it —
              which is also how its open/closed state gets reset. Keeping it
              mounted behind an `enabled` prop meant an open panel would still
              be open when you scrolled back down to it later.
            */}
            {atFooter && (
              <PixelWardrobe
                revealed={hovered}
                accessory={accessory}
                onSelect={onSelectAccessory}
              />
            )}

            <div
              ref={spriteRef}
              className={styles.hitArea}
              aria-hidden="true"
              onClick={() => flash("embarrassed", 1100)}
            >
              <Pixel
                expression={expression}
                lookX={look.x}
                lookY={look.y}
                size={size}
                accessory={accessory}
                bob={!reducedMotion && !asleep}
                decorative
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
