"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode, RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { MotionProps } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { hasShutterPanel } from "./sections";

/**
 * The shutter: an index's header section closing upward, and the header of
 * whatever was clicked opening downward in its place.
 *
 * Driven by Motion on the real elements, and — the part that matters — the
 * navigation is deferred until the close has finished. That one decision is
 * what makes this tractable. The outgoing page is still mounted and still real
 * while it closes, so there is nothing to snapshot, no box being tweened
 * between two sizes, and no separate layer for the rest of the page to fall
 * through.
 *
 * It replaces a View Transitions implementation that could not be made to work
 * in both directions. That API is built to morph one element into another that
 * persists across a route change; this is not a morph but two adjacent moves,
 * and every part of it fought the API — the shared name that makes React start
 * a transition at all is the same thing that creates the group box tweening a
 * full window into a third of one, and which end counts as "old" flips with
 * direction, so any geometry pinned for one way is wrong the other. Here both
 * directions are the same component doing the same thing with the sign flipped.
 *
 * The cost is honest: close, then navigate, then open, rather than the two
 * overlapping. Links are prefetched on hover and on request, so the step in the
 * middle is short.
 *
 * Mounted once in the root layout rather than per page, so the nav bar — which
 * lives in that layout, outside every page — can drive it too. That is what
 * makes an index-to-index move (Work to Writing) the same gesture as a move
 * into a case study. Living in the layout also means it no longer unmounts
 * between pages, so `closing` is reset from the pathname instead.
 */

/*
 * The dials. Durations in seconds (Motion's unit), easing as a cubic-bezier's
 * four control points.
 *
 * The close accelerates away and the open decelerates into place, which is the
 * usual pairing for something leaving and something arriving — an ease-in on
 * the open would have the panel still speeding up as it reaches its resting
 * position and stop dead.
 */
const CLOSE_TRANSITION = {
  duration: 0.6,
  ease: [0.4, 0, 1, 1],
} as const;

const OPEN_TRANSITION = {
  duration: 0.3,
  ease: [0, 0, 0.2, 1],
} as const;

/** How far the content below the header drops as it leaves. */
const SHEET_DROP = "60vh";

/** Bottom edge at the bottom: fully open. */
const OPEN = "inset(0 0 0% 0)";
/** Bottom edge pulled up to the top edge: rolled shut. */
const SHUT = "inset(0 0 100% 0)";

type ShutterApi = {
  /**
   * Close the panel, then navigate. Returns whether it took the navigation
   * over — `false` means the caller should let the ordinary link happen, which
   * keeps Next's own scroll handling rather than reimplementing it here.
   */
  navigate: (href: string) => boolean;
  /** True from the moment a close starts until the route actually changes. */
  closing: boolean;
  /** Spread onto the `motion` element that is the panel. */
  panelProps: MotionProps;
  /**
   * Put on that same element. The shutter needs to know where its panel is to
   * decide whether a close is worth playing at all.
   */
  panelRef: RefObject<HTMLElement | null>;
  /** Spread onto the `motion` element holding the content below the panel. */
  sheetProps: MotionProps;
};

const ShutterContext = createContext<ShutterApi | null>(null);

/**
 * Read the shutter. Returns `null` outside a provider, which is a legitimate
 * state rather than an error — `Banner` renders inside `CaseShell`, but nothing
 * stops a page from using it on its own, and it should simply not animate.
 */
export function useShutter() {
  return useContext(ShutterContext);
}

export function ShutterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  /*
   * Owned here rather than passed in, so every panel gets the off-screen check
   * simply by wearing the ref — the index header and a case study's banner have
   * the same problem and neither has to know about it.
   */
  const panelRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [closing, setClosing] = useState(false);
  /*
   * The destination, held across the close. A ref rather than state because
   * nothing renders from it and it must be readable inside the animation's
   * completion callback without re-running the animation.
   */
  const pending = useRef<string | null>(null);

  /*
   * The route has changed, so the close that asked for it is done. This is what
   * used to happen by the provider unmounting; from the layout it has to be
   * explicit, and without it the incoming panel would mount already shut and
   * stay that way.
   */
  useEffect(() => {
    setClosing(false);
    pending.current = null;
  }, [pathname]);

  const navigate = useCallback(
    (href: string): boolean => {
      // A second click while one close is already running would restart the
      // animation and strand the first destination. Swallowed, not passed on.
      if (pending.current) return true;

      /*
       * A link to the page you are already on. Nothing would change the
       * pathname, so nothing would reset `closing`, and the panel would roll
       * shut and stay shut. This is reachable: the nav bar marks the current
       * section but still links to it.
       */
      if (href === pathname) return false;

      if (reducedMotion) return false;

      /*
       * No panel on this page at all — `/writing/<slug>` pages have none.
       *
       * This must decline rather than proceed, and getting it the wrong way
       * round broke pages like that completely: the shutter took the click,
       * suppressed the link's default and set `closing`, then waited for an
       * `onAnimationComplete` that could never fire because there was no panel
       * mounted to animate. Every nav link on those pages silently did nothing.
       */
      const panel = panelRef.current;
      if (!panel) return false;

      /*
       * Scrolled clean past the panel. Animating something the reader cannot
       * see is not a subtle transition — it is six-tenths of a second in which
       * the click appears to have done nothing.
       */
      if (panel.getBoundingClientRect().bottom <= 0) return false;

      // Nothing at the far end to open in its place.
      if (!hasShutterPanel(href)) return false;

      pending.current = href;
      // The gap between close and open is a real navigation, so shorten it.
      router.prefetch(href);
      setClosing(true);
      return true;
    },
    [reducedMotion, router, pathname],
  );

  const panelProps: MotionProps = reducedMotion
    ? {}
    : {
        // Every mount starts shut and opens, including a cold page load — the
        // panel arriving is the same gesture however the reader got here.
        initial: { clipPath: SHUT },
        animate: { clipPath: closing ? SHUT : OPEN },
        transition: closing ? CLOSE_TRANSITION : OPEN_TRANSITION,
        onAnimationComplete: () => {
          const href = pending.current;
          if (!closing || !href) return;
          pending.current = null;
          router.push(href);
        },
      };

  const sheetProps: MotionProps = reducedMotion
    ? {}
    : {
        animate: {
          y: closing ? SHEET_DROP : 0,
          opacity: closing ? 0 : 1,
        },
        transition: CLOSE_TRANSITION,
      };

  return (
    <ShutterContext.Provider
      value={{ navigate, closing, panelProps, panelRef, sheetProps }}
    >
      {children}
    </ShutterContext.Provider>
  );
}

/**
 * Turns a click on a link into a shutter navigation.
 *
 * Returns a handler to put on the `<Link>`, which stays a real `<Link>` so it
 * keeps its href, its prefetching and its right-click and middle-click
 * behaviour. Modified clicks are left alone deliberately: cmd/ctrl-click opens
 * a new tab, and animating the current page shut for a navigation that is not
 * happening here would be wrong.
 *
 * The default is only suppressed once the shutter has said it is taking over.
 * Suppressing first and pushing by hand made every skipped case — reduced
 * motion, a panel scrolled out of view, a destination with no panel, a link to
 * the page you are already on — go through a manual `router.push` instead of
 * the link, and the last of those did nothing at all.
 */
export function useShutterLink(href: string) {
  const shutter = useShutter();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!shutter) return;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      if (shutter.navigate(href)) event.preventDefault();
    },
    [shutter, href],
  );
}
