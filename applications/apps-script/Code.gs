/**
 * Job application tracker — Apps Script backend.
 *
 * This file is the source of truth for what's pasted into the Google Sheet's
 * Apps Script editor (Extensions > Apps Script). If you edit the copy in the
 * browser, paste it back here so the two don't drift.
 *
 * Setup and deploy steps: ../README.md
 *
 * The web app is deployed with "Who has access: Anyone", which is what lets a
 * script call it without a Google login. The shared token is therefore the only
 * thing protecting it — treat it like a password. It is checked on every
 * request; without it every action returns an error and touches nothing.
 *
 * The token lives in a Script Property, not in this file, so this file stays
 * safe to commit. Set it in the Apps Script editor under
 * Project Settings > Script Properties (see ../README.md step 4).
 *
 * Every action takes an optional `sheet` naming which tab to work on. The tab
 * must be one of TABS below — the script will not touch a tab it has no schema
 * for, so an unrelated sheet in this spreadsheet can't be clobbered by a typo.
 */

const DEFAULT_TAB = 'Applications';

const TRACKS = [
  'A — Strategist',
  'B — Researcher',
  'C — Consultant',
  'D — Product',
];

const APPLICATION_STATUSES = [
  'lead',        // found, not yet triaged
  'shortlisted', // worth applying to
  'tailoring',   // CV cut in progress
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',   // pulled out
  'lapsed',      // went quiet past the point of chasing
];

const DREAM_STATUSES = [
  'watching',    // no suitable role open yet
  'role open',   // something worth acting on is live
  'applied',     // has a row in Applications now
  'parked',      // still want it, not now
  'ruled out',
];

const STRENGTHS = ['cold', 'warm', 'strong'];

const APPLICATION_COLOURS = {
  lead: '#e8eaed',
  shortlisted: '#d7e3fc',
  tailoring: '#fff0c9',
  applied: '#d4edbc',
  screening: '#c9e7f5',
  interview: '#b7e1cd',
  offer: '#a7f3d0',
  rejected: '#f4c7c3',
  withdrawn: '#efefef',
  lapsed: '#efefef',
};

const DREAM_COLOURS = {
  watching: '#e8eaed',
  'role open': '#a7f3d0',
  applied: '#d4edbc',
  parked: '#fff0c9',
  'ruled out': '#efefef',
};

const STRENGTH_COLOURS = {
  cold: '#e8eaed',
  warm: '#fff0c9',
  strong: '#d4edbc',
};

/**
 * One entry per tab. `columns` is the contract with scripts/jobs-sheet.mjs —
 * change it in both files, then re-run init for that tab. `key` is the column
 * used to find a row for update/remove, so it has to stay unique by hand.
 */
const TABS = {
  // The volume tab: everything actually applied to, or about to be.
  Applications: {
    key: 'slug',
    columns: [
      'slug',        // links the row to cv/jd/<slug>.txt and cv/versions/<slug>.tex
      'company',
      'role',
      'track',       // positioning track from Vidush_CV_Master_Source.md §2
      'location',
      'source',      // where the posting was found
      'url',
      'found_on',
      'status',
      'applied_on',
      'cv_version',  // slug of the CV cut actually sent
      'coverage',    // what the JD asked for vs. what the master source evidences
      'contact',
      'last_touch',
      'follow_up_on',
      'next_action',
      'notes',
    ],
    dropdowns: { status: APPLICATION_STATUSES, track: TRACKS },
    colours: { column: 'status', map: APPLICATION_COLOURS },
    overdue: 'follow_up_on',
    wide: ['coverage', 'next_action', 'notes'],
    freeze: 3,
  },

  // The handmade list: companies worth a bespoke application, by track.
  // These aren't applications yet — they're targets being watched.
  Dream: {
    key: 'slug',
    columns: [
      'slug',
      'company',
      'track',
      'why',          // why this one specifically, in a line
      'route_in',     // warm intro, referral, cold — the actual path
      'careers_url',
      'status',
      'check_on',     // when to look at their careers page again
      'contact',      // name in Contacts, if there is one
      'notes',
    ],
    dropdowns: { status: DREAM_STATUSES, track: TRACKS },
    colours: { column: 'status', map: DREAM_COLOURS },
    overdue: 'check_on',
    wide: ['why', 'route_in', 'notes'],
    freeze: 2,
  },

  // The rolodex. `related` holds slugs from Applications or Dream, comma
  // separated, so a person can be traced to the things they're connected to.
  Contacts: {
    key: 'name',
    columns: [
      'name',
      'company',
      'role',
      'relationship', // how you know them
      'email',
      'linkedin',
      'related',      // comma-separated slugs from Applications / Dream
      'strength',
      'last_touch',
      'next_touch',
      'notes',
    ],
    dropdowns: { strength: STRENGTHS },
    colours: { column: 'strength', map: STRENGTH_COLOURS },
    overdue: 'next_touch',
    wide: ['relationship', 'notes'],
    freeze: 2,
  },
};

