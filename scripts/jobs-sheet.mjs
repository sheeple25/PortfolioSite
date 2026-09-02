/**
 * Client for the job-application tracker sheet.
 *
 * The Google Sheet is the source of truth for tracker rows; this repo only
 * holds the artifacts (JD text, tailored CV cuts). The two are linked by the
 * `slug` column. See applications/README.md for setup and the deploy steps.
 *
 * Three tabs, each with its own columns:
 *   Applications  the volume tab — everything applied to, keyed by slug
 *   Dream         handmade targets worth a bespoke approach, keyed by slug
 *   Contacts      the rolodex, keyed by name
 *
 * Usage:
 *   node scripts/jobs-sheet.mjs ping
 *   node scripts/jobs-sheet.mjs init                    # builds/repairs all three tabs
 *   node scripts/jobs-sheet.mjs board                   # everything needing attention
 *   node scripts/jobs-sheet.mjs list --sheet Contacts
 *   node scripts/jobs-sheet.mjs add --sheet Dream --slug quicksand --company Quicksand --track "A — Strategist"
 *   node scripts/jobs-sheet.mjs set quicksand-strategist --status applied --applied_on 2026-09-02
 *   node scripts/jobs-sheet.mjs remove zz-test-row
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = path.join(ROOT, ".env.local");

if (fs.existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const URL_ = process.env.JOBS_SHEET_URL;
const TOKEN = process.env.JOBS_SHEET_TOKEN;

export const DEFAULT_TAB = "Applications";

/**
 * Mirrors TABS in applications/apps-script/Code.gs. `columns` must match the
 * backend exactly; `display` is only which of them this CLI prints in a table.
 */
export const TABS = {
  Applications: {
    key: "slug",
    columns: [
      "slug", "company", "role", "track", "location", "source", "url",
      "found_on", "status", "applied_on", "cv_version", "coverage",
      "contact", "last_touch", "follow_up_on", "next_action", "notes",
    ],
    display: ["slug", "company", "role", "track", "status", "applied_on", "follow_up_on"],
    due: "follow_up_on",
    closed: ["rejected", "withdrawn", "lapsed"],
  },
  Dream: {
    key: "slug",
    columns: [
      "slug", "company", "track", "why", "route_in", "careers_url",
      "status", "check_on", "contact", "notes",
    ],
    display: ["slug", "company", "track", "status", "route_in", "check_on"],
    due: "check_on",
    closed: ["applied", "ruled out"],
  },
  Contacts: {
    key: "name",
    columns: [
      "name", "company", "role", "relationship", "email", "linkedin",
      "related", "strength", "last_touch", "next_touch", "notes",
    ],
    display: ["name", "company", "role", "strength", "related", "next_touch"],
    due: "next_touch",
    closed: [],
  },
};

function spec(tab) {
  const found = TABS[tab];
  if (!found) {
    throw new Error(`Unknown tab "${tab}". Known tabs: ${Object.keys(TABS).join(", ")}.`);
  }
  return found;
}

/** Sends one action to the Apps Script web app and unwraps its reply. */
export async function call(action, params = {}) {
  if (!URL_ || !TOKEN) {
    throw new Error(
      "JOBS_SHEET_URL and JOBS_SHEET_TOKEN must be set in .env.local — see applications/README.md",
    );
  }

  let response;
  try {
    response = await fetch(URL_, {
      method: "POST",
      // text/plain keeps Apps Script from rejecting the request; it reads the
      // raw body itself rather than relying on the content type.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: TOKEN, ...params }),
      // Apps Script answers a POST with a 302 to googleusercontent.com. Letting
      // fetch follow that automatically carries the original headers over and
      // Google serves a 404, so the hop is made by hand just below.
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`redirected with no location header (${response.status})`);
      }
      response = await fetch(location, { redirect: "follow" });
    }
  } catch (cause) {
    throw new Error(`Could not reach the sheet web app: ${cause.message}`, { cause });
  }

  const text = await response.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    // HTML here means Google answered instead of the script — usually a private
    // deployment serving a sign-in page, or a stale/deleted deployment URL.
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1];
    const hint = title
      ? `HTTP ${response.status}, Google returned "${title}" — check the deployment is a Web app with access "Anyone", and that JOBS_SHEET_URL is its current /exec URL`
      : `HTTP ${response.status}, unexpected response: ${text.slice(0, 200)}`;
    throw new Error(`The sheet did not return JSON — ${hint}`);
  }

  if (!payload.ok) throw new Error(`Sheet refused the request: ${payload.error}`);
  return payload;
}

export const ping = () => call("ping");
export const schema = () => call("schema");
export const init = (sheet) => call("init", sheet ? { sheet } : {});
export const list = async (sheet = DEFAULT_TAB) => (await call("list", { sheet })).rows;
export const add = (row, sheet = DEFAULT_TAB) => call("append", { sheet, row });
export const set = (key, fields, sheet = DEFAULT_TAB) =>
  call("update", { sheet, slug: key, fields });
export const remove = (key, sheet = DEFAULT_TAB) => call("remove", { sheet, slug: key });

