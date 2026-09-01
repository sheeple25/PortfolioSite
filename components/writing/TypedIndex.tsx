"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";
import { useShutterLink } from "@/components/chrome/Shutter";
import styles from "./TypedIndex.module.css";

/**
 * The `/writing` index — every piece, typed out as one running block of text.
 *
 * The shape is taken from heckhouse.com: one field of large type filling its
 * box edge to edge, in which each item is an inline link and the items simply
 * run on from one another like sentences in a paragraph, wrapping wherever they
 * wrap. No rows, no cards, no rules between them. What makes it read as a list
 * rather than as prose is that adjacent items alternate face and weight, and
 * each carries a small chip after it.
 *
 * The version before this typed one piece at a time and needed arrows, dots and
 * a click-to-skip to be usable, because five sixths of the index was always off
 * screen waiting its turn. Typing the whole block instead deletes that entire
 * apparatus: everything is present and clickable from the first frame the
 * typing reaches it, so there is nothing to skip *to*. It also fixes the thing
 * the one-at-a-time version was worst at — with JavaScript off, or to a
 * crawler, this renders as what it is, a list of links to every piece.
 *
 * The typing engine's *character* — the jitter, the pause at a comma or a full
 * stop, the occasional stall, the mistyped letter that gets fixed — comes from
 * `TypedGround`, the decorative ground this descends from. Two things are new.
 * It types across a structure rather than a string: the cursor is one index
 * into the concatenated text, and each item works out from it how much of its
 * own sentence is showing. And it advances a word at a time rather than a
 * letter, which is what makes the whole index arrive in about three seconds
 * instead of half a minute — see the note on `WORD_STEP`.
 *
 * See `docs/INDEX_NAV_REDESIGN.md`.
 */

/*
 * The typing model — a **word** at a time, not a letter.
 *
 * These are the numbers that decide whether the index is usable, so they were
 * solved for rather than guessed: 472 characters across the three summaries but
 * only 84 words. Two separate costs were making character-stepping untenable.
 * The obvious one is nominal — one step per character at any rate slow enough
 * to read as a hand rather than a progress bar puts the last piece's link tens
 * of seconds away. The other only shows up in a browser: every step re-renders
 * and re-wraps the whole block, which measured at ~290ms per step against a
 * ~15ms budget, so the real elapsed time was several times the nominal one.
 * Stepping by word cuts the step count by 5.6x and is what fixes both.
 *
 * Simulated over the actual content at these values: ~4.9s for the whole index
 * (3.8s–7.3s over 600 runs), with the first — recommended — piece's link live
 * at 1.05s. Re-run that simulation if you change them.
 *
 * Every duration below was scaled by 1.4 from the values that simulation was
 * first run against: the original cadence read as a machine going flat out
 * rather than as someone writing.
 *
 * What survives the change is the character: a metronome reads as a loading
 * spinner rather than a person, so every step is jittered, longer words take
 * longer than short ones, and the pauses that make writing legible as writing
 * are the structural ones — a beat at a comma, a longer one at a full stop, the
 * occasional stall where the writer is deciding something. All ms.
 */
const WORD_STEP = 22;
/** Longer words take longer, per character of the word. */
const WORD_PER_CHAR = 1.55;
/** Fraction each step swings either side of its computed duration. */
const WORD_JITTER = 0.5;
const CLAUSE_PAUSE = 63;
const SENTENCE_PAUSE = 147;
/** Chance a given word is followed by a stall, and how long it can run. */
const HESITATION_CHANCE = 0.03;
const HESITATION = 266;
/** The beat between finishing one piece and starting the next. */
const BETWEEN_ITEMS = 210;

/*
 * Mistyping is the detail that sells it and the one that turns cute fastest.
 * Now per *word* rather than per keystroke — against ~90 words that lands two
 * or three slips across the whole block, well apart. The slip still happens at
 * the character level: the word arrives with its last letter one key off, sits
 * wrong for a moment, and is corrected.
 */
const TYPO_CHANCE = 0.015;
/** How long the wrong letter sits there before the writer notices it. */
const TYPO_NOTICE = 170;
const TYPO_NOTICE_JITTER = 180;
const BACKSPACE = 90;

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

