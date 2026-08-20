"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { MotionProps } from "motion/react";

export type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

const defaultChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = "p",
  trigger = true,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const MotionComponent = motion[
    Component as keyof typeof motion
  ] as typeof motion.p;
  const [scrambledText, setScrambledText] = useState<string | null>(null);
  const text = children;
  const displayText = scrambledText ?? children;
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!trigger) return;

    // Deferred rather than run synchronously in the effect body, so the
    // first setState happens in a scheduled callback instead of directly
    // in the effect's own call stack.
    const raf = requestAnimationFrame(() => {
      const steps = duration / speed;
      let step = 0;

      intervalRef.current = setInterval(() => {
        let scrambled = "";
        const progress = step / steps;

        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") {
            scrambled += " ";
            continue;
          }

          if (progress * text.length > i) {
            scrambled += text[i];
          } else {
            scrambled +=
              characterSet[Math.floor(Math.random() * characterSet.length)];
          }
        }

        setScrambledText(scrambled);
        step++;

        if (step > steps) {
          clearInterval(intervalRef.current);
          setScrambledText(null);
          onScrambleComplete?.();
        }
      }, speed * 1000);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <MotionComponent className={className} {...props}>
      {displayText}
    </MotionComponent>
  );
}
