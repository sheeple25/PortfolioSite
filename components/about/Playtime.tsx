"use client";

import { GAMES, type Game } from "@/lib/about/games";
import styles from "./Playtime.module.css";

/*
 * Hours sunk, as bars.
 *
 * The bars are scaled against the largest entry rather than against a round
 * number, so the longest bar always reaches the full width and the panel
 * reads the same whether the top game is at 40 hours or 400. The absolute
 * figure is printed next to each bar, which is where the honesty lives — a
 * chart with no numbers would let the shape imply whatever the reader wants.
 *
 * Bars are plain divs rather than a chart library: this is one series of one
 * value each, and the site's chart stack would be a large dependency to pull
 * in for a bar whose length is `hours / max`.
 */
export default function Playtime({ games = GAMES }: { games?: Game[] }) {
  const max = Math.max(1, ...games.map((g) => g.hours));

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {games.map((game) => (
          <li key={game.title} className={styles.item}>
            <div className={styles.head}>
              <span className={styles.title}>{game.title}</span>
              <span className={styles.hours}>{game.hours} h</span>
            </div>
            <div className={styles.track}>
              <div
                className={styles.bar}
                style={{ width: `${(game.hours / max) * 100}%` }}
              />
            </div>
            {game.note ? <p className={styles.note}>{game.note}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
