# Pixel Chat Feature

A chat interface powered by Claude, branded as Pixel (the site's existing mascot), that answers questions on Vidush's behalf and helps visitors — especially recruiters — find what they're looking for fast.

---

## Source of Truth

**`source/PixelBot_SoP.md` is the actual product spec** — positioning, tone, guard rails, known FAQs, and the full features wishlist all come from there. This file (`PIXEL_CHAT.md`) tracks *the build*: what's in v1, what's deliberately deferred, and the resulting technical architecture. If the two ever disagree, the SOP wins and this file needs updating.

---

**The sequenced work queue now lives in `docs/PIXELBOT_BUILD.md`** — every PixelBot item from this file, the SOP, `docs/TODO.md` and the case-study docs, compiled in one place with the current code state checked against it. This file remains the record of decisions and why they were made.

## Status

Scoping complete for v1 (this session, 2026-08-26). The code that exists so far (`app/api/chat/route.ts`, `components/pixel/PixelSidebar.tsx`, `lib/pixel/system-prompt.ts`) was a **spike to confirm the Claude API key and streaming pipeline work end-to-end** — it does not yet reflect the SOP (no FAQ block, no guard rails, no tone, no redirect-linking, no InScreen/InChat split). The real build starts from the v1 scope below, reusing that plumbing.

---

## V1 Scope — Build Now

### InChat (the full chat sidebar)

- Header button → sidebar toggle (built)
- Streaming plain-text responses (built) — no tool-calling needed for v1, see Architecture below
- System prompt assembled from:
  - **Positioning** — Pixel is not Vidush and doesn't claim to be; a guide speaking on his behalf. (Current draft in `system-prompt.ts` has a garbled sentence here — needs a clean rewrite when this is actually built, not just patched.)
  - **Bio** — `lib/site.ts` constants (name, designation, contact, social links)
  - **Live content** — `lib/projects`/`lib/writing` summaries, auto-updating, no manual sync
  - **Known Topics/FAQ block** — hand-authored, pulled directly from the SOP's "Known Topics/FAQs" section (Traces vs. Kobble, non-CV company logos, "what kind of designer", the favorite-project branching logic, "who are you"/"what can you do"). This is new — the current spike doesn't have it, and shouldn't rely on the model inferring these connections from project descriptions alone.
  - **Guard rails** — stick to professional profile/recruitability; deflect morality/personal-belief questions *except* where they're genuinely professional philosophy (fuzzy, intentional); never outright lie. Use the SOP's "meaning of life" deflection verbatim as a few-shot example rather than re-deriving the tone from a rule.
  - **Tone** — snarky/witty/cheeky, younger voice, not rude or cringe; casual with non-recruiters; meta/fourth-wall comments welcome; jokey flattery of Vidush with an "i'm just saying, man"-style deflection if pressed. The rickroll bit for irrelevant questions should be a **scripted, deterministic trigger**, not something left to the model to remember on its own.
  - **Honesty** — say "I don't know" plainly rather than guess.
- Pathname awareness — visitor's current page passed with every request (built, cheap, keep). This is what makes redirects possible; it is *not* the same as full page-content capture (see Wishlist).
- Redirect-to-page — Pixel points to specific project/writing/contact paths as part of a normal reply; the sidebar renders them as clickable links. No special tool call needed — it's just text with a path in it.
- Greeting-state MCQ ("I'm a recruiter" / "I'm just browsing") — built, keep.
- Reset (clears message history but keeps page-context awareness) / close / info-disclaimer buttons — built, keep.
- No cross-session persistence — resets on reload. Decided, not still open.
- Flat per-session message cap (`MAX_USER_MESSAGES`, currently 5) — built, explicitly a stopgap. Keep for v1; revisit once real usage is observed, not before.

### InScreen (the aside column next to page text)

Per the SOP, this is deliberately limited: "context primarily — uncommon words, phrases... generally an aside," at most an MCQ.

- **Open design call before building**: hand-authored footnote-style content per project/writing piece, vs. live LLM generation for every aside. Leaning **hand-authored** — cheaper, zero hallucination risk, no latency, and it matches how narrow the SOP scopes this surface. LLM generation for a sidebar footnote is solving a bigger problem than the feature needs.
- The only thing InScreen needs to *do*, interactively, is offer the recruiter/browsing MCQ that hands off into InChat. Everything past that handoff is InChat's job, not InScreen's.

---

## Wishlist / Future — Logged, Not Building Now

Real, wanted features from the SOP — deferred deliberately, not forgotten. Do not fold these into a "v1.1" without re-scoping; each has its own design or infra cost.

- **Cursor/selection-aware context** — Pixel knows not just what page but what text is selected. Needs client-side selection-capture wiring (`selectionchange` listeners, mapping selected text back to something answerable). Meaningfully bigger than pathname awareness.
- **Email-notify Vidush** on a job offer or special request — needs an email-sending integration, an intent classifier deciding when to fire it, and abuse-hardening (a visitor could deliberately phrase junk to spam the inbox, or prompt-inject a false trigger). Needs tool-calling — see Architecture.
- **askVidush queue** — log genuinely-unanswerable questions for Vidush to review later. **Designed 2026-08-26, not yet built, decision pending — pick up here.** Deliberately *not* tool-calling: batching is cheaper and avoids a live per-message classifier.
  - **Capture**: every conversation appended to Upstash Redis (or Vercel KV) as it happens — a plain data write, no LLM cost. Needed because Vercel's filesystem is ephemeral per-invocation, so a local log file wouldn't survive between messages.
  - **Weekly batch**: a Vercel Cron job (free on the hobby tier) fires once a week, reads the week's log, makes **one** Claude call to extract askVidush-worthy questions plus basic stats (volume, recruiter/browsing split, common topics).
  - **Delivery**: the digest is committed as a dated markdown file straight to the GitHub repo via the GitHub API — a real file, viewable in VS Code, not a dashboard.
  - **Blocked on**: an Upstash account sign-up and a GitHub token set as a Vercel env secret — both are account/credential steps Vidush needs to do himself, not yet set up.
- **Self-correcting objections** — Pixel can ask a clarifying question (including answering a question with a question, always with a decline option) and walk back an earlier refusal if it was wrong. Real conversational-design work; needs testing against actual transcripts before it can be trusted, not just a prompt line.
- **MCQ options on every response**, not just the greeting — needs structured output every turn (a parsed suggestions block, or true tool-use), not plain-text streaming.
- **UI/page reordering driven by chat** (e.g. surface research projects first for a research recruiter) — the SOP itself flags this as possibly too-low-RoI. Would need chat state to reach into page rendering elsewhere in the app. The most architecturally invasive item here; not pursuing unless the rest of Pixel proves valuable first.
- **Genuineness-score rate limiting** — dynamically throttle low-signal conversations instead of a flat cap. Adds its own cost/complexity in the name of saving cost. Flat cap stays for v1.
- **Full "explain on screen" content capture** — reading arbitrary visible page content (not just the pathname) for granular "explain this exact thing" requests. Distinct from, and heavier than, pathname awareness.

---

## Architecture

**V1 as scoped needs no tool-calling.** Everything above is achievable on the current plain-text-streaming route (`app/api/chat/route.ts` as it exists today): redirect links are just paths inside prose, the FAQ/guard-rails/tone content is system-prompt text, pathname is passed as ordinary request context. The spike's plumbing is the right plumbing for v1 — it just needs the actual prompt content built out.

**Tool-calling becomes necessary specifically when these wishlist items get greenlit:**
- *Email-notify Vidush* → a `notifyOwner(reason, summary)` tool the model invokes when it detects a job offer/special request. Should not be a trust-the-first-call system given the abuse surface — worth a second, cheap confirmation pass (or a hard per-session cap on the tool itself) before it actually sends anything.
- *Live UI reordering* → a `reorderProjects`/`highlightProjects` tool that reaches into page state via `PixelContext`, since that's the one item that needs chat to affect rendering elsewhere in the app.

*askVidush queue no longer needs tool-calling* — see its own batch design under Wishlist above (raw capture to Redis + one weekly Claude call + a GitHub-committed digest file), which is cheaper than a live per-message classifier and was worked out in Session 2.

**MCQ-per-response and genuineness-scoring don't strictly need formal tool-use** — a parsed delimiter in the streamed text (e.g. a trailing `<suggestions>` block the client strips out) would cover it without the added complexity of real function-calling.

**Net: nothing on the wishlist blocks v1, and v1 doesn't need to anticipate tool-calling infrastructure it isn't using yet.** Revisit this section when email-notify or askVidush actually get scheduled.

---

## Existing Infrastructure (discovered, reused)

Pixel already exists as a global mascot system — the chat build extends this rather than creating something parallel:

- **`components/pixel/PixelContext.tsx`** — `PixelProvider`/`usePixel()`, mounted once in `app/layout.tsx`. Owns `chatOpen`/`openChat(source)`/`closeChat()`, alongside the existing `mood`/`reaction`/`hidden` state.
- **`components/pixel/PixelCompanion.tsx`** — the floating mascot: idle/sleepy/asleep drift, cursor gaze, hover reactions, per-route moods (`ROUTE_MOODS`).
- **`components/pixel/Pixel.tsx`** — the SVG sprite renderer (expressions, gaze).
- **`lib/projects`, `lib/writing`** — thin wrappers over `lib/writing/collection.ts`'s `createDocumentCollection()`, reading `.md` files from `content/projects` and `content/writing`. Pixel's system prompt pulls from these directly — no separate content sync step.
- **`lib/site.ts`** — bio constants (name, designation, contact, social links) also feed the system prompt.

---

## Sidebar Layout (decided from mockup image 9, 2026-08-25)

- **Full height, flush to viewport edge**, pushes the whole page over — header included. `body` gets `margin-right: var(--sidebar-width)` when open (`body:has(aside[aria-label="Ask Pixel"][data-open="true"])` in `globals.css`); the sidebar itself is `position: fixed`, not a flex sibling (a `position: sticky` flex-item approach was tried first and abandoned — see `KNOWN_BUGS.md`).
- **Width**: `clamp(300px, 26vw, 440px)` (`--sidebar-width`) — narrow enough not to crop content at 1080p, more generous on larger screens.
- **Background**: `--sidebar-bg: #f0f0f0` against the page's `#f7f7f7` — barely different, no border.
- **Padding**: `--sidebar-pad: 1.5rem`, deliberately separate from `--page-gutter` (which scales up to 4rem and was eating too much of a ~400px panel).
- Naming inconsistency carried over from the mockup, not yet resolved: sidebar title says "Pixel Bot", header button says "Ask Pixel." Using both literally for now.

---

## Cost Guard: 5 Messages Per Session (temporary, 2026-08-25)

Enforced in two places, both gated behind a single `MAX_USER_MESSAGES = 5` constant:
- **`components/pixel/PixelSidebar.tsx`**: once 5 user messages have been sent, input/quick-replies disable and a notice appears. The reset button still works — clicking it starts a fresh session, which is the intended way to reset the count.
- **`app/api/chat/route.ts`**: mirrors the same cap server-side (429 if the submitted history has more than 5 user turns), so it can't be bypassed by editing client state directly.

**Known gap, accepted for now**: doesn't stop someone from clicking reset repeatedly, or scripting direct API requests with fresh short history each time. No real session/IP tracking, by design — this is a stopgap against runaway conversations, not determined abuse. The SOP's "genuineness score" idea (Wishlist, above) is the eventual real answer; a flat cap is enough until real usage data says otherwise.

**To remove/replace later**: delete both `MAX_USER_MESSAGES` constants and the corresponding UI branch in `PixelSidebar.tsx` once something better replaces it.

---

## Model Choice

Compared Claude/GPT/Gemini cheap tiers (Aug 2026 pricing, ballpark from aggregators):

| Model | Input/1M | Output/1M | Context |
|---|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K |
| GPT-5-mini | $0.25 | $2.00 | 400K |
| Gemini 3 Flash-Lite | $0.25 | $1.50 | 1M |
| Claude Sonnet 5 | $2.00 | $10.00 | 1M |
| GPT-5 (base) | $1.25 | $10.00 | 400K |
| Gemini 3.1 Pro | $2.00 | $12.00 | 200K+ |

**Key finding**: context window is a non-issue at every tier — even with the FAQ block, guard rails, and tone all folded in, Pixel's system prompt lands nowhere near any of these limits. The real trade-off is personality/instruction-adherence (cheap "nano/lite" tiers drift off-voice more, and this SOP's tone is specifically hard to hold) vs. cost, and at recruiter-scale traffic the cost difference between tiers is a few cents to a couple dollars a month.

