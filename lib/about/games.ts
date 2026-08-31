/**
 * The games panel's data.
 *
 * ⚠️ INCOMPLETE — Vidush's list. Nothing here is sourced from anywhere; the
 * two entries below exist only so the component has a shape to render and
 * should be replaced wholesale, not appended to.
 *
 * `hours` drives the bar length and is deliberately the whole point: the
 * panel is honest about time sunk, not a list of favourites. Order is by
 * hours descending — `Playtime` does not sort, so that the order here is the
 * order on screen and a deliberate exception is possible.
 */

export type Game = {
  title: string;
  /** Hours played. Rounded is fine; nobody is auditing this. */
  hours: number;
  /** One short line. Optional — a game with nothing to say just shows a bar. */
  note?: string;
};

export const GAMES: Game[] = [
  { title: "Placeholder — replace me", hours: 120 },
  { title: "Placeholder — replace me too", hours: 40 },
];
