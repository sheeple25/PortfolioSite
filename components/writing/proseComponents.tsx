import Link from "next/link";
import type { ComponentProps } from "react";
import type { Components, ExtraProps } from "hast-util-to-jsx-runtime";
import Figure from "./Figure";
import { MarginNote, NoteRef } from "@/components/pixel";

/**
 * Element overrides for rendered markdown.
 *
 * Deliberately short. Plain typography — paragraphs, lists, emphasis, rules —
 * is styled by descendant selectors in `prose.module.css`, which keeps sibling
 * spacing (`p + p`, `h3 + p`) expressible; that's the kind of rule you can't
 * write when every element is its own component. Only the two cases that need
 * real behaviour rather than styling live here.
 */

/**
 * Markdown links, routed the way each kind of destination wants to be.
 *
 * Props are named rather than spread: a markdown link carries exactly `href`
 * and an optional `title`, and hast additionally passes its own `node`, which
 * is not a DOM attribute and would warn if it reached the element.
 */
function Anchor({ href = "", title, children }: ComponentProps<"a"> & ExtraProps) {
  // In-page anchors must stay plain `<a>`: the sidebar's jump handler and the
  // browser's own fragment scrolling both expect a real hash navigation.
  if (href.startsWith("#")) {
    return (
      <a href={href} title={title}>
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/*
 * The `x-` tags are synthetic elements that `lib/writing/parse.ts` swaps in for
 * its block directives and note triggers — hast passes an unknown tag name
 * straight through, so a component registered under that key picks it up with
 * no rehype plugin involved. The cast is needed because the upstream
 * `Components` type is keyed by real HTML tag names only.
 */
export const proseComponents = {
  a: Anchor,
  "x-figure": Figure,
  "x-margin-note": MarginNote,
  "x-note-ref": NoteRef,
} as unknown as Partial<Components>;
