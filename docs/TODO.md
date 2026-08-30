# Project TODO

## Done — merged into main (uncommitted)

Built in isolated worktrees, reviewed, merged into the main working tree. Not yet committed to git — sitting as uncommitted changes like the rest of the repo's current work.

- [x] Loader/logo recolor script (`scripts/recolor-brand-assets.mjs`) — takes any hex, regenerates `app/icon.svg` + `public/site-loader.webp` (confirmed to be a 109-frame animated webp, handled correctly). Live assets still untouched — needs `--force` to apply for real, or just bake in the two locked accents (blue/orange) directly now that dark mode's accent decision is settled.
- [x] STL/low-poly 3D viewer spike (`app/(labs)/stl-lab/`) — proven viable (three.js + react-three-fiber + drei + STLLoader, client-only via `next/dynamic`), tested working in-browser. Procedural test icosahedron, not a real asset yet. Note: adding `@react-three/fiber` globally augments TypeScript's JSX namespace project-wide — broke an unrelated text-effects component (`text-morph.tsx`), fixed with a scoped `any` cast. Worth remembering if more polymorphic `as`-prop components get added later.
- [x] About-page bookshelf (`components/about/Bookshelf.tsx`, `lib/about/personalReadingList.ts`, `app/about/page.tsx`) — all 21 Goodreads books fetched and mounted, covers self-hosted, click-to-expand working. About page itself is still bare/placeholder beyond the shelf (barebones About content is a separate open item below).
- [x] Dark mode — manual toggle (header button, defaults to light, no flash, persisted via localStorage), fresh dark palette, `/writing` polish pass, base tokens site-wide. `app/icon.svg` recolored to blue (light-mode default) via the recolor script since a static favicon can't follow the manual toggle live — flag if you'd rather it stayed orange or want the live-swap follow-up built.
- [x] Interactive footer — dark charcoal panel treatment (separate-space feel), "Last shipped X ago · hash" build-time signal, a small matter-js physics pit of the logo's triangles to drag around. Under reconsideration — see "footer direction" in Open below.
- [x] Analytics + sticker rating widget — `@vercel/analytics` wired sitewide, `track()` on project clicks/CV downloads/outbound links/sticker votes. Sticker interaction reworked from the original drag-up/drag-down gesture (`components/chrome/StickerVote.tsx`): two scalloped "Good"/"Bad" seal badges fanned/overlapping at the left edge, click- or drag-anywhere-and-release to place, plants a permanent sticker at the exact page position (survives scroll and a mid-session refresh), double-click a planted sticker to delete it and un-freeze the rail for a new vote. Also fixes the three real bugs the old version had: no keyboard-accessible way to vote, a stale "Rate" label after a refresh, and a left-edge drag that risked fighting the OS back-swipe gesture on mobile. Pixel narrating the gesture and confirming "Vote received!" is still open — batched into the PixelBot item below.
- [x] Contact page (`app/contact/page.tsx`) — real page instead of the "under construction" placeholder: tracked `mailto:` link plus a socials row reusing the footer's `SOCIAL_LINKS`/empty-href convention.
- [x] Tagging data model + knowledge graph (`lib/graph`, `components/graph/WorkGraph.tsx`) — Work page is now the site home (`/` redirects to `/projects`, wordmark links there too). Auto-built from `tags:`/`skills:` frontmatter across `content/projects` + `content/archive`; edit nodes/edges by editing those fields on the relevant project's `.md` file, nothing hand-authored. 16:9 framed panel, fullscreen toggle, lucide icons + legend per node type, live drag physics (d3-force, dormant until a drag wakes it), pan/zoom (d3-zoom) with a panning dot-grid backdrop — modeled on the `drp-graph` reference graph. Visual pass on the rest of the site still pending — this is data/interaction-complete, not styled to final look.

## Open

Sequenced per current priority — Traces is the format pilot everything else replicates from.

