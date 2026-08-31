import type { Metadata } from "next";
import {
  Space_Grotesk,
  JetBrains_Mono,
  Newsreader,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PacmanCursor, PixelCompanion, PixelProvider, PixelSidebar } from "@/components/pixel";
import BottomEdge from "@/components/chrome/BottomEdge";
import SectionGround from "@/components/chrome/SectionGround";
import { ShutterProvider } from "@/components/chrome/Shutter";
import { INDEX_ROUTES } from "@/components/chrome/sections";
import Footer from "@/components/chrome/Footer";
import NavBar from "@/components/chrome/NavBar";
import StickerVote from "@/components/chrome/StickerVote";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}
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
            /*
             * The index ground goes on before first paint for the same reason
             * the theme does: an effect runs after the first frame, so a cold
             * load of an index would flash the light default first. The route
             * list is interpolated from `sections.ts` rather than written out
             * here, so the two cannot drift.
             */
            __html: `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark");if(${JSON.stringify(
              INDEX_ROUTES,
            )}.indexOf(location.pathname)>-1)document.documentElement.classList.add("index-ground")}catch(e){}})()`,
          }}
        />
      </head>
      <body id="top">
        {/* Keeps the index ground in step with the route. Renders nothing. */}
        <SectionGround />

        {/*
          The shutter wraps the nav bar as well as the page, because the bar's
          own links drive it too — mounted per page it could only ever animate a
          move that started inside the page.
        */}
        <ShutterProvider>
          {/*
            Pixel is mounted here rather than per-page so it survives
            client-side navigation — the sprite keeps its idle timer, gaze and
            blink across route changes instead of remounting cold on every link.
          */}
          <PixelProvider>
            <NavBar />
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
            <PacmanCursor />
          </PixelProvider>
        </ShutterProvider>
        {/*
          Fixed to the left edge — Pixel's sidebar and companion both live on
          the right (above), so the left is the one side left for chrome.
        */}
        <StickerVote />
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
