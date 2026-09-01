"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * Keeps an index masthead's standfirst inside the box the layout gave it, by
 * widening the standfirst rather than letting it grow taller.
 *
 * ## The box
 *
 * On the one-window indexes (`/projects`, `/writing`, `/about`) the page is a
 * **stage** — masthead, and a banner if the page has one — over a **band** that
 * carries the page's actual navigation: the graph, the typed list, the interest
 * panel. The split is a flex one, so the stage takes what it needs and the band
 * takes the remainder (see `IndexShell.module.css`). Every pixel the masthead
 * takes is a pixel off the navigation below it.
 *
 * The box, then, is the space between the standfirst's own top edge and
 * `--index-stage-max` — a share of the window height, declared next to the
 * floor it is the counterpart to — less the air the masthead keeps under
 * itself. One line over and the band loses a line's worth of height. That is
 * the rule this enforces.
 *
 * ## Why it can't be CSS
 *
 * The fix for an over-tall column of text is a wider column — the masthead is
 * full-bleed now and there is a great deal of unused width sitting in the gap
 * between the title and the standfirst. But CSS has no way to say "be as wide
 * as you need to be in order to be this short": width is an input to line
 * breaking and height is its output, never the other way round. `aspect-ratio`
 * sizes a box, not the type inside it, and container queries can respond to a
 * width but not choose one. Measuring is the only way.
 *
 * ## What it does
 *
 * A binary search over `--index-intro-width`, between the resting width the
 * stylesheet asks for and the widest the column can be before it would crowd
 * the title. Each probe writes the variable and reads the paragraph's height
 * back, which is a synchronous reflow — bounded to a dozen or so, only at mount
 * and on a genuine viewport change.
 *
 * If even the widest column is too tall — a much longer standfirst than any
 * page currently has, or a very short window — the search falls back to
 * shrinking the type via `--index-intro-scale`, down to `MIN_FONT_SCALE`. That
 * branch does not fire on today's content at any size; it exists so that "the
 * standfirst never exceeds its box" is a guarantee rather than a description of
 * the current copy.
 *
 * Pages with a sheet (`IndexShell` with `children`) are skipped: their header
 * is a full window with no floor to bust, so there is no box to fit.
 */

/**
 * How far the type may be scaled down when width alone can't do it. A floor
 * rather than an open-ended shrink — a standfirst set much smaller than this
 * stops reading as a standfirst, and at that point overflowing is the better of
 * two bad outcomes.
 */
const MIN_FONT_SCALE = 0.82;

/** Stop the width search once the bracket is this tight. Sub-pixel precision here buys nothing. */
const WIDTH_EPSILON = 4;

/** Hard cap on probes per search, so a pathological measurement can't spin. */
const SEARCH_STEPS = 12;

function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * `--index-stage-max` in pixels, or `0` where the page hasn't set one.
 *
 * A custom property's computed value is the token it was written with, so
 * `getComputedStyle` hands back the string `"44svh"` rather than a length. The
 * choice is to teach this file to parse CSS units — and to go stale the moment
 * the token is rewritten in `calc()`, or in a unit nobody thought of — or to
 * let CSS resolve it. A zero-width probe asking for that height, measured and
 * removed inside the same layout pass, is the second option and is always
 * exactly right.
 *
 * `position: absolute` keeps the probe out of flow, so its brief presence can't
 * change the height being measured. Where the property is absent the `height`
 * declaration is invalid at computed-value time, the probe falls back to `auto`
 * and measures `0` — which is the signal for "no ceiling here", and is what
 * makes this stand down on the sheet shape without a second check for it.
 *
 * It goes inside the masthead rather than the stage, which is where the
 * property is declared: custom properties inherit, so both read the same value,
 * and the stage has a `:last-child` rule hanging off it that a temporary extra
 * child would flip on and off for the duration of the measurement.
 */
function resolveCeiling(masthead: HTMLElement): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:var(--index-stage-max)";
  masthead.appendChild(probe);
  const ceiling = probe.getBoundingClientRect().height;
  probe.remove();
  return ceiling;
}

type Elements = {
  stage: HTMLElement;
  masthead: HTMLElement;
  title: HTMLElement;
  intro: HTMLElement;
};

