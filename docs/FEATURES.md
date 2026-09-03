# Features

Everything this site does, where it lives, and why it's there.

This is the doc to read after a long time away. It is deliberately not a
tutorial and not a changelog — it's an inventory. For each feature: what a
visitor actually experiences, which files own it, the decisions behind it that
would be expensive to rediscover, and whether it is finished.

**Companion docs.** This one is the map. The deep-dives are:

| Doc | Covers |
| --- | --- |
| `docs/CASE_STUDY_FORMAT.md` | The case-study chassis in detail — CSS contract, banner mechanics, which primitive for which beat |
| `docs/PIXELBOT_BUILD.md` | PixelBot's work queue, phases, and the request log other features file against |
| `docs/PIXEL_CHAT.md` | PixelBot's decision record — why it is the way it is |
| `docs/KNOWN_BUGS.md` | Open question marks (not confirmed bugs) |
| `docs/TODO.md` | What's next, sequenced |
| `source/content-model.md` | How case studies are built from decisions rather than narrative |
| `source/CONTENT-CONTEXT.md` | Cold-start context for content work |

---

## 1. Status at a glance

Use this to audit. "Shipped" means a visitor can use it today; "partial" means
it works but a named piece is missing; "placeholder" means the surface exists
and the content behind it doesn't.

| Feature | Status | Notes |
| --- | --- | --- |
| **Content & structure** | | |
| Entry registry (`mode` / `section`) | Shipped | Three modes wired end to end |
| Work index (`/projects`) | Shipped | Home of the site; `/` redirects here. Work + Archive merged into it — the graph is its navigation |
| Writing index + reader (`/writing`) | Shipped | 3 documents live |
| Markdown → section-tree pipeline | Shipped | remark, not MDX — see §9 |
| Case-study chassis | Shipped | 3 projects on it |
| Knowledge graph | Data-complete | Interaction done; **visual pass pending** |
| Peek cards | Shipped | Only 2 entries use it (both drafts) |
| **PixelBot** | | |
| Mascot (gaze, blink, idle, moods) | Shipped | |
| Footer wardrobe (5 costumes) | Shipped | Hover Pixel at the footer; lasts the session |
| InScreen margin annotations | Shipped | Mechanism done; no annotation authored for Pixel itself |
| InChat sidebar + streaming API | Shipped | Cost-capped; rate-limited |
| "What I actually did" process note | **Placeholder** | All 7 DecisionLogs are `placeholder: true` → renders nothing |
| Decision context in system prompt | **Placeholder** | Same cause — prompt gets nothing |
| System prompt quality | **Needs a pass** | Knows only each project's one-line description |
| askVidush queue | Parked | Designed, not built. Blocked on accounts |
| **Chrome & interaction** | | |
| Shutter page transition | Shipped | |
| Sticker rating + analytics | Shipped | 2026-09-02 pass: die-cut seal faces, centred viewBox, keyboard delete, `.rails-hidden` fix — awaiting Vidush's hands-on check |
| Dark mode toggle | Shipped | Manual only; ignores `prefers-color-scheme` by design |
| Pac-Man cursor | Shipped | "Feed it to Pixel" interaction not built |
| Footer physics pit | Shipped, under review | To be replaced by a Pixel footer game; the wardrobe half is built |
| Immersive chrome (hide on scroll) | Shipped | |
| Masthead Pixel (`TitlePixel`) | Built, **unmounted** | Pixel as a title's full stop — dozes, wakes near the cursor, wears the session costume. Unmounted from `/projects` same day: two visible mascots read as confusing (Vidush). Kept for the prospective home page. The corner note's "ask me" (`AskPixelNote`) stays live |
| Themed browser surfaces | Shipped 2026-09-02 | `::selection` (project accent on case studies via `--selection-bg`), `scrollbar-color`, `caret-color`, `accent-color` — globals.css |
| Animated titles (8 per-project effects) | Shipped | |
| **Page-specific** | | |
| Bookshelf (About) | Shipped | 21 books, self-hosted covers |
| Cursor image trail (About) | Shipped | Placeholder images (borrowed book covers) |
| About page content | **Placeholder** | Bookshelf only; intro says so |
| Contact page | Shipped | |
| STL viewer | Built, **unmounted** | Component ready; no `.stl` asset to show |
| Charts (Bklit UI) | **In use** | Traces' figures render on it; two registry bugs fixed locally — §12 |
| Home page | Shipped 2026-09-02 | One-viewport hero at `/`; Pixel walks to the companion's corner on exit (`components/home/`) |
| **Infrastructure** | | |
| SEO / sitemap / robots / OG | Shipped | Share card at `app/opengraph-image.tsx` (+ twitter re-export); vendored TTFs in `lib/og/fonts/` |
| Vercel Analytics + custom events | Shipped | |
| Reduced-motion support | Shipped | Honoured by every animated surface |
| CV auto-copy + last-commit stamp | Shipped | Footer CV/Portfolio links have **empty hrefs** |

### The gaps, ranked

The five that actually matter, pulled from `docs/TODO.md`:

1. **The seven DecisionLogs in `content/decisions/` are all scaffolding.** This
   is load-bearing in a way that's easy to miss: `source/traces-rebuild.md`
   deliberately *cut content from the Traces page* on the basis that "everything
   else is answerable by Pixel". The page was trimmed against an account that is
   currently empty. Two Pixel surfaces render nothing as a result.
2. **PixelBot can't say what you did on a project** — the top item in the TODO,
   marked required rather than nice-to-have. Blocked on (1).
3. **Link-out URLs are missing.** `mode: "link"` is wired end to end but no CEPT
   URL is recorded anywhere in the repo, so Matchbox/Mizan/Vortex are still
   full case studies instead of redirects.
4. **The sticker widget needs a function+appearance pass.**
5. ~~Traces' charts should move onto Bklit UI~~ — **done 2026-09-02**, see §12.

---

## 2. The shape of the site

Six public routes. There is no separate home page: `/` redirects to
`/projects`, and the wordmark links there too, so **Work is the home page**.

| Route | What it is |
| --- | --- |
| `/` | **Home** — one-viewport front door: name, thesis, stage Pixel, three doors (2026-09-02) |
| `/projects` | **Work** — every project, navigated by the knowledge graph |
| `/projects/<slug>` | One project. Canonical URL for *every* entry, whatever its section |
| `/writing` | Essays index — the typed nav |
| `/writing/<slug>` | One essay |
| `/about` | Bookshelf (rest is placeholder) |
| `/contact` | Email + socials |

Plus `robots.txt`, `sitemap.xml`, `icon.svg`, and `POST /api/pixel`.

