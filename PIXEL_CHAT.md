# Pixel Chat Feature

A chat interface powered by Claude, trained on the user's portfolio, that can answer questions on their behalf and explain content on screen.

---

## Overview

- **Feature Name**: Pixel Chat
- **Mascot**: Pixel (existing mascot in the project)
- **UI Placement**: Button in top-right header → opens sidebar chat
- **Launch Date**: TBD
- **Status**: Planning phase

---

## Architecture

### Frontend
- **Header button**: Toggles chat sidebar on/off
- **Chat sidebar**: Displays messages, input field, streaming responses
- **Pixel integration**: Mascot can trigger chat in contextual moments
- **UI states**: Already designed (user has screens)

### Backend
- **API endpoint**: Handles chat requests, returns streaming responses
- **LLM**: Claude API
- **System prompt**: Injected with user context (bio, projects, interests)
- **Chat history**: [DECISION NEEDED - client-side vs server-side?]

### Data & Context
- **Pixel's knowledge base**: What should Pixel know about you? (TBD)
- **"Explain on screen" feature**: How to capture current page context (TBD)
- **Streaming**: Should responses stream or return complete? (TBD)

---

## Decisions Made

### 1. UI Implementation Order
- **Decision**: Build UI scaffolding + basic API route first, rather than mockups
- **Rationale**: You already have UI screens; wiring them forces us to clarify remaining questions
- **Next step**: Wire header button → sidebar toggle → basic API call to Claude

### 2. Pixel Mascot Role
- **Decision**: Pixel offers chat option "when necessary, not always"
- **Rationale**: Reduces noise; makes the feature feel contextual, not intrusive
- **Pending**: Define specific triggers (e.g., on certain pages, after X seconds, on specific interactions)

---

## Decisions Pending

| Question | Options | Impact | Status |
|----------|---------|--------|--------|
| Chat history storage | Client-side only vs. server-side | Persistence, cross-device, complexity | TBD |
| "Explain on screen" scope | Full DOM? URL only? Specific element? | Accuracy, token cost, user experience | TBD |
| Pixel trigger logic | Page-based? Time-based? Contextual? | Frequency, relevance of suggestions | TBD |
| System prompt scope | Just bio/projects? Include writing excerpts? Full portfolio? | Accuracy, token usage, data freshness | TBD |
| Streaming vs. chunked | Real-time streams or wait for complete response | UX smoothness, backend complexity | TBD |
| Rate limiting | Per-session? Per-user? Per-IP? | Cost control, abuse prevention | TBD |

---

## Data Model: What Pixel Knows

**To be populated:**
- User bio / headline
- List of projects (title, description, tech stack)
- Writing/articles (topics, excerpts?)
- Interests / specialties
- Contact info
- Custom Q&A pairs (optional)

**Source**: Extract from existing portfolio structure or manual curation?

---

## Existing Infrastructure (discovered, reused)

Pixel already exists as a global mascot system — the chat build extends this rather than creating something parallel:

- **`components/pixel/PixelContext.tsx`** — `PixelProvider`/`usePixel()`, mounted once in `app/layout.tsx`. Now also owns `chatOpen` / `openChat(source)` / `closeChat()`, alongside the existing `mood`/`reaction`/`hidden` state.
- **`components/pixel/PixelCompanion.tsx`** — the floating mascot: idle/sleepy/asleep drift, cursor gaze, hover reactions, per-route moods (`ROUTE_MOODS`). This is where a contextual "want to chat?" trigger should hook in later (Phase 3).
- **`components/pixel/Pixel.tsx`** — the SVG sprite renderer itself (expressions, gaze).
- **`lib/projects`, `lib/writing`** — both are thin wrappers over `lib/writing/collection.ts`'s `createDocumentCollection()`, reading `.md` files from `content/projects` and `content/writing`. Pixel's system prompt pulls from these directly, so a new project/writing piece is picked up automatically — no separate content sync step.
- **`lib/site.ts`** — bio constants (name, designation, contact, social links) also feed the system prompt.

## Implementation Roadmap

