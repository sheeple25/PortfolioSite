# Index navigation redesign — functional backgrounds

Cold-start doc. Last updated 2026-08-31.

Related: `docs/ABOUT_PAGE.md`, `docs/TODO.md`.

Status: **§§1–5 are built.** `/projects` and `/archive` are one page navigated
by the graph, `/writing` is the typed nav, and every index is one screen plus
the footer. §6.6 — the About expansion — is the one part deliberately not done;
it was scoped as a separate follow-up and still is.

The decisions that were open when this was written are recorded in §0 below.
Everything after it is the original plan, left as written so the reasoning is
still readable, with the outcome noted where a section shipped differently.

---

## 0. Resolved — what was actually decided and built

| Open question | Answer | Where it lives |
|---|---|---|
| §6.1 Typed-nav pacing | Click anywhere finishes the current summary instantly; `‹`/`›` and arrow keys step between pieces; a row of dots jumps directly to one. The cycle auto-advances only while untouched — the first deliberate move stops it for the rest of the visit. No always-present list. | `components/writing/TypedIndex.tsx` |
| §6.2 `/archive`'s URL | 301 to `/projects`. `/archive/<slug>` already redirected to `/projects/<slug>`; the bare index now does the same. Nothing external in the repo pointed at it — the only references were `NAV_LINKS`, `ROUTES`, `INDEX_ROUTES`, two `backHref`s and two `indexHref`s. | `next.config.ts` |
| §6.3 Merged route naming | Keeps `/projects`. Nav label and masthead both stay **Work**; the rebus standfirst gained one trailing clause so it doesn't read as naming only the curated four. | `app/projects/page.tsx`, `lib/site.ts` |
| §6.4 Centering algorithm | Both built, behind the `CENTERING` constant. Ships as `"soft"` — an x/y force on featured projects only, so they settle centre and spring back after a drag. `"pin"` fixes them to a ring and never moves them. Flip the constant to compare. | `components/graph/WorkGraph.tsx` |
| §6.5 `IndexShell`'s fate | Kept, with a second shape rather than a second component. Omit `children` and it renders no sheet: masthead, then the background from `--index-bg-top` (62svh) to the fold, then the footer. `/about` passes children and is untouched. | `components/chrome/IndexShell.tsx` |
| §6.7 Metadata on `/writing` | Rides along. Date, reading time and the "recommended" flag sit as one caption line beside the typed link. | `TypedIndex.tsx` |
| **New:** every page is one screen + footer | Not in the original brief — added during the build. All three indexes are exactly one window tall and the only thing below the fold is the site footer. This is what settled §6.5. | `IndexShell.module.css` |
| **New:** phone scroll vs. graph pan | The graph's `touch-action: none` means a finger on it pans instead of scrolling. Resolved by scoping: the graph band starts at 62svh, so the masthead above it keeps ordinary touch scrolling and is how you reach the footer. | `WorkGraph.module.css` |

### Known trade-offs accepted

- **`/writing` renders one link at a time.** Only the current piece's `<a>` is
  in the DOM, so with JavaScript off the index reaches one of three pieces.
  Every piece is still in `sitemap.xml` and reachable at its own URL, which is
  the same argument §4 makes for the graph — but unlike the graph, this one
  genuinely does depend on JS. Revisit if it matters.
- **`TileGrid`, `toTile` and `PeekCard` are now unreferenced.** Left on disk
  rather than deleted: `mode: "peek"` is still a supported entry state and this
  is its only implementation. No entry uses it today.
- **`getWritingProse` / `collection.getProse` are unused.** They existed for
  the single-essay ground; the typed nav uses `meta.description` instead.

---

## 1. The brief

Two problems, one fix.

