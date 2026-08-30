# Portfolio Website

Personal portfolio built with Next.js (App Router), wrapped in a sitewide navbar
and footer. `/writing` is the first real section: a markdown-backed reader laid
out in three columns — contents pinned left, a fixed reading measure in the
middle, and a margin on the right where annotations open above **Pixel** when a
bold word asks for one. Sections open on a preview and expand where you want
them. The
remaining pages are under-construction placeholders fronted by the same mascot,
a hand-authored 24×24 sprite that follows the cursor, blinks, dozes off when
ignored, and can be petted.

## Tech Stack

- **Next.js 16** — App Router, React Server Components
- **React 19**
- **motion** — the animation library formerly published as `framer-motion`
- **TypeScript** — strict, plus `noUnusedLocals` / `noUnusedParameters`
- **CSS Modules** + a small set of custom properties in `app/globals.css`

## Getting Started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Project Structure

```
├── app/
│   ├── (labs)/              # Dev-only sandboxes; no URL segment, all noindex
│   │   ├── lab.module.css   #   chrome shared by every lab page
│   │   ├── pixel-lab/       #   /pixel-lab — sprite sheet, gaze grid, size ramp
│   │   └── text-lab/        #   /text-lab  — text-morph transition candidates
│   ├── about/               # /about
│   ├── contact/             # /contact
│   ├── projects/            # /projects — the index, labelled "Work" in the nav
│   │   └── [slug]/          #   /projects/… — one project, statically generated
│   ├── writing/             # /writing — the index
│   │   └── [slug]/          #   /writing/… — one document, statically generated
│   ├── layout.tsx           # Root layout: fonts, metadata, NavBar/Footer, Pixel
│   ├── page.tsx             # /
│   ├── error.tsx            # Root error boundary
│   ├── loading.tsx          # Root Suspense fallback
│   ├── not-found.tsx        # 404 — pins the mascot to its "dead" expression
│   ├── icon.svg             # Favicon, generated from Pixel's own sprite mask
│   ├── robots.ts            # robots.txt
│   ├── sitemap.ts           # sitemap.xml, generated from lib/site.ts
│   ├── globals.css          # Reset, colour tokens, font bindings
│   └── status.module.css    # Shared by error / loading / not-found
├── components/
│   ├── chrome/              # NavBar, Footer and the animated Logo/loading mark
│   ├── pixel/               # PixelBot — ONE module, one public surface (index.ts)
│   │   ├── AGENTS.md        #   read before touching: do not edit as a side effect
│   │   ├── chat/            #   InChat — the "Ask Pixel" sidebar
│   │   └── screen/          #   InScreen — annotations in the right-hand column
│   ├── writing/             # The essay reader
│   │   ├── figures/         #   inline SVG diagrams, addressed from markdown
│   │   ├── notes/           #   bold-word triggers and the annotations they open
│   │   ├── prose.module.css #   typography for rendered markdown
│   │   ├── ReaderContext.tsx#   which sections are open + which is being read
│   │   ├── SectionCard.tsx  #   heading, preview, expandable body
│   │   └── Toc.tsx          #   contents rail on wide screens, sheet on narrow
│   ├── motion-primitives/   # Reusable text animations, incl. particle-text
│   ├── dev/                 # Dev-only UI (LabMenu), never shipped to production
│   └── UnderConstruction.tsx# The placeholder page shared by the unbuilt routes
├── content/
│   ├── projects/            # The work — one .md file each
│   └── writing/             # The documents themselves — one .md file each
├── lib/
│   ├── projects/            # The project registry, on the same loader
│   ├── writing/             # Markdown -> section tree, and the doc registry
│   ├── breakpoints.ts       # Breakpoints needed in JS as well as CSS
│   ├── hooks.ts             # useMediaQuery and friends
│   ├── utils.ts             # cn() — owned by the shadcn CLI, gets overwritten on `add`
│   ├── format.ts            # formatDate()
│   └── site.ts              # Site URL, nav links, socials, contact, route list
├── public/
│   └── site-loader.webp     # The loading animation; also the logo's hover state
├── eslint.config.mjs        # Flat config for the ESLint CLI
├── next.config.ts
└── tsconfig.json
```

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint (`eslint .`)
- `npm run typecheck` — `tsc --noEmit`

Note that `next build` does **not** run ESLint — `next lint` was removed in
Next.js 16, so linting and type-checking are separate steps.

## Writing and Work

