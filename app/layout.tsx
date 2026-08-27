import type { Metadata } from "next";
import {
  Space_Grotesk,
  JetBrains_Mono,
  Newsreader,
  Waiting_for_the_Sunrise,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PixelCompanion, PixelProvider, PixelSidebar } from "@/components/pixel";
import LabMenu from "@/components/dev/LabMenu";
import BottomEdge from "@/components/chrome/BottomEdge";
import Footer from "@/components/chrome/Footer";
import NavBar from "@/components/chrome/NavBar";
import StickerVote from "@/components/chrome/StickerVote";
import ThemeToggle from "@/components/chrome/ThemeToggle";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  // 600 is the section-heading weight on `/writing`; 400 sets the body.
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
});

/** The hand Pixel annotates in on `/writing`. Single weight — it has only one. */
const waitingForTheSunrise = Waiting_for_the_Sunrise({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-waiting-for-the-sunrise",
});

/**
 * The site-wide default. Every route that doesn't set its own `description`
 * inherits this one, so it shows up in search results and link previews for
 * most of the site — it is not a placeholder slot.
 */
const SITE_DESCRIPTION =
  "Design research and strategy by Vidush Gupta — speculative and critical design projects, field research, and writing on how design decisions get made.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} Portfolio`,
    template: `%s — ${SITE_NAME} Portfolio`,
  },
  description: SITE_DESCRIPTION,
  /*
   * No `images` entry yet: there is no share card in `public/`, and an
   * `openGraph.images` pointing at a missing file previews worse than none at
   * all. Everything else here is what makes a shared link render as something
   * other than a bare URL.
   */
  openGraph: {
    type: "website",
    siteName: `${SITE_NAME} Portfolio`,
    title: `${SITE_NAME} Portfolio`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} Portfolio`,
    description: SITE_DESCRIPTION,
  },
};

/**
 * Statically false in a production build, so the bundler drops both the element
 * and the `LabMenu` module below. See the note in components/dev/LabMenu.tsx.
 */
const SHOW_DEV_LABS = process.env.NODE_ENV === "development";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${newsreader.variable} ${waitingForTheSunrise.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs synchronously during HTML parsing, before first paint, so a
          returning visitor's dark-mode choice never flashes light first. The
          site defaults to light and never looks at `prefers-color-scheme` —
          only a stored choice moves it off that default. `suppressHydrationWarning`
          on `<html>` above is what stops React treating the class this adds
          as a hydration mismatch. See the Next.js "preventing flash before
          hydration" guide (themes section) for the pattern.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body id="top">
        {/*
          Pixel is mounted here rather than per-page so it survives client-side
          navigation — the sprite keeps its idle timer, gaze and blink across
          route changes instead of remounting cold on every link.
        */}
        <PixelProvider>
          <NavBar />
          {/*
            Deliberately not inside <NavBar>: the header row ends at "Ask
            Pixel", which has to stay the rightmost thing in it. The theme
            switch is fixed page chrome instead, sitting in the strip just
            below the header on every route.
          */}
          <ThemeToggle />
          {/*
            `.appMain` is the flex child that grows, which is what holds the
            footer at the bottom of pages too short to fill the viewport.
          */}
          <div className="appMain">{children}</div>
          <Footer />
          <BottomEdge />
          {/*
            Fixed-position, not part of this flow — opening it widens `body`'s
            margin-right (globals.css) to push the page over instead.
          */}
          <PixelSidebar />
          <PixelCompanion />
        </PixelProvider>
        {/*
          Fixed to the left edge — Pixel's sidebar and companion both live on
          the right (above), so the left is the one side left for chrome.
        */}
        <StickerVote />
        {SHOW_DEV_LABS && <LabMenu />}
        {/*
          Vercel Web Analytics: automatic pageviews site-wide, plus the
          `track()` custom events fired from IndexCard, Footer and
          StickerVote. No-ops safely when not deployed on Vercel.
        */}
        <Analytics />
      </body>
    </html>
  );
}