**`/archive/<slug>` permanently redirects to `/projects/<slug>`**, and
**`/archive` itself permanently redirects to `/projects`** (`next.config.ts`).
The slug redirect's pattern is `:slug([^./]+)` — the `[^./]` excludes anything
with a dot in it so `public/archive/*.webp` assets still serve. `/archive` was
a separate index until Work and the Archive merged into one graph; the entries
it listed are all still there, which is why an old link redirects rather than
404s. `section: "archive"` survives the merge as a curation flag — it decides a
node's size, colour and whether the centring force holds it in the middle — it
just no longer decides which page an entry appears on, because there is only
one.

### The one structural idea

Everything about how work is presented comes from **one registry**, and two
independent fields on each entry:

- **`mode`** — what clicking the tile *does*
- **`section`** — which index it *appears on*

Neither derives from the other. A finished case study can sit in the Archive
because it's older work; a Work project can be a bare link while it waits to be
written. The rule the model enforces:

> Changing `mode` or `section` must never require rebuilding content or moving a
> file.

Which is why: every payload (`peek`, `link`) lives on the entry regardless of
which mode is active; peek content is *derived* from metadata the tile already
has, so flipping to `peek` costs zero authoring; the canonical URL is
`/projects/<slug>` for everything; and all markdown lives in one pool
(`content/projects/`).

Promoting a project from Archive to Work is **two words on one line**.

---

## 3. The entry model

**Owns:** `lib/entries/` — `types.ts` (the model + the design note), `registry.ts`
(the data you edit), `index.ts` (resolution).

### The three modes

| Mode | Tile behaviour | Element rendered |
| --- | --- | --- |
| `case-study` | Opens the entry's own page | `<Link>` — prefetched, middle-clickable |
| `peek` | Slides a large card over the index. **No navigation** | `<button aria-haspopup="dialog">` |
| `link` | Goes straight out to another URL | `<a target="_blank">` |

The element changes with the mode rather than being faked, because they mean
different things to a browser and a screen reader — announcing a peek as a link
would be a lie.

It's a union, not three booleans: three booleans describe eight states, five of
which are nonsense.

### Where content comes from

`source.kind` is a statement of fact, not a preference — it says where the words
are, not how they're shown:

- **`page`** — a hand-built React case study under `app/projects/<slug>/`.
  Metadata is inline in the registry because the markdown it replaced is gone
  (lifted verbatim from the old frontmatter). Also carries `sectionTitles` (the
  contents rail, kept in step by hand) and a hand-set `readingMinutes` — these
  pages are half figures, so a word count reads short.
- **`document`** — a markdown file in `content/projects/`. Metadata stays in
  frontmatter, which is the right home for it.
- **`external`** — the work exists but not here (a PDF, a Behance post). Enough
  metadata to draw a tile and a peek card; no page of ours.

### The current roster

| Slug | Section | Mode | Source |
| --- | --- | --- | --- |
| `unflattening` | work | case-study | page |
| `traces` | work | case-study | page |
| `loco` | work | case-study | page |
| `flux` | archive | case-study | document |
| `mizan` | archive | case-study | document |
| `vortex` | archive | case-study | document |
| `matchbox` | archive | case-study | document |
| `kobble` | archive | peek | document (draft) |
| `vashi` | archive | peek | document (draft) |

`draft: true` is a **separate axis** from `mode` — it's the right switch for
"not written yet". Drafts render in dev and vanish from production.

Work sorts newest-first; the Archive sorts by `rank`, because it's a curated
shortlist rather than a feed. The Archive's ranks start at 3 — ranks 1 and 2
were Traces and Loco, which got promoted to Work.

---

## 4. Site chrome

Mounted once in `app/layout.tsx` and shared by every page.

### Nav bar — `components/chrome/NavBar.tsx`
Sticky, transparent until scrolled. Wordmark (links to `/projects`), the five
nav links, `ThemeToggle`, and the "Ask Pixel" pill. Its links drive the shutter.

Every colour comes from a token, and **no rule names a nav link** — so the
`hero-chrome` class can retint the whole bar (wordmark, links, current-page
marker, Ask Pixel pill) for a full-bleed hero by re-pointing tokens, including
anything added to the bar later.

### Logo — `components/chrome/Logo.tsx`
Three falling triangles, in **two representations of the same artwork**:
inline SVG at rest (sharp at any size, takes the accent from the palette), and
`public/site-loader.webp` — a 109-frame animation — while in motion.

The raster's colour is baked in, which made it stay orange in light mode while
the resting mark went blue. It's re-tinted **at paint time**: an SVG filter
floods the accent colour and composites it into the frame's alpha. The SVG's
geometry is measured off the animation's own resting frame, so the swap is
seamless.

### The shutter — `components/chrome/Shutter.tsx`
The page transition. An index's header section closes upward; the header of
whatever you clicked opens downward in its place.

**The decision that makes it tractable: navigation is deferred until the close
has finished.** The outgoing page is still mounted and still real while it
closes — nothing to snapshot, no box tweening between two sizes, no separate
layer. Cost is honest: close, navigate, open, rather than the two overlapping.
Links are prefetched on hover and on request, so the middle step is short.

It replaced a View Transitions implementation that could not be made to work
both ways — that API morphs one element into another that persists, and this is
two adjacent moves, not a morph.

Declines (letting the ordinary link happen) when: reduced motion, a link to the
current page, no panel on this page, the panel is scrolled out of view, or the
destination has no panel. Getting one of those backwards broke every nav link on
`/contact` — the shutter took the click and waited forever for an animation that
had no element to run on.

Timings: close `0.6s` ease-in, open `0.3s` ease-out. The pairing is deliberate —
an ease-in on the open would have the panel still accelerating as it arrives.

### Theme toggle — `components/chrome/ThemeToggle.tsx`
Manual light/dark. **There is no `prefers-color-scheme` handling anywhere in the
site** — it defaults to light and only moves when pressed.

The glyph shown is the *destination*, not the current state (a sun while dark),
so it reads as an instruction rather than a status light.

Source of truth is the `.dark` class on `<html>`, set before first paint by an
inline script in `app/layout.tsx` so a returning visitor never sees a flash. A
`useSyncExternalStore` subscription keeps the button in step; `getServerSnapshot`
returns `"light"` so the server and the pre-hydration client agree while the
*actual* class may already be dark. A `storage` listener syncs other tabs.

### Bottom edge — `components/chrome/BottomEdge.tsx`
Two jobs from one measurement, which is why they share a component rather than
racing on separate scroll listeners:

1. A fade-and-blur over content running past the bottom of the screen — **held
   back until the footer is fully below the viewport**, since the footer is its
   own dark panel and washing it just dirties its top edge.