function fit({ stage, masthead, title, intro }: Elements): void {
  /*
   * Both dials back to their stylesheet values first. A refit has to start from
   * the same place every time — measuring through the previous fit's width
   * would ratchet the column wider on every resize and never let it back.
   */
  masthead.style.removeProperty("--index-intro-width");
  masthead.style.removeProperty("--index-intro-scale");

  const ceiling = resolveCeiling(masthead);
  if (ceiling <= 0) return;

  /*
   * Below `60rem` the masthead stacks into one column and the standfirst
   * already has the full width; there is no gap left to widen into, and the
   * page is scrolling by then anyway. Read the track count rather than
   * re-testing the media query, so the breakpoint lives in exactly one place.
   */
  const mastheadStyle = getComputedStyle(masthead);
  const tracks = mastheadStyle.gridTemplateColumns.split(" ").filter(Boolean);
  if (tracks.length < 2) return;

  /*
   * The box: from the standfirst's own top edge down to the ceiling, less the
   * air the masthead holds under itself (`.masthead:last-child`, which is `0`
   * on a page whose banner brings its own).
   */
  const stageTop = stage.getBoundingClientRect().top;
  const introTop = intro.getBoundingClientRect().top;
  const budget =
    ceiling - (introTop - stageTop) - px(mastheadStyle.paddingBottom);

  /*
   * A non-positive budget means the masthead's own top padding has already
   * eaten the whole ceiling — a window far shorter than any this layout
   * targets. Leave it alone rather than trying to fit a paragraph into no
   * height at all.
   */
  if (budget <= 0) return;
  if (intro.getBoundingClientRect().height <= budget) return;

  const heightAtWidth = (width: number): number => {
    masthead.style.setProperty("--index-intro-width", `${width}px`);
    return intro.getBoundingClientRect().height;
  };

  /*
   * The widest the column may be: everything left over once the title has its
   * own width and the two are still held apart by the gap floor. Measured off
   * the title rather than assumed, because "Work." and "Writing." are not the
   * same width and the title's own size is a `vw` clamp.
   */
  const inner =
    masthead.clientWidth -
    px(mastheadStyle.paddingLeft) -
    px(mastheadStyle.paddingRight);
  const resting = intro.getBoundingClientRect().width;
  const widest = Math.max(
    resting,
    inner - title.getBoundingClientRect().width - px(mastheadStyle.columnGap),
  );

  /*
   * Probe the widest first. If that doesn't fit, no narrower width will either
   * — more width is monotonically fewer lines — so the search is skipped
   * entirely and the type-scale fallback takes over from there.
   */
  if (widest > resting && heightAtWidth(widest) <= budget) {
    let low = resting;
    let high = widest;
    let best = widest;

    for (let i = 0; i < SEARCH_STEPS && high - low > WIDTH_EPSILON; i += 1) {
      const mid = (low + high) / 2;
      if (heightAtWidth(mid) <= budget) {
        best = mid;
        high = mid;
      } else {
        low = mid;
      }
    }

    /*
     * The narrowest width that fits, not the widest. Both satisfy the rule, and
     * the narrow one keeps the standfirst's measure closer to what the
     * stylesheet asked for — widening is a correction, not a preference.
     */
    masthead.style.setProperty("--index-intro-width", `${best}px`);
    return;
  }

  // Out of width. Keep the widest column and take the rest out of the type.
  masthead.style.setProperty("--index-intro-width", `${widest}px`);

  let low = MIN_FONT_SCALE;
  let high = 1;
  let best = MIN_FONT_SCALE;

  for (let i = 0; i < SEARCH_STEPS && high - low > 0.01; i += 1) {
    const mid = (low + high) / 2;
    masthead.style.setProperty("--index-intro-scale", String(mid));
    // Largest scale that fits, so the search walks up rather than down.
    if (intro.getBoundingClientRect().height <= budget) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  masthead.style.setProperty("--index-intro-scale", String(best));
}

export default function useMastheadFit({
  stage,
  masthead,
  title,
  intro,
  signature,
}: {
  stage: RefObject<HTMLElement | null>;
  masthead: RefObject<HTMLElement | null>;
  title: RefObject<HTMLElement | null>;
  intro: RefObject<HTMLElement | null>;
  /**
   * Something that changes when the standfirst's *content* does.
   *
   * The measurement is keyed on the viewport, so a resize refits and anything
   * else does not — which is right, except across a client-side move between
   * two indexes. React reconciles one `IndexShell` into the next rather than
   * remounting it, so the same paragraph element gets new text at the same
   * viewport, and a viewport-keyed refit would skip it and leave the previous
   * page's width in place. Passing the page title here is enough to tell those
   * apart.
   */
  signature: string;
}): void {
  /*
   * Layout, not passive: the fit has to land before the browser paints, or the
   * first frame of every index shows the unfitted masthead and the band jumps
   * up underneath it a moment later.
   */
  useLayoutEffect(() => {
    const elements = {
      stage: stage.current,
      masthead: masthead.current,
      title: title.current,
      intro: intro.current,
    };
    if (
      !elements.stage ||
      !elements.masthead ||
      !elements.title ||
      !elements.intro
    ) {
      return;
    }
    const resolved = elements as Elements;

    let cancelled = false;
    let lastKey = "";

    /*
     * The guard against the obvious feedback loop: fitting changes the stage's
     * height, the observer watching the stage notices, and it fits again. Keying
     * on the viewport instead of on "something changed" breaks that, because
     * nothing this function writes can alter the stage's width or the window's
     * height. `force` is for the cases where the geometry is unchanged but the
     * measurement is stale anyway — a web font landing, or new copy.
     */
    const run = (force = false) => {
      if (cancelled) return;
      const key = `${Math.round(resolved.stage.clientWidth)}|${Math.round(
        window.innerHeight,
      )}`;
      if (!force && key === lastKey) return;
      lastKey = key;
      fit(resolved);
    };

    run(true);

    const observer = new ResizeObserver(() => run());
    observer.observe(resolved.stage);

    const onResize = () => run();
    window.addEventListener("resize", onResize);

    /*
     * Fallback text and the real face break lines in different places, so the
     * fit made before the webfont arrives is measuring the wrong type.
     */
    void document.fonts.ready.then(() => run(true));

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [stage, masthead, title, intro, signature]);
}
