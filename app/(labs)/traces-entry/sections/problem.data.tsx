"use client";

import Image from "next/image";
import styles from "@/components/case-study/case.module.css";

/**
 * The three failures, and the figure that belongs to each.
 *
 * Every number here is off the board PDF's own failure spread
 * (`source/traces-extract/a_failures.png`) — nine figures, three per failure,
 * with the third of each set the damning one the board sets in magenta. They
 * are not re-derived here; this is the same data the old board's
 * `ProblemSelector` carries, re-expressed against this page's tokens.
 *
 * The frame draws one charcoal slot labelled "custom bklit UI chart" for the
 * whole section. That slot is really three: the board has a different figure
 * per failure, and the selector below swaps them.
 */

/*
 * The section's chart colours — this page's palette rather than the chart
 * registry's own cold neutrals.
 *
 * Literals rather than `var(--tp)`, because these are handed to SVG `fill`
 * attributes on elements built from data rather than set through a stylesheet.
 * They are the resolved values of `--tp` and `--ink` in `entry.module.css`; the
 * tint is a 28% wash of the magenta on white, strong enough to read against the
 * panel, which is itself a 4% wash of the same colour. Anything styled by class
 * rather than by datum — the gridlines, the line itself, the tick labels —
 * still goes through the tokens.
 */
const CHART_PINK = "#ee15a5";
const CHART_INK = "#1e1e1e";
const CHART_TINT = "#fabde6";

/**
 * Read directly off the board's Tinder match/gender chart
 * (`public/traces-board/chart-functional.webp`) — these are the exact
 * percentages plotted there, so digitising them isn't fabricating data.
 *
 * The source plots green/blue/red; re-expressed here in the project's magenta
 * and ink so the chart belongs to the page rather than importing another
 * document's palette.
 */
const TINDER = [
  {
    name: "Male",
    labelsAbove: true,
    segments: [
      { value: 1, fill: CHART_PINK, label: "1%", labelAt: 1.5 },
      { value: 52, fill: CHART_INK, label: "52%", labelAt: 27 },
      { value: 47, fill: CHART_TINT, label: "47%", labelAt: 76.5 },
    ],
  },
  {
    name: "Female",
    labelsAbove: false,
    segments: [
      { value: 1.8, fill: CHART_PINK, label: "1.8%", labelAt: 2 },
      { value: 3.2, fill: CHART_INK, label: "3.2%", labelAt: 8.5 },
      { value: 95, fill: CHART_TINT, label: "95%", labelAt: 52.5 },
    ],
  },
];

/*
 * User units. The left column holds the row names; the axis fills the rest.
 *
 * `labelAt` above is where each segment's percentage is printed, in axis units.
 * Most sit at their segment's midpoint; the two slivers on the women's row
 * would collide there, so they are nudged apart exactly as the source does it.
 * Placing them by hand is fine here — this reproduces one known chart, it is
 * not a component that has to lay out arbitrary data.
 */
const BAR = { width: 700, axisLeft: 64, axisWidth: 620, rowHeight: 52 };
const ROW_Y = [56, 146];
const pctX = (p: number) => BAR.axisLeft + (p / 100) * BAR.axisWidth;

/**
 * The men-and-women-on-Tinder chart, drawn directly.
 *
 * This started on the shared `BarChart` with `orientation="horizontal"` and
 * `stacked` — the same configuration `components/traces/ProblemSelector.tsx`
 * uses on `/traces-board`. That combination miscomputes the width of the last
 * segment: the men's row rendered its "Pass" band at `x=287.5, width=-32.5`, so
 * 47% of the bar — the whole point of the comparison — silently did not draw,
 * while the women's row came out correct. It is a bug in the shared chart
 * rather than in the data, and `/traces-board` has it too.
 *
 * Six rectangles justify neither fixing a shared component in the middle of
 * this work nor shipping a chart that drops half a bar. Drawing it here also
 * gets the per-segment percentages the source prints and the registry doesn't.
 */