// ----------------------------------------------------------------------- CLI

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    flags[key] = value;
  }
  return flags;
}

function table(rows, columns) {
  if (!rows.length) return "(no rows)";

  const cell = (v) => String(v ?? "").replace(/\s+/g, " ").slice(0, 40);
  const widths = columns.map((c) =>
    Math.max(c.length, ...rows.map((r) => cell(r[c]).length)),
  );
  const line = (cells) => cells.map((v, i) => cell(v).padEnd(widths[i])).join("  ");

  return [
    line(columns),
    widths.map((w) => "-".repeat(w)).join("  "),
    ...rows.map((r) => line(columns.map((c) => r[c]))),
  ].join("\n");
}

const today = () => new Date().toISOString().slice(0, 10);

/** Everything needing attention, across all three tabs. */
async function board() {
  const applications = await list("Applications");
  const appSpec = spec("Applications");
  const live = applications.filter((r) => !appSpec.closed.includes(r.status));

  console.log("APPLICATIONS\n");
  console.log(table(live, appSpec.display));
  console.log(
    `\n${applications.length} tracked  ·  ${live.length} live  ·  ${applications.length - live.length} closed`,
  );

  const sections = [
    ["Follow up on applications", live, appSpec, (r) => `${r.company} — ${r.role}`],
  ];

  for (const tab of ["Dream", "Contacts"]) {
    const tabSpec = spec(tab);
    const rows = (await list(tab)).filter((r) => !tabSpec.closed.includes(r.status));
    const label =
      tab === "Dream"
        ? (r) => `${r.company} (${r.track || "no track"})`
        : (r) => `${r.name} — ${r.company || "?"}`;
    sections.push([`${tab} to revisit`, rows, tabSpec, label]);
  }

  const now = today();
  for (const [heading, rows, tabSpec, label] of sections) {
    const due = rows.filter((r) => r[tabSpec.due] && r[tabSpec.due] <= now);
    if (!due.length) continue;
    console.log(`\n${heading} (${due.length}):`);
    for (const r of due) {
      console.log(`  ${label(r)}  — due ${r[tabSpec.due]}  ${r.next_action ?? ""}`.trimEnd());
    }
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const tab = flags.sheet ?? DEFAULT_TAB;

  switch (command) {
    case "ping": {
      const res = await ping();
      // A reply without `tabs` is the pre-multi-tab backend, which means the
      // Apps Script editor still holds an older Code.gs than this repo does.
      if (!res.tabs) {
        throw new Error(
          `Connected to "${res.spreadsheet}", but it is running an older Code.gs — ` +
            "paste applications/apps-script/Code.gs into the Apps Script editor, save, " +
            "then Deploy > Manage deployments > edit > Version: New version.",
        );
      }
      console.log(`Connected to "${res.spreadsheet}". Tabs: ${res.tabs.join(", ")}.`);
      break;
    }
    case "init": {
      const res = await init(flags.sheet);
      for (const r of res.result) console.log(`Built "${r.sheet}" with ${r.columns} columns.`);
      break;
    }
    case "schema": {
      const res = await schema();
      for (const [name, s] of Object.entries(res.tabs)) {
        console.log(`${name} (key: ${s.key})\n  ${s.columns.join(", ")}\n`);
      }
      break;
    }
    case "list": {
      let rows = await list(tab);
      if (flags.status) rows = rows.filter((r) => r.status === flags.status);
      console.log(table(rows, spec(tab).display));
      break;
    }
    case "board":
      await board();
      break;
    case "add": {
      const { sheet, ...row } = flags;
      const res = await add(row, tab);
      console.log(`Added "${res.result.key}" to ${res.result.sheet} as row ${res.result.row}.`);
      break;
    }
    case "set": {
      const key = rest[0];
      if (!key || key.startsWith("--")) {
        throw new Error(`set needs a ${spec(tab).key}: set <${spec(tab).key}> --field value`);
      }
      const { sheet, ...fields } = parseFlags(rest.slice(1));
      const res = await set(key, fields, tab);
      console.log(`Updated ${res.result.key} in ${res.result.sheet}: ${res.result.updated.join(", ")}.`);
      break;
    }
    case "remove": {
      const key = rest[0];
      if (!key || key.startsWith("--")) {
        throw new Error(`remove needs a ${spec(tab).key}: remove <${spec(tab).key}>`);
      }
      const res = await remove(key, tab);
      console.log(`Removed ${res.result.key} from ${res.result.sheet} (was row ${res.result.deletedRow}).`);
      break;
    }
    default:
      console.log(
        [
          "Commands (all take --sheet Applications|Dream|Contacts, default Applications):",
          "  ping                          check the connection",
          "  init [--sheet X]              build/repair tab structure; all tabs if none named",
          "  schema                        print each tab's columns",
          "  board                         everything needing attention, across all tabs",
          "  list [--status x]             rows in a tab",
          "  add --slug x --company y ...  append a row",
          "  set <key> --field value       update a row",
          "  remove <key>                  delete a row",
        ].join("\n"),
      );
      process.exitCode = command ? 1 : 0;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("jobs-sheet.mjs")) {
  main().catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exitCode = 1;
  });
}