// ---------------------------------------------------------------- entrypoints

function doGet(e) {
  return handle_(e, e.parameter || {});
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Request body was not valid JSON.' });
  }
  return handle_(e, body);
}

/** The shared secret, read from Script Properties so it stays out of this file. */
function token_() {
  const stored = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!stored) {
    throw new Error(
      'No TOKEN script property is set — add one under Project Settings > Script Properties.'
    );
  }
  return stored;
}

function handle_(e, params) {
  let expected;
  try {
    expected = token_();
  } catch (err) {
    return json_({ ok: false, error: String(err.message) });
  }

  const token = params.token || (e.parameter && e.parameter.token);
  if (token !== expected) {
    return json_({ ok: false, error: 'Bad or missing token.' });
  }

  const tab = params.sheet || DEFAULT_TAB;

  try {
    switch (params.action) {
      case 'ping':
        return json_({
          ok: true,
          spreadsheet: SpreadsheetApp.getActive().getName(),
          tabs: Object.keys(TABS),
        });
      case 'schema':
        return json_({ ok: true, tabs: schema_() });
      case 'init':
        // No sheet named: build every tab. Named: build just that one.
        return json_({
          ok: true,
          result: params.sheet ? [init_(tab)] : Object.keys(TABS).map(init_),
        });
      case 'list':
        return json_({ ok: true, sheet: tab, rows: list_(tab) });
      case 'append':
        return json_({ ok: true, result: append_(tab, params.row) });
      case 'update':
        return json_({ ok: true, result: update_(tab, params.slug, params.fields) });
      case 'remove':
        return json_({ ok: true, result: remove_(tab, params.slug) });
      default:
        return json_({ ok: false, error: 'Unknown action: ' + params.action });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

// ------------------------------------------------------------------- actions

function schema_() {
  const out = {};
  Object.keys(TABS).forEach(function (name) {
    out[name] = { key: TABS[name].key, columns: TABS[name].columns };
  });
  return out;
}

/**
 * Builds (or rebuilds) one tab's structure: headers, dropdowns, colours.
 * Safe to re-run — it only rewrites the header row and the formatting rules,
 * never the data rows below.
 */
function init_(tabName) {
  const spec = spec_(tabName);
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

  sh.getRange(1, 1, 1, spec.columns.length)
    .setValues([spec.columns])
    .setFontWeight('bold')
    .setBackground('#1f2430')
    .setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(spec.freeze || 1);

  const bodyRows = Math.max(sh.getMaxRows() - 1, 1);

  Object.keys(spec.dropdowns || {}).forEach(function (column) {
    columnRange_(sh, spec, column, bodyRows).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(spec.dropdowns[column], true)
        .setAllowInvalid(false)
        .build()
    );
  });

  const rules = [];

  if (spec.colours) {
    const range = columnRange_(sh, spec, spec.colours.column, bodyRows);
    Object.keys(spec.colours.map).forEach(function (value) {
      rules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(value)
          .setBackground(spec.colours.map[value])
          .setRanges([range])
          .build()
      );
    });
  }

  // A date that has come and gone goes red, so the sheet nags on its own.
  if (spec.overdue) {
    const letter = columnLetter_(spec.columns.indexOf(spec.overdue) + 1);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=AND($' + letter + '2<>"", $' + letter + '2<=TODAY())')
        .setBackground('#f4c7c3')
        .setFontColor('#8c1d18')
        .setRanges([columnRange_(sh, spec, spec.overdue, bodyRows)])
        .build()
    );
  }

  sh.setConditionalFormatRules(rules);

  sh.autoResizeColumns(1, spec.columns.length);
  (spec.wide || []).forEach(function (column) {
    sh.setColumnWidth(spec.columns.indexOf(column) + 1, 280);
  });

  return { sheet: tabName, columns: spec.columns.length };
}

