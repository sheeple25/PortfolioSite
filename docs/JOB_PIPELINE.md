# Job Application Pipeline

A semi-automated pipeline for the job search: find openings, triage them, tailor
the CV to each one, apply, and track status and follow-ups. Deliberately **not**
fully automatic — it stops at the points where judgement is actually required.

Everything a cold session needs to pick this up without re-deriving it.

---

## Source of Truth

Four files own four different things. If any two disagree, this order wins:

| File | Owns |
|---|---|
| `cv/Vidush_CV_Master_Source.md` | Every fact, claim and ceiling. Nothing enters a CV that isn't in here. |
| The Google Sheet ("JobHunt 2026") | Every tracker row — applications, targets, contacts. |
| `applications/README.md` | How the sheet tooling works — setup, commands, columns, troubleshooting. |
| This file | The process: stages, decision points, and why it's built this way. |

This file tracks *the pipeline*. `applications/README.md` tracks *the tools*.
Don't duplicate command reference here.

---

## Status

**Built and verified (2026-09-02):** the tracker. Google Sheet with three tabs,
an Apps Script backend, and a dependency-free Node client. Tested end to end
against the live deployment.

**Not built yet:** discovery (stage 1), the tailoring flow (stage 3), and
form-fill assistance (stage 4). `applications/profile.yaml` and
`applications/watchlist.yaml` are referenced by the README but don't exist yet —
they arrive with stages 4 and 1 respectively.

The recommended build order is **stage 3 next**, then 4, then 1. Discovery is
last on purpose: it's the piece most likely to need tuning against real inbox
traffic, and it's worthless until there's a working tailoring flow to feed.

---

## The pipeline

### Stage 1 — Discovery *(not built)*

Two legitimate sources, deliberately excluding scraping:

- **Email alerts.** LinkedIn/Indeed/Otta job alerts sent to the inbox, read via
  the Gmail connector and filed as `lead` rows. No scraping, nothing to break
  when a site changes its markup.
- **A watchlist of career pages** (`applications/watchlist.yaml`), polled and
  diffed against a `seen` cache. The target companies are studios with a handful
  of openings, not high-volume boards — polling their own pages beats any
  aggregator for this cohort.

Do **not** build this on LinkedIn or Indeed scraping. Both are auth-walled and
hostile to it; anything built there breaks within weeks.

Output is a list of new postings. Not applications.

### Stage 2 — Triage → **human decision point**

New leads are presented with company, role, link, and a one-line read on which
track they might fit. Vidush says yes or no.

This is the gate that stops the system becoming spray-and-pray. It does not get
automated.

### Stage 3 — Tailoring → **human decision point** *(not built)*

For a shortlisted lead:

1. Fetch and save the JD to `cv/jd/<slug>.txt` (gitignored — postings vanish,
   and the text is private).
2. Extract requirements and keywords from the JD.
3. Pick a track (master source §2) and a set of framing knobs (§9).
4. Produce a **coverage report**: which JD requirements the master source
   genuinely evidences, and which it does not.
5. **Vidush approves or adjusts the framing.**
6. Write `cv/versions/<slug>.tex` and build it with `cv/build.ps1 -Version <slug>`.
7. Record `cv_version` and `coverage` on the sheet row.

The coverage gaps are the *useful* output. They are reported honestly and never
papered over with keyword-matched filler — see Rules below.

Follow `cv/versions/README.md` for the mechanics of starting a cut (the
`\cvfontpath` override is easy to forget and fails confusingly).

### Stage 4 — Applying → **human decision point** *(not built)*

Standing answers live in `applications/profile.yaml` — notice period, work
authorisation, portfolio links, salary band — so form-filling doesn't re-ask the
same questions forty times.

A browser tool can fill Greenhouse/Lever/Workday forms in a logged-in session,
but it **stops before submit, every time**. Vidush reads and clicks.

### Stage 5 — Tracking *(built)*

Status and dates live on the sheet. `node scripts/jobs-sheet.mjs board` shows
everything live plus anything overdue across all three tabs. Overdue dates also
go red in the sheet itself via conditional formatting, so the nag works even
when no script ever runs.

---

## The three tabs

- **`Applications`** — the volume tab. Everything applied to or about to be.
- **`Dream`** — handmade targets worth a bespoke approach, per track. These are
  *watched*, not applied to; when one becomes real it gets an `Applications` row
  and its status here becomes `applied`.
- **`Contacts`** — the rolodex. `related` links a person to slugs in either
  other tab.

Column lists live in `applications/README.md` and in the `TABS` registry in both
`applications/apps-script/Code.gs` and `scripts/jobs-sheet.mjs`.

---

## Rules that don't bend

**Claim ceilings govern everything.** `cv/Vidush_CV_Master_Source.md` §7 applies
to every cut, not just the default. Tailoring means *reframing and reordering
what's true*, never inventing to match a keyword. If a JD wants something the
master source doesn't evidence, that's a gap to report, not a gap to fill.

**Never auto-submit an application.** A hallucinated form field is unrecoverable
and lands in front of a real employer.

**The sheet is the source of truth for rows.** Don't build a parallel markdown
tracker in the repo — two masters drift, and then neither is trusted. The repo
holds artifacts; the sheet holds state; `slug` links them.

**Don't commit application data.** `cv/jd/` is gitignored. The tracker lives in
Google, not in git, partly for this reason.

---

## Why it's built this way

**Apps Script, not the Google Sheets API.** Both are free, but Apps Script needs
no Google Cloud project, no service account, and no key file. The trade is that
the web app's URL is public-by-design and protected only by a shared token.

**The token lives in Script Properties**, not in `Code.gs`, so the file is safe
to commit. Properties are read at runtime — changing one needs no redeploy.

**The sheet is the source of truth because Vidush wants to live in a
spreadsheet** — editing status on a phone, sorting, scanning. A markdown master
with a generated sheet view would mean two masters and a sync problem.

**The CV engine already existed.** The master source with its tracks (§2),
claim ceilings (§7) and framing knobs (§9) is what makes agent-driven tailoring
*safe* — it turns an open-ended rewrite into a constrained operation. The
pipeline is built around that engine, not the other way round.

---

## Gotchas, learned the hard way

**Saving in the Apps Script editor is not deploying.** The `/exec` URL is pinned
to a version. Any `Code.gs` change needs **Deploy → Manage deployments → pencil
→ Version: New version**. Changes to `scripts/jobs-sheet.mjs` need nothing —
they're local and live instantly.

**Apps Script answers a POST with a 302**, and Node's automatic redirect-follow
carries the original headers to `googleusercontent.com`, which returns 404. The
client catches the redirect and makes the second hop by hand. Don't "simplify"
that back into `redirect: "follow"` — see the comment in `call()`.

**The `TABS` registry is duplicated** in `Code.gs` and `jobs-sheet.mjs` and must
stay identical. Changing columns means editing both, redeploying, and re-running
`init`. There's no automated guard for this yet.

**A GET to the `/exec` URL works while a POST fails**, if the deployment is
stale — useful for telling "bad deployment" apart from "bad code".

---

## Cold start

To pick this up in a fresh session:

1. Read `cv/Vidush_CV_Master_Source.md` §2 (tracks), §7 (ceilings), §9 (framing
   knobs). Nothing about CV content makes sense without these.
2. Read `applications/README.md` for the tooling.
3. Run `node scripts/jobs-sheet.mjs board` to see current state.
4. Check Status above for what's built.

Credentials are in `.env.local` (gitignored): `JOBS_SHEET_URL`,
`JOBS_SHEET_TOKEN`.
