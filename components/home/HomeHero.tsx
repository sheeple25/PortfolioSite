"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { PixelStage, SAY_ATTRIBUTE, usePixel } from "@/components/pixel";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./HomeHero.module.css";

/**
 * The home hero — one viewport of site blue with nothing on it but type,
 * built to the Figma frame.
 *
 * **The page introduces a person, so it is composed around a name.** A small
 * mono greeting hands off mid-sentence to the word "vidush", set in the
 * reading serif at a size nothing else on the site ever reaches; underneath,
 * two more small blocks say what he does and who Pixel is. The ground is the
 * site accent (`.home-ground` in globals.css floods the whole document,
 * including the nav bar, for as long as `/` is mounted), so there is nothing
 * to look at here but the words and the space around them.
 *
 * **Everything arrives; nothing is simply there.** One authored timeline deals
 * the page out in the order you would read it — the bar, the greeting, the
 * name letter by letter, the blurb, Pixel's two links, and then Pixel himself,
 * dropping in and taking the landing. The bar is included deliberately: it is
 * part of this composition rather than furniture the page is hung on, which is
 * why `NavBar` carries `data-nav` hooks for the timeline to find.
 *
 * The one exception is **Pixel's voice**, which is not choreographed. It holds
 * its space from the first frame and simply fades up when he wakes, then swaps
 * to whatever he has to say about the link under your cursor — the same
 * `saying` the corner box draws everywhere else. He is talking, not animating.
 *
 * Pixel is still the thing this page teaches. The corner companion stands down
 * while it is mounted (`stageRoutes={["/"]}` on the provider, so the
 * suppression is SSR-consistent), the one here *is* the companion —
 * `PixelStage` runs the same mind — and he **walks to the corner when you
 * leave**: a link click glides his box to the exact spot the companion
 * occupies on every other page, so the dot in the corner is recognisably the
 * character you just met.
 */

/* ------------------------------------------------------------------ copy */

/** The mono greeting, which hands off mid-sentence to the name below it. */
const GREETING_LINES = ["hi.", "nice to meet you. i’m"] as const;

/** The word the page is built around. Lowercase, as drawn. */
const NAME = "vidush";

/** The blurb, in three pieces so the job title can carry the one emphasis. */
const BLURB_LEAD = "i’m an";
const BLURB_ROLE = "interdisciplinary designer";
const BLURB_TAIL = "interested in strategy, research, interaction + experience.";

/**
 * Pixel's standing line, and the two ways on. His line is not typed here: it
 * lands at the end of a timed arrival, and another two seconds of waiting for
 * a sentence nobody asked for is dead air on a page about arriving.
 */
const VOICE = "I’m Pixel, your guide to this site!";

const JUMPS = [
  {
    href: "/about",
    label: "about Vidush",
    say: "That’s him. This way for the parts that don’t fit on a CV.",
  },
  {
    href: "/projects",
    label: "Vidush’s work",
    say: "Everything he’s made, on one board. Point at a skill and I’ll light up the work that proves it.",
  },
] as const;

/* ---------------------------------------------------------------- timing */

/** The wake takes a beat of surprise before settling into attention. */
const SURPRISE_MS = 650;
/** The walk to the corner, in seconds. Fits inside a click's patience. */
const WALK_S = 0.55;

/**
 * Whether the arrival has been seen this session. The full intro is for the
 * actual arrival; a client-side return to `/` gets the short version. Set once
 * the timeline has actually moved — not on mount — so Strict Mode's rehearsal
 * effect, which unmounts at progress 0, doesn't spend it.
 */
let introPlayed = false;

/* --------------------------------------------------------------- helpers */

const sel = (...classes: string[]) => classes.map((c) => `.${c}`).join(" ");

/** The bar's own elements, which live in the root layout rather than in here. */
const navHeader = () =>
  document.querySelector<HTMLElement>('[data-chrome="header"]');

const navParts = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-chrome="header"] [data-nav]'),
  );

/** A sentence as masked words, so each can rise out of its own line box. */
function Words({ text, strong = false }: { text: string; strong?: boolean }) {
  const Word = strong ? "strong" : "span";
  const className = strong ? `${styles.word} ${styles.strong}` : styles.word;

  return text.split(" ").map((word, i) => (
    <Fragment key={`${word}-${i}`}>
      {i > 0 ? " " : null}
      <span className={styles.mask}>
        <Word className={className}>{word}</Word>
      </span>
    </Fragment>
  ));
}