2. `--corner-lift`, published as a custom property on `<html>`, so the fixed
   corner furniture (mascot, annotation panel, index corner note) comes to rest
   on the footer's **bottom row** instead of sitting on top of it. Measured
   from that row (`[data-footer-baseline]`), not the panel's top edge: the
   footer opens to 60svh, so its top edge ends up halfway up the screen and
   resting the mascot there would fling it into the middle of the viewport.

It's a custom property rather than React state because the consumers are
stylesheets, not components.

### Section ground — `components/chrome/SectionGround.tsx`
Renders nothing. Toggles the `index-ground` class on `<html>` per route — the
index header's own light/dark ground, which now tracks the theme toggle the
same as the rest of the site.

Exists because the ground used to be added/removed by `IndexShell`'s own mount
and unmount, which **flashed white on every index-to-index navigation** — the
outgoing cleanup ran before the incoming effect. Mounted in the layout it never
unmounts, so it toggles instead, and there's no moment when the ground is absent.

`components/chrome/sections.ts` is the single list both this and the shutter
read, so they can't drift.

### Footer — `components/chrome/Footer.tsx`
A server component with small interactive islands. Deliberately a black panel —
its own space, not one more page section.

- **Opens to 60svh as you reach the end of the page**, with no JS. The panel is
  `min-height: 60svh` and last in the document, so its bottom edge only meets
  the bottom of the viewport at maximum scroll; before that the overhang is
  off-screen and what you see is a black band growing upward. The height over
  and above the content *is* the scroll runway that drives it. `.baseline` is
  `position: sticky; bottom` so the bottom row arrives with the band's leading
  edge instead of waiting at the end of the runway — which is what makes it
  read as a normal-height footer opening upward rather than one tall panel
  sliding in. `svh`, not `dvh`: a dynamic unit would re-lay the panel out every
  time a mobile toolbar hid itself, mid-scroll.
- **`.baselineTrack` is load-bearing, not a wrapper.** A sticky element is
  clamped by its containing block, so with the bottom row parented straight to
  the panel its ceiling was the top of the footer — and on a band too short to
  hold both rows, sticky hauled the bottom row up over `.inner`. The track
  spans only the space below `.inner`, so *it* is the clamp and its top edge is
  the ceiling. No padding or margin can substitute: the clamp follows the box.
- **Every blue in here follows the page accent.** The panel re-points its own
  `--color-accent` at `--nav-pixel-accent` — the same page-scoped accent the
  logo already used — so the document buttons, download arrows, commit dot and
  hash, and back-to-top arrow all turn Traces' magenta, Unflattening's orange,
  and so on. `--footer-accent` overrides that for a page whose accent is too
  dark to survive a black ground.

- Nav, socials, and document links. **An entry with an empty `href` is a
  reminder, not a link**: greyed out in dev, dropped entirely from production.
  (`Portfolio` and `Resume` in `DOCUMENT_LINKS` are currently empty.)
- **"Last shipped X ago · hash"** — from `lib/generated/last-commit.json`,
  written by a prebuild script. Never shells out to git at render time.
- **`FooterPlayground`** — a matter-js pit of little triangles (the wordmark's
  own shape) that drop in, pile up, and can be dragged and flicked. A fidget
  toy, not a control. Reduced motion settles them once and paints a static
  frame. *Slated for replacement by a Pixel footer game.*

### Sticker rating — `components/chrome/StickerVote.tsx`
Two scalloped seal badges, "Good" and "Bad", peeking from the **left** edge (the
right is Pixel's). Drag either one anywhere on the page and release, or just
click it, to plant a sticker and cast the vote.

- **One vote per page per browser session**, `sessionStorage`-guarded and keyed
  by pathname.
- The planted sticker is anchored at the **exact page coordinate** it was
  dropped — it scrolls with the content like a sticker really left there, and is
  restored at that spot on every remount, so a mid-session refresh shows the
  same picture.
- Still draggable afterward to reposition; **double-click removes it** and
  un-freezes the rail for a new vote.
- Fires a `sticker_vote` analytics event.

Two mechanics worth not rediscovering:

- The planted badge is a **sibling of the fixed rail**, not a child. `.rail` is
  `position: fixed`, which would make it the containing block and anchor
  `top`/`left` to the viewport instead of the page.
- `left`/`top` fix the original drop point and never change; subsequent dragging
  is expressed purely as Motion's `x`/`y`, which Motion already accumulates.
- The click path exists as the **accessibility fix** — a drag-only control
  leaves a keyboard user with no way to vote — and doubles as the safer touch
  path, since an edge-anchored drag fights the OS back-swipe gesture.

**Status: flagged for rework.** Both the interaction and the seals' appearance
are called out in `docs/TODO.md` as not right yet.

### Pac-Man cursor — `components/pixel/PacmanCursor.tsx`
A custom cursor drawn on Pixel's own crisp-cell sprite pipeline (`rowsToRuns` /
`runsToPath`) but at a coarser 12-cell grid, rendered small so the blockiness
*is* the point. A rounded square rather than a coin.

The mouth is a live angle-cut wedge, so it can face any direction. It stays shut
at rest and **opens only for a single-chomp envelope triggered by a click** —
mouth-open-and-shut plus a squash-and-rebound with an easeOutBack overshoot —
rather than chewing continuously.

Mounted sitewide in the layout. The TODO's "feed the pellet to Pixel"
interaction is **not built yet**.

---

## 5. PixelBot

The mascot, the annotation layer, and the chat. **One feature with one owner**,
spanning `components/pixel/`, `lib/pixel/` and `app/api/pixel/`.

> **`components/pixel/AGENTS.md` states the rule: do not edit anything in this
> module unless the task is explicitly about PixelBot.** Other features file a
> request in `docs/PIXELBOT_BUILD.md` §10 and work around the gap.

Everything outside imports from `@/components/pixel` (the barrel). Deep imports
are an ESLint error, by design — that's how a module quietly grows a third,
undocumented public surface. Server-only pieces come from
`@/components/pixel/server`; that split is a Next.js constraint (`ProcessNote`
reads `node:fs`), not a second module.

### 5a. The mascot

A hand-authored **24×24 sprite**, authored as a literal grid of cells rather
than vectors that get downsampled. That's the whole point: a curve drawn smooth
and then shrunk leaves semi-transparent fringe pixels, which is what makes a
"pixelated" render still look soft. Here the stair-steps *are* the artwork.

The body is one 24×24 mask; eyes live in their own 6×6 box, drawn once and
**mirrored**, so the face is symmetrical by construction.

**Nine expressions:** `default`, `happy`, `embarrassed`, `surprised`, `sleepy`,
`asleep`, `unimpressed`, `dead`, `blink`.

**Five costumes**, authored the same way as the body and eyes — see *5b. The
footer wardrobe* below.

Behaviours:

- **Gaze** — follows the cursor, snapped to nine cells. rAF-throttled, and the
  setter bails when the cell hasn't changed, since the quantised output only
  moves nine times across the whole viewport. A 40px dead zone means it looks
  straight ahead when you're close. Only some moods track — a sleeping ghost
  that still watches you is unsettling in the wrong way.
- **Blink** — on a timer, suppressed while asleep or dead.
- **Idle drift** — `sleepy` after 9s, `asleep` after 20s of no pointer, key or
  scroll activity.
- **Reactions** — pointer-down flashes `surprised`; clicking Pixel flashes
  `embarrassed` (this is the "petting").
- **Hover awareness** — goes `happy` while the pointer is over anything
  interactive.
- **Per-route moods** — `/about` happy, `/projects` surprised, and `not-found`
  pins `dead`.

Expression precedence, and the order matters: `reaction → localReaction → mood →
idle → hover → route → default`. A page that pins a mood (404's "dead") must not
drift off to sleep, but a deliberate reaction still interrupts it.

Mounted in the root layout, not per page, so it survives client-side navigation
— the idle timer, gaze and blink carry across route changes instead of
remounting cold.

### 5b. The footer wardrobe

Scroll to the footer, hover Pixel, and a **Customise** pill appears above him.
It opens five costumes — bow tie, bowler hat, sunglasses, devil horns, angel
halo — and whichever you pick stays on **for the rest of the session**, on every
Pixel on the site, not just the one in the footer.

**There is no second Pixel in the footer, deliberately.** The obvious build is a
local `<Pixel>` mounted inside `<footer>` with the sitewide companion hidden
behind it — which is exactly the shape `PIXELBOT_BUILD.md` §12 pre-registered,
and it is why that section reserves the reason-tagged `setHidden` work as a
prerequisite. It isn't needed here: the companion is already fixed to the
bottom-right corner and `--corner-lift` rests it on the footer's bottom row as
you arrive, so by the time the wardrobe is reachable the real Pixel is sitting
in the footer anyway. Attaching to him costs no duplicate sprite, no second copy
of the gaze/blink/idle machinery, and no third writer to `hidden`.

- **Accessories are masks, like everything else.** Literal grids in `sprites.ts`
  with an `originY` saying where row 0 lands on the body — and `originY` may be
  **negative**, which is how a hat, horns and a halo sit above the head.
- **The sprite overflows its viewBox rather than growing.** An SVG clips to its
  viewBox, so above-head costumes would simply not paint. Widening the box was
  the alternative and would have changed the rendered height of *every* Pixel on
  the site — the fixed corner, the chat header, the 404 — for a costume that is
  usually not even worn. `Pixel.module.css` sets `overflow: visible` instead and
  the body's box stays exactly 24×24 at `size` px.
- **Three costumes carry their own colour, and that is a contrast decision, not
  a style one.** The bowler, horns and halo overhang the body onto whatever is
  behind Pixel — and where the wardrobe is reachable, that is the footer's pure
  black panel. The bowler was authored in the eyes' near-black first and was
  flatly invisible there; it is warm grey now. Anything that stays on the blue
  body still defaults to the eye ink.
- **Sunglasses suppress the eyes** (`hidesEyes`). Drawing them under an opaque
  lens just muddied the shape. Gaze and blink keep running underneath and come
  back the moment the shades come off.
- **Chosen costume lives in `sessionStorage`, via `useSyncExternalStore`.** The
  session is the point — it survives a reload of the tab and dies with it, where
  `localStorage` would turn a one-off joke into a permanent fact about the site.
  The external-store shape is what lets a value that doesn't exist on the server
  be read without a hydration mismatch or a setState-in-effect cascade; the same
  reasoning as the theme toggle.
- **The hover survives the trip to the button.** The wardrobe's own box is
  `pointer-events: none` until revealed, then solid — so the pointer leaves the
  sprite and lands on *it* rather than on the page behind, and the pill doesn't
  flicker away mid-gesture. While hidden it must stay transparent to the mouse,
  because it sits directly over the footer's "Back to top" link.
- **Keyboard gets in.** The trigger is `opacity: 0`, not `visibility: hidden`,
  precisely so it stays focusable — a hidden element can't take focus and there
  would be no way in without a mouse. `aria-hidden` moved off the companion
  wrapper onto the sprite alone, since the mascot is still decoration but the
  wardrobe underneath it is real, operable UI.
- **Leaving the footer unmounts it**, which is also how its open/closed state
  resets. Behind an `enabled` prop, a panel left open stayed open when you
  scrolled back down to it later.
- **"Have I reached the footer" is `atFooter` on `PixelContext`**, not local
  state. Two surfaces need the same answer — this, and the InScreen panel, which
  has to get out of the way when he arrives (§5c) — so it is one
  `IntersectionObserver` on `#site-footer` rather than two.
- **It speaks in mono**, like the annotation panel's `.panelText`. Buttons
  inherit the body face under the preflight reset, so the pill first rendered in
  Newsreader — the reading face, on a piece of interface furniture.

### 5c. InScreen — margin annotations

Notes written once in markdown, reachable from three places that all agree via
one context: the note in the margin, any bold word listed as an anchor, and
Pixel narrating it.

```markdown
[NOTE de-futuring, de-future: De-futuring says that human activity, through
design, can erase possible future outcomes.]
```

The comma-separated anchors become buttons; clicking one opens the annotation
**above Pixel in the bottom-right margin** — never before. Anchors match
anywhere in the document, so a bold word in the last section can open a note
written in the first. Drop the anchors (`[NOTE: …]`) and the note sets inline
where it was written — the one case that shows unprompted. A bold word naming no
note simply stays bold.

**The panel leaves when Pixel reaches the footer.** It is fixed and rides
`--corner-lift`, so once the footer opens it would otherwise be left floating
over a black panel it was never designed against — a note anchored to the mascot,
hanging in a room the mascot has already walked into. It reads `atFooter` from
`PixelContext` (the same signal the wardrobe uses, one observer for both) and
exits through `AnimatePresence`, so it slides away rather than being cut off
mid-sentence.

Narration clears itself after 16s. The context's default is a **working no-op
rather than a thrown error**, because prose containing a note can legitimately
render outside a provider (a preview, a card) and a bold word quietly staying
bold beats a broken page.

**The design principle:** InScreen explains deterministically and for free, and
hands off to InChat only when a visitor wants more than an aside can carry.

### 5d. ProcessNote — "what he actually did"

`components/pixel/screen/ProcessNote.tsx`. Renders the `## What I did` block
from `content/decisions/<slug>.md` into Pixel's margin on project open,
**unprompted**.

Deliberately **static text, not a model call**: it renders on every project open,
so generating it would mean one API request per visitor per page before anyone
has typed anything — the single most expensive thing PixelBot could do, for a
paragraph that doesn't change.

It's in the third column because it can't go in the header (already carrying
title, spec row and stickers) and can't go under the intro (that beat's job is
pulling the reader into the problem).

