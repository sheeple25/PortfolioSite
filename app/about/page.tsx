import type { Metadata } from "next";
import AboutView from "@/components/about/AboutView";

/*
 * Placeholder art for the cursor trail.
 *
 * These borrow book covers already on the page rather than introducing new
 * assets for a temporary set. They are due to be replaced with pixelated
 * cutouts in the same treatment as the interest band's — two different
 * languages of scattered image on one page read as noise, and the trail
 * should belong to the same world as the cutouts rather than sit beside it.
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

/**
 * The About index.
 *
 * The standfirst is written here rather than inside `AboutView` so the page's
 * words stay in the page file, next to its metadata — the component beside it
 * is layout and behaviour.
 */
export default function About() {
  return (
    <AboutView
      trailImages={TRAIL_IMAGES}
      intro="I build structure out of ambiguity, and I can implement what I specify. Most of what I do sits between the research that decides what a thing should be and the build that makes it real."
    />
  );
}
