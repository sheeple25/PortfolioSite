/**
 * Twitter reads `twitter:image`, not `og:image`, and Next only emits the
 * former from this file convention — so the one card is re-exported rather
 * than duplicated. See `opengraph-image.tsx` for the design.
 */
export { default, alt, size, contentType } from "./opengraph-image";