> **Currently renders nothing.** All seven DecisionLogs carry `placeholder:
> true`, which hides them from both the margin and the prompt — showing a
> recruiter "TK" is worse than showing them nothing.

### 5e. InChat — the Ask Pixel sidebar

Fixed-position sidebar. Opening it widens `body`'s margin to push the page over
rather than overlaying it.

- **Model: `claude-haiku-4-5-20251001`**, chosen in `docs/PIXEL_CHAT.md` —
  context window is a non-issue at every tier, so the trade-off is
  voice-adherence against cost, and the real lever as the prompt grows is
  caching it, not the model tier.
- **Streams** plain text chunks; the sidebar reads the body as a stream.
- **Audience switch** — "recruiter" or "browsing", which changes tone.
- **Handoff from InScreen** — "say something more" on an annotation opens the
  chat carrying that note as context plus the question the visitor just clicked
  to ask. Conversation state lives in `useChatSession` (held by the provider),
  *outside* the sidebar, precisely so something else can open the chat with
  content already in it.
- **The rickroll.** The SOP asks for one running joke: a completely off-topic
  question gets a warmly unhelpful reply and the obvious link. The **judgement**
  stays with the model (only it can tell if a question is off-topic) but the
  **payload does not** — the model emits a `[[RICKROLL]]` sentinel and the exact
  wording lives in `scriptedBits.ts`. Left to the model it would eventually
  paraphrase the joke or mangle the URL, and a half-remembered bit is worse than
  no bit. A regex also swallows partial sentinels mid-stream so `[[RICK` never
  flashes on screen.

**Cost and abuse posture** (`lib/pixel/limits.ts`, `rateLimit.ts`) — one
definition imported by both client and route, so they can't drift:

| Guard | Value |
| --- | --- |
| User messages per conversation | 5 (input disabled at the cap; route rejects a larger body) |
| History messages | 20 |
| Characters per message | 2,000 |
| InScreen note text | 1,000 |
| Burst | 8 requests / minute |
| Sustained | 40 requests / hour |

The rate limiter is **module memory**, so on a serverless host it's per-instance
and resets when the instance recycles. It raises the cost of abuse; it does not
cap it. The only hard ceiling is a spend limit on the Anthropic key itself — set
that too.

The route narrows the InScreen payload to three known fields. This replaced an
open-ended `pageExcerpt` that was accepted but never sent — an unbounded string
going straight into a system prompt is both a cost multiplier and the widest
available surface for prompt injection.

### 5f. DecisionLogs — `content/decisions/<slug>.md`

One file per project, serving two readers the content model keeps together:

- **`## What I did`** → the margin, unprompted, no model call (§5d).
- **`## Decisions`** → folded into the system prompt, so a visitor can ask *why*.
  This is the "Interrogate" depth tier in `source/content-model.md`.

Content cut from a case study for length is supposed to land here.

> **All seven are placeholders.** Replacing them is editorial judgement, not
> delegable — see `content/decisions/_README.md`.

---

## 6. Index surfaces

### IndexShell — `components/chrome/IndexShell.tsx`
The shared frame for `/projects`, `/writing` and `/about`. **Two shapes**,
picked by whether the page passes `children`.

**With a sheet** (`/about`): two bands. The **header section** is a full window
tall — masthead at its top, the rest deliberately empty so a background can
carry it. The **sheet** holding the content is pulled back up over the header's
bottom band by `--index-peek`, so the first row is already showing before a
single scroll. The header doesn't stop where content starts: it runs on
underneath, and the content sits on it.

**Without one** (`/projects`, `/writing`): no sheet at all. The page is exactly
one window — masthead on top, background from `--index-bg-top` (62svh) to the
bottom edge — and the only thing a scroll reveals is the site footer. Once the
background *is* the navigation there is no foreground list competing with it, so
it takes the whole lower half of the screen instead of a contained band.

The header section is also the shutter's panel. It takes a `background` **slot**
rather than a typed prop, so a page can put a video, a canvas or a graph there
without the shell knowing — which is exactly how the knowledge graph gets onto
`/projects` and the typed nav onto `/writing`. Those two also pass
`backgroundInteractive`, which drops the slot's `aria-hidden`: it is right for a
texture and wrong for the only links on the page.

It exists as a component because the indexes had already drifted apart once.

### TileGrid — `components/index/TileGrid.tsx`
**Currently unused.** It was the foreground on `/projects` and `/archive`; both
indexes now navigate through their background instead, so nothing renders it.
Kept rather than deleted because `mode: "peek"` is a supported entry state whose
only implementation lives here — an entry flipped to `peek` today would resolve
correctly in `lib/entries` and have nothing to open it. Described as built.

Two columns of **equal width with varying heights**, so the columns flow out of
step and rows stop lining up. The asymmetry is carried by height alone — six
cover ratios cycled by index, so a column runs a full pass before repeating.

At rest a card is only its cover. Name and description are **held back until
hover** — it keeps the grid scannable as a set of images and puts the words
where the cursor already is. Place and term stay visible, because those are what
you sort by when nothing is hovered.

The grid does **no routing arithmetic**. It used to take a `basePath` and glue a
slug on, which assumed a project's URL followed the index it appeared on — no
longer true.

### PeekCard — `components/index/PeekCard.tsx`
A large picture-in-picture card sliding in over the index. The middle setting of
the three modes: more than a tile, less than a page, and **crucially not a
navigation**.

For two kinds of project: those without enough depth to carry a case study, and
those that live somewhere else and aren't worth rebuilding.

Content is resolved in `lib/entries` and arrives pre-filled from the entry's own
metadata, so flipping to `peek` needs no new writing. Every `PeekContent` field
is optional and falls back to `meta`.

**`onward` is what stops it being a dead end** — a peek over a project with a
page ends in "read the case study"; over an external document, a link to it. The
modes aren't really exclusive in the UI, only in what the tile does first.

Traps focus, restores it on close.

### WorkGraph — `components/graph/WorkGraph.tsx` + `lib/graph/`
A force-directed knowledge graph, used as `/projects`' header background.

**Four node types:** projects, plus three separate tag types — **domain**
(`tags:`), **skill** (`skills:`) and **tool** (`tools:`). Three rather than one
because a label can plausibly appear in more than one column ("CAD" as a skill,
"SolidWorks" as the tool) without meaning the same node.

Built from `getEntries()` with **no section filter**, so it's always the whole
pool — that's what lets Work read as a subselection of something broader.
Nothing is hand-authored: edit `tags:`/`skills:`/`tools:` on a project and the
graph changes.

