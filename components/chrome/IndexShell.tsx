import type { ReactNode } from "react";
import styles from "./IndexShell.module.css";

/**
 * The shared frame for `/projects`, `/archive` and `/writing`.
 *
 * This exists as a component rather than as a stylesheet each page imports
 * because the three indexes have already drifted apart once. Holding the width
 * and the masthead in one place means a change to any of it lands on all three,
 * and the sections can't fall out of step again.
 *
 * Document pages keep the three-track reading shell — see
 * `app/projects/[slug]/page.module.css`. Only indexes use this.
 */
export default function IndexShell({
  title,
  intro,
  children,
}: {
  /** Page title, left half of the masthead. Written with its full stop. */
  title: string;
  /** Standfirst, right half. */
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>

      {children}
    </div>
  );
}
