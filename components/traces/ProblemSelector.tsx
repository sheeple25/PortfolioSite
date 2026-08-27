"use client";

import { useState } from "react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Line } from "@/components/charts/line";
import { LineChart } from "@/components/charts/line-chart";
import { ChartTooltip } from "@/components/charts/tooltip";
import Stat from "./Stat";
import styles from "./board.module.css";

/** The site's own three colors, not an imported chart palette. */
const CHART_PINK = "var(--pink)";
const CHART_INK = "var(--ink)";
const CHART_TINT = "var(--tint-bg)";

type StatSpec = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  accent?: boolean;
};

type Reason = {
  number: string;
  kicker: string;
  title: React.ReactNode;
  stats: StatSpec[];
  chart: React.ReactNode;
};

/**
 * Read directly off the board's own Tinder match/gender chart — these are
 * the exact percentages plotted there, so digitizing them isn't fabricating
 * data.
 */
const TINDER_DATA = [
  { name: "Male", match: 1, likeNoMatch: 52, pass: 47 },
  { name: "Female", match: 1.8, likeNoMatch: 3.2, pass: 95 },
];

function TinderChart() {
  return (
    <div className={styles.reasonChart}>
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
            style={{ background: CHART_TINT, border: "1px solid var(--rule)" }}
          />
          Pass
        </span>
      </div>
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
        <ChartTooltip />
      </BarChart>
      <p className={styles.chartCredit}>
        The experiences of men and women on Tinder — source Duro.Data,
        Swipestats.io
      </p>
    </div>
  );
}

/*
 * Digitized off the board's own sourced chart (Sensor Tower, via "Love
 * Lost") rather than invented — read from the plotted line, so treat these
 * as close approximations, not the exact underlying dataset. Dates are
 * synthetic and evenly spaced one per month; the chart's built-in `XAxis`
 * only ever prints "month day" (no year), which is wrong for a five-year
 * span, so real calendar dates aren't used and `STRUCTURAL_LABELS` below
 * drives the labels actually shown instead.
 */
const STRUCTURAL_DATA = [
  { date: new Date(2019, 0, 1), value: 130 },
  { date: new Date(2019, 1, 1), value: 149 },
  { date: new Date(2019, 2, 1), value: 152 },
  { date: new Date(2019, 3, 1), value: 151 },
  { date: new Date(2019, 4, 1), value: 144 },
  { date: new Date(2019, 5, 1), value: 141 },
  { date: new Date(2019, 6, 1), value: 135 },
  { date: new Date(2019, 7, 1), value: 134 },
];

const STRUCTURAL_LABELS = [
  "2019",
  "2020",
  "2021",
  "2022",
  "’23 Q1",
  "’23 Q2",
  "’23 Q3",
  "’24",
];

function StructuralChart() {
  return (
    <div className={styles.reasonChart}>
      <LineChart
        data={STRUCTURAL_DATA}
        xDataKey="date"
        aspectRatio="2.8 / 1"
        margin={{ top: 12, right: 16, bottom: 8, left: 40 }}
      >
        <Line dataKey="value" stroke={CHART_PINK} strokeWidth={2.5} />
        <ChartTooltip showDatePill={false} />
      </LineChart>
      <div className={styles.chartAxisRow}>
        {STRUCTURAL_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <p className={styles.chartCredit}>
        Selected dating apps (Badoo, Bumble, Grindr, Hinge, Match, Tinder),
        monthly active users, millions — source Sensor Tower, approximated
        from the board&rsquo;s chart
      </p>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className={styles.reasonChart}>
      <div className={styles.chartPlaceholder}>TK</div>
    </div>
  );
}

const REASONS: Reason[] = [
  {
    number: "01",
    kicker: "Functional Failure",
    title: "they don’t work",
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
        label: "said dating app conversations went nowhere",
        accent: true,
      },
    ],
    chart: <TinderChart />,
  },
  {
    number: "02",
    kicker: "Structural Failure",
    title: (
      <>
        they don’t even <em>want</em> to work
      </>
    ),
    stats: [
      { value: 62, suffix: "%", label: "of dating app revenue was subscriptions" },
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
    chart: <StructuralChart />,
  },
  {
    number: "03",
    kicker: "Experiential Failure",
    title: "people don’t like using them",
    stats: [
      { value: 78, suffix: "%", label: "users report burnout" },
      { value: 46, suffix: "%", label: "report medium-to-high dissatisfaction" },
      {
        value: 50,
        suffix: "%",
        label: "find dating apps embarrassing",
        accent: true,
      },
    ],
    chart: <ChartPlaceholder />,
  },
];

/**
 * Click a reason, its stats and chart swap in below. Replaces what used to be
 * three stacked full-width sections (one per failure, each with its own
 * chart) with one block that shows one failure at a time — the content is
 * the same, the scroll cost isn't.
 */
export default function ProblemSelector() {
  const [active, setActive] = useState(0);
  const reason = REASONS[active];

  return (
    <div className={styles.reasonBlock}>
      <div className={styles.reasonTabs}>
        {REASONS.map((r, i) => (
          <button
            key={r.number}
            type="button"
            onClick={() => setActive(i)}
            className={styles.reasonTab}
            aria-pressed={i === active}
          >
            <p className={styles.reasonNumber}>
              <span className={styles.hash}>{r.number}</span>
              {r.kicker}
            </p>
            <h3 className={styles.reasonTitle}>{r.title}</h3>
          </button>
        ))}
      </div>

      <div className={styles.statRow}>
        {reason.stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      {reason.chart}
    </div>
  );
}
