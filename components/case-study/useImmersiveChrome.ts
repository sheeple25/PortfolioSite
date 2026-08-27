"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollFrame, type ScrollSnapshot } from "@/lib/useScrollFrame";

/**
 * App-style chrome: scrolling down hides everything, scrolling back up brings it
 * back.
 *
 * Two pieces of state rather than one, because they don't always move together.
 * `chrome` covers the header and footer; `rails` covers the contents rail and
 * Pixel's corner. Scrolling moves both. Summoning Pixel from inside the page
 * moves only `rails` — the header is the one thing that should never come back
 * uninvited, since the point of tapping Pixel is to stay where you are.
 */

/** Movement needed before a direction change counts, in px. */
const THRESHOLD = 10;
/** How close to either end of the page counts as "at the end". */
const EDGE = 90;

export type ImmersiveChrome = {
  /** Header and footer. */
  chromeVisible: boolean;
  /** Contents rail and Pixel. Always true when `chromeVisible` is. */
  railsVisible: boolean;
  /** Bring back the side panels only — for an in-page Pixel trigger. */
  revealRails: () => void;
};

export function useImmersiveChrome(): ImmersiveChrome {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [railsForced, setRailsForced] = useState(false);

  /*
   * Direction is accumulated rather than read per-event. A single scroll
   * gesture on a trackpad emits a stream of events that includes small
   * counter-direction jitter, and reacting to each one makes the chrome
   * flicker. Only sustained travel past THRESHOLD flips the state.
   */
  const travel = useRef(0);

  const revealRails = useCallback(() => setRailsForced(true), []);

  const onFrame = useCallback(({ y, delta, max }: ScrollSnapshot) => {
    const atTop = y <= EDGE;
    const atBottom = max > 0 && y >= max - EDGE;

    // Both ends of the page always show everything: there is nothing left to
    // immerse in, and the footer is the point of being at the bottom.
    if (atTop || atBottom) {
      travel.current = 0;
      setChromeVisible(true);
      setRailsForced(false);
      return;
    }

    // Reset the accumulator whenever direction flips, so travel always
    // measures one continuous gesture.
    if ((delta > 0) !== (travel.current > 0)) travel.current = 0;
    travel.current += delta;

    if (travel.current > THRESHOLD) {
      setChromeVisible(false);
      // A deliberate scroll down overrides a Pixel-summoned rail.
      setRailsForced(false);
    } else if (travel.current < -THRESHOLD) {
      setChromeVisible(true);
      setRailsForced(false);
    }
  }, []);

  useScrollFrame(onFrame);

  return {
    chromeVisible,
    railsVisible: chromeVisible || railsForced,
    revealRails,
  };
}

/**
 * Turns the site header white while a full-bleed hero is still behind it.
 *
 * `NavBar` is transparent chrome until the page scrolls, so a hero that runs to
 * the top edge puts the bar's charcoal wordmark and grey links straight onto
 * the hero's colour, where they are close to unreadable. The frame draws this
 * header white (`#fafafa`, node 202:216), which is what this reproduces.
 *
 * Nothing here knows what a nav link is. Every colour in `NavBar.module.css` is
 * already a token — `--color-charcoal`, `--color-muted`, `--color-accent` — so
 * re-pointing those on the header element retints all of it at once, the same
 * way `.railOnColour` inverts the contents rail in `entry.module.css`. The rule
 * itself lives in `app/globals.css` next to the other `data-chrome` rules.
 *
 * @param depth How far the page can scroll before the hero has cleared the bar.
 */
export function useHeroChrome(depth: number) {
  const [overHero, setOverHero] = useState(true);

  const onFrame = useCallback(
    ({ y }: ScrollSnapshot) => setOverHero(y < depth),
    [depth],
  );

  useScrollFrame(onFrame);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("hero-chrome", overHero);

    // Leaving the lab must not strand the rest of the site with white chrome.
    return () => root.classList.remove("hero-chrome");
  }, [overHero]);
}

/**
 * Drives the site's own chrome from the state above.
 *
 * Two classes on `<html>`; the rules that respond to them live in
 * `app/globals.css`, keyed off the `data-chrome` attribute each piece of chrome
 * carries. Nothing here touches an element directly.
 *
 * That matters, and is a deliberate replacement for what used to be here. The
 * previous version found the chrome with `querySelectorAll` on CSS-module class
 * prefixes and wrote `style.transform`/`style.opacity` straight onto the nodes,
 * which broke in two ways:
 *
 *  - `PixelCompanion` is a `motion.div` whose entire animation is opacity, so
 *    two owners wrote the same property and the last writer won. Whether the
 *    companion hid depended on whether a Motion animation was mid-flight.
 *  - `querySelectorAll` ran once, inside the effect, so anything mounting later
 *    was missed entirely. Closing the sidebar while scrolled down brought the
 *    companion back unstyled, into a page whose header and footer were hidden.
 *
 * A class on an ancestor has neither problem. It reaches elements that mount
 * afterwards, and a stylesheet rule loses to Motion's inline styles predictably
 * rather than racing them.
 *
 * `PixelSidebar` is deliberately not part of the rail group: it is
 * `position: fixed` and opening it widens `body`'s `margin-right`, so sliding
 * it off-screen would leave a strip of dead space beside nothing. It is also
 * the one piece of chrome you are actively using when it's open.
 */
export function useSiteChromeSync(chromeVisible: boolean, railsVisible: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("chrome-hidden", !chromeVisible);
    root.classList.toggle("rails-hidden", !railsVisible);

    // Leaving the lab must not strand the site's own chrome off-screen.
    return () => root.classList.remove("chrome-hidden", "rails-hidden");
  }, [chromeVisible, railsVisible]);
}
