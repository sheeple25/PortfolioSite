# The case study format

How Traces, Loco Lavatory and Unflattening are built, and how to add the next one.

**Status:** live. All three are real pages under the Work tab — they graduated
out of `app/(labs)` and are the site's only version of this work. Copy is still
being iterated on; the structure is settled.

| Project | Route | Figma node | Accent |
| --- | --- | --- | --- |
| Traces | `/projects/traces` | `230:10461` | magenta `#ee15a5` |
| Loco Lavatory | `/projects/loco` | `232:11647` | none — monochrome, deliberately |
| Unflattening | `/projects/unflattening` | `232:12450` | orange `#ffa554` |

Figma file key: `j9Qe0Z9qS4qk3KE27Kr0b9`.

Each page lives at `app/projects/<slug>/`, with its route file, its
`<Name>Entry.tsx` and its `sections/` colocated. The markdown documents they
replaced — `content/projects/unflattening.md`, `content/archive/traces.md`,
`content/archive/loco.md` — have been removed; their frontmatter now lives in
`lib/caseStudies.ts`, which is what feeds the Work index, the knowledge graph,
the sitemap and Pixel's system prompt. `/traces-board` remains a dev-only lab.

---

## 1. Why there is a shared chassis

The three Figma frames are the same page. Identical banner, identical
three-margin reading layout, identical contents rail, identical
COLLAPSE/EXPAND sections. The only real differences are the accent colour, the
banner's texture, and which pieces each beat happens to use.

So the chassis lives in **`components/case-study/`** and is the single source of
truth for type, spacing and layout across all three. That is what makes a
future "audit fonts + sizing + spacing" pass land on every project at once
instead of three times with drift.

It lives in `components/`, **not** in a lab directory, because these pages are
going into the real site later and the shared code should not be entangled with
dev-only route files.

### The one rule

> **Nothing in `components/case-study/` knows about a specific project.**

Everything takes its content as props. A project supplies data, a palette, and
its own bespoke figures. If you find yourself writing `if (project === ...)` in
there, the abstraction is wrong — add a prop instead.

The corollary, which matters when work is parallelised:

> **Never fork `case.module.css` into a project-local stylesheet.**
> If a project needs a style that doesn't exist, add it to the shared sheet
> once. Two near-duplicate classes for the same thing is exactly the state this
> structure exists to prevent.

---

## 2. What's in `components/case-study/`

```
case.module.css        1641 lines — the single source of truth
CaseShell.tsx          page wrapper: banner + 3-margin grid + rail + Pixel margin + chrome
Banner.tsx             Banner, BannerImage, Stickers
Contents.tsx           the numbered contents rail + sectionIds()
Carousel.tsx           one-at-a-time walk through screens
MoreProjects.tsx       closing neighbour cards
primitives.tsx         Disclosure, Beat, Chain, CardRow, StepList, Stat, StatRow,
                       Slot, ActionRow, useFocusRow, CASE_ASSETS
useImmersiveChrome.ts  scroll-driven chrome + the white-header-over-hero hook
index.ts               the public surface — import from here
```

Shared icons live in `public/case-study/` (`plus.svg`, `plus-inline.svg`,
`arrow-straight.svg`, `caret-left.svg`, `caret-right.svg`). Project-specific
figures stay under their own folder — e.g. Traces' cycle icons are still in
`public/traces-entry/`.

### `CaseShell` — the page

```tsx
<CaseShell
  palette={PALETTE}          // optional; omit for monochrome
  contents={CONTENTS}        // rail rows
  banner={<Banner …>…</Banner>}
  marginNote="…"             // one line in Pixel's margin
>
  {(at) => (<>
    <Context {...at("s-context")} />
    …
  </>)}
</CaseShell>
```

`children` is a **render prop** rather than plain nodes, because each beat needs
the `at(id)` anchor helper that comes from `ReaderContext` — and a component
can't consume a context it renders itself.

`CaseShell` also owns three behaviours you get for free:

- **Immersive chrome** — scrolling down clears the site header, footer and both
  margins; scrolling up, or reaching either end, returns them.
