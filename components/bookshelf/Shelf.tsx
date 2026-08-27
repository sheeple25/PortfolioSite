"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LayoutGroup, motion } from "motion/react";
import { FONT_VAR, spineMetrics, type SpineStyle } from "@/lib/bookshelf/spine";
import coverSizes from "@/lib/bookshelf/cover-sizes.json";
import styles from "./shelf.module.css";

/*
 * The parts both shelves have in common: the scroll rail, the spine button,
 * and the open-book panel's frame.
 *
 * The two shelves genuinely differ in their data — the thesis corpus carries
 * curated `says`/`why`/`took` annotations, the personal shelf carries a
 * Goodreads rating and review — and an earlier note in `Bookshelf.tsx` was
 * right that threading both through one component would be worse than having
 * two. So the split here is by *shape*, not by feature: this file owns the
 * furniture, each shelf owns its own data and supplies its own detail rows as
 * children. Nothing about the two data shapes appears in this file.
 */

/* JSON infers `number[]`, not a tuple — the length check in `Cover` is what
 * narrows it, so a malformed entry falls back rather than rendering wrong. */
const COVER_SIZES: Record<string, number[]> = coverSizes;

/*
 * How `OpenBook` gets told its cover has loaded.
 *
 * Context rather than a prop threaded through the render callbacks: the
 * handler reads refs, and handing a ref-reading function to a function called
 * during render is exactly what `react-hooks/refs` (correctly) rejects.
 * Reading it from context inside the child keeps the access where it belongs
 * and means neither shelf has to pass it at all.
 */
const CoverLoadContext = createContext<() => void>(() => {});

/** One spine on the shelf. Appearance is fully decided by the caller. */
export function Spine({
  id,
  label,
  title,
  spine,
  onSelect,
}: {
  id: string;
  label: string;
  /** The `title` attribute — the tooltip, not the book's title. */
  title: string;
  spine: SpineStyle;
  onSelect: () => void;
}) {
  const { height, width } = spineMetrics({
    id,
    label,
    fontSize: spine.fontSize,
    tracking: spine.tracking,
  });

  const style: CSSProperties = { height, width, background: spine.bg, color: spine.fg };
  const labelStyle: CSSProperties = {
    fontFamily: FONT_VAR[spine.font],
    fontWeight: spine.weight,
    fontStyle: spine.italic ? "italic" : "normal",
    letterSpacing: spine.tracking,
    textTransform: spine.caseStyle === "upper" ? "uppercase" : "none",
    fontSize: spine.fontSize,
  };

  return (
    <button
      type="button"
      className={styles.spine}
      style={style}
      aria-pressed={false}
      title={title}
      onClick={onSelect}
    >
      <span className={styles.spineLabel} style={labelStyle}>
        {label}
      </span>
    </button>
  );
}

/**
 * The cover, at the open panel's full height with its own natural width.
 *
 * Dimensions come from `cover-sizes.json`, measured off the files themselves by
 * `scripts/measure-covers.mjs`. That is what lets this be a `next/image` at
 * all: the covers are 300 KB–2.4 MB source files, and serving them raw was the
 * single largest transfer on the site. Knowing the intrinsic size also means
 * the box is correct before the file arrives, so the panel no longer settles
 * wider after load.
 *
 * A cover missing from the map (a new file, script not yet re-run) falls back
 * to an unsized `<img>` — the old behaviour, including its re-center-on-load —
 * rather than guessing an aspect ratio and rendering it wrong.
 */
function Cover({ src, alt, onLoad }: { src: string; alt: string; onLoad: () => void }) {
  const size = COVER_SIZES[src];

  if (!size || size.length !== 2) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={styles.coverImage} onLoad={onLoad} />;
  }

  const [width, height] = size;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={styles.coverImage}
      onLoad={onLoad}
      // The panel is a fixed height, so the rendered width is small and
      // fixed too — no need for the browser to pick from a srcset.
      sizes="320px"
    />
  );
}

