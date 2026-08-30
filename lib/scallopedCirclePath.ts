/**
 * A seal's scalloped rim: a ring of points alternating between two radii,
 * smoothed into a closed loop with quadratic curves through each edge's
 * midpoint (the standard trick for turning a jagged polygon into a wavy
 * blob). Bumps stay shallow relative to the radius so it reads as a badge
 * with a wavy edge, not a spiky star.
 *
 * Shared by every wavy-edge badge on the site — the sticker-rating widget
 * (`StickerVote.tsx`) and the case-study institution stickers
 * (`components/case-study/Banner.tsx`) both draw from this one shape so the
 * two "badge" surfaces read as the same visual language rather than two
 * independent wavy-circle implementations.
 */

/**
 * Coordinates are rounded before they reach the path string, and that is a
 * correctness fix rather than a tidiness one.
 *
 * `Math.cos`/`Math.sin` are not required by the spec to be correctly rounded,
 * so Node and Chrome — different V8 builds against different libm — can return
 * values that differ in the last bit or two. Unrounded, those land in the `d`
 * attribute as visibly different strings, React compares the server's markup
 * with the client's, and every badge on the site reports a hydration mismatch.
 *
 * Three decimals is far below what a ~92px badge can show, so the shape is
 * unchanged, and any plausible ULP-level disagreement rounds away.
 */
const round = (n: number) => Math.round(n * 1000) / 1000;

export function scallopedCirclePath(radius: number, bumps: number, waveDepth: number) {
  const cx = radius;
  const cy = radius;
  const totalPoints = bumps * 2;
  const angleStep = (Math.PI * 2) / totalPoints;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius - waveDepth;
    pts.push([round(cx + r * Math.cos(angle)), round(cy + r * Math.sin(angle))]);
  }
  const last = pts[pts.length - 1];
  const first = pts[0];
  let d = `M ${round((last[0] + first[0]) / 2)} ${round((last[1] + first[1]) / 2)} `;
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const midX = round((curr[0] + next[0]) / 2);
    const midY = round((curr[1] + next[1]) / 2);
    d += `Q ${curr[0]} ${curr[1]} ${midX} ${midY} `;
  }
  return `${d}Z`;
}
