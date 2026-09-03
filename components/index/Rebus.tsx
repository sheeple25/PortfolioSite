import type { ReactNode } from "react";
import styles from "./Rebus.module.css";

/*
 * A standfirst written as a rebus — logos and emoji standing in for words
 * rather than illustrating them.
 *
 * A logo sitting in a line of type needs the line tall enough for the mark to
 * carry the same optical weight as the words around it. That requirement used
 * to be met by setting the rebus larger than the standfirst around it; it is
 * now met by every standfirst being that size — see `.intro` in
 * `components/chrome/IndexShell.module.css`. All this keeps of its own is the
 * extra leading and word-spacing the marks need.
 */

/**
 * A mark standing in for a word.
 *
 * `alt` is real text rather than empty, because the mark *is* a word here —
 * dropping it would leave a sentence with holes in it for anyone reading with
 * a screen reader. The rebus has to parse as a sentence both ways.
 */
export function RebusLogo({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- static local SVG; the optimiser has nothing to do here and would only add a request
  return <img className={styles.logo} src={src} alt={alt} />;
}

/** An emoji, sized and spaced to sit on the line the way the logos do. */
export function RebusEmoji({
  children,
  label,
}: {
  children: string;
  label: string;
}) {
  return (
    <span className={styles.emoji} role="img" aria-label={label}>
      {children}
    </span>
  );
}

export default function Rebus({ children }: { children: ReactNode }) {
  return <span className={styles.rebus}>{children}</span>;
}
