/**
 * Spine geometry, shared by both shelves.
 *
 * The two shelves source their spine *appearance* differently — the thesis
 * corpus hand-authors a colourway per book, the personal shelf generates one
 * from a palette — but the sizing math is the same in both, and was duplicated
 * line for line before this file existed.
 */

/**
 * A deterministic stand-in for randomness: same id, same shelf, every render
 * — real `Math.random()` would desync the server-rendered heights from the
 * client's on hydration.
 */
export function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** The three faces a spine can be set in, mapped to the site's font variables. */
export const FONT_VAR = {
  serif: "var(--font-newsreader)",
  sans: "var(--font-space-grotesk)",
  mono: "var(--font-jetbrains-mono)",
} as const;

export type SpineFont = keyof typeof FONT_VAR;

/** Everything that decides how one spine looks. */
export type SpineStyle = {
  bg: string;
  fg: string;
  font: SpineFont;
  weight: number;
  italic: boolean;
  tracking: string;
  caseStyle: "upper" | "normal";
  fontSize: string;
};

/** `.spine`'s `padding-block`, both edges, in rem. */
const SPINE_PADDING_REM = 1.6;
/** A vertical Latin glyph's advance is roughly this fraction of its font size. */
const GLYPH_ADVANCE = 0.6;
/** Tallest a spine may get, however long its title. */
const MAX_HEIGHT_REM = 27;

/**
 * Books don't line up flush — a real shelf has a little chaos in it. But the
 * chaos can't outrun the label: a spine is at least tall enough to hold its
 * own text at its own font size, so nothing ever runs off the top.
 */
export function spineMetrics({
  id,
  label,
  fontSize,
  tracking,
}: {
  id: string;
  label: string;
  fontSize: string;
  tracking: string;
}): { height: string; width: string } {
  const h = hash(id);
  const baseHeight = 14 + (h % 6); // 14–19rem, organic default
  const width = 2.6 + ((h >> 4) % 6) * 0.22; // 2.6–3.7rem

  const fontSizeRem = parseFloat(fontSize) || 0.8;
  const trackingRem = (parseFloat(tracking) || 0.02) * fontSizeRem;
  const fitHeight =
    SPINE_PADDING_REM +
    label.length * fontSizeRem * GLYPH_ADVANCE +
    Math.max(0, label.length - 1) * trackingRem;

  const height = Math.min(Math.max(baseHeight, fitHeight), MAX_HEIGHT_REM);
  return { height: `${height}rem`, width: `${width}rem` };
}
