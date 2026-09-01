"use client";

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "motion/react";
import DesktopWindow, { type Offset } from "./DesktopWindow";
import ExperienceWidget from "./ExperienceWidget";
import MusicWidget from "./MusicWidget";
import PixelSprite from "./PixelSprite";
import { INTERESTS } from "./interests";
import styles from "./InterestBand.module.css";

/*
 * Act II: a desktop.
 *
 * The sandbox under the masthead is drawn as a home screen — wallpaper, icons
 * down the left, a widget rail on the right, a taskbar along the bottom, and
 * windows that open when an icon is clicked and travel back into that icon
 * when they are put away. Everything here is scoped to that sandbox: it fills
 * the shell's band and touches nothing above it.
 *
 * **Windows, not macOS.** The furniture matches: no menu bar along the top, a
 * taskbar along the bottom instead, with the clock in the tray at its right,
 * a button per running window, a show-desktop strip at the far edge, and a
 * right-click menu on the wallpaper. The window's own controls stay where the
 * earlier pass put them, which is the one detail still borrowed from the other
 * platform.
 *
 * **Why a desktop and not the row of scattered cutouts this used to be.** The
 * band had to fit one screen alongside a panel, and whatever was left over
 * read as an awkward strip of leftover ground. The desktop turns that leftover
 * into the point: a pane with an even margin of *something else* around it is
 * a window sitting on a surface, where a pane that fills its container is just
 * a layout. So the gap is load bearing.
 *
 * **What changed in this pass.** Several windows can be open at once, they
 * drag by their title bars, they stack, and they minimise to the taskbar
 * rather than only closing. The state model below is what had to move first:
 * the open window used to be read straight off the URL hash, which is exactly
 * right for one window and cannot express a stack of four. See `windows`.
 *
 * **What this is still not.** Windows do not resize, and there are no windows
 * inside windows: if a panel ever wants to link out — a book, a project — it
 * should be an ordinary link that navigates. That is the guardrail against the
 * usual failure mode for this genre.
 *
 * Registry note: `interests.tsx` is untouched and its `offset` field (the
 * hand-tuned scatter the old row needed) is no longer read.
 */

/*
 * The wallpaper image, once there is one. `null` renders the drawn placeholder
 * below it and nothing else changes.
 *
 * Structured as a single constant rather than as a CSS `background-image`
 * because the photo is going to arrive as a file and this is the one line that
 * then has to change. Drop it at `public/about/wallpaper.jpg` and set this to
 * `"/about/wallpaper.jpg"`; `.wallpaperPhoto` in the stylesheet already
 * handles the cover-fit, the desaturation and the scrim that keeps pixel art
 * legible over a photograph.
 */
const WALLPAPER: string | null = null;

/*
 * Where each interest's window lands, as a fraction of the space the window
 * does not fill: `0` is hard against the top/left of the desktop, `1` hard
 * against the bottom/right, `0.5` centred. Fractions rather than lengths
 * because the desktop's size depends on the viewport and a fixed `left` would
 * push a window off a narrow one.
 *
 * Art-directed rather than generated, for the same reason the old scatter was:
 * `Math.random()` produces one value on the server and a different one on the
 * client, which is a hydration mismatch, and it would reshuffle on every
 * re-render so a window would jump each time anything else changed.
 *
 * With more than one window open these also have to *cascade*: four windows
 * that all opened at the same fraction would sit in a single pile and only the
 * top one would look like anything. The spread here is what makes a stack read
 * as a stack.
 */
const SPOTS: Record<string, { fx: number; fy: number }> = {
  travel: { fx: 0.28, fy: 0.06 },
  reading: { fx: 0.74, fy: 0.3 },
  games: { fx: 0.42, fy: 0.62 },
  pets: { fx: 0.96, fy: 0.04 },
};

/** Centred, for an interest added to the registry without a spot of its own. */
const DEFAULT_SPOT = { fx: 0.5, fy: 0.3 };

/** No drag applied yet. Shared so a fresh window doesn't allocate its own. */
const NO_OFFSET: Offset = { x: 0, y: 0 };

/** The vector a window travels along when put away, to its icon. */
type Origin = { x: number; y: number };