- **White header over the hero** — the banner bleeds to the top edge *under* the
  sticky `NavBar`, so the header retints white while the banner is behind it.
  See §4 for how that works.
- **Reader tracking** — the rail highlights the beat currently under the reading
  line, by measurement (not `IntersectionObserver`).

---

## 3. The CSS contract — read this before touching anything

### Tokens

`.page` in `case.module.css` declares the whole token set. Everything else in
the sheet reads through these, so re-skinning a project is one object, never a
stylesheet edit.

| Token | Role | Default |
| --- | --- | --- |
| `--tp` | the project accent — headings, indices, marks, arrows | `#1e1e1e` (neutral) |
| `--tp-wall` | type colour for a *text* banner texture | **derived** from `--tp` |
| `--tp-deep` | darker relative, for type that must read on the tint | `#4a4a4a` |
| `--tp-tint` | a wash of the accent, for tinted cards | 4% of ink |
| `--tp-stage` | stage colour behind a carousel | `#efefef` |
| `--ink` / `--ink-soft` / `--ink-mute` | the three text greys | fixed |
| `--mono` / `--serif` / `--sans` | JetBrains Mono / Newsreader / Space Grotesk | fixed |
| `--column` | the reading measure | `773px` |
| `--beat` | distance between top-level beats | `8rem` |

**Neutral is the default, on purpose.** A project turns colour on by passing
`palette` to `CaseShell`. Loco passes nothing and comes out monochrome — so its
lack of colour is a stated decision in code, not an absence someone will later
"fix".

```ts
const PALETTE = {
  accent: "#ee15a5",
  tint: "rgba(238, 21, 165, 0.04)",
  deep: "#9a2f77",
  stage: "#f3e7ef",
  // wall — optional, derived from accent if omitted
};
```

**`--tp-wall` is derived, not defaulted flat.** It is
`color-mix(in srgb, var(--tp) 55%, #ffffff)`. This is a scar: when the tokens
were first made neutral, Traces' palette set `accent` but not `wall`, so the
magenta banner got a grey text wall and looked broken. Deriving it means a
project that overrides the accent **cannot forget** the wall. Override
explicitly via `palette.wall` only if the derived value is wrong for a
particular ground.

### Stylesheet map

`case.module.css` is sectioned with `/* ---- name ---- */` banners in this
order: banner, stickers, layout, contents, type, disclosure, observation chain,
focus rows, stats, charts, placeholders, cycle figure, fix cards, outcome,
carousel, teaser rows, more projects, Pixel's margin, banner texture, steps,
slots, project covers.

Two of those — **charts** and **cycle figure** — are currently Traces-only. They
were left in the shared sheet rather than split out, because the priority is one
place to audit type and spacing. If the sheet gets unwieldy, those are the two
sections to lift into a project-local module first.

### Doing a type / spacing audit

Everything typographic is already centralised. The sizes worth knowing:

- Banner title `clamp(3.5rem, 5vw, 96px)`, spec value `20px`, spec label `14px` mono
- Section heading `clamp(2rem, 2.5vw, 40px)` serif accent
- Lede / prose `clamp(1.75rem, 2.2vw, 36px)`
- Card title `clamp(1.5rem, 1.9vw, 32px)`, small prose `clamp(1.25rem, 1.5vw, 24px)`
- All mono labels `14px`, chart credits/ticks `12px`

Change them here and all three projects move together. That is the whole point —
do not "fix" a size inside a project file.

---

## 4. How the banner works

Three layers, bottom to top: **texture**, **gradient floor**, **title plate**.

- The texture is a **slot** (`children` on `Banner`), not a fixed prop. Traces
  fills it with `<Wall />` (a scrolling text marquee); the other two use the
  shared `<BannerImage src=… />`.
- The **floor** is a `345px` bottom gradient to 34% black. It is what lets white
  type sit on an arbitrary texture. It was raised from the frame's 25% because
  it now has to hold 14px mono labels over a light text wall, a locomotive cabin
  photo, and a bright SF collage.
- The **plate** holds title, spec row and stickers, bottom-anchored.

