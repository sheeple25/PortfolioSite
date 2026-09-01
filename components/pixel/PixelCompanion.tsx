"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Pixel from "./Pixel";
import PixelWardrobe from "./PixelWardrobe";
import { usePixel } from "./PixelContext";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useBlink, useFlash, useGaze } from "./hooks";
import type { Accessory, Expression } from "./sprites";
import styles from "./PixelCompanion.module.css";

/** Mood Pixel settles into on each route, unless a page says otherwise. */
const ROUTE_MOODS: Record<string, Expression> = {
  "/": "default",
  "/about": "happy",
  "/projects": "surprised",
};

const SLEEPY_AFTER = 9_000;
const ASLEEP_AFTER = 20_000;

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary';

export default function PixelCompanion({ size = 88 }: { size?: number }) {
  const pathname = usePathname();
  const { mood, reaction, hidden, chatOpen, accessory, setAccessory, atFooter } =
    usePixel();
  const reducedMotion = usePrefersReducedMotion();

  const spriteRef = useRef<HTMLDivElement>(null);
  const look = useGaze(spriteRef);
  const [idle, setIdle] = useState<"awake" | "sleepy" | "asleep">("awake");
  const [hoveringTarget, setHoveringTarget] = useState(false);
  const [localReaction, flash] = useFlash();

  const [hovered, setHovered] = useState(false);

  // --- idle drift + hover awareness ---------------------------------------
  useEffect(() => {
    let sleepyTimer: ReturnType<typeof setTimeout>;
    let asleepTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      setIdle((current) => (current === "awake" ? current : "awake"));
      clearTimeout(sleepyTimer);
      clearTimeout(asleepTimer);
      sleepyTimer = setTimeout(() => setIdle("sleepy"), SLEEPY_AFTER);
      asleepTimer = setTimeout(() => setIdle("asleep"), ASLEEP_AFTER);
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setHoveringTarget(Boolean(target.closest(INTERACTIVE)));
    };

    const onPointerDown = () => {
      resetIdle();
      flash("surprised", 500);
    };

    window.addEventListener("pointermove", resetIdle, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("scroll", resetIdle, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(sleepyTimer);
      clearTimeout(asleepTimer);
      window.removeEventListener("pointermove", resetIdle);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("scroll", resetIdle);
    };
  }, [flash]);

  const onSelectAccessory = (next: Accessory | null) => {
    setAccessory(next);
    flash(next ? "happy" : "embarrassed", 900);
  };

  // --- resolve the expression --------------------------------------------
  // Order matters: a page that pins a mood (a 404 saying "dead") must not drift
  // off to sleep, but a deliberate reaction still gets to interrupt it.
  const idleMood: Expression | null =
    idle === "asleep" ? "asleep" : idle === "sleepy" ? "sleepy" : null;

  const hoverMood: Expression | null = hoveringTarget ? "happy" : null;

  const expression: Expression =
    reaction ??
    localReaction ??
    mood ??
    idleMood ??
    hoverMood ??
    ROUTE_MOODS[pathname] ??
    "default";

  const canBlink =
    expression !== "asleep" && expression !== "dead" && expression !== "blink";

  const blinking = useBlink(!reducedMotion && canBlink);

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
                expression={blinking ? "blink" : expression}
                lookX={look.x}
                lookY={look.y}
                size={size}
                accessory={accessory}
                bob={!reducedMotion && idle !== "asleep"}
                decorative
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