**Problem A — `/projects` has two interactive layers fighting over the same
space.** `WorkGraph` (drag/pan/zoom, click-to-navigate) sits behind `TileGrid`
(scroll, hover). Both need to be visible and both need to be operable at once,
which is the actual source of the clutter — not "the background is too big."
Shrinking the background to a band (this session's change, see §5) treats the
symptom, not the conflict.

**Problem B — the site is heavy and scroll-y.** Every index is a full-screen
header plus a long list/grid below it.

**The fix:** stop pairing a functional background with a redundant decorative
foreground. Where the background can do the navigation job itself, let it, and
delete the foreground list that duplicated the same information. Concretely:

- `/projects` and `/archive` merge into one page. `WorkGraph` — which already
  contains every project, not just "Work" ones (see §3) — becomes the actual
  navigation, not wallpaper behind a tile grid. No more `/archive` route.
- `/writing`'s typed-text background stops being ambient and starts being the
  list: it types each piece's short blurb in turn, ending in a real link.
- `/about` is a separate, smaller item — it already has a real interactive
  layer (`docs/ABOUT_PAGE.md`), this is about expanding it, not restructuring
  the page.
- With the foreground lists gone, the nav bar drops the `Archive` link, and
  three of the four index pages stop being "hero + long scroll" and become
  closer to one screen each.

## 2. Decided

- **Mobile pan:** touch-drag on the graph canvas pans it. `WorkGraph`'s
  pan/zoom is `d3-zoom` (`components/graph/WorkGraph.tsx`), which handles
  touch gestures natively — this is very likely "hardening + verify", not
  "build from scratch": add `touch-action: none` on the `<svg>` so the browser
  doesn't intercept the first touch-move as a page scroll, then test on an
  actual device. Watch for the corollary: a single-finger drag on the graph
  can no longer *also* mean "scroll the page" — which is fine precisely
  because the graph is meant to become the whole page body (see §4), but
  would be broken if any content still sits below it needing a scroll.
- **Keyboard:** `Tab` cycles project nodes only; domain/skill/tool nodes are
  skipped. Today every node type gets `tabIndex={0}` uniformly
  (`WorkGraph.tsx` ~line 623). Fix: set non-project nodes to `tabIndex={-1}`,
  leave project nodes as the only tab stops. Tag nodes keep their current
  click-to-highlight-connections behavior for pointer users; they just drop
  out of the tab order.

## 3. What exists today

| Piece | Path | Today | Fate |
|---|---|---|---|
| `WorkGraph` | `components/graph/WorkGraph.tsx` | Background-only on `/projects`. Already has drag physics, pan/zoom (`d3-zoom`), click-to-navigate (`router.push(node.href)` on project nodes), `tabIndex`+`role="button"` on every node. Node icon is a generic `FileText`; `cover`/`coverAlt` fields exist on the data but aren't rendered. Featured vs. archive already differ in radius/color (`PROJECT_RADIUS`, legend swatches). | Becomes the sole nav for the merged page. Gets thumbnails, a centering force for featured projects, tab-scoping, touch hardening, real link semantics. |
| `getProjectGraph()` | `lib/graph/index.ts` | **Already pulls `getEntries()` with no section filter** — the graph dataset already unions Work + Archive projects and already flags `featured`. Comment at the top of the file literally calls this "the Work/Archive knowledge graph." | No data-layer changes needed. This is the part of the plan that's mostly already built. |
| `TileGrid` | `components/index/TileGrid.tsx` | Real `next/link`, shutter-integrated (`useShutterLink`), current foreground on both `/projects` and `/archive`. | Removed from `/projects`. |
| `/archive` route | `app/archive/page.tsx` | Separate flat curated list (own `IndexShell`, no graph, ordered by `rank`). | Deleted. Needs a routing decision — §6.2. |
| `IndexShell` | `components/chrome/IndexShell.tsx` + `.module.css` | **Just reworked this session** (see §5) to render `background` as a hard-edged band that ends just past the `sheet`'s top edge — built on the assumption a tile/list sheet still exists below it. | That assumption stops holding for `/projects` and `/writing` once their sheets are gone — see §5 and §6.5. Still correct as-is for `/about`, which keeps real foreground content below its header. |
| `TypedGround` | `components/writing/TypedGround.tsx` | Loops **one** essay's full prose forever, a measured screenful at a time, with a realistic typo/pause simulation (`delayFor`, `slip`, `NEIGHBOURS`, `useFitter`). Purely decorative — nothing it types is a link. | Restructured to cycle across *every* piece, typing a short passage each, ending in a real link, then advancing. The character-level typing engine is reusable as-is; the single-essay pagination loop (`useFitter`'s binary search across one huge prose blob) is not — see §5. |
| `getWritingProse` | `lib/writing/index.ts` | Fetches one essay's full prose by slug, for the current single-essay loop. | Not the right shape for "short passage per piece." Recommend reusing `meta.description` (already a short, purpose-written one-liner on every piece, also used for `<meta description>`/OG tags) instead of extracting "first paragraph" from markdown bodies. |
| `IndexList` / writing `IndexCard` | `IndexShell.tsx` export + `components/writing/IndexCard.tsx` | Real `next/link` list of every piece, with date, reading time, "recommended" badge. | Removed. That metadata has no obvious home once the list is gone — §6.7. |
| `NavBar` / `sections.ts` | `components/chrome/NavBar.tsx`, `components/chrome/sections.ts` | `INDEX_ROUTES` includes `/projects`, `/archive`, `/writing`, `/about`; drives ground color and shutter-panel detection. | Drop `/archive` once the route is gone. |
| `CursorImageTrail` / interest band | `components/about/*` | Documented in full in `docs/ABOUT_PAGE.md` — Act I is a decorative, pointer-only cursor trail; Act II is already an interactive tablist of panels with hash-synced routing. | Out of scope for the mechanics in this doc. Expanding it is real work but a different shape of problem — see §6.6. |

