"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "./DesktopWindow.module.css";

/*
 * The window that opens on the About desktop.
 *
 * It looks like an OS window and it now largely *behaves* like one: it drags
 * by its title bar, it raises on click, it minimises to the taskbar and it
 * maximises to fill the desk. The earlier pass in this file argued the
 * opposite — that a title bar which looks draggable and is not is a bug
 * report — and that argument still holds; the answer was to make it drag, not
 * to keep pretending. What it still refuses to do is resize: a resize handle
 * means every panel inside has to survive every size, and the panels (a
 * departure board, a bookshelf) are laid out for one.
 *
 * The window owns *how* it moves and the desktop owns *where it is*: the drag
 * offset is handed up through `onOffsetChange` and comes back down as
 * `offset`, so this stays a controlled component and a window's position
 * survives being minimised and restored. Same split as `spot`.
 *
 * It is a `region`, emphatically not a `dialog`. A dialog implies modality and
 * a focus trap, and the desktop icons behind this have to stay reachable the
 * whole time it is open — the reader is meant to flip between interests
 * without dismissing anything. With several windows open at once that matters
 * more, not less.
 *
 * The travel-into-the-icon vector is not measured here. This component owns
 * the *motion*; the desktop owns the *destination*, because only it knows
 * where the icons are — it hands one in through `AnimatePresence`'s `custom`,
 * which arrives below as the `closed` variant's argument. See `InterestBand`'s
 * `origin`.
 */

/** Matches `InterestBand`'s `Origin` — the vector to the icon, or none. */
type Travel = { x: number; y: number } | null;

/** A drag offset in pixels, from wherever `spot` put the window. */
export type Offset = { x: number; y: number };

/*
 * Closing genies into the icon; opening just appears.
 *
 * The asymmetry is on purpose. Putting a window away has somewhere specific to
 * go and the travel is what tells the reader where it went — that the icon it
 * came from is how to get it back. Opening has no such story to tell, and a
 * window that flew out of an icon every time would put a half-second of
 * theatre in front of content the reader has already asked for.
 *
 * `custom` is `null` when nothing is travelling anywhere, and then this is a
 * plain fade.
 */
const VARIANTS = {
  open: { opacity: 1, scale: 1, x: 0, y: 0 },
  closed: (travel: Travel) =>
    travel
      ? { opacity: 0, scale: 0.06, x: travel.x, y: travel.y }
      : { opacity: 0, scale: 0.97, x: 0, y: 0 },
};

/** No travel, no scale — just a fade — when the reader has asked for less. */
const STILL_VARIANTS = {
  open: { opacity: 1, scale: 1, x: 0, y: 0 },
  closed: { opacity: 0, scale: 1, x: 0, y: 0 },
};

type DesktopWindowProps = {
  /** The window's name, shown in the title bar and on its taskbar button. */
  title: string;
  /**
   * One line under the title bar, setting up what is being looked at. Its box
   * reserves two lines whether or not it needs them — a longer note on one
   * interest must not make that interest's panel shorter than the others'.
   */
  note?: ReactNode;
  /** Closes the window for good. Wired to the control and to Escape. */
  onClose: () => void;
  /** Puts it away without losing it — it stays on the taskbar. */
  onMinimise: () => void;
  /** Toggles fill-the-desk. Also on double-click of the title bar. */
  onToggleMaximise: () => void;
  /** Raises this window above the others. Fires on any pointer down inside. */
  onFocus: () => void;
  /** Whether this is the topmost window; drives the active title-bar tint. */
  focused: boolean;
  /** Whether it currently fills the desk. */
  maximised: boolean;
  /** Stacking order within the window layer. */
  z: number;
  /**
   * Where on the desktop this window sits *before* it is dragged, as a
   * fraction of the space it does not fill — `0` hard against the top/left,
   * `1` against the bottom/right. The desktop owns these values (`SPOTS` in
   * `InterestBand`) because where a window opens is a fact about the desk, not
   * about the frame.
   */
  spot: { fx: number; fy: number };
  /** How far it has been dragged from `spot`. Owned by the desktop. */
  offset: Offset;
  /** Reports a new drag offset, already clamped to the desk. */
  onOffsetChange: (offset: Offset) => void;
  /** The panel itself, from the interest registry. */
  children: ReactNode;
};

/*
 * A drag in progress. Kept in a ref rather than in state because none of it is
 * rendered — putting it in state would cost two renders a frame, one to store
 * the numbers and one to use them.
 *
 * The bounds are measured once at pointer-down, not per move: the window's own
 * rect moves *as it is dragged*, so re-measuring mid-drag would be comparing
 * against a moving ruler and the clamp would walk.
 */
