"use client";

import { useEffect } from "react";
import { usePixelMood } from "@/components/pixel";
import styles from "./status.module.css";

/**
 * Root error boundary. Next requires this to be a client component. It sits
 * inside app/layout.tsx, so PixelProvider is mounted and the mascot is reachable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  usePixelMood("surprised");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <p className={styles.code}>error</p>
      <h1 className={styles.heading}>Something broke</h1>
      <p className={styles.message}>
        That one is on me, not you. Trying again sometimes clears it.
      </p>
      <button type="button" className={styles.action} onClick={reset}>
        try again
      </button>
    </main>
  );
}
