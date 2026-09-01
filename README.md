# Portfolio Website

Personal portfolio for Vidush Gupta, built with Next.js (App Router).

**Work is the home page** — `/` redirects to `/projects`. Every project lives at
`/projects/<slug>` whatever index lists it, and how each one is presented (a full
case study, a card that slides over the index, or a link straight out) is two
fields in one registry.

The site is wrapped in a sitewide navbar and footer, a page transition that rolls
one header shut and the next one open, and **Pixel** — a hand-authored 24×24
mascot who follows the cursor, blinks, dozes off when ignored, reads annotations
out of the margin, and answers questions about the work in a chat sidebar.

> **Looking for what this site actually does?** → **[`docs/FEATURES.md`](docs/FEATURES.md)**
> is the complete reference: every feature, where it lives, why it's there, and
> what's still unfinished. This README is the short version.

---

## Tech Stack

- **Next.js 16** — App Router, React Server Components
- **React 19**
- **motion** — the animation library formerly published as `framer-motion`
- **TypeScript** — strict, plus `noUnusedLocals` / `noUnusedParameters`
- **CSS Modules** + design tokens in `app/globals.css`
- **@anthropic-ai/sdk** — Pixel's chat endpoint (Haiku 4.5)
- **d3-force / d3-zoom** — the knowledge graph
- **three / @react-three** — the STL viewer
- **matter-js** — the footer's physics pit
- **gsap** — the About page's cursor trail
- **@visx** — via Bklit UI, the vendored chart set

## Getting Started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

> Only run one dev server at a time — Turbopack's cache grows large and two
> servers fight over port 3000.

For Pixel's chat, set `ANTHROPIC_API_KEY` in `.env.local`. Everything else works
without it.

---

## Feature summary

The full account is in [`docs/FEATURES.md`](docs/FEATURES.md); this is the index.

| Feature | What it is | Where | Status |
| --- | --- | --- | --- |
| **Entry registry** | One list; `mode` decides what a tile does, `section` decides which index it's on | `lib/entries/` | Shipped |
| **Work index** | Every project on one screen, the knowledge graph as its navigation | `app/projects/` | Shipped |
| **Knowledge graph** | Force-directed graph of projects × domains × skills × tools, built from frontmatter. Nodes are real links with cover thumbnails | `components/graph/`, `lib/graph/` | Shipped as `/projects`'s navigation |
| **Tile grid** | Two columns, unequal heights; names held back until hover | `components/index/TileGrid.tsx` | Built, currently unused — see note below |
| **Peek cards** | A large card slides over the index — more than a tile, less than a page, not a navigation | `components/index/PeekCard.tsx` | Shipped |
| **Shutter transition** | One header rolls shut, the next opens. Navigation deferred until the close finishes | `components/chrome/Shutter.tsx` | Shipped |
| **PixelBot — mascot** | 24×24 sprite; gaze, blink, idle sleep, nine expressions, pettable | `components/pixel/` | Shipped |
| **PixelBot — InScreen** | Bold words in prose open annotations in the right margin | `components/pixel/screen/` | Shipped |
| **PixelBot — InChat** | Streaming chat sidebar, audience-aware, rate-limited | `components/pixel/chat/`, `app/api/pixel/` | Shipped |
| **PixelBot — process note** | "What he actually did", unprompted, on project open | `components/pixel/screen/ProcessNote.tsx` | **Placeholder** — logs empty |
| **Sticker rating** | Drag a "Good"/"Bad" seal anywhere on the page and drop it; it stays where you left it | `components/chrome/StickerVote.tsx` | Shipped, **needs rework** |
| **Pac-Man cursor** | Custom cursor on Pixel's sprite pipeline; chomps on click | `components/pixel/PacmanCursor.tsx` | Shipped |
| **Dark mode** | Manual toggle, no flash, no `prefers-color-scheme` by design | `components/chrome/ThemeToggle.tsx` | Shipped |
| **Animated titles** | Eight per-project title effects, each chosen to say what the project is | `components/archive/TitleEffect.tsx` | Shipped |
| **Case-study chassis** | Banner, three-margin layout, contents rail, beat primitives | `components/case-study/` | Shipped |
| **The reader** | Markdown → section tree; previews, expandables, notes, figures, contents rail | `lib/writing/`, `components/writing/` | Shipped |
| **Inline SVG diagrams** | 12 animated thesis figures, replayable, full-screen | `components/projects/figures/` | Shipped |
| **Bookshelf** | 21 Goodreads books, click a spine to open it | `components/about/`, `components/bookshelf/` | Shipped |
| **Cursor image trail** | Images pop in behind the cursor (About only) | `components/about/CursorImageTrail.tsx` | Shipped, placeholder art |
| **Footer** | Dark panel, "last shipped" stamp, draggable physics pit | `components/chrome/Footer.tsx` | Shipped, under review |
| **STL viewer** | Orbit/zoom 3D model viewer with optional file upload | `components/stl/` | Built, **not mounted yet** |
| **Charts** | Vendored Bklit UI chart set | `components/charts/` | Vendored, **unused** — see below |

