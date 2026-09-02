# The work graph — what it was, what survives

Written 2026-09-01, from `8092928` — the last commit before the `/projects`
revamp. §§1–3 describe the graph **as it was at that commit**, present tense;
§4 is what shipped.

Not an obituary. The graph was **demoted from primary navigation to the expanded
view**, not deleted. This records what it was built to do, so the part worth
keeping was kept deliberately rather than by accident, and so the part dropped
was dropped for a stated reason.

Prior art: `docs/INDEX_NAV_REDESIGN.md` is the doc that *built* this. It stays
as written. One thing in it is now stale — its §0 table points at a `CENTERING`
constant in `WorkGraph.tsx` that no longer exists.

---

## 1. What it is, concretely

| File | Lines | Job |
|---|---|---|
| `components/graph/WorkGraph.tsx` | 1371 | The canvas — physics, zoom, drag, hover, panel, legend |
| `components/graph/WorkGraph.module.css` | 641 | Its styling |
| `lib/graph/layout.ts` | 602 | Where every node goes. Pure function of `(graph, dims, inset, mode)` |
| `lib/graph/index.ts` | 160 | The dataset — `getProjectGraph()` |
| `lib/graph/cover-ink.json` | 19 | Measured light/dark ink per cover |

**One entry point:** `app/projects/page.tsx`, as `background={<WorkGraph …>}`.
Nothing else imported it. That clean seam is what made the swap cheap — it is
now `backgroundExpanded={<WorkGraph …>}` on the same call, and nothing inside
`components/graph` or `lib/graph` changed at all.

**The dataset today:** 9 projects, 26 tag nodes — 8 domains, 12 skills, 6 tools.
Built from `getEntries()` with **no section filter**, which is the one thing on
the site that already knew Work and the Archive were a single pool.

**Position is authored, not simulated.** This was the redesign's central move —
d3-force for 300 ticks was replaced by: projects snap to a grid (`CARD` 168×118,
one size for all); gutters are tried widest→tightest until the grid yields
enough cells with `FREE_CELLS: 3` to spare; every tag then sits at the centroid
of the projects it connects. The physics that remains is a spring home
(`HOME_STRENGTH: 0.09`) plus collision — enough that a dragged node fights back,
not enough to decide anything.

**The interaction:** hover *or* click a node → walk `graph.edges` → everything
outside the connected set gets `data-dim` → the persistent left panel names the
connected projects by title (`activeProjects`) and, for a project, lists its
facts (`detailFacts`). A four-row legend sits bottom-left. Pan/zoom is d3-zoom
at `[0.5, 4]`; drag pins `fx`/`fy` and releases back to home. Full-screen expand
was hoisted out of here into `IndexShell` and stays there.

---

## 2. The principle worth keeping

**A tag names the projects that answer it.** A recruiter arrives with a
requirement, not a curiosity. Pointing at that requirement and being told
*which* of the nine pieces of work demonstrate it is the whole value, and the
code already says so — the comment above `activeProjects` reads: *"Dimming the
rest of the canvas was the whole of a tag's answer before, which asks you to
hunt for what stayed lit and then read nine small titles to find out what it
was. Saying the names is the answer."*

The revamp is that sentence promoted from a side panel to the page.

Three secondary principles also carry forward:

- **One pool.** `section: "work"` is presentation (order, size, emphasis), never
  a filter on the data. Nothing about a project's URL or file location depends
  on which index it appears on.
- **Authored position beats simulation** for anything that has to be looked at
  rather than explored.
- **The covers are the visual weight.** Nine photographs are an order of
  magnitude heavier than anything else on the canvas; the composition is
  whatever they do.

---

## 3. Why it is being replaced

- **It never became beautiful.** Nine photographic rectangles on a shared grid
  plus 26 mono labels scattered through the gutters is a diagram. It reads as
  composed rather than scattered — the grid fixed that — but composed is not the
  same as good-looking, and this is the first thing anyone sees of the site.
- **It has to explain its own encoding.** The four-row legend is the tell. A
  navigation that ships with a key is a navigation that failed to be obvious.
- **The one thing worth keeping is unreachable without a pointer.** Project
  cards are `tabIndex={0}`; every domain, skill and tool node is `tabIndex={-1}`.
  So the graph is keyboard-navigable as a list of nine links, and the
  tag→projects insight — the actual value — has no keyboard or touch path at
  all. Read the comment at `WorkGraph.tsx:1019` before judging this: it is a
  reasoned trade, not an oversight — 26 tags scattered across a canvas in no
  meaningful order would mean "pressing Tab dozens of times to walk past the
  tags to the projects." A canvas has no better answer available. A row does:
  facets in a labelled group have an order, can be arrow-navigated, and can be
  skipped in one Tab. That is the argument for rows, stated properly.
