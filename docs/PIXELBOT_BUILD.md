# PixelBot — Compiled Build Plan

Everything PixelBot-related, pulled together from the five places it was
scattered across, plus the actual state of the code as of 2026-08-28.

**Sources compiled here**

| Source | What it contributed |
|---|---|
| `source/PixelBot_SoP.md` | The product spec — positioning, tone, guard rails, FAQ list, wishlist. Still the authority on *what Pixel is*; if this file disagrees with it, the SOP wins. |
| `docs/PIXEL_CHAT.md` | The build record — v1/wishlist split, architecture, layout, cost guard, model comparison, session history. Still the authority on *decisions already made and why*. |
| `docs/TODO.md` | Three PixelBot obligations: the VERY IMPORTANT per-project "what I did", the StickerVote narration pair, the DecisionLog feed. |
| `source/CONTENT-CONTEXT.md` / `docs/CASE_STUDY_FORMAT.md` | The InScreen surface actually exists now — `CaseShell`'s right margin (`marginNote`) — and the "Ask Pixel" cue is logged as unwired debt. |
| `source/Proposed Structure for Projects..md` | "What did YOU do" is one of the four questions the first 20 seconds must answer — the origin of the VERY IMPORTANT item. |

**This file is the work queue.** `PIXEL_CHAT.md` stays the decision log.

---

## 1. What is actually built (verified in code, 2026-08-28)

| Surface | State |
|---|---|
| `components/pixel/PixelContext.tsx` | `chatOpen` / `openChat(source)` / `closeChat`, plus mood/reaction/hidden. `source: "companion"` is accepted and ignored. |
| `components/pixel/PixelSidebar.tsx` | Full chat UI: i/reset/close header, greeting + recruiter/browsing MCQ, streaming render, 5-message cap + limit notice, Escape-to-close, abort on close/reset. |
| `components/chrome/NavBar.tsx` | "Ask Pixel" pill toggles the sidebar. Per-project accent via `--nav-pixel-accent`. |
| `app/api/chat/route.ts` | Streaming Claude call, same-origin check, body validation, 2k char/message + 4k char excerpt caps, server-side mirror of the 5-message cap, 503 on missing key. |
| `lib/pixel/rateLimit.ts` | Per-IP burst (8/min) + hourly (40/hr) budget, in-memory, documented as per-instance only. |
| `lib/pixel/system-prompt.ts` | Bio from `lib/site.ts` + live project/writing summaries + pathname + optional excerpt. **Spike-level content only.** |
| `components/case-study/CaseShell.tsx` | `marginNote` prop renders one static line in Pixel's right margin — the InScreen column exists, with no intelligence behind it. |

Everything above is the spike confirmed in Session 1. The plumbing is right;
the *content* of the bot is not built.

---

## 2. Defects and gaps found while compiling

Each is small and independently fixable — do these before or alongside Phase 1.

1. **Garbled positioning sentence** — `system-prompt.ts` line 1 literally reads
   "You speak on X's behalf, in first person plural is wrong". Rewrite clean,
   don't patch. (Flagged in Session 2, never fixed.)
2. **Stale model** — `MODEL = "claude-sonnet-4-5"` in `route.ts`. The model
   comparison landed on Claude Haiku 4.5 or GPT-5-mini to start.
3. **No prompt caching** — the system prompt is about to grow a lot (FAQ + tone
   + guard rails + per-project context). Caching it is the real cost lever.
4. **Redirect links are not clickable** — the sidebar renders
   `{message.content}` as a raw string. "Redirect to page" is listed as *built*
   in `PIXEL_CHAT.md`; it is not. Needs a path/URL linkifier in the bubble.
5. **`pageExcerpt` is dead weight** — accepted and capped server-side, never
   sent by the client. Either wire it or drop it; leaving it half-built is
   an unbounded prompt-injection surface with no feature behind it.
6. **The `i` button does nothing** — it is a `<button>` with a `title` tooltip.
   The SOP asks for a real LLM/legal disclaimer.
7. **"Pixel Bot" vs "Ask Pixel"** — sidebar title and header button disagree.
   Carried over from the mockup; pick one.
8. **Traces' "Ask Pixel" cue does not open Pixel** — logged as known debt in
   `CONTENT-CONTEXT.md`; it restores the side panels only.
