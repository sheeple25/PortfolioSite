"use client";

import Link from "next/link";
import { Fragment } from "react";
import { applyScriptedBits } from "./scriptedBits";
import styles from "./PixelSidebar.module.css";

/*
 * Renders one of Pixel's replies, turning the paths it mentions into links.
 *
 * Pointing a visitor at the right page is most of PixelBot's job, and it needs
 * no tool-calling to do it: Pixel writes the path in an ordinary sentence and
 * this turns it into something clickable. Before, the reply was rendered as a
 * raw string, so "have a look at /projects/traces" was a dead end — the visitor
 * had to retype it.
 *
 * Deliberately not a markdown renderer. The model is told to write plain prose
 * for a narrow panel; a full parser would invite it to format, which is the
 * wrong voice for a chat sidebar.
 */

/**
 * Internal paths (the site's real sections only), absolute URLs, and emails.
 * "contact" isn't in the path alternation — it's not a page (see
 * `lib/site.ts`'s `NAV_LINKS`), so the system prompt has Pixel mention the
 * email address instead, which this already linkifies as a `mailto:`.
 *
 * Trailing punctuation is left out of the match so "see /about." links the
 * path and keeps the full stop as text.
 */
const LINKABLE =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?"'])|(\/(?:projects|writing|archive|about)(?:\/[a-zA-Z0-9-_]+)*)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export default function MessageText({ text: raw }: { text: string }) {
  const text = applyScriptedBits(raw);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(LINKABLE)) {
    const [value] = match;
    const start = match.index ?? 0;

    if (start > cursor) nodes.push(text.slice(cursor, start));
    cursor = start + value.length;

    if (match[1]) {
      nodes.push(
        <a
          key={key++}
          className={styles.messageLink}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>,
      );
    } else if (match[2]) {
      nodes.push(
        <Link key={key++} className={styles.messageLink} href={value}>
          {value}
        </Link>,
      );
    } else {
      nodes.push(
        <a key={key++} className={styles.messageLink} href={`mailto:${value}`}>
          {value}
        </a>,
      );
    }
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