## 4. Work + Archive merge — plan

- **Data:** none needed. `getProjectGraph()` already unions both sections.
- **Route:** one page for all project work. Which URL survives (`/projects`,
  something new) is undecided — §6.3.
- **Layout:** `WorkGraph` stops being a background band and becomes the whole
  page body below the masthead. `IndexShell`'s `sheet`/peek/tile-grid
  machinery is not used on this route at all once this lands.
- **Thumbnails in nodes:** `ProjectGraphNode.cover`/`coverAlt` already exist
  on the data (`lib/graph/index.ts`), just unconsumed by `WorkGraph`. Add a
  clipped `<image>` per project node (same technique the tool-logo chip
  already uses around `WorkGraph.tsx` ~line 683), falling back to the current
  `FileText` icon when a project has no cover.
- **Centering:** the force simulation has no "pull featured nodes to the
  middle" today — only size/color distinguish featured from archive. Add a
  centering force or an `fx`/`fy` pin keyed on `featured` so the curated work
  reads as the visual core and the rest radiates outward. Try both a hard pin
  and a soft (springy) center-force — different feel, worth comparing.
- **Real link semantics:** today a node's hit target is `<g role="button"
  tabIndex={0}>` with a `handleActivate` → `router.push()` click handler, not
  an anchor. This is not an SEO problem — `app/sitemap.ts` already lists every
  project independently of any index page's UI — but it does mean no
  right-click/open-in-new-tab, no no-JS fallback, and no shutter-close
  transition (`useShutterLink`, which `TileGrid` uses and `WorkGraph`
  currently doesn't). Wrap the hit target in an SVG `<a>` and route it through
  the same `useShutterLink` handler `TileGrid` uses today, so a graph click
  closes the shutter exactly like a tile click does now.
- **Keyboard / mobile:** see §2.

## 5. Writing nav — plan

- Replace `TypedGround`'s single-essay infinite loop with a cycle over
  `getWritingSummaries()`: type `meta.description` (or a real first-paragraph
  extraction — undecided, see §6.1) for piece *N*, hold, render a real link
  (`next/link`, shutter-integrated) at the end of the typed passage, hold
  longer, clear, advance to *N+1*, wrap after the last piece.
- The character-level typing engine (`delayFor`, `slip`, `NEIGHBOURS`, the
  typo/hesitation model) is reusable unchanged — it already operates on
  whatever string it's handed. What's replaced is the outer loop: no more
  "binary-search how much of this one giant string fits per screen and keep
  paging through it forever" — instead "type this one short, pre-sized
  passage per piece, then move to the next piece."
- Order should probably start from the recommended piece (same
  `pick ?? documents[0]` logic `/writing/page.tsx` already uses today), then
  proceed in the same order the removed list used (date/rank).
- What's lost: date, reading time, and the "recommended" badge currently
  shown on `IndexCard` have no home in typed text alone — §6.7.
- Open question on pacing — §6.1. This is the one piece of the plan not yet
  resolved even at the concept level.

### ⚠️ Superseded — resolved, see §0

The band described below is gone. `IndexShell` kept both jobs rather than being
split: `.background` still ends at the sheet's edge on `/about`, and
`.backgroundFull` runs to the fold on the two routes with no sheet. The original
note follows.

This session already shipped a change to `IndexShell.module.css`/`.tsx`:
`.background` was reworked from filling the whole header to a hard-edged band
ending just past the `sheet`'s top edge, and the `scrim` prop/gradient was
removed entirely. That change assumed the tile grid / writing list stays —
it was the previous, smaller fix for Problem A before this bigger
restructure was discussed. Once `/projects` and `/writing` no longer have a
`sheet` below the header at all, that band math is moot: the background
either goes back to filling the whole available body (now uncontested, since
there's no foreground list left to compete with) or `IndexShell` stops being
used for these two routes altogether in favor of a simpler wrapper that's
just "masthead, then full-bleed content." `/about` still needs `IndexShell`
as-is — it keeps real foreground content below its header. Decide this
concretely as part of §6.5 before touching CSS again.

## 6. Open questions — **all resolved except §6.6; answers in §0**

1. **Typed-nav pacing.** Is "type through, then click the link" the *only*
   way to reach a piece, or is there a low-friction skip — click anywhere to
   jump straight to the link, arrow keys to skip to next/previous, a minimal
   always-present index alongside it? Sitting through pieces 1–5 typing out
   to reach piece 6 is a real cost once this is the actual navigation and not
   ambience. Not resolved in discussion yet — needs an explicit answer.
2. **`/archive`'s URL fate.** 301 redirect to the merged page, or just gone
   (404, dropped from nav, no redirect)? Check whether anything external
   (a résumé, a LinkedIn link, a past email) points at `/archive` or an
   `/archive/<slug>` URL before deciding.
3. **Merged route naming.** Does the merged page keep the `/projects` URL
   (today's Work URL) or move? `NavBar`, `sections.ts`'s `INDEX_ROUTES`, and
   any hardcoded links all need to agree once this is picked.
4. **Centering algorithm.** Hard pin (`fx`/`fy`, featured nodes never drift)
   vs. soft center-force (draggable but springs back) — try both.
5. **`IndexShell`'s fate for `/projects` and `/writing`.** See the
   "Superseded" box in §5 — pick "background fills the whole body" vs. "stop
   using `IndexShell` for these two routes" before writing CSS.
6. **About's expansion — which piece, and to what end?** Candidates:
   `CursorImageTrail` (Act I, decorative, pointer-only today) or the interest
   band (Act II, already interactive). Not scoped yet; treat as a separate,
   smaller follow-up once §§1–5 land, not a blocking part of this plan.
7. **Metadata loss on `/writing`.** Date, reading time, "recommended" badge —
   decide whether any of it rides along near the typed link (a small caption)
   or is simply dropped from the index (still visible on the piece's own
   page).

## 7. Build order — steps 1–4 and 6 done, step 5 outstanding

1. ~~Resolve §6.2, §6.3, §6.5 first~~ — see §0.
2. ~~`WorkGraph` hardening~~ — tab-scoping, touch, SVG `<a>` + shutter wiring,
   cover thumbnails, centring force.
3. ~~Wire the graph as the merged page's full body; delete `/archive`~~.
4. ~~Writing: multi-piece typed nav~~ — `TypedIndex` replaces `TypedGround`,
   which is deleted along with `IndexCard` and `IndexShell`'s `IndexList`.
5. **About expansion — still outstanding.** Separate pass, once §6.6 is
   actually scoped.
6. ~~Re-verify the masthead on both shapes~~ — build passes, both indexes emit
   the expected markup. Not yet looked at in a browser: **the visual pass is
   the thing to do next**, particularly the 62svh band boundary against the
   stacked masthead on a phone, and whether `"soft"` or `"pin"` centring reads
   better (§6.4).
