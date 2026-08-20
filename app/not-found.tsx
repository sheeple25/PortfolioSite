"use client";

import Link from "next/link";
import { usePixelMood } from "@/components/pixel";
import styles from "./status.module.css";

/**
 * Client component because it pins the mascot's mood. `not-found.tsx` can't
 * export `metadata` in any case, so nothing is lost by opting out of the server.
 */
export default function NotFound() {
  usePixelMood("dead");

  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>This page doesn&apos;t exist</h1>
      <p className={styles.message}>
        Either it was never built, or it wandered off. Given the state of the
        rest of the site, the first one is more likely.
      </p>
      <Link href="/" className={styles.action}>
        back home
      </Link>
    </main>
  );
}