- [ ] Close the dev server before ending work for the day — `next dev`'s Turbopack filesystem cache (`.next/dev/cache/turbopack`) grows large (585MB+) and startup time (3-10s) scales with how much changed since the last run; an open server left running overnight also just sits on port 3000.
- [ ] **Traces project work** (items below are one bundled pass, not separate passes):
  1. Restructure/remake the Traces project content for the web — card elements, graphs rebuilt from images rather than flat screenshots, etc.
  2. Severely cut down the content while doing so.
  3. Take a first pass at Traces' DecisionLog (see below) alongside the rewrite.
  - Template doc already written: `source/case-study-procedure.md` (gitignored, not in `content/`) — two templates, OBJECT (Flux/Mizan/Vortex/Matchbox) vs SYSTEM (Traces/Kobble/IFTC/DRP), pre-write worksheet, "every H2 is a claim not a phase label." Traces is SYSTEM-template.
  - Being done conversationally (not delegated to an agent) — worksheet answers are editorial judgment calls, not something to fabricate.
  - Traces is the template: once it's done, apply the resulting format to the rest (next item).
- [ ] **[VERY IMPORTANT] PixelBot must explain what I actually did on each project, when the project opens.** Treat as a required capability, not a nice-to-have — the Traces format is not finished without it, and every project built on that format inherits the gap.
  - The need: recruiters want the process at a glance — held interviews, extracted insights, synthesised, ideated the app, built working UI mockups. The brief (`source/Proposed Structure for Projects..md`) puts "what did YOU do" among the four questions the first 20 seconds has to answer.
  - Why it belongs to Pixel and not the page: it can't go in the project header (bloats it, and the header is already carrying title + spec row + stickers), and it can't go under the intro text (breaks the reader's immersion into the problem, which is the whole job of that opening beat). Pixel already renders text into the right-hand column of the three-column layout and owns the "Ask Pixel" sidebar — so it is text on screen that costs no layout.
  - Must fire **on project open**, unprompted — not only when asked. A recruiter who never clicks the chat still has to see it.
  - Distinct from the DecisionLog item below, though they share one per-project context feed: DecisionLog answers *why* decisions were made; this answers *what I did*. Write both in the same content pass per project.

- [ ] Apply the Traces format to most Archive + Work projects — but not uniformly: some Archive projects should just be simple site links or link out to a premade poster/PDF rather than getting a full custom rebuild, since custom-everything isn't worth the time. Only Flux and Loco Lav are expected to get the full Traces-style treatment; the rest of Archive gets the lighter link-out treatment.
- [ ] Set up a header section for all important projects (consistent per-project header block).
- [ ] Fix all project banners + thumbnails.
- [ ] Figure out how the PDF portfolio will work.
- [ ] Get barebones content onto the About page (beyond the existing bookshelf).
- [ ] Decide what replaces the footer if not the Pac-Man-style physics pit currently there.
- [ ] **PixelBot is a closed module — never edit it as a side effect of other work.** It lives in `components/pixel/` (+ `lib/pixel/`, `app/api/pixel/`), everything outside imports only from `@/components/pixel` (ESLint-enforced), and `components/pixel/AGENTS.md` states the rule. Other features file a row in `docs/PIXELBOT_BUILD.md` §10 Requests plus a line here — they do not edit the module.
- [ ] **[HIGH PRIORITY] Replace the placeholder DecisionLogs in `content/decisions/`.** All seven (`unflattening`, `flux`, `loco`, `matchbox`, `mizan`, `traces`, `vortex`) are scaffolding carrying `placeholder: true`, which hides them from both Pixel's margin and his prompt — so today those surfaces render nothing at all. Each file holds two things written in one pass: `## What I did` (the process summary shown unprompted in Pixel's margin on project open — the VERY IMPORTANT item above) and `## Decisions` (the "why", fed to Pixel's prompt). Drop the `placeholder: true` flag as each becomes real. Editorial judgement, not delegable — see `content/decisions/_README.md`.
  - This is already load-bearing: `source/traces-rebuild.md` cuts content from the Traces page on the explicit basis that "everything else is answerable by Pixel", and `source/content-model.md` routes the whole Interrogate tier here. The page content is being trimmed against an account that is currently empty.
- [ ] **[Parked, don't forget] askVidush queue.** Designed in full, deliberately not built — see `docs/PIXELBOT_BUILD.md` §3 Phase 5 and the Wishlist in `docs/PIXEL_CHAT.md`. Raw conversation capture to Upstash Redis, a weekly Vercel Cron job making one Claude call to extract unanswered questions plus stats, delivered as a dated markdown digest committed to the repo via the GitHub API. Blocked on two account steps of Vidush's own: an Upstash (or Vercel KV) account, and a GitHub token set as a Vercel env secret. Revisit once v1 is live and there is real traffic worth batching.
- [ ] Continue work on PixelBot. **Full compiled plan: `docs/PIXELBOT_BUILD.md`** (phases, defects, blocking decisions); `docs/PIXEL_CHAT.md` for the decision record, `source/PixelBot_SoP.md` for the spec.
  - Have Pixel walk a visitor through the sticker-rating widget (`components/chrome/StickerVote.tsx`) — explain the drag-to-place / click-to-vote gesture, unprompted, so it's discoverable rather than a hidden feature.
  - Have Pixel say "Vote received!" every time a sticker is actually placed (i.e. past `MIN_DRAG_DISTANCE` in `StickerVote.tsx` — not on every attempted drag).
  - Have Pixel smile or frown to match whichever rating sticker ("Good"/"Bad") was placed.
  - Both batched here rather than built standalone — wait until PixelBot's other hookup work lands, then wire all of it at once. (Phase 4 in `docs/PIXELBOT_BUILD.md`; the architecture they need is now in place.)
- [ ] DecisionLog artefact per project (beyond the Traces pilot above) — resolves the tension between showing depth of thought (why decisions were made, what makes the thinking distinctive) and keeping visible pages short (low attention span). Content is a sequence of key "why" questions asked + answers found per project, written as plaintext, decoupled from on-page length entirely.
  - Delivery channel 1 (primary): fed to PixelBot as project-specific context, so a visitor can ask PixelBot about a project's decisions directly, in-site — also doubles as a PixelBot showcase.
  - Delivery channel 2 (fallback): plaintext doc + a short copy-pasteable prompt, for recruiters who'd rather drop it into their own LLM than use a chat widget.
  - Written during each project's content pass, not a separate pass.
- [ ] Set up structure for the About + Archive index pages (Work's structure — fixed top 4, knowledge graph — is done above).
  - Archive: catch-all for college/side projects that don't fit current framing — confirmed.
  - About: still undecided beyond the bookshelf — have a bunch of references, no firm shape yet.
  - Image cursor effect: hand-rolled (GSAP, infra already confirmed present), lives on the **About** page only, not global.
- [ ] Redo the Work and Archive index pages in the new style — tied to the page-transition task (linked, not independent: the new index layout and the transition between index → project page need to be designed together, not bolted on after each other).
- [ ] (Medium priority) Revisit the Ask Pixel pill's per-project accent colour (`--nav-pixel-accent`, set via `useNavAccent` in `components/case-study/useImmersiveChrome.ts`) — something about the current solid-fill result isn't quite right yet; unspecified change, to be decided later.
- [ ] (Medium priority) Custom cursor — ideally a pellet sprite (matching Pixel's Pac-Man-adjacent visual language) that can be "fed" to Pixel as an interaction, rather than the default system cursor.
- [ ] (Medium priority) Create the InScreen annotation for PixelBot — blocked until all content pages are done.

## Long-term / Revisit Later

Low priority or not yet decided — park here instead of forcing a decision now.

- [ ] Discussion around artefacts — things to keep from the portfolio visit.
- [ ] Text effects on titles — shelved for a future full micro-animations pass across the whole site rather than a one-off now
- [ ] Visual/styling pass on the knowledge graph — data and interaction are done (physics, pan/zoom, icons, legend); how it should actually look is still open
