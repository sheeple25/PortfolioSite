import type { ReactNode } from "react";
import styles from "./PanelScroll.module.css";

/**
 * Wraps a panel that was not written to fit a fixed slot.
 *
 * The shared panel's height is constant for every interest, and panels are
 * expected to fill it rather than size themselves. `Bookshelf` predates that
 * rule and legitimately changes height — opening a book adds a whole
 * open-book pane below the spine rail — so instead of rewriting a component
 * that two pages depend on, its growth is absorbed here: the slot's height
 * stays put and the overflow scrolls inside it.
 *
 * This is the escape hatch the slot's contract allows for, not a default.
 * A panel written for this page should fill the slot directly.
 */
export default function PanelScroll({ children }: { children: ReactNode }) {
  return <div className={styles.scroll}>{children}</div>;
}
