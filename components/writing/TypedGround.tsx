"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import styles from "./TypedGround.module.css";

/**
 * The `/writing` header texture — the selected essay, typed out across the
 * whole window in nearly invisible type.
 *
 * Goes in `IndexShell`'s `background` slot. `/projects` fills that slot with a
 * live force graph; this is deliberately the opposite kind of thing — no
 * interaction, no canvas, one `setTimeout` in flight at a time. Writing is the
 * one index whose content *is* type, so its ground is type as well, and it is
 * the real document rather than filler: the page hands over the recommended
 * essay's prose and this walks through it a screenful at a time, holding at
 * the bottom of each before the next starts on a clean sheet.
 *
 * Set in the same serif the essays themselves are set in, at an ink level
 * meant to be seen rather than read — the point is the sight of writing
 * happening, not the words.
 *
 * A screenful is measured, not guessed — see `useFitter`.
 */

/*
 * The typing model. A metronome reads as a loading spinner rather than a
 * person, so every keystroke is jittered, and the pauses that make typing
 * legible as typing are the structural ones: a beat at a comma, a longer one
 * at a full stop, the occasional stall where the typist is deciding something.
 * All ms.
 *
 * `KEYSTROKE` is quicker than a person really types, and that is the trade for
 * a large face: a screenful is only a few hundred characters, and at a literal
 * typing speed the window sits half-empty for most of the time anyone is
 * looking at it. The jitter and the pauses are what carry the impression of a
 * hand at work; the rate is only what keeps the screen filling.
 */
const KEYSTROKE = 30;
/** Fraction each keystroke swings either side of `KEYSTROKE`. */
const KEYSTROKE_JITTER = 0.8;
/** Spaces cost slightly more than letters — the hand resets between words. */
const WORD_BREAK = 1.3;
const CLAUSE_PAUSE = 120;
const SENTENCE_PAUSE = 300;
/** Chance a given keystroke is followed by a stall, and how long it can run. */
const HESITATION_CHANCE = 0.025;
const HESITATION = 420;

/*
 * Mistyping is the detail that sells it and the one that turns cute fastest.
 * Per keystroke, against a screenful of a few hundred — so this lands two or
 * three slips a page, a few lines apart.
 */
const TYPO_CHANCE = 0.007;
/** How long the wrong letter sits there before the typist notices it. */
const TYPO_NOTICE = 240;
const TYPO_NOTICE_JITTER = 320;
const BACKSPACE = 130;

/** A full page holds, fades, and the next screenful starts on a clean sheet. */
const HOLD = 3600;
const CLEAR = 1000;
const RELOAD = 600;

/**
 * QWERTY neighbours, for typos that look like a finger landing one key off
 * rather than a random character appearing. Letters only — punctuation slips
 * read as corruption, not as a mistake.
 */
const NEIGHBOURS: Record<string, string> = {
  a: "sqw", b: "vgn", c: "xvd", d: "sfe", e: "wrd", f: "dgr", g: "fhtv",
  h: "gjy", i: "uok", j: "hkn", k: "jli", l: "kop", m: "nj", n: "bm",
  o: "ipl", p: "ol", q: "wa", r: "etf", s: "adw", t: "ryg", u: "yij",
  v: "cbf", w: "qes", x: "zcs", y: "tuh", z: "xa",
};

/** How long to wait after committing `char`. */
function delayFor(char: string): number {
  const swing = 1 + (Math.random() * 2 - 1) * KEYSTROKE_JITTER;
  let delay = KEYSTROKE * swing;

  if (char === " ") delay *= WORD_BREAK;
  if (",;:—-".includes(char)) delay += CLAUSE_PAUSE;
  if (".!?".includes(char)) delay += SENTENCE_PAUSE;
  if (Math.random() < HESITATION_CHANCE) delay += Math.random() * HESITATION;

  return delay;
}

/** The wrong key for `char`, or `null` when this keystroke lands cleanly. */
function slip(char: string): string | null {
  if (Math.random() > TYPO_CHANCE) return null;

  const options = NEIGHBOURS[char.toLowerCase()];
  if (!options) return null;

  const wrong = options[Math.floor(Math.random() * options.length)];
  // Match the case of the key that was meant, so a slip on a capital reads right.
  return char === char.toUpperCase() ? wrong.toUpperCase() : wrong;
}

/**
 * Finds where each screenful ends, by measuring rather than counting.
 *
 * The face is proportional, so there is no character width to divide a box by
 * — an `i` and a `W` are not the same key on this typewriter. Instead a hidden
 * twin of the page is filled with candidate slices and asked whether it has
 * overflowed, and a binary search closes on the longest one that still fits.
 * Fourteen or so layout passes settle a page, once per page, which is nothing
 * beside the seconds it then takes to type it.
 *
 * The gain over a character estimate is that a page fills its box exactly,
 * whatever the window, the size or the essay's own mix of long and short words.
 */
