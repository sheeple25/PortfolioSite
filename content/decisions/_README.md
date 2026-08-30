# DecisionLogs

One file per project: `content/decisions/<slug>.md`, where `<slug>` matches the
project's own file in `content/projects/` or `content/archive/`.

Each file feeds two surfaces, from one piece of writing:

- `## What I did` — the process summary. Rendered into Pixel's margin on the
  project page, unprompted, as plain text. No model call: this fires on every
  project open, so generating it would cost an API request per visitor per page.
- `## Decisions` — the "why" behind each call. Folded into Pixel's system prompt
  so a visitor can ask about them in the chat.

**`placeholder: true` hides the file from both.** That is deliberate: a
half-written log is worse than no log, both for the recruiter reading the margin
and for the model, which will otherwise elaborate on scaffolding. Remove the flag
when the content is real.

Files starting with `_` are ignored.

See `docs/PIXELBOT_BUILD.md` §3 Phase 3, and `source/content-model.md`.
