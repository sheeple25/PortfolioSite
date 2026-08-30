/*
 * Bits of Pixel that are scripted rather than generated.
 *
 * The SOP asks for one running joke: a question with nothing to do with Vidush
 * gets a warmly unhelpful "oh absolutely, here's what I have for you" and a
 * link to the obvious video. Leaving that to the model means it eventually
 * paraphrases the joke, or mangles the URL, or forgets it entirely — and a
 * half-remembered bit is worse than no bit.
 *
 * So the judgement stays with the model (only it can tell whether a question is
 * genuinely off-topic) but the payload does not: the model emits a sentinel,
 * and the exact wording and link are written here, once.
 */

/** What the model emits when it decides a question is completely off-topic. */
export const RICKROLL_SENTINEL = "[[RICKROLL]]";

const RICKROLL_REPLY =
  "oh absolutely, i've got exactly what you're looking for → https://www.youtube.com/watch?v=dQw4w9WgXcQ";

/**
 * Any leading slice of the sentinel, so a half-arrived `[[RICK` doesn't flash
 * on screen mid-stream before the rest of the token turns up.
 */
const PARTIAL_SENTINEL = /\[\[?R?I?C?K?R?O?L?L?\]?$/;

/** Swaps sentinels for their scripted text. Safe to call on a partial stream. */
export function applyScriptedBits(text: string): string {
  return text.split(RICKROLL_SENTINEL).join(RICKROLL_REPLY).replace(PARTIAL_SENTINEL, "");
}