function useFitter(probeRef: RefObject<HTMLElement | null>) {
  return useCallback(
    (text: string, start: number): number => {
      const probe = probeRef.current;
      // Nothing measurable yet — guess rather than stall the typing.
      if (!probe) return Math.min(start + 400, text.length);

      const fits = (end: number) => {
        probe.textContent = text.slice(start, end);
        return probe.scrollHeight <= probe.clientHeight;
      };

      // Everything left over fits: this is the last page.
      if (fits(text.length)) return text.length;

      let lo = 1;
      let hi = text.length - start;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fits(start + mid)) lo = mid;
        else hi = mid - 1;
      }

      // Back off to a word boundary so a page never breaks mid-word.
      const end = start + lo;
      const space = text.lastIndexOf(" ", end);
      return space > start ? space : end;
    },
    [probeRef],
  );
}

type TypedGroundProps = {
  /** The essay, as one continuous run of prose. See `getWritingProse`. */
  text: string;
};

export default function TypedGround({ text }: TypedGroundProps) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLParagraphElement>(null);
  const probeRef = useRef<HTMLParagraphElement>(null);
  const fit = useFitter(probeRef);

  /*
   * Bumped whenever the box changes size or the web font finally lands, both
   * of which move where a page ends. The typing effect keys off it, so either
   * one starts the current page again at the new measure.
   */
  const [measure, setMeasure] = useState(0);

  /** The screenful being typed. Set by the loop as it moves through the text. */
  const [passage, setPassage] = useState("");
  /** How far into the current page the typist has got. */
  const [cursor, setCursor] = useState(0);
  /** The wrong letter currently sitting in the last committed slot, if any. */
  const [wrong, setWrong] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [resting, setResting] = useState(true);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    let live = true;
    const remeasure = () => {
      if (live) setMeasure((n) => n + 1);
    };

    /*
     * Rounded, so the pixel-by-pixel resizes a mobile browser fires as its
     * toolbars collapse don't restart the page over and over.
     */
    let last = "";
    const observer = new ResizeObserver(() => {
      const key = `${Math.round(box.clientWidth / 12)}x${Math.round(box.clientHeight / 12)}`;
      if (key === last) return;
      last = key;
      remeasure();
    });
    observer.observe(box);

    /*
     * The fallback face has different metrics, so a page measured before the
     * real one arrives comes out visibly short or long.
     */
    void document.fonts?.ready.then(remeasure);

    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!text || measure === 0) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    async function run() {
      let start = 0;

      while (!cancelled) {
        const end = fit(text, start);
        const sheet = text.slice(start, end).trim();

        // A measure too small to hold anything — start over rather than spin.
        if (!sheet) {
          if (start === 0) return;
          start = 0;
          continue;
        }

        setPassage(sheet);

        /*
         * Nothing types under reduced motion, but the ground still has to be
         * there — so the first page is set out in full and left alone. The
         * render reads `passage.length` as the cursor in that case.
         */
        if (reduceMotion) return;

        setCursor(0);
        setWrong(null);
        setClearing(false);
        setResting(false);

        for (let i = 0; i < sheet.length; i += 1) {
          const char = sheet[i];

          const mistake = slip(char);
          if (mistake) {
            /*
             * The wrong letter takes the slot the right one was going to, so
             * everything already on screen stays exactly where it is. Only
             * the text after the caret shifts, and that is still unpainted.
             */
            setWrong(mistake);
            setCursor(i + 1);
            await wait(TYPO_NOTICE + Math.random() * TYPO_NOTICE_JITTER);
            if (cancelled) return;

            setWrong(null);
            setCursor(i);
            await wait(BACKSPACE);
            if (cancelled) return;
          }

          setCursor(i + 1);
          await wait(delayFor(char));
          if (cancelled) return;
        }

        // Idle from here to the next sheet — which is when the caret blinks.
        setResting(true);
        await wait(HOLD);
        if (cancelled) return;

        setClearing(true);
        await wait(CLEAR);
        if (cancelled) return;

        setCursor(0);
        await wait(RELOAD);
        if (cancelled) return;

        start = end >= text.length ? 0 : end;
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [text, reduceMotion, measure, fit]);

  const at = reduceMotion ? passage.length : cursor;

  /*
   * The whole page is always in the flow: everything ahead of the caret is
   * laid out and simply not painted. That is what holds the line breaks
   * still — with only the typed part in the DOM, every word that outgrew its
   * line would drop to the next one and shove the rest of the screen down.
   */
  const written = wrong
    ? passage.slice(0, Math.max(0, at - 1)) + wrong
    : passage.slice(0, at);
  const pending = passage.slice(at);

  return (
    <div className={styles.ground}>
      {/* The hidden twin `useFitter` measures against. */}
      <p ref={probeRef} className={cn(styles.page, styles.probe)} />
      <p ref={boxRef} className={cn(styles.page, clearing && styles.clearing)}>
        <span>{written}</span>
        {/*
          Takes up no space at all — the rule is drawn by a pseudo-element hung
          off a zero-sized box, so the line it sits on is laid out as though
          the caret weren't there and nothing shifts as it travels.
        */}
        <span
          className={cn(
            styles.caret,
            !reduceMotion && resting && styles.blinking,
          )}
        />
        <span className={styles.pending}>{pending}</span>
      </p>
    </div>
  );
}
