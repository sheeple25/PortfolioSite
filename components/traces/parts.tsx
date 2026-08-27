import Image from "next/image";
import styles from "./board.module.css";

/**
 * The pieces more than one section of the board uses.
 *
 * `TracesBoard.tsx` was a single 861-line component holding all thirteen
 * sections inline, with its data arrays declared below the component that read
 * them. Changing one beat meant loading the whole file. The sections now live
 * one-per-file in `./sections`, and this holds what they share.
 */

/** Where the board's extracted crops live under `public/`. */
export const IMG = "/traces-board";

/** Props spread onto a `<section>` so the reader can track it. */
export type AnchorProps = {
  id: string;
  ref?: (el: HTMLElement | null) => void;
};

/** The same, for a `SectionRule`, which takes its ref under another name. */
export type RuleAnchorProps = {
  id: string;
  anchorRef?: (el: HTMLElement | null) => void;
};

export type Anchor = (id: string) => AnchorProps;
export type RuleAnchor = (id: string) => RuleAnchorProps;

/** The board's full-bleed section dividers — a rule with a single word on it. */
export function SectionRule({
  label,
  id,
  anchorRef,
}: {
  label: string;
  id?: string;
  anchorRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <div className={styles.rule} id={id} ref={anchorRef}>
      <span className={styles.ruleLabel}>{label}</span>
    </div>
  );
}

/** Kicker + full-width plate + the paragraph that says what the plate showed. */
export function Plate({
  kicker,
  src,
  alt,
  w,
  h,
  note,
}: {
  kicker: string;
  src: string;
  alt: string;
  w: number;
  h: number;
  note: string;
}) {
  return (
    <div className={styles.stack}>
      <p className={styles.kicker}>{kicker}</p>
      <Image
        src={`${IMG}/${src}.webp`}
        alt={alt}
        width={w}
        height={h}
        className={styles.imgWide}
      />
      <p className={styles.note}>{note}</p>
    </div>
  );
}
