/**
 * The departure board's data.
 *
 * ⚠️ PLACEHOLDER — EVERY ROW BELOW IS INVENTED AND MUST BE REPLACED.
 *
 * Vidush has been to 22 countries, and the board's four fields (from, to,
 * date, carrier) are facts only he has. Nothing here was sourced from
 * anywhere; the rows exist so the board has a full face to render while it is
 * being designed. **Do not ship this file as-is** — replace the array
 * wholesale rather than appending to it.
 *
 * The count matters to the layout in one direction only: the board fills its
 * face with whatever it is given, so more trips than `TRIPS_PER_PAGE` start it
 * paging, and fewer make each row taller. Sixteen is what fills two columns of
 * eight without either.
 */

export type Trip = {
  /** Origin, three letters. Airport code where there is one. */
  from: string;
  /** Destination, three letters. */
  to: string;
  /**
   * Shown in the board's date column, six characters: `MMM YY`.
   *
   * A pre-formatted string rather than a `Date`, because the board is a grid
   * of fixed-width flaps and the value has to be exactly six characters — a
   * formatter returning `MAY 25` for one row and `SEPT 24` for another would
   * break the column alignment the flaps depend on.
   */
  date: string;
  /** Carrier, up to three letters. Airline code, board-style. */
  carrier: string;
  /** One line, shown in the board's remarks strip when the row is selected. */
  note?: string;
  /**
   * Photos for this trip, under `public/about/travel/`. Optional and
   * deliberately so: this is what keeps the board complete on day one rather
   * than blocking on 22 sets of pictures.
   */
  photos?: string[];
};

export const TRIPS: Trip[] = [
  { from: "DEL", to: "LIS", date: "SEP 24", carrier: "TAP" },
  { from: "LIS", to: "OPO", date: "SEP 24", carrier: "TAP" },
  { from: "OPO", to: "MAD", date: "OCT 24", carrier: "IB" },
  { from: "MAD", to: "BCN", date: "OCT 24", carrier: "VY" },
  { from: "BCN", to: "CDG", date: "OCT 24", carrier: "AF" },
  { from: "CDG", to: "AMS", date: "OCT 24", carrier: "KL" },
  { from: "AMS", to: "BER", date: "NOV 24", carrier: "LH" },
  { from: "BER", to: "PRG", date: "NOV 24", carrier: "OK" },
  { from: "PRG", to: "VIE", date: "NOV 24", carrier: "OS" },
  { from: "VIE", to: "FCO", date: "DEC 24", carrier: "AZ" },
  { from: "FCO", to: "ATH", date: "DEC 24", carrier: "A3" },
  { from: "ATH", to: "IST", date: "DEC 24", carrier: "TK" },
  { from: "IST", to: "DXB", date: "JAN 25", carrier: "EK" },
  { from: "DXB", to: "DEL", date: "JAN 25", carrier: "AI" },
  { from: "DEL", to: "BOM", date: "FEB 25", carrier: "6E" },
  { from: "BOM", to: "KTM", date: "MAY 25", carrier: "RA" },
];

/**
 * Rows in each of the board's two columns.
 *
 * This is what fixes the board's face, and the board shares a fixed slot with
 * every other interest — so it is a layout constant, not a display preference.
 */
export const ROWS_PER_COLUMN = 8;

/** Trips on one face of the board: two columns of rows. */
export const TRIPS_PER_PAGE = ROWS_PER_COLUMN * 2;

/** How long a face holds before the board flips to the next. */
export const PAGE_INTERVAL_MS = 8000;