9. **No `content/decisions/`** — the DecisionLog directory the content model
   specifies (`content/decisions/<slug>.md`) does not exist yet, so Pixel has
   no per-project context feed to read.
10. **No error fallback UX** — an API failure renders the raw error string in a
    chat bubble. Open question already logged in `PIXEL_CHAT.md`.

---

## 3. Build sequence

### Phase 0 — Housekeeping (no decisions needed)

- [x] Rewrite the positioning sentence in `system-prompt.ts` (defect 1). *Done 2026-08-28.*
- [x] Swap `MODEL` to Claude Haiku 4.5 — `claude-haiku-4-5-20251001` (defect 2). *Done 2026-08-28.*
- [ ] Resolve the "Pixel Bot" / "Ask Pixel" naming (defect 7).
- [ ] Decide and act on `pageExcerpt`: wire or delete (defect 5).

### Phase 1 — Build the actual bot (the v1 core)

The whole point: the spike's prompt has none of the SOP in it.

- [ ] **Positioning** — Pixel is not Vidush, is a guide speaking on his behalf.
- [ ] **Tone** — snarky/witty/cheeky, younger voice, not rude or cringe;
      fourth-wall breaks welcome; casual with non-recruiters; jokey flattery of
      Vidush with an "i'm just saying, man" deflection when pressed.
- [ ] **Guard rails** — professional profile / recruitability only; deflect
      morality and personal belief, *except* where it is genuinely professional
      philosophy (fuzzy on purpose); never outright lie; deflections are
      offhand-comment-plus-redirect, not a hard no. Ship the SOP's
      "meaning of life" answer verbatim as a few-shot, not as a rule.
- [ ] **Honesty** — say "I don't know" plainly. (Also the trigger the askVidush
      queue would later hang off.)
- [ ] **FAQ block** — hand-authored from the SOP's seven Known Topics:
      Traces/Kobble relationship; non-CV logo-banner companies (Verizon via the
      PwC internship, Future Factory via Traces); "what kind of designer";
      "no clear theme"; favourite-project branching (ask what they are looking
      for, then Kobble / DRP / IFTC, default Kobble); "who are you"; "what can
      you do". Do not leave these to inference from project descriptions.
- [ ] **Rickroll** — deterministic scripted trigger for irrelevant questions,
      not a prompt line the model has to remember.
- [ ] **Prompt caching** on the assembled system prompt (defect 3).

### Phase 2 — Finish the InChat surface

- [ ] Linkify paths in assistant messages so redirects are clickable (defect 4).
- [ ] Real disclaimer panel behind the `i` button (defect 6).
- [ ] Graceful fallback when the API is down or rate-limited (defect 10).

### Phase 3 — InScreen and per-project context  (the VERY IMPORTANT block)

This is the part `docs/TODO.md` marks as blocking the Traces format, and it is
the largest genuinely-unbuilt piece.

- [ ] **Create `content/decisions/<slug>.md`** — frontmatter linked to the
      project slug. One file per project serving *two* readers:
      DecisionLog ("why") and the process summary ("what I did").
      Written during each project's content pass, not as a separate pass.
- [ ] **"What I did", on project open, unprompted** — held interviews,
      extracted insights, synthesised, ideated, built working UI mockups.
      Renders into Pixel's right margin (`CaseShell`'s `marginNote` slot, which
      currently takes one hand-written line per project). Must fire without the
      visitor clicking anything.
- [ ] **Feed the DecisionLog into the chat prompt** so a visitor can ask about
      a project's decisions in-chat — the SOP's showcase case.
- [ ] **Plaintext fallback doc plus copy-paste prompt** for recruiters who would
      rather use their own LLM. Same source file, second output.
- [ ] **MCQ handoff** — InScreen's only interactive job is offering the
      recruiter/browsing MCQ that hands into InChat. Everything past the
      handoff belongs to InChat.

### Phase 4 — Site hookups (batched deliberately; do after Phase 1–3 land)

- [ ] Wire Traces' "Ask Pixel" cue to actually `openChat()` (defect 8).
- [ ] Pixel narrates the StickerVote gesture unprompted, so drag-to-place and
      click-to-vote are discoverable rather than hidden.
