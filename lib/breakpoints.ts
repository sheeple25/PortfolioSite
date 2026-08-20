/**
 * Breakpoints shared between CSS and JS.
 *
 * A media query cannot read a custom property — `@media (max-width: var(--x))`
 * is not valid CSS — so a value needed on both sides can't live in `:root` and
 * be imported here. This file is the source of truth for the JS side; every
 * `@media` block using the same threshold carries a comment pointing back at
 * the matching constant, so a change here is greppable from the stylesheets.
 */

/** Phone-width layout: the mascot shrinks and the hero sprite steps down a size. */
export const COMPACT_MAX_WIDTH = 640;

export const COMPACT_QUERY = `(max-width: ${COMPACT_MAX_WIDTH}px)`;