Interaction: live drag physics (d3-force, the simulation stays alive rather than
one-shot), pan/zoom (d3-zoom, 0.5×–4×), a dot-grid backdrop that pans with it,
icon-per-type nodes, a legend, and a fullscreen toggle.

Two coordinate spaces, not one scaled version of the other: the framed panel
keeps its 960×540 tuning, fill mode gets 1600×1200 so fixed-size badges get more
breathing room. Force constants are stored as **fractions of `dims.width`** so
one K-set behaves identically on both.

Label dedup: same label collapses to one node however it was cased or spaced;
display keeps the first-seen form.

> **Status: data- and interaction-complete, not styled.** Visual design is
> explicitly not final.

---

## 7. The case-study chassis

`components/case-study/`. Traces, Loco and Unflattening are the same page with
different content.

> **The rule: nothing in this directory knows about a specific project.**
> Everything takes its content as props — the banner as a node, the rail as
> data, the beats as a render prop, the palette as token overrides.

`case.module.css` is the single source of truth for type, spacing and layout
across all three. Add to it rather than forking a project-local stylesheet.

Full detail lives in **`docs/CASE_STUDY_FORMAT.md`**. The shape:

| Piece | What it is |
| --- | --- |
| `CaseShell` | Banner, three-margin layout, contents rail, Pixel's margin, hero chrome |
| `Banner` | Texture slot + gradient floor + title plate. Stickers anchor to the *title block*, not the banner corner |
| `Contents` | Purpose-built rail — mono index, title, optional `[PROCESS]` tag. Marks the current beat by colouring the index rather than moving the row |
| `Carousel` | One-at-a-time walk through screens. Steps with no image render an outlined placeholder rather than being dropped, so the walk keeps its real length |
| `MoreProjects` | Closing row — two neighbours plus a way back |
| `primitives.tsx` | `Beat`, `Chain`, `Disclosure`, `CardRow`, `StepList`, `Stat`/`StatRow`, `Slot`, `ActionRow`, `useFocusRow` |

**Which primitive for which beat** is tabulated in `CASE_STUDY_FORMAT.md` §5.

### Immersive chrome — `useImmersiveChrome.ts`
App-style behaviour: scrolling down hides everything, scrolling up brings it
back.

**Two pieces of state, not one**, because they don't always move together:
`chrome` (header/footer) and `rails` (contents rail + Pixel). Scrolling moves
both; summoning Pixel from inside the page moves only `rails` — the header
should never come back uninvited, since the point of tapping Pixel is to stay
where you are.

Direction is **accumulated**, not read per-event: a trackpad gesture emits
counter-direction jitter, and reacting to each event makes the chrome flicker.
Only sustained travel past 10px flips it.

`useHeroChrome(depth)` toggles the white-header class while scrolled above the
banner. `useNavAccent` sets `--nav-pixel-accent` per project — *flagged in the
TODO as not quite right yet.*

---

## 8. Project pages, individually

Three hand-built case studies, each with its own bespoke pieces:

**Traces** (`/projects/traces`) — magenta `#ee15a5`. Its banner texture is
`Wall.tsx`, a scrolling marquee of user-reported frustrations. Its problem
section carries two hand-drawn SVG charts and a screenshot, swapped by a
selector (§12).

**Loco Lavatory** (`/projects/loco`) — monochrome, deliberately. Carries the
`STL viewer for design in view` slot that `components/stl/` is waiting to fill.

**Unflattening** (`/projects/unflattening`) — orange `#ffa554`. The thesis. Has
its own `Grid.tsx` and the largest figure set: **twelve inline SVG diagrams**
plus a reading-list shelf, in `components/projects/figures/`.

### Inline SVG diagrams — `components/projects/figures/`
Diagrams addressable from markdown as `![alt](diagram:fig-4-3-1 "caption")` via
the registry in `index.ts`. Each has a hand-tuned version and a `generated/`
counterpart.

`InlineSvgDiagram.tsx` wraps them: they animate on view, can be replayed, and
open into a **portalled full-screen overlay**. Because the overlay is portalled
out of the page, the `--fig-*` custom properties the figures read have to be
carried across explicitly — that's what `CARRIED_TOKENS` is for.

---

## 9. The reader — writing and markdown projects

`/writing` and the markdown-backed projects are **the same reader pointed at two
folders**. Adding to either is one step: drop a `.md` file into
`content/writing/` or `content/projects/`. The filename becomes the slug, and
the index, sitemap, metadata, contents rail and Pixel's notes all derive from
the file. There is no list to keep in step.

Loading rules live once in `lib/writing/collection.ts`.

### Why remark and not MDX

`lib/writing/parse.ts` parses markdown to an mdast tree on the server.
**`@next/mdx` was rejected for one reason:** the reader needs the document as a
*structure* — preview, body, headings, notes — and MDX hands back a single
opaque component whose children can only be split by poking at React internals.
Parsing to mdast lets every one of those fall out of the same pass.

### Frontmatter

```markdown
---
title: Design Manifesto
subtitle: A brief explanation of my outlook on design.
description: One or two sentences. Used on the index card and in the OG tags.
date: 2026-02-14        # sort order, newest first
version: v4             # optional revision label
tags: [manifesto]       # optional — also becomes a graph node
skills: [...]           # optional — graph node
tools: [...]            # optional — graph node
recommended: true       # optional — drives the index's "Start with…" note
draft: false            # true hides it from production entirely
---
```

### Body syntax

| Syntax | Effect |
| --- | --- |
| Shallowest heading level | The section break — `##` and `###` both work, whichever you reach for |
| `Preview:` / `Expanded:` | Splits a section in two. Both optional; without them the first paragraph previews the rest |
| `[NOTE anchors: body]` | A margin annotation, opened by the named bold words (§5c) |
| `[FIGURE key: caption]` | A diagram from the registry |
| `![alt](/path.png?w=1600&h=900)` | An optimised `next/image`. The `w`/`h` query is how a raster tells `next/image` its ratio — without it the figure falls back to a plain `<img>` and the page reflows on load |
| `![alt](diagram:key "caption")` | A registry component |
| `[PLACEHOLDER file.svg: caption]` | A dashed frame naming the asset it's waiting for, so a document can be written around its diagrams |
| `<!-- private -->` after a heading | Keeps that section out of production; renders in dev, badged |

### The reading layout

Three columns: contents rail pinned left, a fixed measure in the middle, and a
right-hand margin where annotations open above Pixel.

- **`SectionCard`** — heading, preview, and the rest behind a toggle. The toggle
  sits **on the heading line**: below the text it read as a button interrupting
  the essay, and you had to reach the bottom of the preview to learn there was
  more. The body **stays mounted while collapsed** rather than unmounting, so the
  text is in the HTML for crawlers and the height transition has something to
  measure; `inert` keeps it out of the tab order and off screen readers.