**The bleed.** `NavBar` is `position: sticky; top: 0`, so it reserves a box in
flow. `.page` pulls the whole page up by `--nav-height` and `.banner` adds the
same amount back to its own height — so the pink starts at y=0 and everything
below lands exactly where it would have. The negative margin is on `.page`, not
on `.banner`, because a negative margin on a first child collapses through its
parent and breaks the moment anything gains padding.

**The white header.** `useHeroChrome(depth)` toggles a `hero-chrome` class on
`<html>` while `scrollY < depth` (480 = the banner's height below the bar). The
rule lives in `app/globals.css` next to the other `data-chrome` rules and works
by **re-pointing NavBar's own tokens** — no rule names a nav link, so the
wordmark, links, current-page marker and Ask Pixel pill all retint together,
including anything added to the bar later.

**Stickers.** Institution marks, anchored to the *title block's* top-right, not
the banner's corner — the banner corner belongs to the site header's controls,
and anything there drifts further from the title as the window widens. When a
project has stickers, `.bannerInnerStuck` sets a `--sticker-gutter` so a long
title (e.g. "Loco Lavatory") wraps instead of colliding.

---

## 5. Adding a new project

1. `app/projects/<slug>/page.tsx` — a server component that exports `metadata`
   built from the registry entry and renders the entry below.
2. `<Name>Entry.tsx` — `"use client"`, composes `CaseShell`. Copy
   `app/projects/traces/TracesEntry.tsx` as the model.
3. `sections/*.tsx` for the beats, `*.content.ts` / `*.data.ts` for copy.
4. Add the project to `CASE_STUDIES` in `lib/caseStudies.ts`, or it exists as a
   URL but appears on no index, in no graph and in no sitemap, and Pixel will
   not know it exists.
5. Verify: `npx tsc --noEmit` and `npx eslint "app/(labs)/<name>-entry"`.

**Do not** start a dev server if one is already on port 3000 — Turbopack's cache
grows large and two servers fight over the port.

### Which primitive for which beat

| Frame element | Use |
| --- | --- |
| Observation → observation → claim | `Chain` |
| Section with COLLAPSE/EXPAND | `Disclosure` |
| Section with a plain heading | `Beat` |
| Three cards (archetypes, positions, principles) | `CardRow` (`tinted` for a statement) |
| Numbered vertical sequence | `StepList` |
| Figures that count up | `Stat` / `StatRow` |
| Undesigned figure | `Slot` (`tall` for the 320px band) |
| "See the full document / DOWNLOAD PDF" | `ActionRow` |
| Screen-by-screen walk | `Carousel` |
| Stepped row that dims the ones you aren't on | `useFocusRow` |

`CardRow` headline faces: `serif` (default), `sans` (sentence case, 24px),
`sans-caps` (uppercase, 32px — for a refusal like "NO SWIPING."). The older
`display` boolean still works and maps to `sans-caps`.

---

## 6. Per-project notes

### Traces (`/projects/traces`)

Content is furthest along. The banner wall is real text with a **hidden sentence
set into it** in medium weight — reading only the emphasised phrases gives
"in this research studio 'We Ourselves' I investigate how technology mediates
romantic relationships because dating apps have a lot of problems. My name is
Vidush Gupta." That's why `wallText.ts` stores alternating noise/sentence
segments rather than one string, and why the rows are split **contiguously** —
the phrases stay in source order so they read down the page.

Two charts are **hand-drawn SVG**, not registry components — see §7.
`Outcome` ("What came of it") is not in the Figma frame; it was added because
the brief in `source/Proposed Structure for Projects..md` requires an outcome
beat. It states the ceiling honestly (studio project, UI mockups, not shipped)
and invents no adoption metrics.

Still open: the `00 Context` lede, the user flow chart, and two of three
carousel screens.

### Loco Lavatory (`/projects/loco`)

Monochrome by design — passes **no** palette. Content came from the former
`content/archive/loco.md` plus pp. 9–14 of
`source/archive/VidushGupta_Spring25_Portfolio_V1.1.pdf`.

**Spec-row conflict, unresolved:** the Figma frame says "1 Month / Fall 2025"
and files "Lead Designer" under `PROJ TYPE`. The archive entry and the CV page
both said Jul–Sept 2024, Fall 2024, "Transport Design Intern". These look like
Traces' values left behind when the frame was duplicated. **The page uses the
archive entry's values**, now carried in `lib/caseStudies.ts`.
Worth correcting the Figma frame.

Carousel copy is written prose (grounded in the requirements list and
interviews, not quoted). Institution URLs are guesses carrying `TODO: confirm`.
No outcome beat — the sources give no outcome figures, so none was invented.

### Unflattening (`/projects/unflattening`)

Content from the former `content/projects/unflattening.md` and the Work-tab
implementation this page replaced. Nothing thesis-bearing was invented.

**Two placeholders that need real assets:** there is no banner image (a book
cover from `public/projects/books/` is standing in) and no thesis PDF, so the
`ActionRow` points at the existing project page instead of shipping a 404 link.
Both are one-line swaps, commented in place. `ReadingListShelf` in
`components/projects/figures` is the real component for the "DRP reading list"
slot whenever you want it.

---

## 7. Traps already hit — don't rediscover these

**An `<img>` cannot be recoloured by a CSS mask.** The chain arrow is exported
from Figma in Traces' magenta. Masking the `<img>` and filling with `--tp`
looks right in the stylesheet but the image's own bitmap paints over the mask.
Arrows are now empty `<span>`s with `mask-image` — one asset, every palette.

**Windows filesystem is case-insensitive.** `wall.ts` and `Wall.tsx` collided
and broke the TypeScript build. The data file is now `wallText.ts`.

**Emphasis by colour disappears on a monochrome page.** `.proseMark` sets a
phrase in `--tp`, which resolves to ink when there's no accent. Use
`.proseStrong` (weight-based) on colourless projects.

**A CSS custom property can't resolve inside an SVG `<stop>`.** The chart
registry's `Line` fades its stroke by building a `<linearGradient>` from the
colour it's given; hand it `var(--tp)` and the stops come out with no
`stop-color` and the line paints invisibly. Bar fills survive it because they
go straight onto the rect. Chart colours passed as data are **literals**;
anything styled by class still goes through the tokens.

**Two bugs in the shared chart registry (`components/charts/`), still unfixed:**

1. `BarChart` with `orientation="horizontal"` + `stacked` miscomputes the final
   segment's width — the men's row rendered its 47% band at `x=287.5,
   width=-32.5`, so half the bar silently didn't draw. `/traces-board` uses the
   same config and **has this bug today**.
2. `LineChart` forces a zero-based y-domain for all-positive data
   (`resolveTimeSeriesYDomain` returns `[0, max * 1.1]`, no floor prop), which
   flattens any series that doesn't start near zero.

Both were worked around by drawing Traces' two charts as plain SVG rather than
patching shared chart infrastructure mid-task. Worth fixing properly — item 1
would also fix `/traces-board`.

**A hydration warning in the dev overlay is a browser extension**, not the code
— it injects `fdprocessedid` attributes and hits NavBar, ThemeToggle and
LabMenu too.

---

## 8. Open items

Tracked in `docs/TODO.md`; the two that matter most for this format:

- **PixelBot must explain what I actually did on each project, on project open**
  (marked VERY IMPORTANT). The process summary — held interviews, extracted
  insights, synthesised, ideated, built UI mockups — can't go in the header
  (bloat) or under the intro (breaks immersion), so it belongs to Pixel's
  right-hand column. Must fire unprompted, not only when asked.
- **Add logo SVGs for the institution stickers.** `Stickers.tsx` already has an
  optional `logo` field per entry; drop an SVG in and fill it.

Also outstanding: confirm the Future Factory URL
(`https://futurefactory.cept.ac.in` is an unverified guess in all three
projects' sticker data).

---

## See also

- `source/Proposed Structure for Projects..md` — the brief this format serves
  (8.4-second rule, the four questions, Problem → research → solution with
  process *after*).
- `source/traces-rebuild.md` — Traces' editorial content plan.
- `docs/TODO.md` — sequencing and open work.