/*
 * One open window. The array holding these is ordered back-to-front, so the
 * last entry is the focused one and raising a window is a move-to-end.
 *
 * A minimised window stays in this array: it is still open, it is just not on
 * screen, which is precisely what the taskbar button in front of it says. It
 * keeps its `offset` and `maximised` while it is away, so restoring puts it
 * back exactly where the reader had it rather than resetting it to `spot`.
 */
type WindowState = {
  slug: string;
  offset: Offset;
  minimised: boolean;
  maximised: boolean;
};

/** The wallpaper's right-click menu, and where it was opened. */
type Menu = { x: number; y: number };

export default function InterestBand() {
  const iconsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const windowsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const surfaceRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /*
   * The open windows, and the one piece of this component most worth reading
   * before changing.
   *
   * This used to be derived state — no `useState` at all, just the URL hash
   * read through `useSyncExternalStore`, on the argument that one source of
   * truth beats two kept in step by an effect. That argument was right and it
   * only works for a single window: a hash is one string, and "travel and
   * reading are open, reading is on top, travel has been dragged 40px left"
   * is not one string. Encoding it as one would be inventing a serialisation
   * format for a page's furniture.
   *
   * So the stack lives here, and the hash is demoted to what it can actually
   * carry: a *pointer to the focused window*, kept in sync one-way for the
   * sake of deep links (`/about#reading` still opens the bookshelf). See the
   * two effects below — one reads the hash, the other writes it, and they do
   * not fight because the writer uses `replaceState`, which fires no event.
   */
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);

  /*
   * Where a window being put away is headed.
   *
   * Measured at the moment it leaves rather than kept up to date, because it
   * is only ever needed once and a resize in between would make a stored value
   * wrong. `null` means "no travel" — a plain fade, which is what a
   * minimise-everything gets: four windows cannot each fly into their own icon
   * off one shared vector, and four separate flights at once is a mess rather
   * than a cue.
   */
  const [origin, setOrigin] = useState<Origin | null>(null);

  /** The vector from an open window's centre to its icon's. */
  const vectorToIcon = useCallback((slug: string): Origin | null => {
    const index = INTERESTS.findIndex((i) => i.slug === slug);
    const icon = iconsRef.current[index];
    const win = windowsRef.current[slug];
    if (!icon || !win) return null;

    const i = icon.getBoundingClientRect();
    const w = win.getBoundingClientRect();
    return {
      x: i.left + i.width / 2 - (w.left + w.width / 2),
      y: i.top + i.height / 2 - (w.top + w.height / 2),
    };
  }, []);

  /*
   * Open, or bring back and raise if it is already open. One entry point for
   * both because from the reader's side clicking an icon means "show me this"
   * whether or not it happens to be behind three other windows.
   */
  const open = useCallback((slug: string) => {
    setOrigin(null);
    setWindows((current) => {
      const existing = current.find((w) => w.slug === slug);
      const rest = current.filter((w) => w.slug !== slug);
      return [
        ...rest,
        existing
          ? { ...existing, minimised: false }
          : { slug, offset: NO_OFFSET, minimised: false, maximised: false },
      ];
    });
  }, []);

  /** Raise without changing anything else. Fires on a pointer-down inside. */
  const focus = useCallback((slug: string) => {
    setWindows((current) => {
      if (current[current.length - 1]?.slug === slug) return current;
      const target = current.find((w) => w.slug === slug);
      if (!target) return current;
      return [...current.filter((w) => w.slug !== slug), target];
    });
  }, []);

  const close = useCallback(
    (slug: string) => {
      setOrigin(vectorToIcon(slug));
      setWindows((current) => current.filter((w) => w.slug !== slug));
    },
    [vectorToIcon],
  );

  const minimise = useCallback(
    (slug: string) => {
      setOrigin(vectorToIcon(slug));
      setWindows((current) =>
        current.map((w) => (w.slug === slug ? { ...w, minimised: true } : w)),
      );
    },
    [vectorToIcon],
  );

  const toggleMaximise = useCallback((slug: string) => {
    setWindows((current) =>
      current.map((w) => (w.slug === slug ? { ...w, maximised: !w.maximised } : w)),
    );
  }, []);

  const setOffset = useCallback((slug: string, offset: Offset) => {
    setWindows((current) => current.map((w) => (w.slug === slug ? { ...w, offset } : w)));
  }, []);

  /*
   * A taskbar button is a three-way toggle, and it is the OS behaviour rather
   * than an invention: away → bring it back, buried → raise it, on top →
   * put it away. Anything simpler makes one of those three states unreachable
   * from the bar.
   */
  const onTaskClick = useCallback(
    (slug: string) => {
      const target = windows.find((w) => w.slug === slug);
      if (!target) return;
      if (target.minimised) open(slug);
      else if (windows[windows.length - 1]?.slug === slug) minimise(slug);
      else focus(slug);
    },
    [windows, open, minimise, focus],
  );

  /* ------------------------------------------------------- desktop actions */

  /** Show desktop: everything away at once, nothing lost. */
  const minimiseAll = useCallback(() => {
    setOrigin(null);
    setWindows((current) => current.map((w) => ({ ...w, minimised: true })));
  }, []);

  const closeAll = useCallback(() => {
    setOrigin(null);
    setWindows([]);
  }, []);

  const openAll = useCallback(() => {
    setOrigin(null);
    setWindows((current) =>
      INTERESTS.map((interest) => {
        const existing = current.find((w) => w.slug === interest.slug);
        return existing
          ? { ...existing, minimised: false }
          : {
              slug: interest.slug,
              offset: NO_OFFSET,
              minimised: false,
              maximised: false,
            };
      }),
    );
  }, []);

  /*
   * Tidy up: every window back to the spot the desk chose for it, un-maximised
   * and un-dragged. The desktop equivalent of "arrange icons", and the escape
   * hatch for a reader who has dragged four windows into a heap and would
   * rather not drag them back out one at a time.
   */
  const tidy = useCallback(() => {
    setWindows((current) =>
      current.map((w) => ({ ...w, offset: NO_OFFSET, maximised: false })),
    );
  }, []);

  /* -------------------------------------------------------- wallpaper menu */

  const onContextMenu = useCallback((event: ReactMouseEvent) => {
    // Only the bare wallpaper gets the desktop menu. Right-clicking a window,
    // an icon or a widget should still give the browser's own menu, because
    // that is where copy-link and save-image live.
    if ((event.target as HTMLElement).closest("[data-desk-item]")) return;

    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    setMenu({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  }, []);

  /*
   * Dismissed by the next press anywhere, the way every desktop menu is —
   * except inside itself.
   *
   * That exception is the whole reason this is not a one-liner. `pointerdown`
   * lands before `click`, so an unguarded listener tears the menu down while
   * the press that is choosing an item is still in flight: the button unmounts
   * and its `onClick` never fires, and every item in the menu silently does
   * nothing. Listening for `click` instead would fix that and break the more
   * important case, since a press that starts on the menu and ends elsewhere
   * has to dismiss it too.
   */
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event?: Event) => {
      if (event && menuRef.current?.contains(event.target as Node)) return;
      setMenu(null);
    };
    window.addEventListener("pointerdown", dismiss);
    // A resize moves the desk out from under a menu positioned in the desk's
    // own coordinates, so it has to go too. It never passes the guard above —
    // a resize's target is `window`, which is not a node in the menu.
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [menu]);

  /* ------------------------------------------------------------- keyboard */

  /** Escape dismisses the menu first, then puts away the topmost window. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menu) {
        setMenu(null);
        return;
      }
      const top = [...windows].reverse().find((w) => !w.minimised);
      if (top) close(top.slug);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, windows, close]);

  /*
   * Up/Down walk the icons, Home/End jump to the ends. Focus moves without
   * opening anything — opening is a deliberate act (Enter/Space, or a click),
   * because there is a closed state worth being able to arrow past without
   * blowing it away.
   */
  const onIconKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = INTERESTS.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    iconsRef.current[next]?.focus();
  };

  /* ------------------------------------------------------------- the hash */

  /*
   * Reading the hash. Runs on mount so `/about#reading` opens the bookshelf,
   * and on `popstate`/`hashchange` so a back button or an in-page link does
   * the same thing.
   *
   * It only ever *opens*. An empty hash does not close anything, because with
   * a stack of windows the hash no longer describes the whole state and
   * treating its absence as "nothing is open" would throw away three windows
   * the reader never asked to lose.
   */
  useEffect(() => {
    const fromHash = () => {
      const slug = window.location.hash.replace(/^#/, "");
      if (INTERESTS.some((i) => i.slug === slug)) open(slug);
    };
    fromHash();
    window.addEventListener("popstate", fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener("popstate", fromHash);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [open]);

  /*
   * Writing the hash: the URL names whatever is on top, so the address bar is
   * always a shareable link to what the reader is actually looking at.
   *
   * `replaceState`, not `pushState`. Pushing would put an entry in history for
   * every raise and every drag-to-front, and the back button would spend a
   * dozen presses walking a stack the reader has already dismantled. It also
   * fires no event, which is what stops this effect and the one above from
   * chasing each other.
   */
  const top = [...windows].reverse().find((w) => !w.minimised) ?? null;
  useEffect(() => {
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", top ? `#${top.slug}` : pathname + search);
  }, [top]);

  return (
    <section
      className={styles.desktop}
      aria-labelledby="act-two-heading"
      style={WALLPAPER ? ({ "--wallpaper": `url(${WALLPAPER})` } as CSSProperties) : undefined}
    >
      {/*
        The act still needs a heading for anyone navigating by them; it just no
        longer has a bar to sit in now that the top one is gone.
      */}
      <h2 id="act-two-heading" className="sr-only">
        The rest of it
      </h2>

      {/*
        The wallpaper. Two layers rather than a background on the desktop
        itself: the drawn one is always there, and the photo — when there is
        one — sits over it with its own scrim. See `WALLPAPER` above.
      */}
      <div className={styles.wallpaper} aria-hidden="true" />
      {WALLPAPER ? <div className={styles.wallpaperPhoto} aria-hidden="true" /> : null}

      <div ref={surfaceRef} className={styles.surface} onContextMenu={onContextMenu}>
        {/* Desktop icons, down the left the way a Windows desktop stacks
            them — on the wallpaper itself, not in a panel. */}
        <ul className={styles.icons} aria-label="Interests" data-desk-item>
          {INTERESTS.map((interest, i) => {
            const state = windows.find((w) => w.slug === interest.slug);
            const isOpen = Boolean(state);
            return (
              <li key={interest.slug}>
                <button
                  ref={(el) => {
                    iconsRef.current[i] = el;
                  }}
                  type="button"
                  className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
                  aria-expanded={isOpen}
                  aria-controls="desktop-window"
                  onClick={() =>
                    state && !state.minimised && top?.slug === interest.slug
                      ? close(interest.slug)
                      : open(interest.slug)
                  }
                  onKeyDown={(e) => onIconKeyDown(e, i)}
                  /*
                    Pixel's line for this icon. A plain attribute, read by one
                    window-level listener in `useHoverSpeech` — nothing here
                    subscribes to anything or needs to know he exists.
                  */
                  data-pixel-say={interest.say}
                >
                  <span className={styles.tile}>
                    {interest.art ? (
                      // eslint-disable-next-line @next/next/no-img-element -- pixel art must not be resampled by the image optimiser; see PixelSprite.tsx
                      <img
                        className={styles.art}
                        src={interest.art.src}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : (
                      <PixelSprite
                        sprite={interest.sprite}
                        size={34}
                        className={styles.art}
                      />
                    )}
                  </span>
                  <span className={styles.label}>{interest.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/*
          The widget rail, down the right and anchored to the *top*.

          Both widgets used to take a corner each, and the sticky note had the
          bottom-right one — which is where Pixel stands. Pixel is `position:
          fixed` to the viewport (see `PixelCompanion.module.css`) so it does
          not know or care what is under it, and the CV, of all things, was the
          surface it sat on. A rail hanging from the top keeps both widgets
          clear of that corner by construction rather than by a magic number
          that would need re-tuning the next time Pixel grows a hat.
        */}
        <div className={styles.rail} data-desk-item>
          <ExperienceWidget />
          <div className={styles.music}>
            <MusicWidget />
          </div>
        </div>

        {/*
          The window layer, covering the whole desktop so a window can be placed
          anywhere on it. `pointer-events: none` in the stylesheet is what keeps
          this from swallowing clicks meant for the icons and widgets beneath;
          each window takes them back for itself.

          The map runs over the **registry**, not over `windows`, and that is
          load bearing rather than incidental. `windows` is in z-order, so
          mapping it would reshuffle the DOM every time a window was raised —
          React moves a keyed child rather than rebuilding it, but moving a node
          still detaches and reinserts it, and a reinserted node's scrollable
          descendants come back at the top. Raising the bookshelf would silently
          scroll it home.

          So the DOM order is fixed and stacking is entirely `z`, read off the
          window's index in the z-ordered array. Nothing moves; only a number
          changes.
        */}
        <div className={styles.layer} id="desktop-window" data-desk-item>
          <AnimatePresence custom={origin} initial={false}>
            {INTERESTS.map((interest) => {
              const index = windows.findIndex((w) => w.slug === interest.slug);
              const state = windows[index];
              if (!state || state.minimised) return null;

              return (
                <DesktopWindow
                  key={state.slug}
                  ref={(el) => {
                    windowsRef.current[state.slug] = el;
                  }}
                  title={interest.label}
                  note={interest.caption}
                  onClose={() => close(state.slug)}
                  onMinimise={() => minimise(state.slug)}
                  onToggleMaximise={() => toggleMaximise(state.slug)}
                  onFocus={() => focus(state.slug)}
                  focused={top?.slug === state.slug}
                  maximised={state.maximised}
                  z={index + 1}
                  spot={SPOTS[state.slug] ?? DEFAULT_SPOT}
                  offset={state.offset}
                  onOffsetChange={(offset) => setOffset(state.slug, offset)}
                >
                  {interest.panel}
                </DesktopWindow>
              );
            })}
          </AnimatePresence>
        </div>

        {/* The wallpaper's right-click menu. Rendered last so it sits over the
            windows, and only while it is open. */}
        {menu ? (
          <div
            ref={menuRef}
            className={styles.menu}
            style={{ left: menu.x, top: menu.y }}
            role="menu"
            aria-label="Desktop"
            data-desk-item
          >
            <button type="button" role="menuitem" onClick={openAll}>
              Open everything
            </button>
            <button type="button" role="menuitem" onClick={tidy} disabled={!windows.length}>
              Tidy up
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={minimiseAll}
              disabled={!windows.some((w) => !w.minimised)}
            >
              Show desktop
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={closeAll}
              disabled={!windows.length}
            >
              Close all
            </button>
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------- taskbar */}

      <div className={styles.taskbar}>
        {/*
          The start button is furniture — there is no menu behind it and it is
          not a control, so it is a span rather than a button and is hidden from
          assistive tech. Same call as the window's two painted traffic lights
          used to be.
        */}
        <span className={styles.start} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>

        {/*
          Running windows, in the order they were first opened rather than in
          z-order: a bar whose buttons reshuffle every time you click one is
          unusable, which is why every real taskbar pins them where they land.
        */}
        <ul className={styles.tasks}>
          {INTERESTS.filter((i) => windows.some((w) => w.slug === i.slug)).map((interest) => {
            const state = windows.find((w) => w.slug === interest.slug)!;
            return (
              <li key={interest.slug}>
                <button
                  type="button"
                  className={`${styles.task} ${state.minimised ? styles.taskAway : ""} ${
                    top?.slug === interest.slug ? styles.taskFocused : ""
                  }`}
                  onClick={() => onTaskClick(interest.slug)}
                  aria-label={`${
                    state.minimised
                      ? "Restore"
                      : top?.slug === interest.slug
                        ? "Minimise"
                        : "Bring forward"
                  } ${interest.label}`}
                >
                  <PixelSprite
                    sprite={interest.sprite}
                    size={16}
                    className={styles.taskArt}
                  />
                  <span>{interest.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <Clock />

        {/*
          The show-desktop strip at the very end of the bar — the thin sliver
          Windows has put there since 7. It is a real button with a real label
          for anyone who cannot see that it is a sliver.
        */}
        <button
          type="button"
          className={styles.showDesktop}
          onClick={minimiseAll}
          aria-label="Show desktop"
        />
      </div>
    </section>
  );
}

/*
 * The tray clock. Renders nothing until mounted, on purpose: the server has no
 * idea what time it is where the reader is, and rendering a server-side time
 * would be a hydration mismatch that resolves by visibly changing.
 *
 * Ticks every 30s. It shows minutes, so a second-by-second timer would be
 * fifty-nine wasted renders a minute for a display that cannot show them.
 */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className={styles.clock} suppressHydrationWarning>
      {now
        ? now.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : ""}
    </p>
  );
}
