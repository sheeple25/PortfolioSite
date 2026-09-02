# Job applications

A tracker for the job search. The **Google Sheet is the source of truth** for
tracker rows — open it, edit it, sort it, use it on your phone. This repo holds
only the things that don't belong in a spreadsheet cell:

> **The process and SOP live in [`docs/JOB_PIPELINE.md`](../docs/JOB_PIPELINE.md)**
> — stages, decision points, rules, and why it's built this way. This file is
> the tooling reference: setup, commands, columns, troubleshooting.

| Where | What |
|---|---|
| The sheet | Three tabs: `Applications`, `Dream`, `Contacts` |
| `cv/jd/<slug>.txt` | The raw job description, saved because postings get taken down (gitignored) |
| `cv/versions/<slug>.tex` | The tailored CV cut for that application |
| `applications/profile.yaml` | Standing answers for application forms — notice period, links, work authorisation |
| `applications/watchlist.yaml` | Career pages to poll for new postings |

The `slug` column is the only link between the sheet and the repo. One home per
piece of information, so the two can't drift apart.

Nothing here talks to the Google Sheets API or needs a Google Cloud project.
The sheet carries its own small backend (`apps-script/Code.gs`), and
`scripts/jobs-sheet.mjs` calls it over plain HTTP using Node's built-in `fetch`
— no npm packages.

## The three tabs

**`Applications`** — the volume tab. Everything actually applied to or about to
be. Keyed by `slug`.

> `slug` `company` `role` `track` `location` `source` `url` `found_on` `status`
> `applied_on` `cv_version` `coverage` `contact` `last_touch` `follow_up_on`
> `next_action` `notes`

Statuses run `lead → shortlisted → tailoring → applied → screening → interview
→ offer`, plus `rejected` / `withdrawn` / `lapsed`. `coverage` is the honest
output of the tailoring step: what the JD asked for versus what the master
source actually evidences. The gaps are the useful part — they don't get
papered over.

**`Dream`** — the handmade list. Top companies per track, worth a bespoke
approach rather than a volume application. These are targets being *watched*,
not applications; when one turns into a real application it gets a row in
`Applications` and its status here becomes `applied`. Keyed by `slug`.

> `slug` `company` `track` `why` `route_in` `careers_url` `status` `check_on`
> `contact` `notes`

`route_in` is the actual path in — a warm intro, a referral, or cold. `check_on`
is when to look at their careers page again; it turns red once that date passes.
Statuses: `watching` / `role open` / `applied` / `parked` / `ruled out`.

**`Contacts`** — the rolodex. Keyed by `name`.

> `name` `company` `role` `relationship` `email` `linkedin` `related`
> `strength` `last_touch` `next_touch` `notes`

`related` holds comma-separated slugs from `Applications` or `Dream`, so a
person can be traced back to the things they're connected to. `strength` is
`cold` / `warm` / `strong`. `next_touch` turns red once due.

`track` values across all tabs are the four positioning tracks from
`cv/Vidush_CV_Master_Source.md` §2.

## One-time setup

**1. Make the sheet.** New blank Google Sheet, name it whatever you like.

**2. Open its script editor.** In the sheet: **Extensions → Apps Script**. A new
tab opens with a mostly-empty `Code.gs` and a stub `myFunction`.

**3. Paste the backend.** Select everything in that editor, delete it, and paste
the entire contents of [`apps-script/Code.gs`](apps-script/Code.gs). Save
(the disk icon, or Ctrl+S).

**4. Set the shared token.** In the left sidebar: **Project Settings** (the gear)
→ scroll to **Script Properties** → **Add script property**:

- Property: `TOKEN`
- Value: the value of `JOBS_SHEET_TOKEN` in `.env.local`

Save. The token lives here rather than in `Code.gs` so the file stays safe to
commit — a secret in a tracked file is a secret one `git push` away from being
public.

**5. Deploy it as a web app.** Top right: **Deploy → New deployment**. Click the
gear next to "Select type" and pick **Web app**. Then set:

- **Execute as:** Me
- **Who has access:** **Anyone**

