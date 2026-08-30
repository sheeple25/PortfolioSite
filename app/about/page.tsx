import type { Metadata } from "next";
import Bookshelf from "@/components/about/Bookshelf";
import CursorImageTrail from "@/components/about/CursorImageTrail";
import IndexShell from "@/components/chrome/IndexShell";
import styles from "./page.module.css";

const TITLE = "About.";
const INTRO =
  "This page is still being written. In the meantime, here’s what I’ve been reading.";

/*
 * Placeholder art for the cursor trail — real images are still coming, so
 * this borrows a handful of the book covers already on this page rather than
 * introducing new assets for a temporary set.
 */
const TRAIL_IMAGES = [
  "/about/books/the-great-gatsby-41733839.jpg",
  "/about/books/norwegian-wood-11297.jpg",
  "/about/books/klara-and-the-sun-54120408.jpg",
  "/about/books/the-secret-history-29044.jpg",
  "/about/books/1984-61439040.jpg",
  "/about/books/the-alchemist-18144590.jpg",
];

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
    <>
      <CursorImageTrail images={TRAIL_IMAGES} />
      <IndexShell title={TITLE} intro={INTRO}>
        <h2 className={styles.sectionLabel}>Bookshelf</h2>
        <Bookshelf />
      </IndexShell>
    </>
  );
}