/** The link cue: a small arrow that nudges toward the page it opens. */
function Cue() {
  return (
    <span className={styles.cue} aria-hidden="true">
      &rarr;
    </span>
  );
}

type IntroHooks = {
  /** Pixel notices you. `surprised` adds the little jolt. */
  wake: (surprised: boolean) => void;
  /** He has something to say. */
  greet: () => void;
  /** The timeline is over; resting styles belong to the stylesheet again. */
  done: () => void;
};

/**
 * The arrival: ~3.3s, one timeline, read top to bottom.
 *
 *   0.00  the bar deals itself in — wordmark, tabs, controls
 *   0.35  "hi." rises out of its line box, then the second line
 *   0.78  "vidush" is dealt out letter by letter
 *   1.50  the blurb rises word by word
 *   1.95  Pixel's two links slide in from the left
 *   2.20  Pixel drops onto his mark
 *   2.55  he wakes (surprised)
 *   2.78  he takes the landing — a squash that springs out
 *   2.90  his line fades up (a fade, not a beat — see the header comment)
 *   ~3.3  done
 *
 * `expo.out` on everything that travels; the drop is the only `back.out` and
 * the landing the only elastic. `clearProps` on every tween, so the resting
 * page is the stylesheet's again.
 */
function arrivalTimeline(nav: HTMLElement[], { wake, greet, done }: IntroHooks) {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: done });

  /* ---- the bar ------------------------------------------------------- */
  if (nav.length) {
    tl.from(
      nav,
      {
        y: -16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.07,
        clearProps: "opacity,transform",
      },
      0,
    );
  }

  /* ---- the greeting -------------------------------------------------- */
  tl.from(
    sel(styles.greeting, styles.lineText),
    {
      /* Past the mask's bottom padding, not just past the line box. */
      yPercent: 130,
      opacity: 0,
      duration: 0.8,
      stagger: 0.16,
      clearProps: "transform,opacity",
    },
    0.35,
  );

  /* ---- the name, dealt out letter by letter -------------------------- */
  tl.from(
    sel(styles.letter),
    {
      /* The letter masks sit on a 0.86 line box with 0.14em of clip below
         them, so a letter has to travel a good deal further than its own
         height to be fully out of the box it rises from. */
      yPercent: 135,
      opacity: 0,
      duration: 0.95,
      stagger: 0.055,
      clearProps: "transform,opacity",
    },
    0.78,
  );

  /* ---- the blurb ----------------------------------------------------- */
  tl.from(
    sel(styles.blurb, styles.word),
    {
      yPercent: 130,
      opacity: 0,
      duration: 0.75,
      stagger: 0.022,
      clearProps: "transform,opacity",
    },
    1.5,
  );

  /* ---- Pixel's links, then Pixel -------------------------------------- */
  tl.from(
    sel(styles.jump),
    {
      x: -20,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      clearProps: "transform,opacity",
    },
    1.95,
  );

  tl.from(
    sel(styles.stage),
    {
      y: -52,
      scale: 0.6,
      opacity: 0,
      duration: 0.62,
      ease: "back.out(1.8)",
      clearProps: "opacity,transform",
    },
    2.2,
  );

  /*
   * He lands with some weight — squashed on his feet, springing back out.
   * `immediateRender: false` matters: without it this would flatten him at
   * t = 0, long before he has dropped.
   */
  tl.fromTo(
    sel(styles.stage),
    { scaleX: 1.1, scaleY: 0.88 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.5,
      ease: "elastic.out(1, 0.4)",
      transformOrigin: "center bottom",
      clearProps: "transform",
      immediateRender: false,
    },
    2.78,
  );

  tl.call(() => wake(true), [], 2.55);
  tl.call(() => greet(), [], 2.9);

  return tl;
}

/**
 * The return visit: everything fades up together in ~0.8s, Pixel already up.
 * The bar is left alone — it never unmounted, and re-animating furniture that
 * did not go anywhere is a tic.
 */