Click Deploy. Google will ask you to authorise it — this is the scary-looking
screen where you pick your account, then click **Advanced → Go to (project name)
→ Allow**. It looks alarming because the script is unverified; it's unverified
because you wrote it thirty seconds ago.

> **Why "Anyone"?** It's what lets a script call the URL without a Google login.
> The URL is unguessable and the token is checked on every request, so the two
> together act as the password. Any request without the right token is refused
> before it touches the sheet.

**6. Copy the Web app URL.** It ends in `/exec`. Paste it into `.env.local`:

```
JOBS_SHEET_URL=https://script.google.com/macros/s/AKfy.../exec
```

**7. Check the connection and build the tabs:**

```powershell
node scripts/jobs-sheet.mjs ping    # prints the sheet name and known tabs
node scripts/jobs-sheet.mjs init    # builds all three tabs
```

## Daily use

Every command takes `--sheet Applications|Dream|Contacts`, defaulting to
`Applications`.

```powershell
node scripts/jobs-sheet.mjs board            # everything needing attention, all tabs
node scripts/jobs-sheet.mjs schema           # print each tab's columns
node scripts/jobs-sheet.mjs list --sheet Contacts
node scripts/jobs-sheet.mjs list --status applied

node scripts/jobs-sheet.mjs add --slug quicksand-strategist --company Quicksand --role "Design Strategist" --status lead
node scripts/jobs-sheet.mjs add --sheet Dream --slug quicksand --company Quicksand --track "A — Strategist" --status watching --check_on 2026-10-01
node scripts/jobs-sheet.mjs add --sheet Contacts --name "Jane Doe" --company Quicksand --strength warm --related quicksand

node scripts/jobs-sheet.mjs set quicksand-strategist --status applied --applied_on 2026-09-02
node scripts/jobs-sheet.mjs remove zz-test-row
```

`set` and `remove` take the tab's key as the first argument — `slug` for
`Applications` and `Dream`, `name` for `Contacts`.

Use `remove` for duds and typos. An application that came to nothing should be
set to `rejected` or `lapsed` instead, so the history survives.

You can do any of this by editing the sheet directly instead — the scripts and
the spreadsheet are two doors into the same room.

## Reading the sheet from the Claude apps

The tracker is an ordinary Google Sheet, so the **Google Drive connector** in
the Claude desktop and mobile apps can read it — useful for "what am I waiting
on?" while away from the machine. That connector is **read-only**: it can't add
rows or update cells, and it exports sheets as CSV so formulas don't survive.
Writing goes through `scripts/jobs-sheet.mjs` here, or by editing the sheet
directly in the Google Sheets app.

## Changing the columns

Column order is a contract between the `TABS` registry in
`apps-script/Code.gs` and the one in `scripts/jobs-sheet.mjs`. To add a column:
add it to that tab's `columns` in **both** files, paste the updated script back
into the Apps Script editor, **Deploy → Manage deployments → edit → Version: New
version**, then re-run `init`. Re-running `init` only rewrites header rows and
formatting; it never touches data rows.

Adding a whole new tab means adding an entry to `TABS` in both files — schema,
dropdowns, colours, and which date column counts as overdue.

## Troubleshooting

**"The sheet did not return JSON — Google returned ..."** — the response came
from Google rather than the script. Check the deployment is a **Web app** with
access **Anyone**, and that `JOBS_SHEET_URL` is its current `/exec` URL.

**"Sheet refused the request: No TOKEN script property is set"** — step 4 was
skipped, or the property is named something other than `TOKEN`.

**"Sheet refused the request: Bad or missing token"** — the `TOKEN` script
property and `JOBS_SHEET_TOKEN` in `.env.local` don't match.

**"Unknown tab X"** — `--sheet` has to be one of the tabs in `TABS`. The script
deliberately refuses to touch a tab it has no schema for, so a typo can't
clobber an unrelated sheet.

**Changes to `Code.gs` seem to do nothing** — saving in the editor isn't enough.
Each change needs **Deploy → Manage deployments → edit (pencil) → Version: New
version → Deploy**. The `/exec` URL stays the same.

**"Tab X not found — run init first"** — `init` hasn't been run since that tab
was added.
