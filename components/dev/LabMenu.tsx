"use client";

/**
 * Dev-only jump menu between the sandbox routes in `app/(labs)`.
 *
 * The development gate lives at the mount site in `app/layout.tsx`, not in here:
 * a `process.env.NODE_ENV` check inside the component still leaves the JSX and
 * its `next/link` + `motion` imports referenced from the layout's module graph.
 * Guarding the element instead lets the production build drop the whole thing.
 *
 * Collapsed by default and tucked top-right — the mascot owns bottom-right and
 * Next's own dev-tools badge already sits bottom-left.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LAB_ROUTES } from "@/lib/site";
import styles from "./LabMenu.module.css";

export default function LabMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-label="Dev labs menu"
      >
        labs
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.menu}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {LAB_ROUTES.map((lab) => (
              <Link
                key={lab.href}
                href={lab.href}
                className={
                  pathname === lab.href
                    ? `${styles.item} ${styles.itemActive}`
                    : styles.item
                }
                onClick={() => setOpen(false)}
              >
                {lab.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