### Phase 1: UI + Basic API (Current Sprint)
- [x] Add `@anthropic-ai/sdk` dependency
- [x] Create API endpoint `/api/chat` (`app/api/chat/route.ts`) — streams plain-text chunks from Claude
- [x] Build system prompt from live site content (`lib/pixel/system-prompt.ts`)
- [x] Extend `PixelContext` with `chatOpen`/`openChat`/`closeChat`
- [x] `ANTHROPIC_API_KEY` set in `.env.local` — verified working via a direct `curl` to `/api/chat` (Pixel replied in character, using real bio/project data)
- [x] Build chat sidebar component (`components/pixel/PixelSidebar.tsx` + `.module.css`) — full-height, `position: fixed`, pushes the page over via a `margin-right` on `body` (see "Sidebar layout" below)
- [x] Build header button + toggle logic — "Ask Pixel" pill in `NavBar.tsx`, wired to `openChat`/`closeChat`/`chatOpen`, with a mini animated `<Pixel>` mascot (white, hover → happy + bob) instead of a generic icon
- [x] Wire up message display + input, calling `/api/chat` and reading the streamed response — confirmed working end-to-end in the user's own browser
- [ ] **Decision pending**: which model to use long-term — see "Model choice" below
- [ ] Companion's contextual "occasional offer" bubble (image 5/6 in the mockups) — a lighter nudge tethered to the roaming mascot, not yet built. Plan: its input, on submit, should call `openChat("companion")` and forward the typed text as the sidebar's first message — same underlying chat surface, not a separate one. See Phase 3.
- [ ] Page-contextual greeting (mockup showed "I recommend you start with the Design Manifesto..." on `/writing` vs a generic greeting elsewhere) — sidebar greeting is currently static ("Tell me. What's on your mind?")

### Phase 2: Context & Personalization
- [ ] Define what Pixel knows (data model)
- [ ] Build system prompt with user context
- [ ] Implement streaming responses
- [ ] Add loading/thinking states

### Phase 3: Pixel Mascot Integration
- [ ] Define Pixel trigger logic
- [ ] Add "open chat" event from Pixel component
- [ ] Test contextual suggestions

### Phase 4: "Explain on Screen" Feature
- [ ] Capture current page context (URL + DOM)
- [ ] Pass to Claude for explanation
- [ ] Test on key portfolio pages

### Phase 5: Polish & Optimization
- [ ] Chat history persistence (if needed)
- [ ] Error handling & fallbacks
- [ ] Rate limiting
- [ ] Analytics / usage tracking

---

## Sidebar Layout (decided from mockup image 9, 2026-08-25)

- **Full height, flush to viewport edge**, pushes the whole page over — header included — rather than floating above it. `body` gets `margin-right: var(--sidebar-width)` when open (see `body:has(aside[aria-label="Ask Pixel"][data-open="true"])` in `globals.css`); the sidebar itself is `position: fixed`, not a flex sibling.
  - **Why not a flex row with the sidebar as a sibling** (the first approach tried): a `position: sticky` flex item with `flex-shrink: 0` resolved to `0` width in testing — see `KNOWN_BUGS.md` for the full debugging trail. Switched to `position: fixed` + the `:has()`-driven margin push instead, which sidesteps the interaction entirely.
- **Width**: `clamp(300px, 26vw, 440px)` (`--sidebar-width` in `globals.css`) — narrow enough not to crop content at 1080p, a bit more generous on larger screens. No exact number was specified; this is adjustable via that one variable.
- **Background**: `--sidebar-bg: #f0f0f0` against the page's `#f7f7f7` — barely different, no border.
- **Padding**: `--sidebar-pad: 1.5rem`, deliberately separate from the site's `--page-gutter` (which scales up to 4rem and was eating too much of a ~400px panel).
- **Header row** (info icon, "Pixel Bot" title, refresh icon, close icon) top-padded to line up with the page's own top padding (where "BACK" sits on a reading page).
- Naming inconsistency carried over from the mockup, not yet resolved: sidebar title says "Pixel Bot", header button says "Ask Pixel". Using both literally for now.

## Key Files to Create/Modify

| File | Purpose | Status |
|------|---------|--------|
| `components/pixel/PixelChat.tsx` (or sidebar location) | Chat sidebar component | TBD — waiting on mockups |
| `app/api/chat/route.ts` | Backend chat endpoint, streams Claude's reply as text | Created |
| `lib/pixel/system-prompt.ts` | Builds Pixel's system prompt from `lib/site.ts` + project/writing summaries | Created |
| `components/pixel/PixelContext.tsx` | Extended with `chatOpen`/`openChat`/`closeChat` | Updated |
| `lib/pixel/context.ts` | Utilities for page context capture ("explain this") | TBD |
| `PIXEL_CHAT.md` | This file — live documentation | Created |

## Setup Required (user action)

The API route reads `process.env.ANTHROPIC_API_KEY` and returns a 503 with a clear message if it's missing. To actually talk to Claude:

1. Get an API key from the Anthropic Console
2. Create `.env.local` in the project root (already gitignored) with:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the dev server

Model used: `claude-sonnet-4-5` (set in `app/api/chat/route.ts`, `MODEL` const) — swap it there if you want a different tier.

**Gotcha hit in Session 1**: the file first got saved to `components/.env.local` instead of the project root — Next.js only reads env files from the root, so it silently didn't work. Watch for this if the key ever seems to stop working after an edit.

## Model Choice

Compared Claude/GPT/Gemini cheap tiers (Aug 2026 pricing, ballpark from aggregators — not official pages):

