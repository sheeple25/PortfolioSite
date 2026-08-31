"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import PixelSprite from "./PixelSprite";
import { DEFAULT_SLUG, INTERESTS } from "./interests";
import styles from "./InterestBand.module.css";

/*
 * Act II: a band of pixel cutouts over one shared panel.
 *
 * Every interest opens into the *same* slot rather than into a page of its
 * own. Flipping between them then costs one click and no navigation, which is
 * the behaviour worth optimising for — the reader is meant to try all of
 * them, and a subpage per interest taxes every switch with a page load.
 *
 * The panel's height is fixed for every interest (see the stylesheet). Some
 * panels are emptier than others as a result, and that is the accepted trade:
 * a slot that resizes to its contents would move the page under the reader on
 * every switch. This follows the same rule as the three switchable charts in
 * the Traces case study, whose bounding box is likewise held constant.
 *
 * The open interest is mirrored into the URL hash so a choice is linkable and
 * the back button walks through the ones you looked at. `pushState` rather
 * than `replaceState` for exactly that reason; `popstate` puts the state back
 * when the reader goes back. Note the constraint this places on `slug` — it
 * must not match any element `id` on the page, or the browser will scroll to
 * that element on the way in. See `interests.tsx`.
 */

/*
 * The open interest is not React state — it is the URL, read through
 * `useSyncExternalStore`.
 *
 * Holding it in `useState` as well would mean two sources of truth kept in
 * step by an effect, and syncing them is what makes the back button and a
 * fresh load on `/about#reading` fiddly to get right. Subscribing to the
 * location instead means there is only ever one answer to "what's open", and
 * hydration is handled by the server snapshot rather than by a corrective
 * render after mount.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

/** Must return a stable value when nothing changed — a string does. */
function getSnapshot(): string {
  return window.location.hash.replace(/^#/, "");
}

/*
 * There is no location on the server, so the server always renders the
 * default. React knows this snapshot is the one used for hydration and
 * re-renders with the real hash immediately afterwards, which is why this
 * doesn't produce a mismatch the way reading `window` during render would.
 */
function getServerSnapshot(): string {
  return "";
}

export default function InterestBand() {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const openSlug = INTERESTS.some((i) => i.slug === hash) ? hash : DEFAULT_SLUG;

  const open = useCallback((slug: string) => {
    // `pushState` rather than assigning to `location.hash`: assigning makes
    // the browser scroll to a matching element, and pushing keeps the back
    // button walking through the interests the reader actually opened.
    window.history.pushState(null, "", `#${slug}`);
    // `pushState` fires no event of its own, so the store above would never
    // hear about a change this component made itself.
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  /*
   * Left/right walk the band and open as they go, which is what `tablist`
   * semantics promise. Home/End jump to the ends. Focus follows selection so
   * a keyboard reader sees each panel as they pass it, matching what a mouse
   * reader gets from clicking along the row.
   */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = INTERESTS.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    open(INTERESTS[next].slug);
    tabsRef.current[next]?.focus();
  };

  const active = INTERESTS.find((i) => i.slug === openSlug) ?? INTERESTS[0];

  return (
    <section className={styles.act} aria-labelledby="act-two-heading">
      <h2 id="act-two-heading" className={styles.heading}>
        The rest of it
      </h2>

      <div className={styles.band} role="tablist" aria-label="Interests">
        {INTERESTS.map((interest, i) => {
          const isOpen = interest.slug === active.slug;
          return (
            <button
              key={interest.slug}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${interest.slug}`}
              aria-selected={isOpen}
              aria-controls="interest-panel"
              tabIndex={isOpen ? 0 : -1}
              className={`${styles.cutout} ${isOpen ? styles.cutoutOpen : ""}`}
              /*
               * The scatter is fed in as custom properties rather than as a
               * `transform` here, so the stylesheet keeps ownership of how
               * they compose — the hover lift has to add to this offset, not
               * replace it, and a `transform` set inline would win outright.
               */
              style={
                {
                  "--dx": interest.offset.x,
                  "--dy": interest.offset.y,
                  "--rot": interest.offset.rotate,
                } as React.CSSProperties
              }
              onClick={() => open(interest.slug)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {interest.art ? (
                // eslint-disable-next-line @next/next/no-img-element -- pixel art must not be resampled by the image optimiser; see PixelSprite.tsx
                <img
                  className={styles.art}
                  src={interest.art.src}
                  alt=""
                  aria-hidden="true"
                />
              ) : (
                <PixelSprite sprite={interest.sprite} size={56} className={styles.art} />
              )}
              <span className={styles.label}>{interest.label}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.caption} aria-live="polite">
        {active.caption}
      </p>

      {/*
       * One panel element, not one per interest. Keyed on the open slug so
       * switching remounts it — the departure board's flaps and the
       * bookshelf's scroll position should both start fresh rather than carry
       * over from whichever interest was open before.
       */}
      <div
        id="interest-panel"
        role="tabpanel"
        aria-labelledby={`tab-${active.slug}`}
        className={styles.panel}
        key={active.slug}
      >
        {active.panel}
      </div>
    </section>
  );
}