function list_(tabName) {
  const spec = spec_(tabName);
  const sh = SpreadsheetApp.getActive().getSheetByName(tabName);
  if (!sh) return [];

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  return sh
    .getRange(2, 1, lastRow - 1, spec.columns.length)
    .getValues()
    .filter(function (row) {
      return String(row[0]).trim() !== '';
    })
    .map(function (row) {
      const out = {};
      spec.columns.forEach(function (name, i) {
        out[name] = cell_(row[i]);
      });
      return out;
    });
}

function append_(tabName, row) {
  const spec = spec_(tabName);
  if (!row || !row[spec.key]) {
    throw new Error(tabName + ' rows need a ' + spec.key + '.');
  }

  const sh = SpreadsheetApp.getActive().getSheetByName(tabName);
  if (!sh) throw new Error('Tab "' + tabName + '" not found — run init first.');

  if (findRow_(sh, spec, row[spec.key]) > 0) {
    throw new Error(
      'A row with ' + spec.key + ' "' + row[spec.key] + '" already exists in ' + tabName + '.'
    );
  }

  const unknown = Object.keys(row).filter(function (k) {
    return spec.columns.indexOf(k) < 0;
  });
  if (unknown.length) {
    throw new Error(tabName + ' has no columns named: ' + unknown.join(', '));
  }

  sh.appendRow(
    spec.columns.map(function (name) {
      return row[name] != null ? row[name] : '';
    })
  );
  return { sheet: tabName, key: row[spec.key], row: sh.getLastRow() };
}

function update_(tabName, key, fields) {
  const spec = spec_(tabName);
  if (!key) throw new Error('update needs a ' + spec.key + '.');
  if (!fields || !Object.keys(fields).length) throw new Error('update needs fields.');

  const sh = SpreadsheetApp.getActive().getSheetByName(tabName);
  if (!sh) throw new Error('Tab "' + tabName + '" not found — run init first.');

  const rowIndex = findRow_(sh, spec, key);
  if (rowIndex < 1) {
    throw new Error('No row in ' + tabName + ' with ' + spec.key + ' "' + key + '".');
  }

  Object.keys(fields).forEach(function (name) {
    const col = spec.columns.indexOf(name);
    if (col < 0) throw new Error(tabName + ' has no column named: ' + name);
    sh.getRange(rowIndex, col + 1).setValue(fields[name]);
  });

  return { sheet: tabName, key: key, row: rowIndex, updated: Object.keys(fields) };
}

/** Deletes a row outright. For mistakes and duds — a real application that came
 *  to nothing should be marked rejected/lapsed instead, so the history survives. */
function remove_(tabName, key) {
  const spec = spec_(tabName);
  if (!key) throw new Error('remove needs a ' + spec.key + '.');

  const sh = SpreadsheetApp.getActive().getSheetByName(tabName);
  if (!sh) throw new Error('Tab "' + tabName + '" not found — run init first.');

  const rowIndex = findRow_(sh, spec, key);
  if (rowIndex < 1) {
    throw new Error('No row in ' + tabName + ' with ' + spec.key + ' "' + key + '".');
  }

  sh.deleteRow(rowIndex);
  return { sheet: tabName, key: key, deletedRow: rowIndex };
}

// ------------------------------------------------------------------- helpers

function spec_(tabName) {
  const spec = TABS[tabName];
  if (!spec) {
    throw new Error(
      'Unknown tab "' + tabName + '". Known tabs: ' + Object.keys(TABS).join(', ') + '.'
    );
  }
  return spec;
}

function findRow_(sh, spec, key) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;

  const keyCol = spec.columns.indexOf(spec.key) + 1;
  const keys = sh.getRange(2, keyCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === String(key).trim()) return i + 2;
  }
  return -1;
}

function columnRange_(sh, spec, name, bodyRows) {
  const index = spec.columns.indexOf(name);
  if (index < 0) throw new Error('No column named ' + name);
  return sh.getRange(2, index + 1, bodyRows, 1);
}

function columnLetter_(index) {
  let letter = '';
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - rem) / 26);
  }
  return letter;
}

/** Dates come back as Date objects; send them as plain yyyy-mm-dd strings. */
function cell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
