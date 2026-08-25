"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./particle-text.module.css";

/**
 * A heading that assembles itself out of particles.
 *
 * The word is rendered twice. The `<span>` is the real text — it carries the
 * accessible name, and its box is what sizes the canvas, so the particles
 * inherit the heading's own type scale instead of a second one kept in step by
 * hand. Once the canvas has drawn a frame the span fades out and the drawing
 * takes over, which means the word is legible before the effect starts and
 * stays legible if it never does.
 *
 * The particle positions are sampled from the glyphs themselves rather than
 * from a path, so any string in any loaded font works without preparation.
 */

/** Sampling stride through the mask, in device-independent pixels. */
const GAP = 4;

/** Pointer radius, and how hard particles are pushed out of it. */
const REPEL_RADIUS = 78;
const REPEL_STRENGTH = 42;

/** Pull back toward home, and the drag that stops it oscillating. */
const SPRING = 0.055;
const FRICTION = 0.86;

/** Particle side length. Just under GAP, so the glyphs read as a mesh. */
const DOT = 2.4;

type Particle = {
  /** Where the glyph wants this dot to sit. */
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/**
 * Canvas 2D ignores CSS `letter-spacing` unless it is set on the context, and
 * a tracked heading drawn without it comes out wider than its own box — which
 * silently clips the last glyph. Guarded because the property is not universal.
 */
function applyTracking(ctx: CanvasRenderingContext2D, tracking: string) {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      tracking;
  }
}

/**
 * Reads the glyph coverage of `text` and returns one particle per filled cell.
 *
 * Drawing to an offscreen canvas and walking the alpha channel is what keeps
 * this font-agnostic: whatever the browser actually rendered is what gets
 * sampled, tracking and ligatures included. The baseline comes from the font's
 * own ascent rather than a guessed fraction of the size, so descenders land
 * inside the box instead of being cut off at the bottom.
 *
 * Returns the width it needed as well — with tracking applied the drawn text
 * can still run a fraction wider than the inline box, and the visible canvas
 * has to match or the sampling is clipped a second time.
 */
function sampleGlyphs(
  text: string,
  font: string,
  tracking: string,
  boxWidth: number,
  boxHeight: number
): { particles: Particle[]; drawWidth: number } {
  const probe = document.createElement("canvas");
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { particles: [], drawWidth: boxWidth };

  ctx.font = font;
  applyTracking(ctx, tracking);
  const metrics = ctx.measureText(text);

  const drawWidth = Math.ceil(Math.max(boxWidth, metrics.width)) + 2;
  const drawHeight = Math.max(1, Math.ceil(boxHeight));
  probe.width = drawWidth;
  probe.height = drawHeight;

  // Resizing a canvas resets its context, so the state has to be set again.
  ctx.font = font;
  applyTracking(ctx, tracking);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";

  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const baseline = (drawHeight - (ascent + descent)) / 2 + ascent;
  ctx.fillText(text, 0, baseline);

  const { data } = ctx.getImageData(0, 0, drawWidth, drawHeight);
  const particles: Particle[] = [];

  for (let y = 0; y < drawHeight; y += GAP) {
    for (let x = 0; x < drawWidth; x += GAP) {
      // Alpha only — the fill is opaque white, so anything above the threshold
      // is glyph and everything else is the gaps between letters.
      if (data[(y * drawWidth + x) * 4 + 3] > 128) {
        particles.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0 });
      }
    }
  }

  return { particles, drawWidth };
}

