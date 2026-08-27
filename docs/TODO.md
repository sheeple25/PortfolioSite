# Project TODO

## Done — merged into main (uncommitted)

Built in isolated worktrees, reviewed, merged into the main working tree. Not yet committed to git — sitting as uncommitted changes like the rest of the repo's current work.

- [x] Loader/logo recolor script (`scripts/recolor-brand-assets.mjs`) — takes any hex, regenerates `app/icon.svg` + `public/site-loader.webp` (confirmed to be a 109-frame animated webp, handled correctly). Live assets still untouched — needs `--force` to apply for real, or just bake in the two locked accents (blue/orange) directly now that dark mode's accent decision is settled.
- [x] STL/low-poly 3D viewer spike (`app/(labs)/stl-lab/`) — proven viable (three.js + react-three-fiber + drei + STLLoader, client-only via `next/dynamic`), tested working in-browser. Procedural test icosahedron, not a real asset yet. Note: adding `@react-three/fiber` globally augments TypeScript's JSX namespace project-wide — broke an unrelated text-effects component (`text-morph.tsx`), fixed with a scoped `any` cast. Worth remembering if more polymorphic `as`-prop components get added later.
- [x] About-page bookshelf (`components/about/Bookshelf.tsx`, `lib/about/personalReadingList.ts`, `app/about/page.tsx`) — all 21 Goodreads books fetched and mounted, covers self-hosted, click-to-expand working. About page itself is still bare/placeholder beyond the shelf (barebones About content is a separate open item below).
- [x] Dark mode — manual toggle (header button, defaults to light, no flash, persisted via localStorage), fresh dark palette, `/writing` polish pass, base tokens site-wide. `app/icon.svg` recolored to blue (light-mode default) via the recolor script since a static favicon can't follow the manual toggle live — flag if you'd rather it stayed orange or want the live-swap follow-up built.
- [x] Interactive footer — dark charcoal panel treatment (separate-space feel), "Last shipped X ago · hash" build-time signal, a small matter-js physics pit of the logo's triangles to drag around. Under reconsideration — see "footer direction" in Open below.
- [x] Analytics + sticker rating widget (first pass) — `@vercel/analytics` wired sitewide, `track()` on project clicks/CV downloads/outbound links/sticker votes. Current sticker interaction itself needs rework — see Open below.
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
- [ ] Add logo SVGs for the institution stickers — the per-project header stickers (studio / university / client) currently render as type because no marks exist under `public/`. `Stickers.tsx` already carries an optional `logo` field on each entry: drop an SVG in and fill that one field and the sticker switches from type to mark, no other change. Needed for Future Factory and CEPT University first (Traces), then whatever institutions the other projects carry.
- [ ] Set up a header section for all important projects (consistent per-project header block).
- [ ] Fix the sticker rating feature — current implementation is wrong, needs a rework (not just a tweak).
- [ ] Figure out how the PDF portfolio will work.
- [ ] Get barebones content onto the About page (beyond the existing bookshelf).
- [ ] Wire up a basic contact form, or — likely simpler — a direct link to email. Exact form can be decided later.
- [ ] Decide what replaces the footer if not the Pac-Man-style physics pit currently there.
- [ ] Continue work on PixelBot.
- [ ] DecisionLog artefact per project (beyond the Traces pilot above) — resolves the tension between showing depth of thought (why decisions were made, what makes the thinking distinctive) and keeping visible pages short (low attention span). Content is a sequence of key "why" questions asked + answers found per project, written as plaintext, decoupled from on-page length entirely.
  - Delivery channel 1 (primary): fed to PixelBot as project-specific context, so a visitor can ask PixelBot about a project's decisions directly, in-site — also doubles as a PixelBot showcase.
  - Delivery channel 2 (fallback): plaintext doc + a short copy-pasteable prompt, for recruiters who'd rather drop it into their own LLM than use a chat widget.
  - Written during each project's content pass, not a separate pass.
- [ ] Set up structure for the About + Archive index pages (Work's structure — fixed top 4, knowledge graph — is done above).
  - Archive: catch-all for college/side projects that don't fit current framing — confirmed.
  - About: still undecided beyond the bookshelf — have a bunch of references, no firm shape yet.
  - Image cursor effect: hand-rolled (GSAP, infra already confirmed present), lives on the **About** page only, not global.
- [ ] Redo the Work and Archive index pages in the new style — tied to the page-transition task (linked, not independent: the new index layout and the transition between index → project page need to be designed together, not bolted on after each other).

## Long-term / Revisit Later

Low priority or not yet decided — park here instead of forcing a decision now.

- [ ] Text effects on titles — shelved for a future full micro-animations pass across the whole site rather than a one-off now
- [ ] Visual/styling pass on the knowledge graph — data and interaction are done (physics, pan/zoom, icons, legend); how it should actually look is still open