| Model | Input/1M | Output/1M | Context |
|---|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K |
| GPT-5-mini | $0.25 | $2.00 | 400K |
| Gemini 3 Flash-Lite | $0.25 | $1.50 | 1M |
| Claude Sonnet 5 | $2.00 | $10.00 | 1M |
| GPT-5 (base) | $1.25 | $10.00 | 400K |
| Gemini 3.1 Pro | $2.00 | $12.00 | 200K+ |

**Key finding**: context window size is a non-issue at every tier — Pixel's system prompt (bio + projects + writing, even with personality/easter eggs added later) will land around 1,500-4,000 tokens, nowhere near any of these limits. The real trade-off is personality/instruction-adherence (cheap "nano/lite" tiers drift off-voice more) vs. cost — and at recruiter-scale traffic the cost difference between any of these tiers is a few cents to a couple dollars a month, so it doesn't really matter financially.

**Recommendation**: start with Claude Haiku 4.5 or GPT-5-mini (currently on `claude-sonnet-4-5`, still needs updating — see TODO). Add prompt caching on the system prompt once it stabilizes (personality + easter eggs finalized) — that's the actual lever for cost as the prompt grows, not model tier. Provider swap is cheap later (one file, one client + model string), so this isn't a lock-in decision.

**Open TODO**: `claude-sonnet-4-5` in the route is not in the current pricing table (may be heading toward deprecation) — swap to Haiku 4.5 or Sonnet 5 once personality/tone is being tuned.

---

## Notes & Open Questions

- Should the chat persist between sessions, or reset on page reload?
- How do we keep Pixel's knowledge base fresh as the portfolio evolves?
- Should there be a fallback if the API is down?
- Any user privacy concerns with storing chat history?
- Should Pixel have a "personality" in responses, or keep it professional?

---

## Session History

### Session 1 (2026-08-25)
- Outlined feature scope and architecture
- Made decision to skip mockup stage, go straight to UI + API scaffolding
- Created this documentation file
- Discovered existing Pixel infrastructure (`PixelProvider`, `PixelCompanion`) and content collections (`lib/projects`, `lib/writing`) — chat build extends these rather than parallel systems
- Installed `@anthropic-ai/sdk`
- Built `lib/pixel/system-prompt.ts` — generates Pixel's system prompt from live site content (bio + project/writing summaries), no manual sync needed
- Built `app/api/chat/route.ts` — POST endpoint, streams Claude's reply as plain text; 503s cleanly if `ANTHROPIC_API_KEY` is missing
- Extended `PixelContext` with `chatOpen`/`openChat(source)`/`closeChat()`
- Typecheck passes on all new/changed files
- Compared Claude/GPT-5/Gemini 3 cheap-vs-mid tiers for cost and capability — see "Model Choice" above. Conclusion: context window isn't the real trade-off (all tiers have far more than needed); personality-adherence vs. trivial cost difference is. Recommended Haiku 4.5 or GPT-5-mini as the starting tier, with prompt caching as the real cost lever once the system prompt stabilizes.
- User added `ANTHROPIC_API_KEY` to `.env.local` — first attempt landed in `components/.env.local` (wrong location, silently ignored by Next.js), moved to project root and confirmed working via direct `curl` to `/api/chat`
- User shared the actual UI mockups. Reviewed them, asked clarifying questions on layout geometry before building (per user's request to sanity-check first) — resolved to: full-height sidebar, pushes header + content over, `#f0f0f0`-ish background barely distinct from page bg, narrow-but-not-cropping width, no exact px given
- Built `components/pixel/PixelSidebar.tsx` + `.module.css` — full chat UI (greeting, quick replies, streaming messages, "Schlepping..." loading state, reset/close/info header controls), wired to `/api/chat`
- Added the "Ask Pixel" header button to `NavBar.tsx`, toggling the same `chatOpen` state
- Hit a real layout bug (sidebar width stuck at 0) while testing via Claude's own browser automation tool; extensive debugging isolated it to something specific to that automation tab (confirmed the CSS itself was correct via a cloned-element test) — **user confirmed it renders correctly in their own regular browser**, so treated as an automation-environment artifact, not a real bug. Full trail logged in `KNOWN_BUGS.md` in case it resurfaces for a real visitor.
- Along the way, switched the sidebar from a `position: sticky` flex-row sibling to `position: fixed` + a `body` `margin-right` push (driven by a `:has()` selector) — sidesteps the sticky+flex-shrink interaction entirely regardless of whether that was the actual root cause
- Polish pass: reduced the "Ask Pixel" button's border-radius (999px → 8px), replaced its generic chat icon with a mini animated `<Pixel>` mascot (white, hover → "happy" expression + bob), and split sidebar padding off the site-wide `--page-gutter` into its own smaller `--sidebar-pad` (was eating too much of the panel width)
- Created `KNOWN_BUGS.md` at the repo root — a running log for exactly this kind of unresolved question mark, separate from this decisions doc
- Next: companion's contextual offer bubble (Phase 3), page-contextual greetings, model choice decision, then Phase 4 ("explain on screen")
