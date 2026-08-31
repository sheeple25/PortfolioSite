"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./InlineSvgDiagram.module.css";

/*
 * The custom properties the figures actually read, carried from the page into
 * the portalled overlay. `--fig-*` are declared on `.page` in
 * `case.module.css`; `--mono` sets the caption.
 */
const CARRIED_TOKENS = [
  "--fig-stage",
  "--fig-ink",
  "--fig-ink-mute",
  "--fig-accent",
  "--fig-accent-deep",
  "--mono",
] as const;

function ReplayIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" aria-hidden="true">
      <path
        d="M12 7A5 5 0 1 1 10.6 3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 2.5V6h-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExpandIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M5.5 1.5H1.5V5.5M8.5 1.5h4v4M8.5 12.5h4v-4M5.5 12.5h-4v-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5l9 9M11.5 2.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The full-viewport read of a figure.
 *
 * Several of these diagrams carry type at a size that only survives at the
 * width of the page column on a large screen — the four-mandate map and the
 * framework map especially — so every figure is clickable and opens here.
 *
 * The SVG is re-rendered rather than the inline one being scaled up: the
 * markup is a handful of elements, and re-rendering is what lets the overlay
 * copy sit at its own size and aspect without the inline copy losing its
 * place in the flow.
 *
 * `motion.svg` (not a plain `<svg>`) with `visible` pinned on both `initial`
 * and `animate` is load-bearing. The generated children declare *only*
 * `variants` and pick their state up from the parent by propagation; under a
 * plain `<svg>` no state reaches them and the ones on `STROKE_FILL_VARIANTS`
 * would paint at full `fill-opacity` instead of the 0.12 their variant sets.
 * Pinning `visible` also means the overlay opens drawn rather than replaying
 * a two-second entrance the reader has already watched once.
 *
 * `tokens` is the other half of the portal's bill. The overlay renders under
 * `<body>`, outside the case study's `.page`, where `--fig-*` and `--mono`
 * simply do not exist — and a `fill="var(--fig-accent)"` that resolves to
 * nothing inherits the parent `fill="none"`, i.e. the figure comes up blank.
 * So the values are read off the inline stage at open time and carried up as
 * inline custom properties, which also means the overlay is in the same theme
 * and the same project palette as the figure the reader clicked.
 */
function FigureOverlay({
  viewBox,
  label,
  children,
  tokens,
  onClose,
}: {
  viewBox: string;
  label?: string;
  children: ReactNode;
  tokens: React.CSSProperties;
  onClose: () => void;
}) {
  // Escape closes, and the page behind must not scroll under the overlay.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className={styles.overlay}
      style={tokens}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? "Figure"}
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.overlayClose}
        onClick={onClose}
        aria-label="Close figure"
      >
        <CloseIcon />
      </button>

      {/*
       * The figure itself swallows the click, so only the backdrop closes.
       */}
      <div className={styles.overlayStage} onClick={(e) => e.stopPropagation()}>
        <motion.svg
          viewBox={viewBox}
          fill="none"
          role={label ? "img" : undefined}
          aria-label={label}
          className={styles.overlaySvg}
          initial="visible"
          animate="visible"
        >
          {children}
        </motion.svg>
        {label ? <p className={styles.overlayCaption}>{label}</p> : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * The inline-SVG counterpart to the old `SvgDiagram`: renders the figure's
 * markup directly into the page (rather than as an `<img src>`) so its
 * `var(--fig-*)` colours and the per-element `pathLength`/`fillOpacity`
 * variants on its children can actually take effect — neither works across
 * an `<img>` boundary. `initial`/`whileInView` here are plain variant
 * *labels*; every generated child only declares `variants` and `custom`, and
 * picks up "hidden"/"visible" by Motion's normal parent-to-child
 * propagation, which is what lets `svg2jsx` emit one line per shape instead
 * of repeating orchestration props on every element.
 */
export function InlineSvgDiagram({
  viewBox,
  label,
  children,
}: {
  viewBox: string;
  label?: string;
  children: ReactNode;
}) {
  // Same trick `SvgDiagram` used: remounting is what replays a `whileInView`
  // animation once it has already fired once.
  const [replayCount, setReplayCount] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [tokens, setTokens] = useState<React.CSSProperties>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  /* See `FigureOverlay` — the portal leaves the page's token scope behind. */
  function openZoom() {
    const stage = stageRef.current;
    if (stage) {
      const computed = getComputedStyle(stage);
      const carried: Record<string, string> = {};
      for (const name of CARRIED_TOKENS) {
        const value = computed.getPropertyValue(name).trim();
        if (value) carried[name] = value;
      }
      setTokens(carried as React.CSSProperties);
    }
    setZoomed(true);
  }

  return (
    <div className={styles.stage} ref={stageRef}>
      {/*
       * The whole figure is the control that opens the larger read. A button
       * rather than a click handler on the stage, so it is reachable by
       * keyboard and announces itself; replay stays a sibling of it rather
       * than a child, because a button inside a button is invalid markup and
       * the browser drops the inner one.
       */}
      <button
        type="button"
        className={styles.zoomTrigger}
        onClick={openZoom}
        aria-label={label ? `Enlarge ${label}` : "Enlarge figure"}
      >
        <motion.svg
          key={replayCount}
          viewBox={viewBox}
          fill="none"
          role={label ? "img" : undefined}
          aria-label={label}
          className={styles.svg}
          initial={reducedMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {children}
        </motion.svg>
        <span className={styles.zoomHint} aria-hidden="true">
          <ExpandIcon />
          Click to enlarge
        </span>
      </button>

      {!reducedMotion && (
        <button
          type="button"
          className={styles.replay}
          onClick={() => setReplayCount((count) => count + 1)}
          aria-label="Replay entrance animation"
          title="Replay animation"
        >
          <ReplayIcon />
        </button>
      )}

      {zoomed && (
        <FigureOverlay
          viewBox={viewBox}
          label={label}
          tokens={tokens}
          onClose={() => setZoomed(false)}
        >
          {children}
        </FigureOverlay>
      )}
    </div>
  );
}