- [ ] Pixel says "Vote received!" when a sticker actually lands — i.e. past
      `MIN_DRAG_DISTANCE` in `StickerVote.tsx`, not on every attempted drag.
- [ ] Use the ignored `openChat("companion")` source: let the companion offer
      the chat contextually rather than only via the header.

### Phase 5 — Parked (wishlist; re-scope before promoting anything)

Carried forward in intent from `PIXEL_CHAT.md`:
askVidush queue (designed, blocked — see §5) · email-notify-Vidush on a job
offer (needs tool-calling plus abuse hardening) · cursor/selection awareness ·
self-correcting objections · MCQ options on every response · chat-driven UI
reordering · genuineness-score rate limiting · full page-content capture.

---

## 4. Decisions to make before the relevant phase starts

1. **"What I did" — static or generated?** It must fire on *every project open,
   unprompted*. A live LLM call per project page view is one API call per
   visitor per page, uncapped, before anyone has typed anything — the single
   most expensive thing in this plan. **Recommendation: hand-authored text
   rendered in Pixel's voice** — zero API cost, zero hallucination, zero
   latency; the chat stays the place where generation happens. (Same reasoning
   `PIXEL_CHAT.md` already applied to InScreen asides.) Blocks Phase 3.
2. **InScreen asides — hand-authored or generated?** Already leaning
   hand-authored in `PIXEL_CHAT.md`. Confirm and move on. Blocks Phase 3.
3. **askVidush go/no-go** — the open decision Session 2 stopped on. Blocked on
   account setup either way (§5). Recommendation: keep parked until v1 is live
   and there is real traffic to batch.
4. **`pageExcerpt` — wire or delete** (defect 5). **Resolved** — see §7.7:
   narrow it to a structured `screenContext` carrying the note that triggered a
   handoff. Blocks Phase 0.

## 5. Blocked on account/credential setup (Vidush, not code)

- `ANTHROPIC_API_KEY` in `.env.local` **at the project root** — Next.js ignores
  env files anywhere else, which cost a session once already.
- A spend limit on the Anthropic key. `rateLimit.ts` documents itself as
  per-instance and therefore not a hard ceiling; the key limit is the real one.
- *(askVidush only)* An Upstash/Vercel KV account, and a GitHub token set as a
  Vercel env secret for committing the weekly digest.

## 6. Cost posture (unchanged from the Session 1 decision)

Flat `MAX_USER_MESSAGES = 5`, enforced in `PixelSidebar.tsx` and mirrored in
`route.ts`. Known and accepted gaps: repeated resets, and scripted requests with
fresh short histories. Keep for v1; revisit on real usage, not before. Remove
both constants together when something better replaces it.

---

## 7. InScreen ↔ InChat integration (analysed 2026-08-28)

**The intended model.** InScreen is triggered by content: a visitor clicks a
hard word or an odd phrase and Pixel explains it. It is deterministic and
hand-authored. It can also ask closed questions ("recruiter / just looking"),
and *sometimes* one of those answers should offer to continue in chat.
Otherwise chat is only ever entered through the "Ask Pixel" button.

**This already exists.** `components/writing/notes/` is the InScreen mechanism,
mounted on `/writing/[slug]`, `/projects/[slug]` and `/archive/[slug]`:
`[NOTE anchor, alias: body]` in markdown → `NotesProvider` holds one `activeId`
→ a bold `NoteRef` button raises it → `AnnotationPanel` renders it above the
mascot. Zero API cost, one note at a time, Esc/16s auto-dismiss, and it already
pokes Pixel (`react("happy")`). Nothing here needs to be invented; the handoff
is an extension of it.

**No blocking problems. One real refactor, one latent CSS bug, and a content
decision.** In rough priority:

1. **The annotation panel and the mascot vanish under an open sidebar.**
   `.panel` (`z-index: 45`) and `.companion` (`z-index: 50`) are both
   `position: fixed; right: var(--shell-inset)`; the sidebar is
   `position: fixed; right: 0; z-index: 55` at 300–440px wide. `body {
   margin-right }` does not move fixed elements, so both slide *under* the
   panel. **This is already true today, with no handoff work done.** Fix once:
   fold the sidebar width into `--shell-inset` (or a `--corner-inset-right`)
   while `chatOpen`, and both follow the page over.

