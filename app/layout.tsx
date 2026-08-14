import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import { PixelCompanion, PixelProvider } from "@/components/pixel";
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
  weight: ["400", "500"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Portfolio — Under Construction",
  description: "My portfolio website is currently under construction.",
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
    >
      <body>
        {/*
          Pixel is mounted here rather than per-page so it survives client-side
          navigation — the sprite keeps its idle timer, gaze and blink across
          route changes instead of remounting cold on every link.
        */}
        <PixelProvider>
          {children}
          <PixelCompanion />
        </PixelProvider>
      </body>
    </html>
  );
}