`/writing` and `/projects` are the same reader pointed at two folders. Adding to
either is one step: drop a `.md` file into `content/writing/` or
`content/projects/`. The filename becomes the slug, and the index, the sitemap,
the metadata, the contents rail and Pixel's notes all derive from the file —
there is no list to keep in step. The loading rules live once in
`lib/writing/collection.ts`, and the two registries are thin wrappers over it.

```markdown
---
title: Design Manifesto
subtitle: A brief explanation of my outlook on and approach to design.
description: One or two sentences. Used on the index card and in the OG tags.
date: 2026-02-14        # sort order on the index, newest first
version: v4             # optional revision label
tags: [manifesto]       # optional
draft: false            # true hides it from production entirely
---

## What is Design?

Preview:

Everything above `Expanded:` is what shows while the section is collapsed.

[NOTE person: An aside. This line defines it; the bold word named above is what
opens it, over by Pixel in the corner.]

Expanded:

Everything below it waits behind the "Read the rest" toggle.
```

**Sections.** The shallowest heading level in the file is the section break, so
`##` and `###` both work — whichever you reach for. The level below it becomes a
nested entry in the contents rail and opens its parent section when clicked.

**Preview and expanded.** `Preview:` and `Expanded:` on their own lines split a
section in two. Both are optional: without them the first paragraph previews the
rest, which is the old behaviour.

**Notes.** `[NOTE anchors: body]` defines an annotation. The comma-separated
`anchors` are bold words that become buttons; clicking one opens the annotation
above Pixel in the bottom-right margin — never before. This is PixelBot's
InScreen surface; it lives in `components/pixel/screen/`. Anchors match anywhere in
the document, so `**de-future**` in the last section can point at a note written
in the first:

```markdown
[NOTE de-futuring, de-future: De-futuring is a concept which says that human
activity, through design, has the ability to erase possible future outcomes.]
```

Drop the anchors (`[NOTE: …]`) and the note has no word to open it, so it sets
inline where it was written instead — the one case that shows unprompted. A
`**bold**` word that names no note simply stays bold.

**Figures.** `[FIGURE key: caption]` renders a diagram from the registry in
`components/writing/figures/index.ts`. Standalone markdown images work too, and
`[PLACEHOLDER file: caption]` holds a slot open for artwork that doesn't exist
yet — it renders a dashed frame naming the file it is waiting for, so a document
can be written around its diagrams before they are drawn:

```markdown
[FIGURE design-loop: The relationship between client, designer and user]
![alt text](/writing/plan.png?w=1600&h=900 "caption")
[PLACEHOLDER fig-2-3-1.svg: What the drawing will show]
```

The `w`/`h` query is how a raster image tells `next/image` its aspect ratio —
without it the figure falls back to a plain `<img>`.

**Titles.** A document's `<h1>` fades in a word at a time. A project can opt
into a particle build-up instead — `titleEffect="particles"` on `DocumentHeader`
— which samples the heading's own glyphs and only suits a short, single word.

**Private sections.** `<!-- private -->` on the line after a heading keeps that
section out of production. It still renders in `npm run dev`, badged, so you can
work on it. Whole documents are held back the same way with `draft: true`.

Markdown is parsed by remark on the server (`lib/writing/parse.ts`) rather than
compiled by `@next/mdx`. The reader needs the document as a *structure* —
preview, body, headings, notes — and MDX only hands back one opaque component.

## Dev sandboxes

The routes under `app/(labs)` — `/pixel-lab`, `/text-lab`, `/effects-lab`,
`/stl-lab`, `/traces-board` — are working surfaces, not
portfolio pages. They are reachable from the **labs** menu in the top-right
corner, which only renders in development. All are safe to delete.

They do not exist in a production build at all: every route file in the group is
named `*.dev.tsx`, and `pageExtensions` in `next.config.ts` only recognises that
extension in development. Adding a lab means adding a `page.dev.tsx` and an entry
to `LAB_ROUTES` in `lib/site.ts`, which is the single list the labs menu and
`robots.ts` both read.

## Working docs

Notes that track work in progress live in `docs/`, not the repo root:

- `docs/TODO.md` — what's next.
- `docs/PIXELBOT_BUILD.md` — PixelBot's work queue, and where other features
  file requests against it rather than editing the module.
- `docs/PIXEL_CHAT.md` — PixelBot's decision record (why things are as they are).
- `docs/KNOWN_BUGS.md` — open question marks, not confirmed bugs.

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the production origin — `metadataBase`, `robots.txt`
and `sitemap.xml` are all derived from it, and it falls back to `http://localhost:3000`.

## License

MIT
