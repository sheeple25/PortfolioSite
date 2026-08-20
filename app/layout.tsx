import type { Metadata } from "next";
import {
  Space_Grotesk,
  JetBrains_Mono,
  Newsreader,
  Waiting_for_the_Sunrise,
} from "next/font/google";
import { PixelCompanion, PixelProvider } from "@/components/pixel";
import LabMenu from "@/components/dev/LabMenu";
import BottomEdge from "@/components/chrome/BottomEdge";
import Footer from "@/components/chrome/Footer";
import NavBar from "@/components/chrome/NavBar";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Portfolio — Under Construction",
    template: `%s — ${SITE_NAME}`,
  },
  description: "My portfolio website is currently under construction.",
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
    >
      <body id="top">
        {/*
          Pixel is mounted here rather than per-page so it survives client-side
          navigation — the sprite keeps its idle timer, gaze and blink across
          route changes instead of remounting cold on every link.
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
          <PixelCompanion />
        </PixelProvider>
        {SHOW_DEV_LABS && <LabMenu />}
      </body>
    </html>
  );
}