### The five things that need attention

1. **The seven DecisionLogs in `content/decisions/` are all placeholders.** Two
   Pixel surfaces render nothing as a result — and the Traces page was
   deliberately trimmed on the assumption Pixel would carry that content.
2. **Pixel can't yet say what you did on a project** — the top TODO item, blocked
   on (1).
3. **`mode: "link"` has no URLs.** The mechanism is wired end to end; the CEPT
   portfolio addresses aren't recorded anywhere in the repo.
4. **The sticker widget needs a function and appearance pass.**
5. **Traces' charts should move onto Bklit UI** — the Figma frame calls for it and
   the old board build used it, but two upstream bugs (a stacked horizontal
   `BarChart` that drops its last segment, and a `LineChart` that forces a
   zero-based y-domain) mean the live figures are hand-rolled SVG instead.

---

## Project Structure

```
├── app/
│   ├── about/               # /about — bookshelf + cursor trail (rest placeholder)
│   ├── api/pixel/           # POST /api/pixel — Pixel's streaming chat endpoint
│   ├── contact/             # /contact
│   ├── projects/            # /projects — the one project index, and every project page
│   │   ├── [slug]/          #   markdown-backed entries, via the reading shell
│   │   ├── loco/            #   hand-built case study
│   │   ├── traces/          #   hand-built case study
│   │   └── unflattening/    #   hand-built case study
│   ├── writing/             # /writing — the index
│   │   └── [slug]/          #   one document, statically generated
│   ├── layout.tsx           # Root: fonts, metadata, chrome, Pixel, no-flash script
│   ├── page.tsx             # / — redirects to /projects
│   ├── error.tsx            # Root error boundary
│   ├── loading.tsx          # Root Suspense fallback
│   ├── not-found.tsx        # 404 — pins the mascot to its "dead" expression
│   ├── icon.svg             # Favicon, generated from Pixel's own sprite mask
│   ├── robots.ts            # robots.txt
│   ├── sitemap.ts           # sitemap.xml, from lib/site.ts + entries + writing
│   ├── globals.css          # Reset, tokens, dark mode, chrome rules
│   └── status.module.css    # Shared by error / loading / not-found
├── components/
│   ├── about/               # Bookshelf, CursorImageTrail
│   ├── archive/             # ProjectMeta, TitleEffect (the 8 title animations)
│   ├── bookshelf/           # Shelf furniture shared by both shelves
│   ├── case-study/          # The chassis — see docs/CASE_STUDY_FORMAT.md
│   ├── charts/              # Bklit UI, vendored via the shadcn CLI. Not hand-authored
│   ├── chrome/              # NavBar, Footer, Shutter, IndexShell, StickerVote,
│   │                        #   ThemeToggle, BottomEdge, SectionGround, Logo
│   ├── graph/               # WorkGraph — the knowledge graph canvas
│   ├── index/               # TileGrid, PeekCard, toTile — the index surfaces
│   ├── motion-primitives/   # Reusable text animations, incl. particle-text
│   ├── pixel/               # PixelBot — ONE module, one public surface (index.ts)
│   │   ├── AGENTS.md        #   READ FIRST: do not edit as a side effect
│   │   ├── chat/            #   InChat — the "Ask Pixel" sidebar
│   │   └── screen/          #   InScreen — annotations in the right-hand column
│   ├── projects/figures/    # The 12 inline SVG thesis diagrams + reading shelf
│   ├── stl/                 # StlViewer — 3D model viewer, built, not yet mounted
│   └── writing/             # The essay reader: sections, TOC, figures, prose
├── content/
│   ├── decisions/           # DecisionLogs — feed Pixel's margin and prompt
│   ├── projects/            # ONE markdown pool serving Work AND Archive
│   └── writing/             # The essays
├── lib/
│   ├── entries/             # THE registry — mode, section, resolution
│   ├── graph/               # Graph data model, built from entry frontmatter
│   ├── pixel/               # System prompt, limits, rate limiting, DecisionLogs
│   ├── writing/             # Markdown -> section tree, and the collection loader
│   ├── bookshelf/           # Spine geometry + measured cover sizes
│   ├── site.ts              # Site URL, nav links, socials, contact, route list
│   ├── useScrollFrame.ts    # ONE scroll listener for the whole page
│   └── hooks.ts             # useMediaQuery, usePrefersReducedMotion, and friends
├── scripts/                 # Build-step and one-off generators (see below)
├── source/                  # Working material, not shipped: drafts, extracts, SoPs
└── docs/                    # The working docs — start with FEATURES.md
```

