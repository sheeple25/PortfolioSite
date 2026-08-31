import { formatDate } from "@/lib/format";
import type { ResolvedEntry } from "@/lib/entries/types";
import type { Tile } from "./TileGrid";

/**
 * A resolved entry as an index tile.
 *
 * Shared by `/projects` and `/archive`, which is the point: the two indexes
 * are two filters over one registry, so they should not each be assembling
 * their own idea of what a card is. Everything to do with where the tile goes
 * — `mode`, `href`, `peek` — is passed through untouched from `lib/entries`,
 * the only module that decides it.
 */
export const toTile = (entry: ResolvedEntry): Tile => ({
  slug: entry.slug,
  title: entry.meta.title,
  description: entry.meta.description,
  place: entry.meta.place,
  // `term` is the display label; the exact date stands in until one is set.
  term: entry.meta.term ?? formatDate(entry.meta.date),
  cover: entry.meta.cover,
  coverAlt: entry.meta.coverAlt,
  coverVideo: entry.meta.coverVideo,
  logo: entry.meta.logo,
  logoInvert: entry.meta.logoInvert,
  logoWidth: entry.meta.logoWidth,
  mode: entry.mode,
  href: entry.href,
  peek: entry.peek,
});
