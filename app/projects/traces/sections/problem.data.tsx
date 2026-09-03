"use client";

import Image from "next/image";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { Line } from "@/components/charts/line";
import { LineChart } from "@/components/charts/line-chart";
import { ChartTooltip } from "@/components/charts/tooltip";
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
 * Handed to SVG `fill` attributes on elements built from data rather than set
 * through a stylesheet, but that doesn't rule out the CSS custom properties:
 * a presentation attribute like `fill` parses its value as CSS, `var()`
 * included. `CHART_PINK` is `--tp` itself — the project's identity colour, a
 * constant across both themes, same as `--fig-accent` on every other figure —
 * so it stays a literal. `CHART_INK` is `var(--ink)` rather than its light-mode
 * value baked in, because the chart's own panel (`.chart`, below) is
 * `--page-bg`-based and flips dark in dark mode; a hardcoded `#1e1e1e` segment
 * would all but vanish against a `#171310` panel. `CHART_TINT` is a 28% wash of
 * the magenta on white — kept literal since a light wash reads fine against
 * either panel colour. Anything styled by class rather than by datum — the
 * gridlines, the line itself, the tick labels — already goes through the
 * tokens.
 */
const CHART_PINK = "#ee15a5";
const CHART_INK = "var(--ink)";
const CHART_TINT = "#fabde6";

/**
 * Read directly off the board's own Tinder match/gender chart — these are the
 * exact percentages plotted there, so digitising them isn't fabricating data.
 * The board scan itself lived at `public/traces-board/chart-functional.webp`
 * and was removed with the labs; the spread it was cut from survives at
 * `source/traces-extract/a_failures.png`, and the scan is in git history.
 *
 * The source plots green/blue/red; re-expressed here in the project's magenta
 * and ink so the chart belongs to the page rather than importing another
 * document's palette.
 */
const TINDER_DATA = [
  { name: "Male", match: 1, likeNoMatch: 52, pass: 47 },
  { name: "Female", match: 1.8, likeNoMatch: 3.2, pass: 95 },
];

/**
 * The men-and-women-on-Tinder chart, on the shared chart registry at last.
 *
 * This was hand-rolled SVG for a while: Bklit's `BarChart` with
 * `orientation="horizontal"` + `stacked` miscomputed the final segment's width
 * (`scale(value) - scale(offset)` instead of the scaled span, so the men's
 * "Pass" band came out at negative width and silently didn't draw). That is
 * fixed at the source now — see the note in `components/charts/bar.tsx` — so
 * the figure is back on the registry, which is what the Figma frame's
 * "custom bklit UI chart" slot asked for all along.
 *
 * The per-segment percentages the hand SVG printed on the bands now live in
 * the tooltip's rows; the sentence the whole figure exists to say is carried
 * for screen readers by the `role="img"` label, and the two headline rates are
 * already printed in the stats row above the figure.
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
      <div
        role="img"
        aria-label="Of the profiles men like on Tinder, 1% match and 52% do not; they pass on 47%. Of those women like, 1.8% match and 3.2% do not; they pass on 95%."
      >
        <BarChart
          data={TINDER_DATA}
          xDataKey="name"
          orientation="horizontal"
          stacked
          aspectRatio="2.8 / 1"
          barGap={0.45}
          margin={{ top: 8, right: 16, bottom: 8, left: 64 }}
        >
          <BarYAxis />
          <Bar dataKey="match" fill={CHART_PINK} />
          <Bar dataKey="likeNoMatch" fill={CHART_INK} />
          <Bar dataKey="pass" fill={CHART_TINT} />
          <ChartTooltip
            rows={(point) => [
              {
                color: CHART_PINK,
                label: "Like & match",
                value: `${String(point.match)}%`,
              },
              {
                color: CHART_INK,
                label: "Like, no match",
                value: `${String(point.likeNoMatch)}%`,
              },
              {
                color: CHART_TINT,
                label: "Pass",
                value: `${String(point.pass)}%`,
              },
            ]}
          />
        </BarChart>
      </div>
      <p className={styles.chartCredit}>
        Women match with 36% of those they like; men with under 2% — source
        Duro.Data, Swipestats.io
      </p>
    </figure>
  );
}

/*
 * Digitised off the board's own sourced chart — the Economist's "Love lost"
 * (source Sensor Tower). Read from the plotted line, so these are close
 * approximations rather than the exact underlying dataset. The board scan lived
 * at `public/traces-board/chart-structural.webp` before the labs were removed;
 * it is recoverable from git history.
 *
 * The dates are synthetic and evenly spaced one per month, matching the
 * board's own uniform point spacing: the registry's `XAxis` only ever prints
 * "month day" labels — wrong for a five-year annual-then-quarterly span — so
 * real calendar dates would buy nothing, and `LOVE_LOST_LABELS` drives the
 * labels actually shown, in a plain row under the plot. Annual to 2022, then
 * quarterly, which is why half the points carry no year label.
 */
const LOVE_LOST_DATA = [
  { date: new Date(2019, 0, 1), mau: 130 },
  { date: new Date(2019, 1, 1), mau: 149 },
  { date: new Date(2019, 2, 1), mau: 152 },
  { date: new Date(2019, 3, 1), mau: 151 },
  { date: new Date(2019, 4, 1), mau: 148 },
  { date: new Date(2019, 5, 1), mau: 143 },
  { date: new Date(2019, 6, 1), mau: 138 },
  { date: new Date(2019, 7, 1), mau: 134 },
];

const LOVE_LOST_LABELS = [
  "2019",
  "’20",
  "’21",
  "’22",
  "’23",
  "",
  "",
  "’24",
];

/**
 * The monthly-active-users decline, on the registry.
 *
 * The blocker was `LineChart` forcing a zero-based y-domain for all-positive
 * data, which flattened this 130–152 series into a straight line. The registry
 * now takes `yScaleDomainMin` (added for exactly this figure), so the source's
 * own truncated axis — it starts at 120, not zero — is expressed as a prop,
 * and the credit line still *says* so rather than leaving the reader to infer
 * it from unlabelled gridlines.
 */
function LoveLostChart() {
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartTitle}>
        Love lost — selected dating apps, monthly active users, millions
      </figcaption>
      <div
        role="img"
        aria-label="Monthly active users across six dating apps rise from 130 million in 2019 to a peak of 152 million in 2021, then fall steadily to 134 million by 2024."
      >
        <LineChart
          data={LOVE_LOST_DATA}
          xDataKey="date"
          aspectRatio="2.8 / 1"
          yScaleDomainMin={120}
          margin={{ top: 12, right: 16, bottom: 8, left: 8 }}
          style={{ touchAction: "pan-y" }}
        >
          <Grid
            horizontal
            stroke="color-mix(in srgb, var(--tp) 22%, transparent)"
            strokeDasharray="0"
            fadeHorizontal={false}
          />
          <Line dataKey="mau" stroke={CHART_PINK} strokeWidth={2.5} />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => [
              {
                color: CHART_PINK,
                label: "Users",
                value: `${String(point.mau)}M`,
              },
            ]}
          />
        </LineChart>
        <div className={styles.chartAxisRow} aria-hidden="true">
          {LOVE_LOST_LABELS.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      </div>
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
         * Re-cut from the board's own `hinge-prompt.webp`, which was a crop off
         * the board page and carried the neighbouring statistics and a slice of
         * the headline below it. This one is the prompt card alone. The
         * original lived in `public/traces-board/` and is in git history.
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