**Recommendation**: start with Claude Haiku 4.5 or GPT-5-mini. Add prompt caching on the system prompt once the FAQ/tone content stabilizes — that's the real cost lever as the prompt grows, not model tier.

**Open TODO**: `claude-sonnet-4-5` is still set in the spike code and isn't in the current pricing table — swap when the real build starts.

---

## Setup Required (user action)

The API route reads `process.env.ANTHROPIC_API_KEY`, 503s cleanly if missing.

1. Get an API key from the Anthropic Console
2. Create `.env.local` in the **project root** (already gitignored) with `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the dev server

**Gotcha hit in Session 1**: the file first got saved to `components/.env.local` instead of the project root — Next.js only reads env files from the root, so it silently didn't work.

---

## Open Questions Not Covered by the SOP

- Should there be a fallback UX if the Claude API is down/rate-limited, beyond the raw error string currently shown in a chat bubble?

---

## Session History

### Session 1 (2026-08-25)
- Outlined feature scope and architecture; skipped mockups, went straight to UI + API scaffolding
- Discovered existing Pixel infrastructure (`PixelProvider`, `PixelCompanion`) and content collections — chat build extends these
- Built `lib/pixel/system-prompt.ts`, `app/api/chat/route.ts` (streams Claude's reply, 503s if key missing)
- Extended `PixelContext` with `chatOpen`/`openChat(source)`/`closeChat()`
- Compared Claude/GPT-5/Gemini tiers for cost and capability — see Model Choice
- `.env.local` fixed (was in `components/`, moved to project root)
- Reviewed user's UI mockups; resolved sidebar layout geometry before building
- Built `components/pixel/PixelSidebar.tsx` + `.module.css` — full chat UI, wired to `/api/chat`
- Added "Ask Pixel" header button to `NavBar.tsx`
- Hit a sidebar-width-stuck-at-0px bug in Claude's own browser automation tool; isolated to the automation environment, not reproduced in the user's real browser — logged in `KNOWN_BUGS.md`
- Switched sidebar from `position: sticky` flex sibling to `position: fixed` + `body` margin-right push
- Polish: reduced "Ask Pixel" button border-radius, replaced generic chat icon with a mini animated `<Pixel>` mascot, split sidebar padding into its own `--sidebar-pad`
- Added temporary 5-message-per-session cost guard, client + server side
- Fixed a build-blocking unused import (`SITE_NAME` in `app/layout.tsx`) that had been silently failing `next build` — likely explanation for pushed changes not appearing live
- Committed and pushed (`7b04b23`) so progress is visible on the live site

### Session 2 (2026-08-26)
- Re-read this doc with fresh eyes for a scoping pass — flagged several roadmap items (analytics, "explain on screen") as possible scope creep before actually having read the real spec
- **Corrected course**: found and read the actual source-of-truth spec, `source/PixelBot_SoP.md`, which had not been consulted before this point — it's materially more specific than this file's earlier speculative roadmap (Top Bar behavior, InScreen/InChat split, tone/personality direction, guard rails with worked examples, a curated FAQ list, and an explicit features wishlist with the SOP's own uncertainty flagged on the riskiest items)
- Re-scoped the whole feature against the real SOP: separated a concrete v1 (this file's "V1 Scope" section) from an explicit, preserved Wishlist/Future list (cursor/selection awareness, email-notify-Vidush, askVidush queue, self-correcting objections, per-response MCQs, chat-driven UI reordering, genuineness-score rate limiting, full page-content capture)
- Worked out the architecture implication: v1 needs no tool-calling at all (current plain-text streaming spike is the right base); tool-calling only becomes necessary for email-notify, askVidash-queue, and live UI reordering specifically
- Rewrote this file around that scope + architecture split; dropped stale/superseded sections (old generic Phase 1–5 roadmap, the "Decisions Pending" table, the stale Key Files table) in favor of the SOP-grounded structure
- Flagged (not yet fixed) a garbled sentence in `lib/pixel/system-prompt.ts`'s positioning line, found while reviewing the spike code
- Designed the askVidush queue as a batch job instead of live tool-calling: raw conversation capture to Upstash Redis/Vercel KV (needed since Vercel's filesystem is ephemeral), a weekly Vercel Cron job making one Claude call to extract questions + basic stats, delivered as a dated markdown digest committed to the repo via the GitHub API. Cheaper than per-message classification and sidesteps the live-trigger abuse surface entirely. Not yet built — needs an Upstash account and a GitHub token set up as a Vercel secret, both on Vidush's end.
- **Stopped here deliberately — picking back up tomorrow.** Open decision: whether to actually greenlight building the askVidush batch pipeline now, or keep it parked in Wishlist alongside the rest. Nothing else pending from this session.
- Next (once resumed): decide the askVidush go/no-go; if yes, set up Upstash + GitHub token first, then wire the capture write into `/api/chat`, the Cron route, and the digest job. Either way, still need to hand-author the FAQ block and InScreen footnote content from the SOP, rewrite the system prompt around the full v1 scope, and decide InScreen's hand-authored-vs-generated question before building it.
