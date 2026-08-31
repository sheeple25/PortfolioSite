"use client";

import { useEffect, useRef } from "react";
import { rowsToRuns, runsToPath } from "./sprites";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./PacmanCursor.module.css";

/*
 * Drawn on the same crisp-cell pipeline as Pixel's own sprite (rowsToRuns /
 * runsToPath from ./sprites), but at a coarser resolution — 12 cells instead
 * of Pixel's 24 — rendered small, so the blockiness itself reads as the
 * point rather than getting smoothed away. Rounded square rather than a
 * circle or a coin — the corner radius stops short of RADIUS. The mouth is a
 * live angle-cut wedge, not a drawn frame, so it can face any direction; it
 * stays shut at rest and only opens for the single-chomp envelope a click
 * triggers (see `biteEnvelope`), rather than chewing continuously.
 */
const GRID = 12;
const CENTER = GRID / 2;
const RADIUS = 5.1;
/** Between a square (≈1) and a circle (== RADIUS) — a rounded square, not a coin. */
const CORNER = 3.3;
const SIZE = 30;

/** One click = one bite: a mouth-open-and-shut plus a squash-and-rebound, both keyed off time since the last click. */
const BITE_DURATION_MS = 320;
const BITE_MOUTH_MAX = 90;
const BITE_SQUASH = 0.18;

/** Envelope for a single bite, `elapsed` ms after the triggering click. Past the duration it's just idle (closed mouth, resting scale). */
function biteEnvelope(elapsed: number): { mouth: number; scale: number } {
  if (elapsed >= BITE_DURATION_MS || elapsed < 0) return { mouth: 0, scale: 1 };
  const t = elapsed / BITE_DURATION_MS;
  const mouth = BITE_MOUTH_MAX * Math.sin(Math.PI * t);

  let scale: number;
  if (t < 0.32) {
    scale = 1 - BITE_SQUASH * (t / 0.32);
  } else {
    // easeOutBack: overshoots past 1 before settling exactly on it — the "bounce back".
    const p = (t - 0.32) / 0.68;
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const eased = 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
    scale = 1 - BITE_SQUASH + BITE_SQUASH * eased;
  }
  return { mouth, scale };
}

function buildPacmanPath(mouthDeg: number, facingDeg: number): string {
  const rows: string[] = [];
  for (let y = 0; y < GRID; y++) {
    let row = "";
    for (let x = 0; x < GRID; x++) {
      const lx = x + 0.5 - CENTER;
      const ly = y + 0.5 - CENTER;
      const qx = Math.abs(lx) - (RADIUS - CORNER);
      const qy = Math.abs(ly) - (RADIUS - CORNER);
      const outsideCorner = Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2 > CORNER ** 2;
      let filled = !outsideCorner;

      if (filled && mouthDeg > 1) {
        const angle = (Math.atan2(ly, lx) * 180) / Math.PI;
        const rel = ((angle - facingDeg + 540) % 360) - 180;
        if (Math.abs(rel) <= mouthDeg / 2) filled = false;
      }

      row += filled ? "#" : ".";
    }
    rows.push(row);
  }
  return runsToPath(rowsToRuns(rows));
}

/** A one-off "nom" that floats and fades at the click point. Cleans itself up via `animationend` rather than a guessed timeout. */
function spawnNom(x: number, y: number, color: string) {
  const el = document.createElement("div");
  el.textContent = "nom";
  el.className = styles.nom;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.addEventListener("animationend", () => el.remove(), { once: true });
  document.body.appendChild(el);
}

export default function PacmanCursor({ color = "#f0ac1c" }: { color?: string }) {
  const fine = useMediaQuery("(pointer: fine)");
  const reducedMotion = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const pointer = useRef({ x: 0, y: 0, seen: false });
  const pac = useRef({ x: 0, y: 0, facing: 0 });
  const lastBiteAt = useRef(-Infinity);

  useEffect(() => {
    if (!fine) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor-active");

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.seen = true;
    };
    const onDown = (e: PointerEvent) => {
      lastBiteAt.current = performance.now();
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      spawnNom(e.clientX, e.clientY, color);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let frame = requestAnimationFrame(loop);

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (!pointer.current.seen || !rootRef.current || !pathRef.current) return;

      if (rootRef.current.style.visibility === "hidden") {
        pac.current.x = pointer.current.x;
        pac.current.y = pointer.current.y;
        rootRef.current.style.visibility = "visible";
      }

      pac.current.x += (pointer.current.x - pac.current.x) * 0.5;
      pac.current.y += (pointer.current.y - pac.current.y) * 0.5;

      const mdx = pointer.current.x - pac.current.x;
      const mdy = pointer.current.y - pac.current.y;
      if (Math.hypot(mdx, mdy) > 1.2) {
        const target = (Math.atan2(mdy, mdx) * 180) / Math.PI;
        const delta = ((target - pac.current.facing + 540) % 360) - 180;
        pac.current.facing += delta * 0.28;
      }

      const { mouth, scale } = biteEnvelope(now - lastBiteAt.current);

      pathRef.current.setAttribute("d", buildPacmanPath(mouth, pac.current.facing));
      const appliedScale = reducedMotion ? 1 : scale;
      rootRef.current.style.transform =
        `translate3d(${pac.current.x - SIZE / 2}px, ${pac.current.y - SIZE / 2}px, 0) scale(${appliedScale})`;
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      root.classList.remove("custom-cursor-active");
    };
  }, [fine, reducedMotion]);

  if (!fine) return null;

  return (
    <div ref={rootRef} className={styles.cursor} style={{ visibility: "hidden" }} aria-hidden="true">
      <svg viewBox={`0 0 ${GRID} ${GRID}`} width={SIZE} height={SIZE} shapeRendering="crispEdges">
        <path ref={pathRef} fill={color} />
      </svg>
    </div>
  );
}
