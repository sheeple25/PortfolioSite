# About page — context, state, and plan

Cold-start doc for the `/about` page. Last updated 2026-08-31. If this chat's
context is cleared, read this first.

Related: `docs/TODO.md`.

---

## 1. The brief

The About page has to hold a balance:

- **Intriguing / engaging** — a reason to stay on the site, not a bio blob.
- **Not irrelevant** — a hiring reader has to get something out of it.
- **Not too personal** — warmth without oversharing.

Hard requirement from Vidush: every personal topic that makes the cut is
expressed through **a unique, fun, interesting component or interaction** — not
a paragraph and not a list.

## 2. Structure — DECIDED

Two acts, on one page. No subpages.

**Act I — the masthead.** Title, a one-paragraph standfirst to its right, and an
infinite-scroll logo marquee underneath. That's the professional read, and it
comes first because it's what buys the page permission to be personal at all.

**Act II — the interest band.** A narrow horizontal band of pixel-art cutouts.
Clicking one expands a shared panel below it; every interest opens into the
*same* slot. Chosen over a subpage-per-interest specifically because flipping
through all of them should cost one click and no navigation — visitors are
meant to try all four.

Reference precedent: `prasjain.com` uses objects-as-doors for her whole site
(six photographic cutouts → `/photos`, `/travel`, `/partnerships`, `/resume`,
`/projects`). Her travel page is a grid of static boarding-pass cards. We can't
adopt that site-wide — this site already has its own chrome (`IndexShell`, the
shutter, Pixel) — so the metaphor is scoped to `/about` and sits *inside* the
existing frame.

### The fixed-panel rule

**The shared panel's height is constant for every interest.** Set once, in
`components/about/InterestBand.module.css`. Some panels are emptier than
others; that is the accepted trade. A slot that resized to its contents would
move the page under the reader on every switch. Same rule as the three
switchable charts in the Traces case study, whose bounding box is likewise held
constant.

Panels must fill the slot (`height: 100%`) rather than size to their content.
Panels that overrun scroll internally — `PanelScroll` is the escape hatch for
components not written to this rule (currently just `Bookshelf`, which grows
when a book opens).

### URL sync

The open interest lives in the URL hash: `/about#travel`, `#reading`, `#games`,
`#pets`. Linkable, and the back button walks through what was opened. The hash
is the *only* source of truth, read via `useSyncExternalStore` — there is
deliberately no duplicate React state.

⚠️ **A slug must never match an element `id` on the page**, or the browser
scrolls to it on load, which is exactly the jump this structure avoids.

## 3. What exists

| Piece | Path | State |
|---|---|---|
| Page (server) | `app/about/page.tsx` | Metadata + standfirst copy + trail image list. Delegates to `AboutView`. |
| Page body (client) | `components/about/AboutView.tsx` | Holds the header element in state for the trail's bounds. |
| Interest band | `components/about/InterestBand.tsx` + `.module.css` | Done. Tablist semantics, arrow/Home/End keys, hash sync, fixed panel. |
| Interest registry | `components/about/interests.tsx` | **Adding an interest is one object in this array.** Nothing counts entries. |
| Departure board | `components/about/DepartureBoard.tsx` + `.module.css` | Done. Solari-style: head strip (name + **live clock/date**), column labels, two columns of 10, remarks strip. Each field sits in its own recessed well; rows stretch to fill so there is **never empty space** on the face. Always dark. |
| Split-flap | `components/motion-primitives/split-flap-text.tsx` + `.module.css` | Vendored from React Bits (MIT), modified — see below. |
| Travel data | `lib/about/travel.ts` | ⚠️ **ENTIRELY PLACEHOLDER.** See §5. |
| Bookshelf | `components/about/Bookshelf.tsx` | Done. Vertically centred in the panel via `PanelScroll`. |
| Book data | `lib/about/personalReadingList.ts` | Generated — `node scripts/fetch-goodreads-shelf.mjs`. Do not hand-edit. |
| Playtime (games) | `components/about/Playtime.tsx` + `.module.css` | Component done; `lib/about/games.ts` is placeholder. |
| Pets | `components/about/PanelPlaceholder.tsx` | Placeholder, waiting on photos. |
| Logo marquee | `components/about/LogoMarquee.tsx` + `.module.css` | Done. 7 logos, seamless loop, pauses on hover. |
| Pixel sprites | `components/about/PixelSprite.tsx` | Hand-drawn 16×16 plane/book/d-pad/paw, on Pixel's own cell grid. Stand-ins for the real cutouts. |
| Cursor trail | `components/about/CursorImageTrail.tsx` + `.module.css` | Done, **scoped to the header** via its `bounds` prop. Images still placeholder. |

### Notes on the vendored split-flap

React Bits' `SplitFlapText` only animates in `words` mode, on its own internal
timer. On a board that drifts — each cell re-schedules with
`cycleDelay + animationDuration`, and that duration depends on how many
characters happened to change, so cells fall out of sync within a few cycles.
The vendored copy makes `text` **controlled**: changing it animates. One timer
in `DepartureBoard` now drives every cell, so the board flips as one machine.

Tiles are state only mid-flip; at rest the render derives them from the target.
That keeps every `setState` inside a `requestAnimationFrame` callback.

### Shared changes made outside `/about`

- `IndexShell` gained two optional props: `banner` (a full-width band under the
  masthead) and `onHeaderElement` (hands the header node out for the trail).
- `IndexShell`'s `.list` no longer caps at `--measure` (42rem). `/writing` was
  visibly narrower than `/projects` and `/archive`; **all four index content
  fields are now the same width** (`--page-max`). The line length that rule
  protected is already held by `components/writing/IndexCard.module.css`
  (36rem on the summary).
- `/projects` standfirst is now a **rebus** — `components/index/Rebus.tsx`,
  logos and emoji standing in for words, set larger so the marks read.

## 4. Still to do

- [ ] **More content under the About title + standfirst** — explicitly planned,
      deliberately left open for now. Goes between the masthead and the
      interest band. Nothing provisional should be put there in the meantime.
- [ ] Replace all travel data (§5).
- [ ] Replace games data.
- [ ] Pets panel — needs photos.
- [ ] **Pixel-art cutout pipeline** — script a sharp downsample → quantise →
      nearest-neighbour upscale pass so every cutout is consistent. Blocked on
      source photos. Once done, set `art` on the registry entries (it takes
      precedence over `sprite`) and re-point the trail.
- [ ] **Cursor trail images are still book covers.** They must become
      pixel-art in the same treatment as the cutouts — two languages of
      scattered image on one page reads as noise.
- [ ] Lifting — cut for now as a component; one line of copy at most. The band
      makes adding it later a single registry entry if that changes.

## 5. ⚠️ Placeholder data that must not ship

`lib/about/travel.ts` — **all 20 rows are invented.** Vidush has been to 22
countries; from/to/date/carrier are facts only he has, and he is supplying
them. Replace the array wholesale rather than appending. The board fills its
face with whatever it is given — more than `TRIPS_PER_PAGE` starts it paging,
fewer makes each row taller — so no layout change is needed as it grows.

`lib/about/games.ts` — two labelled placeholder rows.

## 6. Reference sites

1. https://prasjain.com/ — objects-as-doors; boarding-pass grid for travel.
2. https://huyml.co/about — no metaphor, ~85% credentials, personal as flavour.
3. https://www.rachelchen.tech/about — identity facets (Designer/Builder/Dancer/
   Fun-Haver), each with an image gallery.
4. https://www.sairakhan.design/ — macOS Finder metaphor, site-wide.
5. https://yashf.in/about — whimsical, ~60% personal, doodles get a subpage.
