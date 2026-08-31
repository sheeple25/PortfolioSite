"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SplitFlapText from "@/components/motion-primitives/split-flap-text";
import { usePrefersReducedMotion } from "@/lib/hooks";
import {
  PAGE_INTERVAL_MS,
  ROWS_PER_COLUMN,
  TRIPS,
  TRIPS_PER_PAGE,
  type Trip,
} from "@/lib/about/travel";
import styles from "./DepartureBoard.module.css";

/*
 * A split-flap departure board for the places he's been.
 *
 * Modelled on a Solari board: a header strip carrying the board's name, a live
 * clock and the column labels, then two columns of departures, then a remarks
 * strip along the bottom. Dark regardless of the site's theme — it is meant to
 * read as a physical object sitting in the page, and a departure board that
 * turns white in light mode stops being one. That is why every colour here is
 * a literal rather than a token: the board must not follow the theme, and
 * tokens would drag it along.
 *
 * **There is no empty space on the face.** A real board's rows are physical
 * wells that exist whether or not there's a flight in them, and the face is
 * always full — so rows here stretch to fill (`flex: 1 1 0`) rather than
 * sitting at their content height above a gap. Give the board six trips
 * instead of sixteen and it renders six taller rows, not sixteen short ones
 * with ten blanks.
 *
 * One timer drives the whole board. Every cell is a `SplitFlapText` in
 * controlled mode, so a page turn changes all of their `text` props in the
 * same render and they flip together — see the vendored component's header for
 * why its own internal cycling would have drifted instead.
 */

/** Character widths per column. Fixed, so the two columns stay in register. */
const WIDTHS = { from: 3, to: 3, date: 6, carrier: 3 } as const;

/* The board's palette. Deliberately literal — see the note above. */
const TILE = "#161b22";
const INK = "#f4efe3";
/* The destination is the one thing a departure board wants you to read. */
const INK_TO = "#f0a95c";

/* ------------------------------------------------------------------ clock */

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function subscribeToSeconds(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

/*
 * The wall clock, as whole seconds since the epoch.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`, for two
 * reasons: the current time is genuinely an external store, and this is the
 * shape that handles hydration correctly. The server has no clock the client
 * will agree with, so `getServerSnapshot` returns 0 — the board is prerendered
 * reading `00:00:00`, and the real time flips up from that on mount, which
 * doubles as the board powering on.
 *
 * The snapshot is whole seconds, not `Date.now()`, so it is stable between
 * ticks — an ever-changing snapshot would make React re-render forever.
 */
function useClockSeconds(): number {
  return useSyncExternalStore(
    subscribeToSeconds,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/* -------------------------------------------------------------------- cells */

function Cell({
  value,
  width,
  color = INK,
}: {
  value: string;
  width: number;
  color?: string;
}) {
  return (
    <span className={styles.well}>
      <SplitFlapText
        text={value.toUpperCase()}
        padTo={width}
        tileColor={TILE}
        textColor={color}
        fontSize="1rem"
        gap={1}
        tileRadius={1}
        flipDuration={0.07}
        stagger={0.03}
        flipsPerChar={5}
        label={value || undefined}
      />
    </span>
  );
}

function Row({
  trip,
  selected,
  onSelect,
}: {
  trip: Trip;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={`${styles.rowButton} ${selected ? styles.rowButtonActive : ""}`}
        onClick={onSelect}
        onFocus={onSelect}
        aria-label={`${trip.from} to ${trip.to}, ${trip.date}, carrier ${trip.carrier}`}
      >
        <Cell value={trip.from} width={WIDTHS.from} />
        <Cell value={trip.to} width={WIDTHS.to} color={INK_TO} />
        <Cell value={trip.date} width={WIDTHS.date} />
        <Cell value={trip.carrier} width={WIDTHS.carrier} />
      </button>
    </li>
  );
}

function ColumnLabels() {
  return (
    <div className={styles.labels} aria-hidden="true">
      <span>From</span>
      <span>To</span>
      <span>Date</span>
      <span>Carrier</span>
    </div>
  );
}

/* -------------------------------------------------------------------- board */

export default function DepartureBoard({ trips = TRIPS }: { trips?: Trip[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const pageCount = Math.max(1, Math.ceil(trips.length / TRIPS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pageCount < 2 || reducedMotion) return;
    const id = setInterval(
      () => setPage((p) => (p + 1) % pageCount),
      PAGE_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [pageCount, reducedMotion]);

  const seconds = useClockSeconds();
  const { time, date } = useMemo(() => {
    const d = new Date(seconds * 1000);
    return {
      time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`,
      date: `${pad2(d.getDate())} ${MONTHS[d.getMonth()]}`,
    };
  }, [seconds]);

  const face = useMemo(
    () => trips.slice(page * TRIPS_PER_PAGE, (page + 1) * TRIPS_PER_PAGE),
    [trips, page],
  );

  /*
   * Split across two columns by halving what is actually on the face, not by
   * the nominal `ROWS_PER_COLUMN`. On a part-full last page that keeps the two
   * columns even, instead of filling the left one and leaving the right short.
   */
  const split = Math.ceil(face.length / 2) || ROWS_PER_COLUMN;
  const columns = [face.slice(0, split), face.slice(split)];
  const selected = selectedIndex === null ? null : (face[selectedIndex] ?? null);

  return (
    <div className={styles.board}>
      <div className={styles.head}>
        <span className={styles.title}>
          <span className={styles.plane} aria-hidden="true">
            ✈
          </span>
          Departures
        </span>

        {/*
         * The live half. The seconds tile flips every second, which is the
         * cheapest possible signal that the board is a running machine rather
         * than a picture of one.
         */}
        <span className={styles.clock}>
          <span className={styles.clockLabel} aria-hidden="true">
            Time
          </span>
          <SplitFlapText
            text={time}
            padTo={8}
            charset="0123456789:"
            tileColor={TILE}
            textColor={INK}
            fontSize="0.82rem"
            gap={1}
            tileRadius={1}
            flipDuration={0.06}
            stagger={0.02}
            flipsPerChar={3}
            label={`Current time ${time}`}
          />
          <span className={styles.clockLabel} aria-hidden="true">
            Date
          </span>
          <SplitFlapText
            text={date}
            padTo={6}
            tileColor={TILE}
            textColor={INK}
            fontSize="0.82rem"
            gap={1}
            tileRadius={1}
            flipDuration={0.06}
            stagger={0.02}
            flipsPerChar={3}
            label={`Today, ${date}`}
          />
        </span>
      </div>

      <div className={styles.labelRow}>
        <ColumnLabels />
        <ColumnLabels />
      </div>

      <div className={styles.columns}>
        {columns.map((column, columnIndex) => (
          <ul className={styles.rows} key={columnIndex}>
            {column.map((trip, i) => {
              const index = columnIndex === 0 ? i : split + i;
              return (
                <Row
                  key={index}
                  trip={trip}
                  selected={index === selectedIndex}
                  onSelect={() => setSelectedIndex(index)}
                />
              );
            })}
          </ul>
        ))}
      </div>

      {/*
       * The remarks strip, as on a real board. Always rendered, note or not —
       * it is part of what fixes the board's height, so it must not appear and
       * disappear with the selection.
       */}
      <p className={styles.remarks}>
        <span className={styles.remarksLabel} aria-hidden="true">
          Remarks
        </span>
        <span className={styles.remarksText}>{selected?.note ?? " "}</span>
        {pageCount > 1 && (
          <span className={styles.paging} aria-hidden="true">
            {page + 1}/{pageCount}
          </span>
        )}
      </p>
    </div>
  );
}