- **`Toc`** — rendered twice, a rail on wide screens and a collapsible bar on
  narrow ones, because the two need genuinely different furniture. Both share
  their row components.
- **`ReaderContext`** — which sections are open, and which is being read. A
  context because two places must agree: the section's own toggle and the
  sidebar's jump links, since a link to a subheading has to open the section
  hiding it first.

### One scroll listener — `lib/useScrollFrame.ts`
Page-level scroll values are read **once per frame, together**, before any
subscriber runs.

Before this, the Traces page ran six independent scroll subscriptions, each with
its own rAF and geometry reads. Every callback read layout after another may
have written to it, forcing synchronous reflow, and six separately-scheduled
frames couldn't be batched.

---

## 10. Motion and text effects

Every animated surface honours `usePrefersReducedMotion` (`lib/hooks.ts`).

### Per-project animated titles — `components/archive/TitleEffect.tsx`
Eight per-glyph title animations, and **the choice isn't decorative** — the
effect is the first thing that says what the project is about, before a word is
read:

| Effect | Why that project |
| --- | --- |
| `ferrofluid` | Letters coalesce out of blobs — literally what the object does to ferrofluid |
| `split` | Letters split into strips, the way bamboo is prepared |
| `bend` | Letters bend and stay bent — the entire finding |
| `rails`, `scatter`, `assemble`, `weave`, `glow` | The rest |

All eight animate on mount and **never loop** — a heading that keeps moving
while you read under it is a cost with no return. Everything is transform and
opacity, so each composites on the GPU and none trigger layout.

### Document titles — `components/writing/DocumentHeader.tsx`
`words` (fades in a word at a time — the default, right for a sentence) or
`particles` (builds the title from its own glyphs; only suits a short, single
word). Any other value is looked up in the title-effect registry.

`TextEffect` is used here and **nowhere further down the page** on purpose: it
only renders its words while `trigger` is true, which suits a heading above the
fold. Section headings further down must survive in the HTML whether or not
they've been scrolled to, so those use plain `whileInView` transforms.

### `components/motion-primitives/`
`text-effect`, `text-loop`, `text-morph`, `text-roll`, `text-scramble`,
`text-shimmer`, `text-shimmer-wave`, `particle-text`.

> Note in `docs/TODO.md`: adding `@react-three/fiber` globally augments
> TypeScript's JSX namespace project-wide, which broke `text-morph.tsx` — fixed
> with a scoped cast. Worth remembering if more polymorphic `as`-prop components
> get added.

---

## 11. Page-specific features

### Bookshelf — `/about`
21 books from Goodreads, covers self-hosted, click a spine to open the book.

Two shelves share furniture via `components/bookshelf/Shelf.tsx` — the scroll
rail, the spine button, the open-book frame — and **nothing else**. The personal
shelf carries a Goodreads rating and review; the thesis corpus
(`components/projects/figures/ReadingListShelf.tsx`) carries curated
`says`/`why`/`took` annotations. The split is **by shape, not by feature**: the
data shapes genuinely differ, but the spine math, centring and 117 lines of CSS
were identical.

Spine colourways: the corpus hand-authors one per book (each was chosen for a
reason); the personal shelf **generates** one from a hash of the id, since
Goodreads data has no equivalent curation. Same book, same spine, every render.

Cover sizes come from `lib/bookshelf/cover-sizes.json`, generated by
`scripts/measure-covers.mjs` — `next/image` needs intrinsic dimensions to reserve
the right box, and the shelves render at a fixed height with `width: auto`, so
the width depends on each cover's own ratio.

### Cursor image trail — `/about`
Images pop in behind the cursor as it moves and fade out. Purely decorative:
the whole layer is `pointer-events: none` and it **never mounts its listener on
a coarse-pointer device**, where there's no cursor to trail.

A **fixed-size DOM pool** (6 nodes) rather than one node per pop, with two
independent counters — one choosing which node to reuse, one choosing which
image. That split is what lets a fast sweep show several different images at
once while a slow one still reuses nodes instead of growing the DOM unbounded.

Positions are applied with GSAP `x`/`y` (a transform), so nothing triggers
layout. Fires after 90px of travel, with 26px of jitter so a straight sweep
doesn't line the images up like beads.

> Images are **placeholders** — borrowed book covers from the same page.

### STL viewer — `components/stl/`
`StlViewer.tsx` (the public component) + `Scene.tsx` (the three.js scene) +
`stl.module.css`. Orbit, zoom, damping, an axis gizmo, and an optional file
picker so a visitor can load their own `.stl`.

`Bounds` refits the camera to whatever geometry mounts, since uploaded files can
be any scale; `key={modelUrl}` forces a remount so a failed load doesn't keep
stale geometry on screen.

The scene is loaded with `next/dynamic({ ssr: false })` and lives in its own
module — three.js needs a real DOM/WebGL context, which doesn't exist during
server rendering. `ssr: false` must be called from a Client Component, hence
`"use client"` on the viewer rather than a server wrapper. **This also means it
costs nothing until used**: three and `@react-three/*` are only fetched by a page
that actually mounts it.

Test asset: `public/stl/icosahedron.stl`, generated by
`scripts/generate-test-stl.mjs` (closed-form icosahedron, no download).

> **Built and kept, but nothing mounts it.** Its intended home is the
> `STL viewer for design in view` slot in `app/projects/loco/sections/Fix.tsx`,
> blocked on there being an actual `.stl` of the unit. Survived the removal of
> the dev labs specifically because it's wanted later.

---

## 12. Charts — Bklit UI

