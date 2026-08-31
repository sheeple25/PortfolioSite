import type { ReactNode } from "react";
import Bookshelf from "./Bookshelf";
import DepartureBoard from "./DepartureBoard";
import PanelPlaceholder from "./PanelPlaceholder";
import PanelScroll from "./PanelScroll";
import Playtime from "./Playtime";
import { BOOK, DPAD, PAW, PLANE, type Sprite } from "./PixelSprite";

/**
 * Act II's contents: one entry per interest.
 *
 * **Adding one is meant to be a single edit to this array** — the band, the
 * keyboard handling, the URL sync and the panel all read from here and none
 * of them know how many entries there are. Lifting, whenever it earns a
 * place, is an object with a sprite and a panel and nothing else.
 *
 * Two rules the array has to keep:
 *
 * 1. `slug` goes in the URL as a hash, so it must not collide with the `id`
 *    of anything else on the page — a hash that matches a real element makes
 *    the browser scroll to it, which is precisely the jump this structure
 *    exists to avoid.
 * 2. Every panel must fill its slot (`height: 100%`) rather than size to its
 *    content. The panel's height is fixed for all interests on purpose; a
 *    panel that sizes itself would defeat that and the page would jump on
 *    every switch.
 */
export type Interest = {
  /** URL hash and React key. Lowercase, no spaces. */
  slug: string;
  /** The band's label, under the sprite. */
  label: string;
  /** One line, shown beside the panel. Sets up what the reader is looking at. */
  caption: string;
  /**
   * Stand-in art, drawn on Pixel's own cell grid. Replaced by `art` when the
   * real pixelated photo cutouts land — see `PixelSprite.tsx`.
   */
  sprite: Sprite;
  /**
   * The real cutout, once it exists. When present the band renders this
   * instead of `sprite`; nothing else changes.
   */
  art?: { src: string; alt: string };
  /** What fills the shared panel when this interest is open. */
  panel: ReactNode;
  /**
   * Where this cutout sits relative to its slot in the band, so the row reads
   * as objects laid down rather than as a row of buttons.
   *
   * Art-directed here rather than generated with `Math.random()`, for two
   * reasons: random values differ between the server render and the client's
   * first pass, which is a hydration mismatch, and they would reshuffle on
   * every re-render — the cutouts would hop about whenever a panel changed.
   * Fixed values also mean the scatter can actually be composed.
   *
   * `y` carries most of it. Keep it inside roughly ±1.5rem or the band stops
   * reading as a band; the reserved space in the stylesheet assumes that.
   */
  offset: { x: string; y: string; rotate: string };
};

export const INTERESTS: Interest[] = [
  {
    slug: "travel",
    offset: { x: "0.4rem", y: "-1.3rem", rotate: "-6deg" },
    label: "Travel",
    caption: "Everywhere I've managed to get to so far.",
    sprite: PLANE,
    panel: <DepartureBoard />,
  },
  {
    slug: "reading",
    offset: { x: "-0.7rem", y: "0.9rem", rotate: "4.5deg" },
    label: "Reading",
    caption: "Picked it back up recently. Pull one off the shelf.",
    sprite: BOOK,
    panel: (
      <PanelScroll>
        <Bookshelf />
      </PanelScroll>
    ),
  },
  {
    slug: "games",
    offset: { x: "0.9rem", y: "-0.5rem", rotate: "7deg" },
    label: "Games",
    caption: "Hours sunk, honestly reported.",
    sprite: DPAD,
    panel: <Playtime />,
  },
  {
    slug: "pets",
    offset: { x: "-0.4rem", y: "1.2rem", rotate: "-4.5deg" },
    label: "Pets",
    caption: "One dog of mine, one cat by association.",
    sprite: PAW,
    panel: <PanelPlaceholder noun="The pets" waitingFor="photos" />,
  },
];

/** The interest the page opens on when the URL doesn't ask for another. */
export const DEFAULT_SLUG = "travel";