/** The expanded panel: cover on the left, caller-supplied detail on the right. */
export function OpenBook({
  cover,
  coverAlt,
  author,
  title,
  year,
  tag,
  children,
  onClose,
}: {
  cover: string;
  coverAlt: string;
  author: string;
  title: string;
  year?: string | number;
  /** Optional eyebrow above the byline — the corpus uses it for its kind. */
  tag?: ReactNode;
  /** The rows below the title. Entirely the caller's business. */
  children: ReactNode;
  onClose: () => void;
}) {
  const onCoverLoad = useContext(CoverLoadContext);

  return (
    <div className={styles.openBook}>
      <div className={styles.openCover}>
        <Cover src={cover} alt={coverAlt} onLoad={onCoverLoad} />
      </div>

      <div className={styles.openInfo}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close book"
          title="Close"
        >
          ×
        </button>

        {tag}

        <div>
          <div className={styles.byline}>{author}</div>
          <div className={styles.titleLine}>
            {title}
            {year !== undefined && year !== "" && (
              <span className={styles.year}> ({year})</span>
            )}
          </div>
        </div>

        <div className={styles.rows}>{children}</div>
      </div>
    </div>
  );
}

/** One labelled row inside an open book. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowBody}>{children}</span>
    </div>
  );
}

/**
 * The scroll rail. Owns which book is open and keeps it centered.
 *
 * Generic over the item type so neither shelf's data shape leaks in here:
 * `renderSpine` and `renderOpen` are given the item and hand back the two
 * states it can be in.
 */
export function Shelf<T>({
  items,
  getId,
  label,
  renderSpine,
  renderOpen,
}: {
  items: readonly T[];
  getId: (item: T) => string;
  /** Optional, like the `aria-label` it becomes — the corpus shelf's label
   *  is supplied by the diagram wrapper and may be absent. */
  label?: string;
  renderSpine: (item: T, open: () => void) => ReactNode;
  renderOpen: (item: T, close: () => void) => ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLDivElement>(null);

  /*
   * Keeps the open book centered — and never clipped — in the scroll
   * container.
   *
   * Deliberately not `el.offsetLeft`: that's relative to the nearest
   * *positioned* ancestor, and Motion's `layout` prop makes each `motion.div`
   * slot positioned — so it read as ~0 relative to the open book's own slot,
   * not its distance into the row. `getBoundingClientRect` sidesteps
   * offsetParent entirely by comparing screen position, which is combined with
   * the container's current `scrollLeft` to get a position in content-space
   * that survives the scroll changing under it.
   *
   * Also deliberately not `scrollIntoView`, for the same class of problem one
   * level up: it reads `getBoundingClientRect` too, but while the FLIP
   * transform is still mid-flight the very first time this runs (right on
   * click, before the animation settles) that rect is transitional. The eager
   * call below is only ever a best-effort first guess for that reason —
   * `onLayoutAnimationComplete` re-runs this once the transform has resolved
   * to identity, correcting it.
   */
  const centerActive = useCallback(() => {
    const container = shelfRef.current;
    const el = openRef.current;
    if (!container || !el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elLeftInContent = elRect.left - containerRect.left + container.scrollLeft;
    const target = elLeftInContent - (container.clientWidth - elRect.width) / 2;
    const max = Math.max(container.scrollWidth - container.clientWidth, 0);
    container.scrollTo({ left: Math.min(Math.max(target, 0), max), behavior: "smooth" });
  }, []);

  // Best-effort immediately (covers the no-motion / reduced-motion case),
  // then corrected once the layout animation actually settles.
  useEffect(() => {
    if (activeId) centerActive();
  }, [activeId, centerActive]);

  return (
    <CoverLoadContext.Provider value={centerActive}>
    <div className={styles.wrap} aria-label={label}>
      <div className={styles.shelfArea} ref={shelfRef}>
        <LayoutGroup>
          <div className={styles.shelfRow}>
            {items.map((item) => (
              <motion.div
                layout
                key={getId(item)}
                className={styles.slot}
                onLayoutAnimationComplete={centerActive}
              >
                {getId(item) === activeId ? (
                  <div ref={openRef}>
                    {renderOpen(item, () => setActiveId(null))}
                  </div>
                ) : (
                  renderSpine(item, () => setActiveId(getId(item)))
                )}
              </motion.div>
            ))}
          </div>
        </LayoutGroup>
      </div>
    </div>
    </CoverLoadContext.Provider>
  );
}
