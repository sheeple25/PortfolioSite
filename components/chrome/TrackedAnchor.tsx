"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@vercel/analytics";

/**
 * A plain `<a>` that also fires a `@vercel/analytics` custom event on click.
 * Used for the footer's outbound social links and its CV download — the two
 * high-signal outbound interactions worth measuring here. Wrapping just these
 * anchors in a client component (rather than the whole footer) keeps `Footer`
 * itself a server component.
 */
export default function TrackedAnchor({
  eventName,
  eventProperties,
  onClick,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: string;
  eventProperties?: Record<string, string | number | boolean | null>;
}) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        track(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}