type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  fromX: number;
  fromY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const DesktopWindow = forwardRef<HTMLDivElement, DesktopWindowProps>(
  function DesktopWindow(
    {
      title,
      note,
      onClose,
      onMinimise,
      onToggleMaximise,
      onFocus,
      focused,
      maximised,
      z,
      spot,
      offset,
      onOffsetChange,
      children,
    },
    ref,
  ) {
    const still = useReducedMotion();

    /*
     * The desktop needs this node to measure the travel vector, and the drag
     * needs it to measure itself against its layer. One node, two consumers,
     * so it is held here and handed up rather than the other way round.
     */
    const nodeRef = useRef<HTMLElement | null>(null);
    useImperativeHandle(ref, () => nodeRef.current as HTMLDivElement, []);

    const drag = useRef<DragSession | null>(null);

    const onBarPointerDown = useCallback(
      (event: ReactPointerEvent<HTMLElement>) => {
        // The traffic lights live in this bar. A pointer-down on one of them is
        // a click on a control, not the start of a drag.
        if ((event.target as HTMLElement).closest("button")) return;
        if (maximised || event.button !== 0) return;

        const node = nodeRef.current;
        const layer = node?.parentElement;
        if (!node || !layer) return;

        const win = node.getBoundingClientRect();
        const bounds = layer.getBoundingClientRect();

        /*
         * Where this window would sit with no offset at all. Derived from the
         * live rect rather than recomputed from `spot`, because only the
         * stylesheet knows how `spot` resolves against the window's own size.
         */
        const baseX = win.left - bounds.left - offset.x;
        const baseY = win.top - bounds.top - offset.y;

        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          fromX: offset.x,
          fromY: offset.y,
          minX: -baseX,
          maxX: bounds.width - win.width - baseX,
          minY: -baseY,
          maxY: bounds.height - win.height - baseY,
        };

        // Capture, so the drag survives the pointer outrunning the title bar.
        // Without it a fast drag drops the window the moment the cursor leaves
        // the 2rem-tall strip it started in.
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      [maximised, offset.x, offset.y],
    );

    const onBarPointerMove = useCallback(
      (event: ReactPointerEvent<HTMLElement>) => {
        const session = drag.current;
        if (!session || session.pointerId !== event.pointerId) return;

        onOffsetChange({
          x: clamp(session.fromX + event.clientX - session.startX, session.minX, session.maxX),
          y: clamp(session.fromY + event.clientY - session.startY, session.minY, session.maxY),
        });
      },
      [onOffsetChange],
    );

    const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);

    return (
      <motion.section
        ref={(el) => {
          nodeRef.current = el;
        }}
        className={`${styles.window} ${maximised ? styles.maximised : ""} ${
          focused ? styles.focused : ""
        }`}
        role="region"
        aria-label={title}
        onPointerDown={onFocus}
        /*
         * Position is fed in as custom properties rather than as `left`/`top`
         * directly, so the stylesheet keeps ownership of how it is composed —
         * the fractional part has to be worked out against the window's own
         * size, which only CSS knows. See `.window`.
         */
        style={
          {
            "--win-fx": spot.fx,
            "--win-fy": spot.fy,
            "--win-dx": `${offset.x}px`,
            "--win-dy": `${offset.y}px`,
            zIndex: z,
          } as CSSProperties
        }
        variants={still ? STILL_VARIANTS : VARIANTS}
        initial="closed"
        animate="open"
        exit="closed"
        transition={
          still
            ? { duration: 0.12 }
            : { type: "spring", stiffness: 420, damping: 38, mass: 0.7 }
        }
      >
        {/*
          All three lights are live now. They were one control and two painted
          dots when a window could only be closed; with a taskbar to minimise
          into and a desk to fill, close/minimise/maximise are three different
          things a reader might want and there is no honest way to fold them
          into one.
        */}
        <header
          className={styles.bar}
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={onToggleMaximise}
        >
          <div className={styles.lights}>
            <button
              type="button"
              className={`${styles.light} ${styles.close}`}
              onClick={onClose}
              aria-label={`Close ${title}`}
            />
            <button
              type="button"
              className={`${styles.light} ${styles.minimise}`}
              onClick={onMinimise}
              aria-label={`Minimise ${title}`}
            />
            <button
              type="button"
              className={`${styles.light} ${styles.zoom}`}
              onClick={onToggleMaximise}
              aria-label={`${maximised ? "Restore" : "Maximise"} ${title}`}
              aria-pressed={maximised}
            />
          </div>

          <p className={styles.title}>{title}</p>

          {/* Balances the lights so the title sits optically centred. */}
          <div className={styles.lights} aria-hidden="true" />
        </header>

        {note ? <p className={styles.note}>{note}</p> : null}

        {/*
          `min-height: 0` in the stylesheet is what lets this shrink. Panels are
          written to fill their slot (`height: 100%`), and a flex child defaults
          to `min-height: auto` — without it the tallest panel would push the
          window past the bottom of the band.
        */}
        <div className={styles.body}>{children}</div>
      </motion.section>
    );
  },
);

export default DesktopWindow;