/** How long to wait after committing `word`. */
function delayFor(word: string): number {
  const swing = 1 + (Math.random() * 2 - 1) * WORD_JITTER;
  let delay = (WORD_STEP + word.length * WORD_PER_CHAR) * swing;

  // Read off the word's own last character, which is where its punctuation is.
  const last = word[word.length - 1];
  if (",;:—-".includes(last)) delay += CLAUSE_PAUSE;
  if (".!?".includes(last)) delay += SENTENCE_PAUSE;
  if (Math.random() < HESITATION_CHANCE) delay += Math.random() * HESITATION;

  return delay;
}

/**
 * Where each word of a passage starts and ends.
 *
 * Three indices per word because the trailing space is committed *with* the
 * word but must not be the character a slip lands on: `end` is the last letter,
 * `next` is where the following word begins. Precomputed per passage rather
 * than split into an array of strings, because the renderer slices the original
 * string by offset — rejoining split words would risk not reproducing it
 * exactly.
 */
function wordsOf(text: string): Array<{ start: number; end: number; next: number }> {
  const out: Array<{ start: number; end: number; next: number }> = [];
  const re = /\S+\s*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    out.push({
      start,
      end: start + match[0].trimEnd().length,
      next: start + match[0].length,
    });
  }
  return out;
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
 * The three faces the index cycles through, in the order they are handed out.
 *
 * All three of the site's families, one per item, rather than the two-way
 * alternation this started with — with the sans leading, so the recommended
 * piece (which is always first, see the page) is the one set in the heaviest
 * face. Cycling by index rather than choosing per item means the pattern holds
 * however many pieces there are.
 */
const FACES = [styles.linkSans, styles.linkSerif, styles.linkMono];

export type TypedIndexItem = {
  slug: string;
  title: string;
  /** The sentence that is the link. `meta.description` — see the page. */
  blurb: string;
  /** Already formatted for display. */
  date: string;
  /** The raw value, for `<time datetime>`. */
  dateTime: string;
  readingMinutes: number;
  recommended?: boolean;
};

