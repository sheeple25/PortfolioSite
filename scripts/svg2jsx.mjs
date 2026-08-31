#!/usr/bin/env node
/*
 * Converts a flat Figma-exported SVG (an optional <mask>/<defs> block plus a
 * flat list of path/rect/etc shapes) into an animated inline JSX diagram for
 * `components/projects/figures/generated`.
 *
 * Usage:
 *   node scripts/svg2jsx.mjs "public/projects/Fig X.X.X.svg" ComponentName [--accent=#rrggbb] [--stroke-draw=12,13,40]
 *
 * Classifies each shape by what it actually has (see motionVariants.ts):
 *   stroke only      -> STROKE_VARIANTS
 *   stroke + fill     -> STROKE_FILL_VARIANTS
 *   fill only          -> FILL_VARIANTS
 * and maps every literal color it finds to the nearest of the four --fig-*
 * theme tokens (ink, ink-mute, accent, stage) by RGB distance, so the figure
 * re-themes with the rest of the page instead of carrying hardcoded hex.
 *
 * Figma flattens a drawn stroke (an arrow, a hand-drawn line) into a single
 * filled outline shape with no `stroke` attribute of its own, so by default
 * it gets FILL_VARIANTS and fades in instead of drawing. `--stroke-draw`
 * takes the 1-based line numbers (in the *source* SVG) of shapes that should
 * draw in instead: it traces the shape's own outline in its fill color via
 * STROKE_DRAW_VARIANTS, fades the fill in over it, then fades the trace
 * stroke back out so the settled shape is a normal solid fill rather than a
 * permanent wireframe outline.
 *
 * Re-run and diff rather than hand-editing the generated output if the
 * source SVG changes.
 */

import fs from "fs";
import path from "path";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const [, , srcArg, nameArg, ...rest] = process.argv;
if (!srcArg || !nameArg) {
  fail("Usage: node scripts/svg2jsx.js <source.svg> <ComponentName> [--accent=#rrggbb]");
}

const accentArg = rest.find((a) => a.startsWith("--accent="));
const ACCENT = accentArg ? accentArg.split("=")[1] : "#ee15a5";

const strokeDrawArg = rest.find((a) => a.startsWith("--stroke-draw="));
const STROKE_DRAW_LINES = new Set(
  strokeDrawArg
    ? strokeDrawArg.split("=")[1].split(",").map((n) => parseInt(n.trim(), 10))
    : [],
);
const strokeDrawWidthArg = rest.find((a) => a.startsWith("--stroke-draw-width="));
const STROKE_DRAW_WIDTH = strokeDrawWidthArg ? strokeDrawWidthArg.split("=")[1] : "2";

const src = fs.readFileSync(srcArg, "utf8");

// --------------------------------------------------------------- color --

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };

function toRgb(color) {
  if (!color) return null;
  const c = color.trim().toLowerCase();
  if (c === "none") return null;
  if (NAMED[c]) return NAMED[c];
  if (c.startsWith("#")) return hexToRgb(c);
  return null;
}

const PALETTE = [
  { token: "var(--fig-ink)", rgb: [255, 255, 255] },
  { token: "var(--fig-ink-mute)", rgb: [160, 160, 160] },
  { token: "var(--fig-accent)", rgb: hexToRgb(ACCENT) },
  { token: "var(--fig-stage)", rgb: [30, 30, 30] },
];

function nearestToken(color) {
  const rgb = toRgb(color);
  if (!rgb) return color; // "none" or unparsed - leave as-is
  let best = null;
  let bestDist = Infinity;
  for (const entry of PALETTE) {
    const d = entry.rgb.reduce((sum, v, i) => sum + (v - rgb[i]) ** 2, 0);
    if (d < bestDist) {
      bestDist = d;
      best = entry.token;
    }
  }
  return best;
}

