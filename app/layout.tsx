import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
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
  title: "Portfolio",
  description: "My portfolio website",
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
      <body>{children}</body>
    </html>
  );
}
