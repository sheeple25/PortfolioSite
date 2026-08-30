/**
 * Limits shared by PixelBot's client and its API route.
 *
 * These used to be two constants with the same name in two files, kept in step
 * by a comment in each pointing at the other. One definition, imported by both,
 * is the version that cannot drift.
 */

/**
 * TEMPORARY cost guard while PixelBot is still being built out.
 *
 * The sidebar disables its input at this count; the route rejects a body
 * carrying more than this many user turns, so editing client state doesn't get
 * around it. Known gaps, accepted for now: repeated resets, and scripted
 * requests that each post a fresh short history. See "Cost posture" in
 * `docs/PIXELBOT_BUILD.md` — the eventual answer is the SOP's genuineness
 * score, not a bigger number here.
 */
export const MAX_USER_MESSAGES = 5;

/** Keeps a runaway client-side history from ballooning the request. */
export const MAX_HISTORY_MESSAGES = 20;

/** Hard cap on one message, in characters. Input tokens are billed too. */
export const MAX_CONTENT_CHARS = 2_000;

/**
 * Hard cap on the InScreen note text handed over on a chat handoff.
 *
 * Notes are hand-authored and short — this is a sanity bound on a field that
 * arrives from the client, not a budget anyone should be spending.
 */
export const MAX_SCREEN_TEXT_CHARS = 1_000;