2. **The conversation is private to `PixelSidebar`.** `messages` is local
   `useState`. A handoff *is* "open chat with something already in it", so this
   is the one structural blocker. Lift `messages`/`sendMessage`/`streaming`
   into context, and widen `openChat(source)` to take a payload —
   `openChat({ source: "note", seed })`.

3. **Two Pixels can talk at once.** `NotesProvider.activeId` and `chatOpen` know
   nothing about each other. Needs a precedence rule; the simple one is
   *chat wins*: opening chat dismisses the active note, and a `NoteRef` click
   while chat is open routes into chat rather than opening a second panel.
   Also covers mobile, where the sidebar takes most of the viewport.

4. **Recruiter/browsing is session state, not surface state.** The sidebar's
   greeting MCQ renders unconditionally on `messages.length === 0`, so a visitor
   who already answered InScreen gets asked twice. Put `audience` in
   `PixelContext`, read by both surfaces, and pass it into the system prompt as
   a **fact, not a seeded user message** — otherwise the handoff spends one of
   the five allowed turns before the visitor has typed anything.

5. **Notes carry text only.** `WritingNote` is `{id, anchors, text, sectionId}`.
   An MCQ needs options with actions. Extend the parser with a sibling
   directive carrying `options: {label, action}[]` over a **closed** action set
   (`chat` · `note` · `navigate` · `dismiss`). Closed is the point: it keeps
   InScreen deterministic, which is what the SOP asks for ("at most offers
   MCQs").

6. **There are two InScreen implementations.** The notes system above, and
   `CaseShell`'s static `marginNote` string in the new case-study format. They
   also disagree on *where the answer appears* — notes anchor to the mascot in
   the corner, `CaseShell` has a dedicated right margin column. Content is
   authored differently for each, so pick one **before** writing content.
   Decide when `CaseShell` graduates into `app/projects/[slug]`.

7. **This settles the `pageExcerpt` question (defect 5).** Don't delete it and
   don't capture arbitrary DOM — replace it with a narrow structured
   `screenContext: { noteId, noteText, sectionId }`. Bounded, deterministic, no
   injection surface, and exactly what "tell me more about this" needs to carry.

### Decided 2026-08-28 — where the InScreen note sits

**Pixel stays bottom-right; the note bubbles up directly above him, like a chat
bubble — and both sit inside the right column's band rather than floating over
it.** The column supplies the horizontal territory (requirement 3: InScreen owns
that column, which is why every content page reserves it); "above Pixel"
supplies the vertical position.

This keeps what the corner arrangement bought — one predictable home for every
note, immune to the clipping bug that drove notes out of the margin in the first
place (see `AnnotationPanel.tsx`) — while making the alignment to the column
deliberate instead of incidental. `.panel` is already `width: var(--notes-width)`,
the same token as the grid track, so the change is alignment and ownership, not
a rebuild. The mascot does not move when a note opens.

**Mobile — decided: keep the existing behaviour.** At <=1080px the panel already
becomes a floating card above the mascot (gutter-to-gutter, capped 28rem,
translucent/blurred, bordered); the mascot scales to 0.72 at <=640px; the
three-column grid collapses to `display: block` at <=1280px. That is already the
desktop metaphor at a narrower width — Pixel bottom-right, bubble above him — so
mobile needs no separate design.

Two alternatives were considered and rejected:

- **Push the page up by the panel's height instead of overlaying.** It does not
  do what it sounds like. A fixed bottom panel covers whatever is at the bottom
  of the viewport *now* — mid-document, not the document's end — so
  `padding-bottom` only clears the final paragraph. A genuine push means
  shrinking the visual viewport (`calc(100dvh - panel)` on an internal scroll
  container), which changes what "the page scrolls" means site-wide and would
  break `useImmersiveChrome` (reads window scroll), sticky positioning, scroll
  restoration, and StickerVote's scroll-surviving page anchoring.
- **Expand the note inline under the paragraph.** Milder version of the same
  reflow problem, and it makes the note read as page text rather than as Pixel
  speaking.

Both reflow the document on every tap — including moving the tapped word out
from under the reader's finger — for a panel that auto-dismisses after 16s and
toggles on re-tap. This is the vertical case of a rule the case-study format
already settled: *panels overlay, never reserve*.

**Instead**, if the panel is found to cover the tapped word (a real risk in the
bottom third of a phone screen), scroll that word clear when the note opens. A
scroll, not a reflow.

---

## 8. Readiness sweep (2026-08-28)

Swept every `.md` in the repo, code comments, `KNOWN_BUGS.md` and the env setup
for anything PixelBot-adjacent not already captured above.

**Verified clear:** `ANTHROPIC_API_KEY` is set in `.env.local` at the project
root, so Phases 0–2 have no setup blocker. No `TODO`/`FIXME` comments in
`components/pixel/`, `lib/pixel/`, `app/api/chat/` or `components/writing/notes/`.
`KNOWN_BUGS.md` has exactly one Pixel entry — the 0px sidebar width in Claude's
automation tab, believed to be tooling, not real.

**Newly found:**

1. **The content rewrite is already spending Pixel's credit, and the account is
   empty.** `source/traces-rebuild.md`: "Board is ~19 screens. Page is four
   decisions. **Everything else is answerable by Pixel.**" And
   `source/content-model.md` routes the entire *Interrogate* depth tier
   (unbounded — "Fork + everything rejected") to `Pixel +
   content/decisions/<slug>.md`. Material is being **cut from pages right now**
   on the promise that Pixel carries it. `content/decisions/` currently holds
   **zero files**. This makes Phase 3 a debt already incurred, not a future
   feature — and it is the strongest argument for sequencing Pixel ahead of the
   remaining case-study rewrites rather than after them.
2. **`README.md` documents the current Pixel/notes architecture in ~8 places** —
   the module tree, the annotation behaviour ("opens above Pixel in the
   corner"), and the `docs/PIXEL_CHAT.md` pointer. The §7 module consolidation
   orphans all of it. Update README in the same pass, or the docs drift on day
   one — which is the exact failure that made this compile necessary.
3. **Two Pixel-adjacent items sitting in `docs/TODO.md` under other headings**,
   both medium priority: the Ask Pixel pill's per-project accent colour
   (`--nav-pixel-accent`, "isn't quite right yet") and the custom pellet cursor
   that can be "fed" to Pixel. Under requirement 1 these are **Pixel-module
   changes**, not chrome changes — named here so they can't be done sideways.

## 9. Is it ready to build?

**Yes — for the architecture work and Phases 0–2. No for Phase 3, and not for
code reasons.**

Phase 3 needs `content/decisions/<slug>.md` files that do not exist, and
`docs/TODO.md` is explicit that this content is *"being done conversationally
(not delegated to an agent) — worksheet answers are editorial judgment calls,
not something to fabricate."* The same holds for the per-project "what I did"
summaries and the FAQ's project-specific claims. Phase 3 is blocked on
authoring, not engineering. Build its plumbing when the first real decision file
exists (Traces), not before — a collection reader with zero content is
speculative.

**Recommended order:** §7 architecture first (module consolidation + the public
surface + enforcement), then Phase 0, then Phase 1, then Phase 2. Doing the
consolidation first means everything after it lands in the final structure
instead of being moved twice — and it is the whole point of requirement 1.

**Still owed by Vidush, both one-word answers:** the "Pixel Bot" / "Ask Pixel"
naming (defect 7), and the askVidush go/no-go (recommendation: park it until v1
is live and there is real traffic to batch).

---

## 10. Requests from other features

PixelBot is one module with one owner, and is never edited as a side effect of
work on something else (`components/pixel/AGENTS.md` states the rule; an ESLint
boundary blocks deep imports; the barrel in `components/pixel/index.ts` is the
only door).

When other work needs something from PixelBot, it goes here instead of into the
module — with a matching line under the PixelBot item in `docs/TODO.md` so it
surfaces in the normal review pass.

| Date | Asked for | Who needed it | Worked around by | Status |
|---|---|---|---|---|
| 2026-08-30 | `lib/pixel/system-prompt.ts` updated to read the new unified entry registry | Work/Archive entry-model unification (`lib/entries/`) | **Not worked around — the module was edited.** The prompt imported `getProjectSummaries` and `getArchiveSummaries`; both modules were deleted in the refactor, so the file could not compile untouched and there was no version of the change that left it alone. Rule broken knowingly, recorded here rather than quietly. | Needs review |

**Detail on the 2026-08-30 row**, since it is an edit rather than a request.
Three changes, all confined to how projects are described:

- The two deleted imports became `getEntries("work")` / `getEntries("archive")`.
- A new `describeEntries()` replaces `describe()` for projects only (writing
  still uses `describe()`). It takes each project's path from
  `linkHrefFor(entry)` instead of gluing `/projects/` or `/archive/` onto a
  slug — the two sections now share one URL space, so the old construction
  would have handed visitors a redirect. It also appends a clause for the two
  non-page modes, so Pixel does not offer a case study that does not exist:
  `peek` → "opens as a card on that index, no separate page"; `link` →
  "hosted elsewhere, the link leaves the site".
- `describeDecisions()` takes its path from the registry rather than the log's
  own `collection` field, which predates the shared URL space.

Nothing else in the prompt was touched — no tone, guard-rail, purpose or
output-rule text was read or changed. Wording of the new clauses has not been
tested against a real conversation; that is the open item in `docs/TODO.md`.

Add a row; don't edit the module.

---

## 11. Build log — 2026-08-28

Architecture, Phases 0–2, and Phase 3's plumbing. `npm run build`, `tsc
--noEmit` and `eslint .` all clean.

### The module (requirement 1)

PixelBot was in five places, two of which didn't have "pixel" in the name. Now:

```
components/pixel/
  index.ts            the client-safe public surface
  server.ts           the server-only surface (reads the filesystem)
  AGENTS.md           do-not-edit-as-a-side-effect rule
  chat/               InChat — sidebar, session hook, linkifier, scripted bits
  screen/             InScreen — was components/writing/notes/
lib/pixel/            prompt, limits, rate limit, decision logs
app/api/pixel/        was app/api/chat/
```

- **Two entry points, not one, and the split is a Next.js constraint** rather
  than an architectural one: `ProcessNote` reads `node:fs`, and anything
  reachable from `index.ts` is pulled into the browser bundle by whichever
  client component imports it. Exporting it from the client barrel failed the
  build with *"the chunking context does not support external modules (request:
  node:fs)"*. Server components import from `@/components/pixel/server`.
- **The boundary is enforced, and verified.** ESLint blocks every path under the
  module except those two doors. A glob group can't express the exception (a
  leading `!` reads as another pattern, not a carve-out), so it is a regex with
  a lookahead. Probed both directions: a deep import errors, the server door
  passes.
- **Requests queue** at §10, mirrored into `docs/TODO.md`.
- **`useImmersiveChrome` was already fixed** — the class-prefix DOM-grabbing
  described in `source/CONTENT-CONTEXT.md` has been replaced by a `data-chrome`
  attribute contract, and `PixelCompanion` opts into it himself. That doc is
  stale on this point; no change was needed.

### Context carry-over (requirement 4)

- The conversation moved out of `PixelSidebar` into `PixelContext` (via
  `chat/useChatSession.ts`), which is what makes a handoff possible at all.
- `triggerPathname` is captured **at `openChat()` time**, not read live. The
  sidebar never unmounts, so a visitor can open it and then navigate — the live
  pathname would answer about a page they had already left.
- `openChat({ source, screenContext, prompt })`. The "say something more" button
  on an annotation passes the note across and sends the visitor's question.
- `audience` is shared state: answering the MCQ in one surface stops the other
  asking again, and it reaches the model as a *fact* rather than a spent turn.
- `pageExcerpt` is gone, replaced by a narrowed `screen: {noteId, noteText,
  anchor}` — bounded, hand-authored, no injection surface.

### Layout (requirements 2 and 3)

- **Fixed the live bug:** `body { margin-right }` doesn't move `position: fixed`
  elements, so Pixel and the annotation panel slid under the open sidebar.
  `--shell-inset` now widens by the sidebar's width while it is open, carrying
  the whole corner across with the page.
- **Mobile InChat is full-screen** (`100dvw`) below `40rem`, with the body push
  and the inset shift both disabled there — there is no page left to push.
- **The third column has its first real occupant.** `ProcessNote` renders "what
  he actually did" into the `--notes-width` track that every content page has
  been reserving and never filling.

### The bot (Phases 1–2)

Positioning, tone, guard rails with the meaning-of-life few-shot, the honesty
rule, the seven-topic FAQ, and output rules — all from the SOP. Plus:

- **Prompt caching**, via two system blocks: the long stable one is marked
  `cache_control: ephemeral`, the few per-visitor lines are not. Merging them
  would re-bill the whole prompt on every page change.
- **The rickroll is scripted.** The model emits `[[RICKROLL]]` and the client
  expands it — the judgement stays with the model (only it can read relevance),
  the wording and the URL live in `chat/scriptedBits.ts` and cannot drift.
- **Links work.** Paths in a reply are turned into real links; before, the reply
  was a raw string and "see /projects/traces" was a dead end.
- **The `i` button opens a real disclaimer**; API failures now say something
  Pixel would say instead of printing an SDK error into a chat bubble.

### Known gaps left open, deliberately

- **The FAQ names Kobble, DRP and IFTC — none of which have content files.**
  `content/projects/` holds only `unflattening.md`. The prompt is instructed to
  cite only paths that appear in its content lists and to name-without-linking
  otherwise, so this doesn't produce 404s — but the favourite-project branch
  can't link anywhere until those pages exist.
- **`CaseShell`'s `marginNote` prop is untouched.** Folding it into the notes
  system belongs with the migration of the case-study format into
  `app/projects/[slug]`, and doing it now would churn labs-only code that Phase
  3 will rewrite anyway.
- **The InScreen MCQ directive isn't built.** Requirement 4's handoff works from
  every annotation ("say something more"); a note that *asks a question* with
  its own options needs a parser extension and authored content, so it sits with
  the Phase 3 content pass.

---

## 12. Using the Pixel sprite in other features

Pre-registered for the interactive-footer work (a Chrome-dino-style game, a
wardrobe, or similar), and applicable to anything else that wants Pixel as a
visual element.

**The distinction that matters: the sprite is not the bot.** Rendering Pixel
somewhere is ordinary consumption of the module's public surface. Changing what
Pixel *is* is editing the module.

### Fine — no request needed

- **Render your own `<Pixel>` instance** with your own local state. The barrel
  exports the renderer, `EXPRESSIONS`, `rowsToRuns`/`runsToPath` and the
  `useBlink`/`useGaze`/`useFlash` hooks; all are pure and read-only. The
  sitewide companion is a separate instance reading global state — yours and it
  do not interact.
- **Hide the sitewide companion** while your Pixel is on screen:
  `usePixel().setHidden(true)`. Two Pixels visible at once reads as a bug.
- **Move the corner** by writing `--corner-lift`, which
  `components/chrome/BottomEdge.tsx` already does to keep Pixel clear of the
  bottom edge. Pixel's stylesheet reads the token and decides what to do with
  it — the same shape as the `data-chrome` contract.

### Watch — shared state, not shared code

- **`hidden` has no ownership.** It is one boolean, and two controllers already
  write it (`BottomEdge`/immersive chrome, and direct `setHidden` calls). A
  third makes "last writer wins" a real bug rather than a theoretical one: one
  owner un-hides while another still wants it hidden. **File a request for
  reason-tagged hiding** (`setHidden("footer-game", true)`) before shipping a
  feature that needs it.
- **`mood` and `reaction` are global.** Driving them from a game makes the
  *sitewide* mascot pull faces, and fights the 404 page's `usePixelMood` and the
  companion's per-route moods. Keep game feedback on your own instance's local
  state unless you specifically want the global mascot to react.

### Request required

- **Anything that changes the sprite itself** — new expressions, accessories, a
  layered/composable sprite model for a wardrobe — is `sprites.ts` and
  `Pixel.tsx`, inside the module. Add a row to §10 and a line to `docs/TODO.md`,
  and do the sprite work in a dedicated PixelBot pass.

### Not reachable from other features at all

The chat, the system prompt, the API route, the InScreen notes and the rate
limits. The ESLint boundary blocks deep imports, so another feature cannot
couple to any of it by accident.