- **Touch was scoped around, not solved.** `touch-action: none` means a finger
  on the band pans instead of scrolling the page. The fix was positional — the
  stage above the band (`--index-stage-min: 30svh`, max `44svh`) keeps ordinary
  touch scrolling, and that is how you reach the footer on a phone.
- **It was the landing page.** `app/page.tsx` is a bare `redirect("/projects")`,
  so there is no softer first impression anywhere.

---

## 4. What happened to it — shipped 2026-09-01

**Kept, demoted.** The band now swaps between two views of the same pool, and
`IndexShell` gained a `backgroundExpanded` slot to do it (two node props rather
than the render prop it wants to be — the pages are server components and the
shell is a client one, so a `(state) => ReactNode` cannot cross the boundary).

- **Collapsed — `components/work/WorkBoard.tsx`.** Three facet rows (Domain,
  Skills, Software) over a horizontally scrolling rail packed two rows deep.
  Pointing at a facet lights the work that carries it.
- **Expanded — `WorkGraph`, unchanged.** Mounted only while full screen, so it
  is no longer in the collapsed page's HTML at all.

`lib/graph/*` stays live as-is and `lib/work/board.ts` is a *view over* it
rather than a second walk of the registry — the graph module remains the only
thing that knows what a tag is, which is what stops the two drifting when a
label is renamed.

### The decisions behind it

- **Rows, not a canvas, because of the keyboard.** Each row is a
  `role="toolbar"` with a roving tabindex: one tab stop per row, arrow keys
  within, Home/End to the ends. Focus previews exactly as hover does. That is
  the direct answer to §3's third bullet — twelve skills now cost a keyboard
  user one Tab rather than twelve, which is what makes showing *all* of them
  affordable.
- **All twelve skills, ranked by count.** Vidush's call, and the roving
  tabindex is what pays for it.
- **Dim, never remove.** A facet fades non-matching tiles instead of filtering
  them out. Removing tiles would reflow a horizontally scrolled strip under the
  reader's pointer and throw away their scroll position — and the honest answer
  to "do you do X" is the whole set with the matches lit, which is the same
  argument that makes Work and the Archive one pool.
- **Featured is wider, not taller.** Spanning both rows was tried and dropped:
  three double-height tiles lead the rail, so the strip would not have read as
  two rows until past them. `section: "work"` orders first and widens; that is
  the whole of the curation, and a fuller treatment (an eyebrow label) was
  explicitly deferred.
- **No wheel hijacking.** Translating a vertical wheel into `scrollLeft` would
  trap the page scroll on a band that has the footer directly beneath it.
  Chevrons for a mouse, native gestures for trackpad and touch, and
  `touch-action` left alone so a vertical finger drag still reaches the footer —
  the thing the graph had to work around positionally.

### Sizing is data-driven, deliberately

An earlier draft of this argued that with 9 projects and 26 facet labels nothing
*narrows*, so the page wanted an evidence UI rather than a filter. Vidush's
correction: the graph's size is not fixed — projects and tags both grow easily,
and at thirty projects a facet is a real filter. So nothing in the board is
authored against today's counts. Rows are built from whatever facets exist and
ranked by count; the rail packs however many tiles there are; the chevrons and
edge fades appear only when there is something past the edge. Adding a project
or tagging an existing one more thoroughly changes the page with no code change.

### Restore points

- **The graph as primary navigation:** `8092928` (2026-09-01).
- **The graph's own history:** `git log -- components/graph lib/graph` —
  `42f1876` (phone legibility), `61d6eef` (the authored-layout rewrite),
  `e8c732c`, `bdaba26`.

### Known follow-ups

- **Single-select.** One facet at a time; "UI/UX *and* Figma" is not
  expressible. Deliberate for v1 — it matches the graph's own `selectedId` and
  avoids an empty-result state — and worth revisiting as the pool grows.
- **The eyebrow label on selected work**, deferred by Vidush for this build.
- **Several `tools` entries are marked `DRAFT — verify` in the registry**
  (Unflattening's Figma, Flux's Solidworks). They are now a headline row, so
  those guesses are load-bearing in a way they were not inside a dense canvas.

## 5. Already-dead code in the same neighbourhood

Left on disk by the previous redesign and still unreferenced — worth knowing
before the revamp adds more:

- `components/index/TileGrid.tsx` (234), `TileGrid.module.css` (246),
  `toTile.ts` (30), `PeekCard.tsx` (209), `peek.module.css` (197).

`mode: "peek"` is still a supported entry state in `lib/entries/types.ts`, and
`WorkBoard` **does** honour it — a peek entry renders as a `button` opening
`PeekCard`, the same three-modes-three-elements rule `TileGrid` had. So
`PeekCard` and `peek.module.css` are live again.

`TileGrid.tsx`, `TileGrid.module.css` and `toTile.ts` (~510 lines) are now
definitively superseded and safe to delete. Left in place rather than removed as
part of this change; `components/case-study/Banner.tsx` has a comment pointing at
`TileGrid.module.css` that should go with them.