function returnTimeline({ wake, greet, done }: IntroHooks) {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: done });

  tl.from(
    [sel(styles.greeting), sel(styles.name), sel(styles.blurb), sel(styles.jumps)],
    { y: 16, opacity: 0, duration: 0.65, stagger: 0.07, clearProps: "opacity,transform" },
    0,
  );
  tl.from(
    sel(styles.stage),
    {
      y: -22,
      scale: 0.85,
      opacity: 0,
      duration: 0.55,
      ease: "back.out(1.5)",
      clearProps: "opacity,transform",
    },
    0.14,
  );
  tl.call(() => wake(false), [], 0.25);
  tl.call(() => greet(), [], 0.45);

  return tl;
}

/* ------------------------------------------------------------- component */

export default function HomeHero() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const { openChat, react, saying } = usePixel();

  const rootRef = useRef<HTMLElement>(null);
  /* The slot holds layout; the stage inside it is what flies to the corner. */
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<gsap.core.Timeline | null>(null);

  const [awake, setAwake] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /* ---------------------------------------------------------- the arrival */

  /*
   * The markup ships fully styled (SSR, no-JS and the reduced-motion path all
   * show the finished page). On the client, this hides the blocks before the
   * first paint so the page doesn't flash complete and then rewind; the
   * timeline below takes over and clears it. Layout effect on purpose: it has
   * to land before the browser paints the hydrated tree.
   */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.setAttribute("data-intro", "pending");

    /* Only the true arrival brings the bar in with it (see `returnTimeline`). */
    const header = introPlayed ? null : navHeader();
    header?.setAttribute("data-nav-intro", "pending");

    return () => {
      root.removeAttribute("data-intro");
      header?.removeAttribute("data-nav-intro");
    };
  }, []);

  /*
   * One authored sequence, then stillness. `clearProps` returns every resting
   * style to the stylesheet, and both intro attributes come off when the
   * timeline ends.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const header = navHeader();
    const clearIntro = () => {
      root.removeAttribute("data-intro");
      header?.removeAttribute("data-nav-intro");
    };

    /*
     * Reduced motion: no timeline. He is simply up and talking — the
     * expression is pinned to the mind's own resting state.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearIntro();
      const id = setTimeout(() => {
        setAwake(true);
        setGreeting(true);
      }, 0);
      return () => clearTimeout(id);
    }

    const hooks: IntroHooks = {
      wake: (surprised) => {
        if (surprised) react("surprised", SURPRISE_MS);
        setAwake(true);
      },
      greet: () => setGreeting(true),
      done: () => {
        clearIntro();
        introPlayed = true;
      },
    };

    /* Read before the context runs, so a return visit doesn't grab the bar. */
    const nav = introPlayed ? [] : navParts();

    let tl: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      tl = introPlayed ? returnTimeline(hooks) : arrivalTimeline(nav, hooks);
    }, root);
    introRef.current = tl ?? null;

    /* Every tween has already placed its target at its start; safe to show. */
    root.setAttribute("data-intro", "playing");
    header?.setAttribute("data-nav-intro", "playing");

    return () => {
      /* Left mid-intro (or finished): the next visit gets the short one. */
      if (tl && tl.progress() > 0) introPlayed = true;
      introRef.current = null;
      ctx.revert();
      clearIntro();
    };
  }, [react]);

  /* ------------------------------------------------------------ the chat */

  const askPixel = useCallback(() => {
    if (!reducedMotion) react("happy", 900);
    openChat({ source: "companion" });
  }, [reducedMotion, react, openChat]);

  /* ------------------------------------------------------------- the walk */

  const walkThrough = useCallback(
    (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      /* Modified clicks keep their browser meaning — new tab, download, etc. */
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

      event.preventDefault();
      if (leaving) return;

      if (reducedMotion) {
        router.push(href);
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        router.push(href);
        return;
      }

      /* Takes his line down before the flight — it belongs to this page. */
      setLeaving(true);

      /*
       * Clicked before the intro finished: jump it to the end (callbacks
       * included, so Pixel is awake and every `clearProps` has run) before
       * measuring the stage — otherwise the flight starts from a half-dropped
       * box.
       */
      const intro = introRef.current;
      if (intro && intro.progress() < 1) intro.progress(1, false);

      react("happy", WALK_S * 1000 + 200);

      /*
       * Where the companion rests, measured rather than recomputed: a probe
       * element takes the companion's own CSS (`--shell-inset`,
       * `--corner-inset-block`, `--companion-size` from globals.css), and the
       * browser resolves the `max()`/`clamp()` math for us. The stage then
       * flies to that exact box, so the companion appearing there on the next
       * page reads as the same character having settled, not a cut.
       */
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;right:var(--shell-inset);bottom:var(--corner-inset-block);" +
        "width:var(--companion-size);height:var(--companion-size);" +
        "visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const target = probe.getBoundingClientRect();
      probe.remove();

      const rect = stage.getBoundingClientRect();

      /*
       * The navigation is the point of the click; the walk is decoration on top
       * of it. Hanging the `router.push` off `onComplete` alone makes the two
       * the same event, so anything that kills the tween before it finishes —
       * a re-render that reverts the intro's GSAP context out from under this
       * element, a mid-flight change of the reduced-motion preference — takes
       * the navigation with it and the click does nothing at all.
       *
       * So: whichever comes first wins, and a plain `setTimeout` is the backstop
       * precisely because it is not GSAP's to cancel.
       */
      let navigated = false;
      const go = () => {
        if (navigated) return;
        navigated = true;
        router.push(href);
      };
      window.setTimeout(go, WALK_S * 1000 + 150);

      /* Fixed at its current spot first, so the flight is pure transform.
         The slot keeps the hero's layout; nothing behind the flight reflows. */
      gsap.set(stage, {
        position: "fixed",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        margin: 0,
        zIndex: 60,
        transformOrigin: "top left",
      });
      gsap.to(stage, {
        x: target.left - rect.left,
        y: target.top - rect.top,
        scale: target.width / rect.width,
        duration: WALK_S,
        ease: "power3.inOut",
        onComplete: go,
      });
    },
    [leaving, reducedMotion, router, react],
  );

  /*
   * What he is saying: whatever the pointer is resting on, else his standing
   * line. Drawn here rather than by `PixelStage`'s own speech box (hence
   * `speaking={false}`) because this page gives his voice a place in the
   * layout instead of a bubble over his head — see the frame.
   */
  const voice = !leaving && greeting ? saying ?? VOICE : null;

  return (
    <section className={styles.hero} ref={rootRef}>
      {/*
        The greeting and the name are two grid items with a matched `fr` row
        either side of the name, rather than one block with a margin between
        them — that is what keeps the space above "vidush" equal to the space
        below it at any window height. See `.hero`'s row comment.
      */}
      <p className={styles.greeting}>
        {GREETING_LINES.map((line) => (
          <span key={line} className={styles.line}>
            <span className={styles.lineText}>{line}</span>
          </span>
        ))}
      </p>

      <h1 className={styles.name}>
        <span className="sr-only">Vidush</span>
        <span aria-hidden="true">
          {NAME.split("").map((letter, i) => (
            <span key={`${letter}-${i}`} className={styles.letterMask}>
              <span className={styles.letter}>{letter}</span>
            </span>
          ))}
        </span>
      </h1>

      <p className={styles.blurb}>
        <Words text={BLURB_LEAD} /> <Words text={BLURB_ROLE} strong />{" "}
        <Words text={BLURB_TAIL} />
      </p>

      <div className={styles.pixelCol}>
        {/*
          Holds its space from the first frame and fades up when he wakes —
          deliberately outside the arrival's choreography, because this is him
          talking rather than the page assembling itself.
        */}
        <p className={styles.voice} data-shown={voice ? "" : undefined}>
          {voice ?? VOICE}
        </p>

        <div className={styles.jumps}>
          {JUMPS.map((jump) => (
            <Link
              key={jump.href}
              href={jump.href}
              className={styles.jump}
              onClick={walkThrough(jump.href)}
              {...{ [SAY_ATTRIBUTE]: jump.say }}
            >
              {jump.label}
              <Cue />
            </Link>
          ))}
        </div>
      </div>

      {/*
        Pixel stands in a row of his own, below the one his words share with the
        blurb — which is what lets those two bottom-align while he hangs off the
        end of the composition. The slot owns layout, the stage owns motion: the
        stage is the box that flies to the corner. Everything inside it is
        Pixel's own (`PixelStage`).
      */}
      <div className={styles.slot}>
        <div className={styles.stage} ref={stageRef}>
          <PixelStage
            awake={awake}
            /* His voice is drawn by this page (see `voice` above), so his own
               speech box stays down — but the stage still claims the corner
               slot, which is what keeps `PixelSpeech` from doubling the line in
               the corner behind him. */
            speaking={false}
            onClick={askPixel}
          />
        </div>
      </div>
    </section>
  );
}