export default function ParticleText({
  children,
  className,
  as: Tag = "h1",
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const host = hostRef.current;
    const label = labelRef.current;
    const canvas = canvasRef.current;
    if (!host || !label || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let frame = 0;
    let cancelled = false;
    let running = false;

    /*
     * Last measured box. Resizing re-homes the existing particles rather than
     * rebuilding them, and an observer callback that reports the same size is
     * ignored outright — otherwise every rebuild would scatter the word again
     * and it would never finish assembling.
     */
    let lastWidth = 0;
    let lastHeight = 0;

    /** Size of the visible canvas in CSS pixels, for clearing each frame. */
    let canvasWidth = 0;
    let canvasHeight = 0;

    /** Pointer in canvas space. Off-canvas until it moves over the heading. */
    const pointer = { x: -9999, y: -9999 };

    function build() {
      if (!host || !label || !canvas || !ctx) return;

      const box = label.getBoundingClientRect();
      const width = box.width;
      const height = box.height;
      if (width < 1 || height < 1) return;
      if (width === lastWidth && height === lastHeight) return;

      const first = lastWidth === 0;
      lastWidth = width;
      lastHeight = height;

      const computed = window.getComputedStyle(label);
      const font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const tracking =
        computed.letterSpacing === "normal" ? "0px" : computed.letterSpacing;

      const sampled = sampleGlyphs(children, font, tracking, width, height);
      const next = sampled.particles;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = sampled.drawWidth;
      canvasHeight = height;
      canvas.width = Math.ceil(canvasWidth * dpr);
      canvas.height = Math.ceil(canvasHeight * dpr);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (first) {
        // Everything starts scattered and springs home over the first frames.
        for (const p of next) {
          p.x = p.homeX + (Math.random() - 0.5) * width * 0.5;
          p.y = p.homeY + (Math.random() - 0.5) * height * 2.5;
        }
      } else {
        /*
         * A reflow only moves the target. Carrying each particle's current
         * position across means the word slides to its new size instead of
         * exploding and reassembling every time the column changes width.
         */
        for (let i = 0; i < next.length; i++) {
          const previous = particles[i];
          if (!previous) break;
          next[i].x = previous.x;
          next[i].y = previous.y;
          next[i].vx = previous.vx;
          next[i].vy = previous.vy;
        }
      }

      particles = next;

      /*
       * Colour comes from the host, not the label: once the canvas takes over,
       * the label is painted transparent, and reading it back on a later
       * rebuild would draw the particles in transparent ink.
       */
      ctx.fillStyle = window.getComputedStyle(host).color;
    }

    function tick() {
      if (cancelled || !ctx || !canvas) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      for (const p of particles) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);

        if (distance < REPEL_RADIUS && distance > 0.01) {
          // Falls off linearly to nothing at the edge of the radius.
          const push = ((REPEL_RADIUS - distance) / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / distance) * push * 0.06;
          p.vy += (dy / distance) * push * 0.06;
        }

        p.vx = (p.vx + (p.homeX - p.x) * SPRING) * FRICTION;
        p.vy = (p.vy + (p.homeY - p.y) * SPRING) * FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillRect(p.x, p.y, DOT, DOT);
      }

      frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    }

    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    /**
     * Starts the loop the first time there is anything to draw.
     *
     * This deliberately does not live in the font callback. A heading that is
     * still unlaid out — hidden tab, collapsed parent, anything with a zero
     * box — samples to nothing, and hanging the start off that one moment
     * would mean it never recovered once the box appeared.
     */
    function ensureRunning() {
      if (cancelled || running || particles.length === 0) return;
      running = true;
      setDrawing(true);
      frame = requestAnimationFrame(tick);
    }

    /*
     * next/font loads asynchronously. Sampling before the face arrives would
     * capture the fallback's glyph shapes, so the first build waits for it.
     */
    document.fonts.ready.then(() => {
      if (cancelled) return;
      build();
      ensureRunning();
    });

    const observer = new ResizeObserver(() => {
      // Re-measure on reflow — the heading is on a fluid clamp() type scale,
      // and this is also what picks the word up if it had no box at mount.
      build();
      ensureRunning();
    });
    observer.observe(host);

    window.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [children, reducedMotion]);

  return (
    <Tag className={className}>
      <span ref={hostRef} className={styles.host}>
        {/*
          Stays in the accessibility tree and keeps sizing the box either way —
          `visibility` would take it out of the tree, so this hides it by paint
          alone once the canvas has something to show.
        */}
        <span
          ref={labelRef}
          className={styles.label}
          style={drawing ? { color: "transparent" } : undefined}
        >
          {children}
        </span>

        {!reducedMotion && (
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        )}
      </span>
    </Tag>
  );
}
