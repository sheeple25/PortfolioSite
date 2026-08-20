import Logo from "@/components/chrome/Logo";
import styles from "./status.module.css";

/**
 * Root Suspense fallback. Every page is currently static, so this rarely shows
 * — it exists so a slow segment degrades to the site's own centred layout
 * rather than a blank document.
 *
 * The wait is the site's own loading animation — the same mark the header
 * wears, and the same file that plays when you hover it. Nothing here is
 * borrowed from a spinner library, so a slow connection still looks like this
 * site rather than like a generic one.
 */
export default function Loading() {
  return (
    <main className={styles.page}>
      <Logo mode="loop" size={56} />
      <span className={styles.code}>loading</span>
    </main>
  );
}