function TinderChart() {
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartTitle}>
        The experiences of men and women on Tinder
      </figcaption>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: CHART_PINK }} />
          Like &amp; match
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: CHART_INK }} />
          Like, but no match
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: CHART_TINT, border: "1px solid #f39fd7" }}
          />
          Pass
        </span>
      </div>
      <svg
        className={styles.sparkline}
        viewBox={`0 0 ${BAR.width} 216`}
        role="img"
        aria-label="Of the profiles men like on Tinder, 1% match and 52% do not; they pass on 47%. Of those women like, 1.8% match and 3.2% do not; they pass on 95%."
      >
        {TINDER.map((row, r) => {
          let cursor = 0;
          return (
            <g key={row.name}>
              <text
                className={styles.sparkTick}
                x={BAR.axisLeft - 12}
                y={ROW_Y[r] + BAR.rowHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {row.name}
              </text>
              {row.segments.map((seg) => {
                const x = pctX(cursor);
                const w = pctX(cursor + seg.value) - x;
                cursor += seg.value;
                return (
                  <rect
                    key={seg.label}
                    x={x}
                    y={ROW_Y[r]}
                    width={w}
                    height={BAR.rowHeight}
                    fill={seg.fill}
                  />
                );
              })}
              {row.segments.map((seg) => (
                <text
                  key={seg.label}
                  className={styles.sparkValue}
                  style={{ fill: seg.fill }}
                  x={pctX(seg.labelAt)}
                  y={
                    row.labelsAbove
                      ? ROW_Y[r] - 10
                      : ROW_Y[r] + BAR.rowHeight + 20
                  }
                  textAnchor="middle"
                >
                  {seg.label}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <p className={styles.chartCredit}>
        Women match with 36% of those they like; men with under 2% — source
        Duro.Data, Swipestats.io
      </p>
    </figure>
  );
}

/*
 * Digitised off the board's own sourced chart — the Economist's "Love lost"
 * (`public/traces-board/chart-structural.webp`, source Sensor Tower). Read from
 * the plotted line, so these are close approximations rather than the exact
 * underlying dataset. Annual to 2022, then quarterly, which is why four of the
 * eight points carry no year label.
 */
const LOVE_LOST = [
  { value: 130, label: "2019" },
  { value: 149, label: "’20" },
  { value: 152, label: "’21" },
  { value: 151, label: "’22" },
  { value: 148, label: "’23" },
  { value: 143, label: "" },
  { value: 138, label: "" },
  { value: 134, label: "’24" },
];

/* The source's axis, kept: it starts at 120, not at zero. */
const Y_MIN = 120;
const Y_MAX = 160;
const Y_TICKS = [120, 130, 140, 150, 160];

/* User units for the plot. The SVG scales to its container from these. */
const PLOT = { width: 700, height: 210, top: 14, right: 44, bottom: 26, left: 8 };

const plotW = PLOT.width - PLOT.left - PLOT.right;
const plotH = PLOT.height - PLOT.top - PLOT.bottom;
const xAt = (i: number) => PLOT.left + (i / (LOVE_LOST.length - 1)) * plotW;
const yAt = (v: number) =>
  PLOT.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * plotH;

/**
 * The monthly-active-users decline, drawn directly rather than through the
 * chart registry.
 *
 * `LineChart` forces a zero-based y-domain for all-positive data — see
 * `resolveTimeSeriesYDomain` in `components/charts/time-series-chart-shell.tsx`,
 * which returns `[0, max * 1.1]` and exposes no way to set a floor. This series
 * only moves between 130 and 152, so on a zero-based axis it is a flat line and
 * the shape the chart exists to show — the rise to 2021 and the fall after it —
 * disappears. Getting it back would mean adding a domain-floor prop to a shared
 * chart component for one figure on one page.
 *
 * Eight points and five gridlines do not need that machinery. Drawn here, the
 * truncated axis is *printed* (120 to 160, on the right, exactly as the source
 * has it), so the reader can see the scale doesn't start at zero rather than
 * having to infer it.
 */
function LoveLostChart() {
  const line = LOVE_LOST.map((d, i) => `${xAt(i)},${yAt(d.value)}`).join(" ");

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartTitle}>
        Love lost — selected dating apps, monthly active users, millions
      </figcaption>
      <svg
        className={styles.sparkline}
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        role="img"
        aria-label="Monthly active users across six dating apps rise from 130 million in 2019 to a peak of 152 million in 2021, then fall steadily to 134 million by 2024."
      >
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              className={styles.sparkGrid}
              x1={PLOT.left}
              x2={PLOT.left + plotW}
              y1={yAt(t)}
              y2={yAt(t)}
            />
            <text
              className={styles.sparkTick}
              x={PLOT.left + plotW + 8}
              y={yAt(t)}
              dominantBaseline="middle"
            >
              {t}
            </text>
          </g>
        ))}

        <polyline className={styles.sparkLine} points={line} />

        {LOVE_LOST.map((d, i) => (
          <circle
            key={i}
            className={styles.sparkDot}
            cx={xAt(i)}
            cy={yAt(d.value)}
            r={3}
          />
        ))}

        {LOVE_LOST.map((d, i) =>
          d.label ? (
            <text
              key={i}
              className={styles.sparkTick}
              x={xAt(i)}
              y={PLOT.height - 6}
              textAnchor="middle"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      <p className={styles.chartCredit}>
        Badoo, Bumble, Grindr, Hinge, Match and Tinder. Annual to 2022, then
        quarterly; axis starts at 120 — source Sensor Tower, approximated from
        the board’s chart
      </p>
    </figure>
  );
}

/**
 * The experiential failure has no chart.
 *
 * The board illustrates it with a Hinge prompt rather than a plot — "you like
 * imagining we met somewhere more romantic than an app, say a bookstore" — and
 * that is the sharper evidence for the claim: the product's own users writing
 * that they would rather not be there. Inventing a bar chart out of the three
 * figures already printed directly above it would say less, twice.
 */
function HingePromptFigure() {
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartTitle}>
        A Hinge prompt, answered
      </figcaption>
      <div className={styles.chartShot}>
        {/*
         * Re-cut from `public/traces-board/hinge-prompt.webp`, which is a crop
         * off the board page and carries the neighbouring statistics and a
         * slice of the headline below it. This one is the prompt card alone.
         */}
        <Image
          src="/traces-entry/hinge-prompt.webp"
          alt="A Hinge profile prompt reading: We’ll get along if you like imagining we met somewhere more romantic than an app, say a bookstore."
          width={574}
          height={695}
          className={styles.chartShotImage}
        />
      </div>
      <p className={styles.chartCredit}>
        The product’s own users, writing that they would rather have met
        anywhere else — source Hinge
      </p>
    </figure>
  );
}

export type StatSpec = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** The board sets one figure per group in magenta — the damning one. */
  accent?: boolean;
};

export type Failure = {
  num: string;
  claim: string;
  /** The one word the frame italicises, when there is one. */
  emphasis?: string;
  kind: string;
  /** The condition at the foot of the section this failure produces. */
  condition: string;
  stats: StatSpec[];
  figure: React.ReactNode;
};

/**
 * Order follows the frame, not the board.
 *
 * The board's spread runs functional, experiential, structural; the frame's
 * three cards run "they don't work", "they don't even want to work", "people
 * don't like using them" — functional, structural, experiential. The frame is
 * the spec, so the pairing of failure to condition follows its order too.
 */
export const FAILURES: Failure[] = [
  {
    num: "01",
    claim: "they don’t work",
    kind: "Functional Failure",
    condition: "high pressure",
    stats: [
      { value: 80, suffix: "%", label: "of dating app users are men" },
      {
        value: 1.96,
        decimals: 2,
        suffix: "%",
        label: "match rate for dating apps",
      },
      {
        value: 66,
        suffix: "%",
        label: "said dating app talking didn’t go anywhere",
        accent: true,
      },
    ],
    figure: <TinderChart />,
  },
  {
    num: "02",
    claim: "they don’t even want to work",
    emphasis: "want",
    kind: "Structural Failure",
    condition: "low trust",
    stats: [
      {
        value: 62,
        suffix: "%",
        label: "of dating app revenue was subscriptions",
      },
      {
        value: 1,
        prefix: "$",
        suffix: "B",
        label: "revenue at Tinder from active users in 2024",
      },
      {
        value: 75,
        suffix: "%",
        label: "say dating apps aren’t for “real” relationships",
        accent: true,
      },
    ],
    figure: <LoveLostChart />,
  },
  {
    num: "03",
    claim: "people don’t like using them",
    kind: "Experiential Failure",
    condition: "detached from real life",
    stats: [
      { value: 78, suffix: "%", label: "of users report burnout" },
      {
        value: 46,
        suffix: "%",
        label: "report medium-to-high dissatisfaction",
      },
      {
        value: 50,
        suffix: "%",
        label: "find dating apps embarrassing",
        accent: true,
      },
    ],
    figure: <HingePromptFigure />,
  },
];
