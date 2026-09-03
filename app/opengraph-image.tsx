import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * The share card — what a link to this site looks like laid on someone else's
 * surface (Slack, LinkedIn, iMessage, a recruiter's notes doc).
 *
 * Built from the site's own materials rather than a separate "OG design": the
 * paper ground, the warm ramp, the triangle mark from `app/icon.svg`, Space
 * Grotesk carrying the name the way it carries every heading, Newsreader
 * carrying the one sentence the way it carries all prose, and the mono meta
 * row as furniture. The fonts are vendored TTFs in `lib/og/fonts/` (Satori
 * can't read the woff2 files `next/font` serves; all three are OFL).
 *
 * Static by construction — no request data — so Next renders it once at build.
 */

export const alt = `${SITE_NAME} — design research and strategy portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The site palette, restated as literals: this renders in Satori, where the
   CSS custom properties in globals.css don't exist. */
const BG = "#f7f7f7";
const CHARCOAL = "#1e1e1e";
const INK_SOFT = "#5c5747";
const MUTED = "#8a8578";
const BORDER = "#c9c3b4";
const ACCENT = "#0047ff";

export default async function OgImage() {
  const [spaceGrotesk, newsreader, jetbrainsMono] = await Promise.all([
    readFile(join(process.cwd(), "lib/og/fonts/SpaceGrotesk-600.ttf")),
    readFile(join(process.cwd(), "lib/og/fonts/Newsreader-Italic-400.ttf")),
    readFile(join(process.cwd(), "lib/og/fonts/JetBrainsMono-500.ttf")),
  ]);

  const host = new URL(SITE_URL).host;

  /* `next dev` and `ImageResponse` fight over the same sharp instance.
     Next's image optimizer hardens the process-wide sharp/libvips singleton by
     blocking every `VipsForeignLoad` operation and unblocking only the raster
     formats it serves (`getSharp` in `next/dist/server/image-optimizer.js`) —
     SVG stays blocked. `@vercel/og` prefers sharp over its resvg-wasm fallback
     whenever sharp is importable (it always is; sharp is a dependency of next
     itself), and renders by feeding satori's SVG to sharp. So in dev, once any
     `/_next/image` request has initialized the optimizer, this route dies with
     "Input buffer contains unsupported image format" — surfaced only as
     `Error: failed to pipe response` and an empty reply. Re-allow libvips'
     SVG loader before rendering. Dev-only: production serves this image
     prerendered from the build, where the optimizer never ran, and the
     optimizer's hardening should stay intact anywhere it matters. */
  if (process.env.NODE_ENV === "development") {
    const sharp = (await import("sharp")).default;
    sharp.unblock({ operation: ["VipsForeignLoadSvg"] });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "72px 84px 0",
        }}
      >
        {/* The mark — app/icon.svg's own polygons, same viewBox. */}
        <svg
          width="76"
          height="66"
          viewBox="54 104 404 352"
          style={{ display: "flex" }}
        >
          <polygon
            points="59,109 175,109 117,210"
            fill={ACCENT}
            stroke={ACCENT}
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <polygon
            points="336,109 452,109 394,210"
            fill={ACCENT}
            stroke={ACCENT}
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <polygon
            points="198,349 313,349 255,450"
            fill={ACCENT}
            stroke={ACCENT}
            strokeWidth="10"
            strokeLinejoin="round"
          />
        </svg>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontSize: 110,
              fontWeight: 600,
              color: CHARCOAL,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontFamily: "Newsreader",
              fontStyle: "italic",
              fontSize: 34,
              color: INK_SOFT,
              marginTop: 28,
              lineHeight: 1.3,
              maxWidth: 900,
            }}
          >
            Design research &amp; strategy — the projects, the field work, and
            the decisions behind them.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${BORDER}`,
            padding: "26px 0 30px",
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            letterSpacing: "0.08em",
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>{host.toUpperCase()}</div>
          <div style={{ display: "flex" }}>PORTFOLIO — WORK / WRITING / ABOUT</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: spaceGrotesk, weight: 600, style: "normal" },
        { name: "Newsreader", data: newsreader, weight: 400, style: "italic" },
        { name: "JetBrains Mono", data: jetbrainsMono, weight: 500, style: "normal" },
      ],
    }
  );
}
