"use client";

import { useEffect } from "react";

/**
 * One scroll listener for the whole page.
 *
 * Before this, `/traces-entry` ran six independent scroll subscriptions —
 * `NavBar`, `Toc`, `ReaderContext`, and three in the entry lab — each with its
 * own `requestAnimationFrame` and its own geometry reads. Every callback read
 * layout after another may already have written to it, which forces a
 * synchronous reflow, and because they were six separately-scheduled frames of
 * work the browser could not batch them.
 *
 * Here, the page-level values are read once per frame, together, before any
 * subscriber runs. Subscribers that need element geometry still measure their
 * own elements, but they do it inside a single shared frame rather than each
 * scheduling another.
 */

export type ScrollSnapshot = {
  /** `window.scrollY` at the time of the frame. */
  y: number;
  /** Change in `y` since the previous frame. `0` on the first read. */
  delta: number;
  /** Furthest `y` the page can reach — `scrollHeight - innerHeight`. */
  max: number;
  /** `window.innerHeight`. */
  viewport: number;
};

type Subscriber = (snapshot: ScrollSnapshot) => void;

const subscribers = new Set<Subscriber>();

let frame = 0;
let lastY = 0;
let listening = false;

function read(): ScrollSnapshot {
  const y = window.scrollY;
  const snapshot: ScrollSnapshot = {
    y,
    delta: y - lastY,
    max: document.documentElement.scrollHeight - window.innerHeight,
    viewport: window.innerHeight,
  };
  lastY = y;
  return snapshot;
}

function measure() {
  frame = 0;
  const snapshot = read();
  // Copied to an array first: a subscriber that unsubscribes during the sweep
  // would otherwise mutate the set being iterated.
  for (const subscriber of [...subscribers]) subscriber(snapshot);
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(measure);
}

function startListening() {
  if (listening) return;
  listening = true;
  lastY = window.scrollY;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/**
 * Schedules a frame for every subscriber without a scroll having happened.
 *
 * For the cases where the numbers change while the page sits still — a section
 * expanding, a font landing, anything a `ResizeObserver` notices. Coalesced
 * into the same single frame as a real scroll, so an observer firing during a
 * scroll costs nothing extra.
 */
export function nudgeScrollFrame() {
  if (listening) schedule();
}

/**
 * Runs `onFrame` once per animation frame in which the page scrolled or
 * resized, plus once immediately on mount so a subscriber never renders a
 * frame with stale state.
 *
 * `onFrame` is read from a ref-free closure on every effect run, so it must be
 * stable — wrap it in `useCallback`, or define it outside the component. This
 * is deliberate: re-subscribing on every render would defeat the point.
 */
export function useScrollFrame(onFrame: Subscriber) {
  useEffect(() => {
    subscribers.add(onFrame);
    startListening();

    // Immediate first read, so state is correct before the first scroll.
    onFrame(read());

    return () => {
      subscribers.delete(onFrame);
      if (subscribers.size === 0) stopListening();
    };
  }, [onFrame]);
}
