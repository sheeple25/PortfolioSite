import type { ReactNode } from "react";
import styles from "./Rebus.module.css";

/*
 * A standfirst written as a rebus — logos and emoji standing in for words
 * rather than illustrating them.
 *
 * Set larger than an ordinary standfirst because it has to be: a logo sitting
 * in a line of type needs the line tall enough for the mark to carry the same
 * optical weight as the words around it. Shrink the type and the marks turn
 * into specks, which is why the size lives here rather than being left to the
 * caller.
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