export default function TypedIndex({ items }: { items: TypedIndexItem[] }) {
  const reduceMotion = useReducedMotion();

  /**
   * Where each item's sentence starts and ends in the block as a whole.
   *
   * One cursor runs over the concatenated text and every item slices out of it
   * by offset. The alternative — a cursor per item, or an "items typed so far"
   * count plus a local cursor — makes each item's state something to keep in
   * step with its neighbours', and the whole point of this layout is that the
   * items are one continuous run.
   */
  /*
   * Built with a loop that reads the previous entry rather than a `map` over a
   * running total: the compiler's lint rules reject a mutable accumulator
   * captured by a callback, and carrying the offset in the array being built
   * needs no accumulator at all.
   */
  const spans = useMemo(() => {
    const out: Array<{ start: number; end: number }> = [];
    for (const item of items) {
      const start = out.length > 0 ? out[out.length - 1].end : 0;
      out.push({ start, end: start + item.blurb.length });
    }
    return out;
  }, [items]);

  const total = spans.length > 0 ? spans[spans.length - 1].end : 0;

  const [cursor, setCursor] = useState(0);
  /** The wrong letter currently sitting in the last committed slot, if any. */
  const [wrong, setWrong] = useState<string | null>(null);

  /*
   * Under reduced motion the block is simply there, in full, from the first
   * frame. Derived rather than pushed into state, so there is no corrective
   * render after mount.
   */
  const at = reduceMotion ? total : cursor;
  const finished = at >= total;

  useEffect(() => {
    if (reduceMotion || total === 0) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    async function run() {
      /*
       * Typed once, on arrival, and then left alone — this does not loop. The
       * ground it descends from looped forever because it was texture and had
       * nothing to arrive at; a list of links that erased and retyped itself
       * under the reader would be actively hostile.
       */
      for (let i = 0; i < items.length; i += 1) {
        const text = items[i].blurb;
        const offset = spans[i].start;

        for (const word of wordsOf(text)) {
          const mistake = slip(text[word.end - 1]);
          if (mistake) {
            /*
             * The word lands with its last letter one key off. The wrong letter
             * takes the slot the right one was going to, so everything already
             * on screen stays exactly where it is — only the text after the
             * caret shifts, and that is still unpainted. Stopping at `end`
             * rather than `next` keeps the caret on the letter being fixed
             * instead of past the following space.
             */
            setWrong(mistake);
            setCursor(offset + word.end);
            await wait(TYPO_NOTICE + Math.random() * TYPO_NOTICE_JITTER);
            if (cancelled) return;

            setWrong(null);
            await wait(BACKSPACE);
            if (cancelled) return;
          }

          setCursor(offset + word.next);
          await wait(delayFor(text.slice(word.start, word.end)));
          if (cancelled) return;
        }

        // A beat before the next piece, which is where its chip appears.
        await wait(BETWEEN_ITEMS);
        if (cancelled) return;
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [items, spans, total, reduceMotion]);

  if (items.length === 0) return null;

  return (
    <div className={styles.ground}>
      {/*
        One paragraph, not a list of blocks. The items are inline so they flow
        into each other and wrap mid-item exactly as words in a sentence do,
        which is the whole look — a `<ul>` of inline-blocks would keep each item
        unbreakable and leave ragged holes at the end of every line.

        It is still a list to a screen reader (`role="list"` on the paragraph,
        `listitem` on each link's wrapper), because that is what it is.
      */}
      <p className={styles.field} role="list">
        {items.map((item, i) => (
          <Item
            key={item.slug}
            item={item}
            index={i}
            span={spans[i]}
            at={at}
            wrong={wrong}
            reduceMotion={Boolean(reduceMotion)}
            // The caret rides the item currently being typed, and rests on the
            // last one once the block is done.
            caret={
              finished
                ? i === items.length - 1
                : at >= spans[i].start && at <= spans[i].end
            }
            resting={finished}
          />
        ))}
      </p>
    </div>
  );
}

function Item({
  item,
  index,
  span,
  at,
  wrong,
  caret,
  resting,
  reduceMotion,
}: {
  item: TypedIndexItem;
  index: number;
  span: { start: number; end: number };
  at: number;
  wrong: string | null;
  caret: boolean;
  resting: boolean;
  reduceMotion: boolean;
}) {
  const href = `/writing/${item.slug}`;
  const shutterClick = useShutterLink(href);

  // How much of this item's own sentence the shared cursor has reached.
  const local = Math.max(0, Math.min(item.blurb.length, at - span.start));
  const started = local > 0;
  const done = local >= item.blurb.length;

  /*
   * The whole sentence is always in the flow: everything ahead of the caret is
   * laid out and simply not painted. That is what holds the line breaks still
   * — with only the typed part in the DOM, every word that outgrew its line
   * would drop to the next one and shove the rest of the block down, and with
   * six items running into each other that reflow would never settle.
   */
  /*
   * `!done` is deliberately not part of this test. A slip on a passage's very
   * last word leaves the cursor at the end of the text, which is exactly the
   * state `done` describes — gating on it would silently skip the correction on
   * the one word per piece where it is most visible.
   */
  const written =
    wrong && caret
      ? item.blurb.slice(0, Math.max(0, local - 1)) + wrong
      : item.blurb.slice(0, local);
  const pending = item.blurb.slice(local);

  return (
    <span className={styles.item} role="listitem">
      <Link
        href={href}
        // Cycling face and weight is what keeps two adjacent sentences from
        // reading as one. Modulo rather than a per-item choice so it stays
        // right however many pieces there are.
        className={cn(styles.link, FACES[index % FACES.length])}
        // Not a tab stop until it says something. An empty link is one a
        // keyboard reader can land on and learn nothing from.
        tabIndex={started ? undefined : -1}
        aria-hidden={started ? undefined : "true"}
        onClick={(event) => {
          shutterClick(event);
          track("writing_click", { slug: item.slug, title: item.title });
        }}
      >
        <span>{written}</span>
        {caret ? (
          /*
            Takes up no space at all — the rule is drawn by a pseudo-element
            hung off a zero-sized box, so the line it sits on is laid out as
            though the caret weren't there and nothing shifts as it travels.
          */
          <span
            className={cn(
              styles.caret,
              !reduceMotion && resting && styles.blinking,
            )}
          />
        ) : null}
        <span className={styles.pending}>{pending}</span>
      </Link>

      {/*
        The chip. Reference's device, and the answer to where the index card's
        metadata went — it appears only once its sentence is finished, so it
        reads as the piece being filed rather than as a label waiting for text.
      */}
      <span className={cn(styles.chip, done && styles.chipOn)} aria-hidden={done ? undefined : "true"}>
        {item.recommended ? <span className={styles.star}>&lowast;</span> : null}
        <time dateTime={item.dateTime}>{item.date}</time>
        <span className={styles.chipDot}>&middot;</span>
        <span>{item.readingMinutes}m</span>
      </span>{" "}
    </span>
  );
}
