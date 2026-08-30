# PixelBot — do not modify as a side effect of other work

This directory, plus `lib/pixel/` and `app/api/pixel/`, is **one feature with
one owner**. It is worked on deliberately, on its own, and never as collateral
of a task about something else.

## The rule

> **Do not edit anything in this module unless the task you were given is
> explicitly about PixelBot.**

That includes edits that look harmless: renaming a class, "tidying" a component,
adding a prop, adjusting a style to make some other page line up, wiring a new
feature's hook into `PixelContext`. If the request you are working on is about
the footer, a case study, the graph, the nav, or anything else — this module is
out of scope, even if changing it would be the quickest way to finish.

## What to do instead

If other work genuinely needs something from PixelBot:

1. **Write the request down** in the `## Requests` section of
   `docs/PIXELBOT_BUILD.md`. Say what you needed, why, and what you did instead.
2. **Add a line to `docs/TODO.md`** under the PixelBot item so it surfaces in
   the normal review pass.
3. **Carry on with your actual task**, working around the gap.

A request in a doc is always the right outcome. A quick edit here is not.

## Talking to PixelBot from outside

Everything outside this module imports from `@/components/pixel` — the barrel in
`index.ts`. Server components that need the filesystem-backed pieces (currently
`ProcessNote` and the DecisionLog readers) import from `@/components/pixel/server`
instead. Those two are the only entry points; anything deeper
(`@/components/pixel/chat/…`) is a lint error, by design — that is how a module
quietly grows a third, undocumented public surface.

The client/server split is a Next.js constraint, not a second module: anything
reachable from `index.ts` gets pulled into the browser bundle, and `ProcessNote`
reads `node:fs`. Exporting it from the client barrel failed the build outright.

If you need behaviour the barrel does not expose, that is a request (above), not
a new export.

**Do not reach into Pixel's DOM.** Pixel's position, visibility and expression
are his own. Asking for them from outside is what the context is for —
`usePixel()` gives you `setHidden`, `setMood` and `react`. Querying for Pixel's
elements by class name and transforming them directly (as
`useImmersiveChrome` did) breaks the moment anything inside here is renamed.

## Why this exists

PixelBot spans a mascot, an annotation layer in the reading column, a chat
sidebar, an API route and a system prompt. That surface area makes it very easy
to modify accidentally from five different directions, and very hard to notice
when someone has. One module, one door, one owner is what keeps it coherent.