---

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint (`eslint .`)
- `npm run typecheck` — `tsc --noEmit`

`next build` does **not** run ESLint — `next lint` was removed in Next.js 16, so
linting and type-checking are separate steps.

`dev` and `build` both run two prebuild steps first: `copy-latest-cv.mjs` (copies
the highest-versioned PDF out of `cv/`) and `generate-last-commit.mjs` (stamps
the footer's "last shipped" line, so nothing shells out to git at render time).

Manual generators live alongside them: `measure-covers.mjs`,
`fetch-goodreads-shelf.mjs`, `recolor-brand-assets.mjs`, `generate-test-stl.mjs`.

---

## Adding work

**A markdown project.** Drop a `.md` into `content/projects/`, then add a row to
`ENTRIES` in `lib/entries/registry.ts`. Without the registry row it appears on no
index, in no graph and in no sitemap.

**A hand-built case study.** Follow `docs/CASE_STUDY_FORMAT.md` §5.

**An essay.** Drop a `.md` into `content/writing/`. Nothing else to update — the
index, sitemap, metadata, contents rail and Pixel's notes all derive from the
file.

**Changing how a project is presented.** Edit `mode` (`case-study` / `peek` /
`link`) and/or `section` (`work` / `archive`) in the registry. Nothing else
moves — no file changes folder, no URL changes.

### Frontmatter

```markdown
---
title: Design Manifesto
subtitle: A brief explanation of my outlook on and approach to design.
description: One or two sentences. Used on the index card and in the OG tags.
date: 2026-02-14        # sort order on the index, newest first
version: v4             # optional revision label
tags: [manifesto]       # optional — becomes a domain node in the graph
skills: [...]           # optional — becomes a skill node
tools: [...]            # optional — becomes a tool node
recommended: true       # optional — drives the index's "Start with…" note
draft: false            # true hides it from production entirely
---
```

### Body syntax

Full table in [`docs/FEATURES.md` §9](docs/FEATURES.md). The essentials:

- **Sections** — the shallowest heading level in the file is the section break,
  so `##` and `###` both work.
- **`Preview:` / `Expanded:`** on their own lines split a section into what shows
  collapsed and what waits behind the toggle. Both optional.
- **`[NOTE anchors: body]`** defines a margin annotation; the comma-separated
  bold words become the buttons that open it, over by Pixel. Anchors match
  anywhere in the document.
- **`[FIGURE key: caption]`** renders a diagram from the registry.
  `[PLACEHOLDER file.svg: caption]` holds a slot open for art that doesn't exist
  yet.
- **`![alt](/writing/plan.png?w=1600&h=900)`** — the `w`/`h` query is how a raster
  tells `next/image` its aspect ratio; without it the figure falls back to a
  plain `<img>`.
- **`<!-- private -->`** on the line after a heading keeps that section out of
  production while still rendering it, badged, in dev.

Markdown is parsed by remark on the server (`lib/writing/parse.ts`) rather than
compiled by `@next/mdx` — the reader needs the document as a *structure*
(preview, body, headings, notes), and MDX only hands back one opaque component.

---

## Working docs

Notes that track work in progress live in `docs/`, not the repo root:

- **`docs/FEATURES.md`** — every feature, where it lives, what's unfinished. Start here.
- `docs/TODO.md` — what's next, sequenced.
- `docs/CASE_STUDY_FORMAT.md` — the case-study chassis in detail.
- `docs/PIXELBOT_BUILD.md` — PixelBot's work queue, and where other features file
  requests against it rather than editing the module.
- `docs/PIXEL_CHAT.md` — PixelBot's decision record (why things are as they are).
- `docs/KNOWN_BUGS.md` — open question marks, not confirmed bugs.

`source/` holds working material that never ships: thesis extracts, board scans,
content drafts, the content model and PixelBot's SoP.

---

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the production origin — `metadataBase`,
`robots.txt` and `sitemap.xml` are all derived from it, and it falls back to
`http://localhost:3000`.

Set `ANTHROPIC_API_KEY` for Pixel's chat. **Also set a spend limit on that key**
— the in-process rate limiter is per-instance on a serverless host and raises the
cost of abuse without capping it.

## License

MIT