// ----------------------------------------------------------- attributes --

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function toCamel(attr) {
  return attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function jsxAttr(name, value) {
  return `${toCamel(name)}="${value.replace(/"/g, "&quot;")}"`;
}

const GEOMETRY_ATTRS = {
  path: ["d"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polygon: ["points"],
  polyline: ["points"],
};

const PASSTHROUGH_ATTRS = [
  "transform",
  "mask",
  "clip-path",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
];

// ------------------------------------------------------------- masks --

// <mask>/<defs> blocks aren't shapes to animate, just definitions later
// elements reference by id - pulled out verbatim, and their line range
// excluded from the shape scan below so `--stroke-draw` line numbers stay
// meaningful against the source file.
const DEFS_BLOCKS = [];
const srcLines = src.split(/\r?\n/);
const excludedLines = new Set();
{
  let inBlock = false;
  let blockLines = [];
  for (let idx = 0; idx < srcLines.length; idx += 1) {
    const line = srcLines[idx];
    if (!inBlock && /<(mask|defs)\b/.test(line)) {
      inBlock = true;
      blockLines = [];
    }
    if (inBlock) {
      excludedLines.add(idx + 1);
      blockLines.push(line);
      if (/<\/(mask|defs)>/.test(line)) {
        inBlock = false;
        const block = blockLines.join("\n");
        DEFS_BLOCKS.push(block.replace(/<path\b([^>]*?)\/>/g, (_, attrs) => {
          const a = parseAttrs(attrs);
          const kept = Object.entries(a).map(([k, v]) => jsxAttr(k, v)).join(" ");
          return `<path ${kept} />`;
        }));
      }
    }
  }
}

// -------------------------------------------------------------- svg --

const rootMatch = src.match(/<svg\b([^>]*)>/);
if (!rootMatch) fail("No <svg> root found.");
const rootAttrs = parseAttrs(rootMatch[1]);
const viewBox = rootAttrs.viewBox || `0 0 ${rootAttrs.width} ${rootAttrs.height}`;

// ------------------------------------------------------------- shapes --

const SHAPE_TAGS = Object.keys(GEOMETRY_ATTRS).join("|");
const shapeRe = new RegExp(`<(${SHAPE_TAGS})\\b([^>]*?)\\/>`, "g");

const usedVariants = new Set();
let i = 0;
const elements = [];
for (let idx = 0; idx < srcLines.length; idx += 1) {
  const lineNo = idx + 1;
  if (excludedLines.has(lineNo)) continue;
  const line = srcLines[idx];

  shapeRe.lastIndex = 0;
  let m;
  while ((m = shapeRe.exec(line))) {
  const [, tag, attrString] = m;
  const attrs = parseAttrs(attrString);

  const styleOpacity = (() => {
    const style = attrs.style || "";
    const fm = style.match(/fill-opacity:\s*([0-9.]+)/);
    return fm ? parseFloat(fm[1]) : null;
  })();

  const fillRaw = attrs.fill;
  const strokeRaw = attrs.stroke;
  const hasFill = fillRaw && fillRaw !== "none";
  const hasStroke = strokeRaw && strokeRaw !== "none";
  const forceStrokeDraw = STROKE_DRAW_LINES.has(lineNo) && hasFill && !hasStroke;
  const fillOpacity = attrs["fill-opacity"] != null
    ? parseFloat(attrs["fill-opacity"])
    : (styleOpacity ?? 1);

  i += 1;

  const parts = [];
  for (const g of GEOMETRY_ATTRS[tag]) {
    if (attrs[g] != null) parts.push(jsxAttr(g, attrs[g]));
  }
  for (const p of PASSTHROUGH_ATTRS) {
    if (attrs[p] != null) parts.push(jsxAttr(p, attrs[p]));
  }

  let variant = null;
  if (forceStrokeDraw) {
    variant = "STROKE_DRAW_VARIANTS";
    const token = nearestToken(fillRaw);
    parts.push(jsxAttr("fill", token));
    parts.push(`stroke="${token}"`);
    parts.push(`strokeWidth={${STROKE_DRAW_WIDTH}}`);
    usedVariants.add(variant);
    parts.push(`variants={${variant}}`);
    parts.push(`custom={{ i: ${i}, fillOpacity: ${fillOpacity} }}`);
  } else if (hasStroke && hasFill) {
    variant = "STROKE_FILL_VARIANTS";
    parts.push(jsxAttr("fill", nearestToken(fillRaw)));
    parts.push(jsxAttr("stroke", nearestToken(strokeRaw)));
    if (attrs["stroke-width"] != null) parts.push(jsxAttr("stroke-width", attrs["stroke-width"]));
    usedVariants.add(variant);
    parts.push(`variants={${variant}}`);
    parts.push(`custom={{ i: ${i}, fillOpacity: ${fillOpacity} }}`);
  } else if (hasStroke) {
    variant = "STROKE_VARIANTS";
    parts.push(jsxAttr("stroke", nearestToken(strokeRaw)));
    if (attrs["stroke-width"] != null) parts.push(jsxAttr("stroke-width", attrs["stroke-width"]));
    usedVariants.add(variant);
    parts.push(`variants={${variant}}`);
    parts.push(`custom={${i}}`);
  } else if (hasFill) {
    variant = "FILL_VARIANTS";
    parts.push(jsxAttr("fill", nearestToken(fillRaw)));
    if (fillOpacity !== 1) parts.push(`fillOpacity={${fillOpacity}}`);
    usedVariants.add(variant);
    parts.push(`variants={${variant}}`);
    parts.push(`custom={${i}}`);
  } else {
    // Neither fill nor stroke resolves to something visible - pass through
    // unanimated rather than guessing.
    i -= 1;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "style") continue;
      if (!GEOMETRY_ATTRS[tag].includes(k) && !PASSTHROUGH_ATTRS.includes(k)) {
        parts.push(jsxAttr(k, v));
      }
    }
  }

  const el = variant
    ? `motion.${tag}`
    : tag;
  elements.push(`    <${el} ${parts.join(" ")} />`);
  }
}

// ------------------------------------------------------------- emit --

const importVariants = [...usedVariants].sort();
const componentName = nameArg;
const relSrc = path.relative(process.cwd(), srcArg).replace(/\\/g, "/");

const header = `import { motion } from "motion/react";
${importVariants.length ? `import { ${importVariants.join(", ")} } from "../motionVariants";\n` : ""}import type { DiagramProps } from "../index";
import { InlineSvgDiagram } from "../InlineSvgDiagram";

/*
 * Generated from \`${relSrc}\` by svg2jsx.mjs - inlined (rather
 * than an <img src>) so \`--fig-*\` theme variables and the per-element
 * stroke-draw/fill-fade animation can reach into it. Re-run the script and
 * diff rather than hand-editing paths if the source SVG changes.
 */
export default function ${componentName}({ label }: DiagramProps) {
  return (
    <InlineSvgDiagram viewBox="${viewBox}" label={label}>
`;

const defs = DEFS_BLOCKS.map((d) => `      ${d.trim()}`).join("\n");

const footer = `
    </InlineSvgDiagram>
  );
}
`;

const out = header + (defs ? defs + "\n" : "") + elements.join("\n") + footer;

const outPath = path.join("components/projects/figures/generated", `${componentName}.tsx`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`Wrote ${outPath} (${elements.length} shapes, ${DEFS_BLOCKS.length} defs blocks)`);
