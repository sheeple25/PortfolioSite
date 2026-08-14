"use client";

import { AnimatePresence, motion } from "framer-motion";
import styles from "./RollingText.module.css";

export type RollMode = "line" | "letters" | "letters-wave";

const EASE = [0.22, 1, 0.36, 1] as const;

function LineRoll({ text }: { text: string }) {
  return (
    <motion.span
      key={text}
      className={styles.line}
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      exit={{ rotateX: -90, opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {text}
    </motion.span>
  );
}

function LetterRoll({ text, wave }: { text: string; wave: boolean }) {
  const chars = [...text];
  return (
    <motion.span key={text} className={styles.line}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className={styles.char}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{
            duration: 0.45,
            ease: EASE,
            delay: wave ? i * 0.028 : 0,
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function RollingText({
  text,
  mode,
  className,
}: {
  text: string;
  mode: RollMode;
  className?: string;
}) {
  return (
    <span className={`${styles.roll} ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === "line" ? (
          <LineRoll key={text} text={text} />
        ) : (
          <LetterRoll key={text} text={text} wave={mode === "letters-wave"} />
        )}
      </AnimatePresence>
    </span>
  );
}
