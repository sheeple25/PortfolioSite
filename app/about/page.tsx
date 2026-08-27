import type { Metadata } from "next";
import Bookshelf from "@/components/about/Bookshelf";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
};

/*
 * Placeholder page: the About page's full content/layout is still an open
 * item (someone else's concern). This just gives the bookshelf a page to
 * live on for review — not a finished design.
 */
export default function About() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>About</h1>
      <p className={styles.intro}>
        This page is still being written. In the meantime, here&rsquo;s what
        I&rsquo;ve been reading.
      </p>

      <h2 className={styles.sectionLabel}>Bookshelf</h2>
      <Bookshelf />
    </main>
  );
}
