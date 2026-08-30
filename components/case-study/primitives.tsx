"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight, Download } from "lucide-react";
import { useInView } from "motion/react";
import { Fragment, useCallback, useRef, useState } from "react";
import styles from "./case.module.css";

/**
 * The vocabulary every case study page is built from.
 *
 * These were originally written inline in the Traces lab. They live here now
 * because Traces, Loco Lavatory and Unflattening are the same page with
 * different content — the Figma frames for all three carry an identical
 * chassis, and the only real differences are the accent colour, the banner's
 * texture, and which of these pieces each beat uses.
 *
 * The rule that keeps that true: **nothing in this directory knows about a
 * specific project.** Everything here takes its content as props. A project
 * supplies data and, where it genuinely needs one, its own bespoke figure.
 */

/** Where the shared case-study assets live under `public/`. */
export const CASE_ASSETS = "/case-study";

/* -------------------------------------------------------------- disclosure -- */

/**
 * The plus mark, exported from the Figma frame rather than drawn here.
 *
 * The frames use one glyph for both states; open is the same mark given a
 * quarter turn, which lands it on a minus. That rotation is in CSS
 * (`.disclosureIconOpen`) so the transition between the two is animatable.
 */
function PlusMark({ open }: { open: boolean }) {
  return (
    /* A fixed-size local SVG. `next/image` would need `dangerouslyAllowSVG`
       turned on site-wide to render it, for no benefit at 24px. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CASE_ASSETS}/plus.svg`}
      alt=""
      width={24}
      height={24}
      aria-hidden="true"
      className={`${styles.disclosureIcon} ${
        open ? styles.disclosureIconOpen : ""
      }`}
    />
  );
}

export type DisclosureProps = {
  /** The section title, set in the frame's accent serif. */
  title: string;
  /**
   * `heading` is the frames' 40px section head; `sub` is the smaller 24px one
   * used for a nested question like "How does it work?".
   */
  tone?: "heading" | "sub";
  /** Anchor id, so the contents rail can scroll to it and track it. */
  id?: string;
  /** Handed down from `ReaderContext` so the rail can measure this beat. */
  anchorRef?: (el: HTMLElement | null) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/**
 * A titled section with the frames' COLLAPSE/EXPAND control on its right.
 *
 * The verb follows the state rather than being fixed: the control names the
 * action it will perform, so an open section offers COLLAPSE (which is what the
 * frames draw, since every section in them is open) and a closed one offers
 * EXPAND.
 *
 * The panel is collapsed with a `grid-template-rows` transition rather than
 * unmounted or snapped to `display: none` — see `.disclosurePanelWrap` in
 * `case.module.css`. Its content is static either way, and leaving it in the
 * DOM keeps in-page search and the reader's own measurement of the section
 * working while it's shut. `inert` while closed keeps it from taking focus or
 * being read by a screen reader mid-collapse.
 */
export function Disclosure({
  title,
  tone = "heading",
  id,
  anchorRef,
  defaultOpen = true,
  children,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = id ? `${id}-panel` : undefined;

  return (
    <section className={styles.beat} id={id} ref={anchorRef}>
      <div className={styles.disclosureBar}>
        <h2
          className={tone === "heading" ? styles.sectionHeading : styles.proseSmall}
        >
          {title}
        </h2>
        <button
          type="button"
          className={styles.disclosureToggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Collapse" : "Expand"}
          <PlusMark open={open} />
        </button>
      </div>
      <div
        id={panelId}
        className={`${styles.disclosurePanelWrap} ${
          open ? "" : styles.disclosurePanelWrapClosed
        }`}
        aria-hidden={!open}
      >
        <div className={styles.disclosurePanel} inert={!open}>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * A beat with a plain heading and no fold — for sections the frames draw
 * without a COLLAPSE control.
 */
export function Beat({
  title,
  id,
  anchorRef,
  children,
}: {
  title?: string;
  id?: string;
  anchorRef?: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.beat} id={id} ref={anchorRef}>
      {title ? <h2 className={styles.sectionHeading}>{title}</h2> : null}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ chain -- */

export type ChainStep = {
  label: string;
  text: string;
  /**
   * Renders the label at zero opacity. The frames use this to hold a middle
   * column on the same baseline as its neighbours without printing a second
   * "OBSERVATION" — deleting it instead drops that column by a label's height.
   */
  spacer?: boolean;
};

/**
 * The frames' exported arrow, sitting in the gaps between steps.
 *
 * A masked empty element rather than an `<img>`. The asset is exported from
 * Figma in Traces' magenta, so rendering it directly carries that magenta onto
 * every project — invisible while Traces was the only page, wrong the moment a
 * differently-coloured one existed. `.chainArrow` masks the shape and fills it
 * with `--tp`; an `<img>` cannot be recoloured that way, because its own bitmap
 * paints over the mask.
 */
function ChainArrow() {
  return <span className={styles.chainArrow} aria-hidden="true" />;
}

/**
 * Observation → observation → claim, joined by arrows.
 *
 * Every one of the three frames opens with this, and each uses a different
 * number of steps, so the arrows are woven in at render time rather than being
 * part of a step.
 */
export function Chain({ steps }: { steps: readonly ChainStep[] }) {
  return (
    <div className={styles.chain}>
      {steps.map((step, i) => (
        <Fragment key={step.label + i}>
          {i > 0 ? <ChainArrow /> : null}
          <div className={styles.chainStep}>
            <p
              className={styles.label}
              aria-hidden={step.spacer || undefined}
              style={step.spacer ? { opacity: 0 } : undefined}
            >
              {step.label}
            </p>
            <p className={styles.chainStepText}>{step.text}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- card rows -- */

export type Card = {
  /** Mono index, top-left of the card. */
  num?: string;
  /** Mono name, pushed to the card's right edge. */
  name?: string;
  /** The card's headline. */
  title: string;
  /**
   * How the headline is set.
   *
   *  - `serif` (default) — the reading face, 24px. A statement in the page's
   *    own voice.
   *  - `sans` — the display face, 24px, sentence case. A named concept.
   *  - `sans-caps` — the display face, 32px, upper-cased. A refusal, a slogan.
   */
  face?: "serif" | "sans" | "sans-caps";
  /** @deprecated Use `face: "sans-caps"`. Kept so existing callers still work. */
  display?: boolean;
  /** Small serif note under the headline. */
  note?: string;
};

function headlineClass(card: Card): string {
  const face = card.face ?? (card.display ? "sans-caps" : "serif");
  if (face === "sans-caps") return styles.fixClaim;
  if (face === "sans") return styles.fixClaimPlain;
  return styles.outcomeHeadline;
}

/**
 * A row of three cards — the shape the frames use for archetypes, principles,
 * theoretical positions and outcomes alike.
 *
 * `tinted` gives each card the accent wash and padding the frames use for a
 * statement (the three refusals, the three positions). Plain cards sit directly
 * on the page.
 */
export function CardRow({
  cards,
  tinted = false,
}: {
  cards: readonly Card[];
  tinted?: boolean;
}) {
  return (
    <div className={tinted ? styles.fixRow : styles.outcomeRow}>
      {cards.map((card, i) => (
        <div
          key={card.num ?? card.title ?? i}
          className={tinted ? styles.fixCard : styles.outcomeCard}
        >
          {card.num || card.name ? (
            <span className={tinted ? styles.fixHead : styles.outcomeHead}>
              <span>{card.num}</span>
              <span>{card.name}</span>
            </span>
          ) : null}
          <p className={headlineClass(card)}>{card.title}</p>
          {card.note ? <p className={styles.cardNote}>{card.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- step list -- */

export type Step = { num: string; text: string };

/**
 * A vertical numbered list with an arrow between the entries — Unflattening's
 * "Goal" beat. Reads as a sequence rather than a set, which is the difference
 * between it and `CardRow`.
 */
export function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <div className={styles.stepList}>
      {steps.map((step, i) => (
        <Fragment key={step.num}>
          {/* The chain arrow, turned a quarter — one asset, masked, rather than two. */}
          {i > 0 ? (
            <span className={styles.stepArrow} aria-hidden="true" />
          ) : null}
          <div className={styles.step}>
            <span className={styles.stepNum}>{step.num}</span>
            <p className={styles.stepText}>{step.text}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ stats -- */

export type StatProps = {
  value: number;
  /** Rendered flush against the digits — "%", "$", "B". */
  suffix?: string;
  prefix?: string;
  /** Digits after the decimal point. 1.96% needs two; most need none. */
  decimals?: number;
  label: string;
  /** The boards set one figure per group in the accent — the damning one. */
  accent?: boolean;
};

/**
 * A single figure, counting up when it scrolls into view.
 *
 * The frames set these as static type. On the page the count-up is what makes a
 * figure land, so the number holds at zero until it is actually on screen
 * rather than animating past unseen, and `once` keeps it from replaying every
 * time the reader scrolls back.
 *
 * The value is derived, not stored: `useInView` already flips exactly once, so
 * the figure can simply *be* zero until then and NumberFlow animates the change
 * itself. A duplicate copy in state, synced from an effect, would buy nothing
 * and cost a cascading render.
 */
export function Stat({
  value,
  suffix,
  prefix,
  decimals = 0,
  label,
  accent,
}: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  return (
    <div className={styles.stat} ref={ref}>
      <div
        className={`${styles.statFigure} ${accent ? styles.statFigureAccent : ""}`}
      >
        {prefix ? <span className={styles.statAffix}>{prefix}</span> : null}
        <NumberFlow
          value={inView ? value : 0}
          format={{
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }}
          /*
           * These sections cut between states rather than crossfading, so the
           * figures should land instead of drifting — a short curve with no
           * bounce reads closest to type snapping into place.
           */
          transformTiming={{ duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" }}
          spinTiming={{ duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" }}
          opacityTiming={{ duration: 300, easing: "ease-out" }}
        />
        {suffix ? <span className={styles.statAffix}>{suffix}</span> : null}
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}

/** A row of figures. */
export function StatRow({ stats }: { stats: readonly StatProps[] }) {
  return (
    <div className={styles.stats}>
      {stats.map((s, i) => (
        <Stat key={i} {...s} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- focus rows -- */

/**
 * The stepped rows.
 *
 * The frames draw these with the first card at full strength and the rest
 * dimmed. Read as a static comp that looks like a mistake; read as a spec it
 * says these are taken one at a time, and the dim is where the reader isn't.
 *
 * So the row keeps an active index, starting at 0 exactly as drawn, and pointer
 * or keyboard focus moves it.
 */
export function useFocusRow() {
  const [active, setActive] = useState(0);

  const cardProps = useCallback(
    (index: number, dim: "48" | "36" = "48", extra = "") => ({
      type: "button" as const,
      className: [
        styles.focusCard,
        dim === "36" ? styles.focusCardDim : "",
        index === active ? styles.focusCardActive : "",
        extra,
      ]
        .filter(Boolean)
        .join(" "),
      onMouseEnter: () => setActive(index),
      onFocus: () => setActive(index),
      "aria-current": index === active,
    }),
    [active],
  );

  return cardProps;
}

/* ------------------------------------------------------------ placeholders -- */

/**
 * A charcoal block with its own name in it.
 *
 * Every frame contains several — figures that aren't designed yet. Building
 * them as a labelled slot rather than dropping them keeps the hole the same
 * size and shape it is in the design, instead of letting the page quietly close
 * over it.
 */
export function Slot({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div className={`${styles.slot} ${tall ? styles.slotTall : ""}`}>
      <p className={styles.slotLabel}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------- action row -- */

/**
 * A single line with a control on its right — the frames' "See the full
 * document / DOWNLOAD PDF" row.
 *
 * Distinct from a closed `Disclosure`, which looks similar but folds something
 * open in place. This one leaves the page.
 */
export function ActionRow({
  label,
  action,
  href,
  icon = "download",
}: {
  label: string;
  action: string;
  href: string;
  icon?: "download" | "arrow";
}) {
  const external = href.startsWith("http");
  const Icon = icon === "download" ? Download : ArrowRight;

  return (
    <div className={styles.teaser}>
      <p className={styles.teaserLabel}>{label}</p>
      <a
        className={styles.disclosureToggle}
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : icon === "download"
            ? { download: "" }
            : {})}
      >
        {action}
        <Icon size={24} aria-hidden="true" className={styles.disclosureIcon} />
      </a>
    </div>
  );
}