`components/charts/` is **not hand-authored**. It's the chart set from
[Bklit UI](https://ui.bklit.com), pulled in through the shadcn CLI from a
registry declared in `components.json`:

```json
"registries": {
  "@bklit": "https://ui.bklit.com/r/{name}.json",
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

It's ESLint-ignored on purpose — not linted against this project's stricter hook
rules upstream, and **re-pullable with `shadcn add`**, so fixes belong at the
source, not here.

What it provides: line and bar charts, stacked and horizontal variants, tooltips,
animated series paths, projection lines, reference areas, hover-dim, loading
states and skeletons, pattern fills, and a full token set wired into
`app/globals.css` (`--chart-*`).

### Resolved — Traces is on Bklit now (2026-09-02)

**Bklit is this site's chart system.** The Figma frame for Traces labels its
slot "custom bklit UI chart", and the old board build genuinely used it. For a
while the live page drew its two figures as hand-rolled inline SVG because of
two real bugs in the registry; both are now **fixed locally at the source**
(upstream was checked on 2026-09-02 and still ships both):

1. **`BarChart` horizontal + stacked final-segment width** — the geometry
   subtracted two unrelated scaled positions (`scale(value) - scale(offset)`)
   instead of scaling the cumulative span, so any segment smaller than the
   running total before it went negative and didn't draw. Fixed in
   `components/charts/bar.tsx`.
2. **`LineChart` zero-based y-domain** — `resolveTimeSeriesYDomain` had no
   floor. The registry now takes `yScaleDomainMin`
   (`LineChart` → `time-series-chart-shell.tsx`), added for Traces' 130–152
   "Love lost" series and available to every future chart.

`app/projects/traces/sections/problem.data.tsx` now renders both figures on the
registry (tooltips carry the per-segment percentages the hand SVG printed;
`role="img"` labels carry the sentence for screen readers). The one remaining
hand-rolled piece is the year-label row under the line chart, because the
registry's `XAxis` only prints month-day labels.

**A re-pull with `shadcn add` will overwrite both fixes** — diff
`components/charts/bar.tsx` and `time-series-chart-shell.tsx`/`line-chart.tsx`
before accepting an update, or re-apply from git history.

The live Traces figures, for reference: a stacked-bar Tinder match/gender chart,
a "Love lost" MAU line chart (both digitised off the original board), and a Hinge
prompt screenshot.

---

## 13. Content authoring — where things live

```
content/
├── projects/          # ONE pool serving both Work and Archive
│   ├── <slug>.md      #   markdown-backed entries
│   └── _parked/       #   not in the registry; ignored by the loader
├── writing/           # essays
└── decisions/         # DecisionLogs — Pixel's margin + prompt
```

`source/` holds working material that isn't shipped: thesis extracts, board
scans, drafts, the content model, and the PixelBot SoP.

**Adding a markdown project:** drop the file in `content/projects/`, then add a
row to `ENTRIES` in `lib/entries/registry.ts` with `source: { kind: "document" }`.
Without the registry row it appears on no index, in no graph and in no sitemap.

**Adding a hand-built case study:** see `docs/CASE_STUDY_FORMAT.md` §5.

**Changing how a project is presented:** edit `mode` and/or `section` in the
registry. Nothing else moves.

---

## 14. Build, scripts and configuration

### Scripts

| Script | When | What |
| --- | --- | --- |
| `copy-latest-cv.mjs` | predev / prebuild | Copies the highest-versioned `cv/vN.N.pdf` into `public/` |
| `generate-last-commit.mjs` | predev / prebuild | Snapshots the latest commit to JSON for the footer, so nothing shells out to git at render time |
| `measure-covers.mjs` | manual | Records book-cover dimensions into `cover-sizes.json` |
| `fetch-goodreads-shelf.mjs` | manual, rerunnable | Pulls the Goodreads shelf via its unofficial RSS export and downloads covers locally. Goodreads' real API was shut down years ago — this endpoint is undocumented and could vanish, which is why it's a build-time script and not a runtime fetch |
| `recolor-brand-assets.mjs` | manual | Regenerates `app/icon.svg` and `public/site-loader.webp` in a given accent |
| `generate-test-stl.mjs` | manual | Writes the STL viewer's test icosahedron |

### Commands

```bash
npm run dev        # copy CV + stamp commit, then next dev
npm run build      # same, then next build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
```

`next build` does **not** run ESLint — `next lint` was removed in Next.js 16, so
linting and type-checking are separate steps.

> Only run one dev server at a time. Turbopack's cache grows large and two
> servers fight over port 3000.

### Config notes

- **`next.config.ts`** — `pageExtensions` governs *all* route resolution, so it
  must name every extension any route file uses. It previously carried a
  `dev.tsx` entry in development only, which is what kept the `app/(labs)`
  sandboxes out of production builds entirely. **The labs have been removed**, but
  the mechanism is worth remembering: dropping an extension drops the routes and
  everything downstream of them from the module graph.
- **`tsconfig.json`** — excludes `.next/dev/types/**/*`, so a running dev server's
  stale route-type snapshot can't fail `next build`.
- **`NEXT_PUBLIC_SITE_URL`** must be set in the deployment environment.
  `metadataBase`, `robots.txt` and `sitemap.xml` all derive from it, and it falls
  back to `http://localhost:3000` — fine for dev, must not be what ships.

### Fonts and tokens

Three Google fonts via `next/font`: **Space Grotesk** (sans), **JetBrains Mono**
(labels, indices), **Newsreader** (serif — body and section headings on
`/writing`).

Design tokens live in `app/globals.css` — colours, the dark-mode overrides, the
index ground, layout rails (`--measure`, `--rail-width`, `--notes-width`,
`--page-max`), Pixel's sizes, and the `--chart-*` set.

---

## 15. SEO, analytics and accessibility

**Metadata.** A sitewide default description with a `%s — Vidush Gupta Portfolio`
title template; per-route overrides on the indexes and every document.
OpenGraph and Twitter cards are set. **There is no share image** — there's no
card in `public/`, and an `openGraph.images` pointing at a missing file previews
worse than none at all.

`sitemap.xml` is generated from `ROUTES` + writing documents + every entry with a
`pageHref`. Entries whose content is external have no page to list; drafts don't
resolve in production, so an unpublished project can't leak in.

**Analytics.** `@vercel/analytics` sitewide — automatic pageviews plus custom
`track()` events: `sticker_vote`, `outbound_link_click`, `contact_email_click`,
and project clicks. No-ops safely off Vercel.

**Accessibility, cross-cutting:**

- `usePrefersReducedMotion` is honoured by the shutter, stickers, mascot, title
  effects, cursor trail, footer pit, figures and peek card. Where a gesture
  can't be made meaningful without motion (the footer pit), the reduced-motion
  path settles it once and paints a static frame rather than half-responding.
- The sticker widget's click path exists specifically so keyboard users can vote.
- Peek cards trap focus and restore it on close.
- Tile elements change with mode so links, buttons and external anchors are
  announced correctly.
- Collapsed section bodies stay in the DOM with `inert` — crawlable, but out of
  the tab order.
- Decorative Pixel instances are `aria-hidden`; interactive ones carry labels.

---

## 16. Known removals and recoveries

**The dev labs were removed.** `app/(labs)` held five sandboxes — `/pixel-lab`,
`/text-lab`, `/effects-lab`, `/stl-lab`, `/traces-board` — reachable from a
dev-only menu. Removed along with `components/dev/` (the menu),
`components/traces/` (an earlier "board" build of the Traces case study),
`components/Aurora.tsx` (a React Bits WebGL background) and
`public/traces-board/` (26 board scans).

Kept: **the STL viewer**, promoted to `components/stl/`.

Everything else is in git history. The board scans' provenance also survives in
`source/traces-extract/`, and the Traces figures carry the same digitised
numbers the board did — no data was lost with the images.

`ogl` was dropped from `package.json` (Aurora was its only consumer).
`@visx/*` stays, because Bklit stays.
