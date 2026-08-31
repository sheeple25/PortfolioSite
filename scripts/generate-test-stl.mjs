/**
 * Generator for the STL viewer's test asset — a regular icosahedron
 * (12 vertices, 20 triangular facets) emitted as ASCII STL.
 *
 * No external model is downloaded; the geometry is the standard closed-form
 * icosahedron construction (golden-ratio rectangles), scaled up so it reads
 * clearly at typical camera distances in `components/stl/Scene.tsx`.
 *
 * Run with: node scripts/generate-test-stl.mjs
 * Writes: public/stl/icosahedron.stl (the default model for `StlViewer`)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PHI = (1 + Math.sqrt(5)) / 2;
const SCALE = 10;

/** @type {[number, number, number][]} */
const rawVertices = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

const vertices = rawVertices.map(([x, y, z]) => [x * SCALE, y * SCALE, z * SCALE]);

/** @type {[number, number, number][]} 20 faces, CCW winding when viewed from outside. */
const faces = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function fmt(n) {
  return n.toFixed(6);
}

const lines = ["solid icosahedron"];

for (const [ia, ib, ic] of faces) {
  const a = vertices[ia];
  const b = vertices[ib];
  const c = vertices[ic];
  const normal = normalize(cross(sub(b, a), sub(c, a)));

  lines.push(`  facet normal ${fmt(normal[0])} ${fmt(normal[1])} ${fmt(normal[2])}`);
  lines.push("    outer loop");
  lines.push(`      vertex ${fmt(a[0])} ${fmt(a[1])} ${fmt(a[2])}`);
  lines.push(`      vertex ${fmt(b[0])} ${fmt(b[1])} ${fmt(b[2])}`);
  lines.push(`      vertex ${fmt(c[0])} ${fmt(c[1])} ${fmt(c[2])}`);
  lines.push("    endloop");
  lines.push("  endfacet");
}

lines.push("endsolid icosahedron");

const outDir = path.join(__dirname, "..", "public", "stl");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "icosahedron.stl");
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

console.log(`Wrote ${faces.length} facets to ${outPath}`);
