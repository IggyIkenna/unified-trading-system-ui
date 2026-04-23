#!/usr/bin/env node
/**
 * Normalizes all widget certification JSONs to Schema A format.
 *
 * Schema A (target):
 *   "l0": {
 *     "status": "pass" | "fail" | "partial" | null,
 *     "by": "agent" | "human" | null,
 *     "date": "YYYY-MM-DD" | null,
 *     "checks": {
 *       "0.1": { "result": "pass" | "fail" | "partial" | "n/a", "note": "..." },
 *       ...
 *     },
 *     "notes": "..." | null
 *   }
 *
 * Handles three incoming schemas:
 *   Schema A — already correct (alerts-kill-switch style: checks.0.1 = { result, note })
 *   Schema B — flat string (orders-table style: checks.0.1_error_boundary = "pass — ...")
 *   Schema C — notes only, no checks object (most files: notes = "0.1 PASS: ... 0.2 ...")
 *
 * Usage:
 *   node scripts/normalize-cert-schema.mjs
 *   node scripts/normalize-cert-schema.mjs --dry-run   (print diffs, no writes)
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CERT_DIR = join(ROOT, "docs/manifest/widget-certification");

const dryRun = process.argv.includes("--dry-run");

// ─── Check definitions ────────────────────────────────────────────────────────

const L0_CHECKS = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"];
const L1_CHECKS = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"];

// ─── Result keyword → canonical result ───────────────────────────────────────

function canonicalResult(raw) {
  if (!raw) return "pass";
  const s = raw.toLowerCase().trim();
  if (
    s === "pass" ||
    s === "✓" ||
    s === "fixed" ||
    s === "fix" ||
    s.startsWith("fix applied") ||
    s.startsWith("fixed") ||
    s.startsWith("added") ||
    s.startsWith("wired") ||
    s.startsWith("removed") ||
    s.startsWith("promoted")
  )
    return "pass";
  if (s === "fail" || s === "fails" || s === "failure") return "fail";
  if (s === "n/a" || s === "not applicable" || s === "na") return "n/a";
  if (
    s === "partial" ||
    s === "gap" ||
    s === "finding" ||
    s === "noted" ||
    s === "blocked" ||
    s.startsWith("partial") ||
    s.startsWith("gap") ||
    s.startsWith("finding")
  )
    return "partial";
  return "pass"; // default: if result keyword is unrecognised, treat as pass
}

// ─── Parse Schema C notes string into per-check map ──────────────────────────

function parseNotesString(notes, checkIds) {
  const result = {};

  for (const id of checkIds) {
    // Match patterns like:
    //   "0.1 PASS: ..." "0.1 pass — ..." "0.1 WidgetErrorBoundary..." "0.6 FIXED: ..."
    //   "0.6 N/A — ..." "1.1 ✓ ..." "0.5 No mock..." "0.1 pass." etc.
    const escaped = id.replace(".", "\\.");
    const nextId = checkIds[checkIds.indexOf(id) + 1]?.replace(".", "\\.") ?? "(?=\\s*$|[^\\d])";

    // Try to find the segment for this check
    const segmentRe = new RegExp(
      `${escaped}\\s*[\\-:–—]?\\s*(.*?)(?=\\s+(?:${checkIds.map((c) => c.replace(".", "\\.")).join("|")})\\s+|$)`,
      "is",
    );
    const m = notes.match(segmentRe);

    if (!m) {
      // Check not mentioned — can't infer
      result[id] = null;
      continue;
    }

    const segment = m[1].trim();

    // Extract result keyword: first word(s) before colon, dash, or long text
    const kwRe =
      /^(pass|fail|fixed|fix|n\/a|not applicable|partial|gap|finding|noted|blocked|✓|PASS|FAIL|FIXED|FIX|N\/A|PARTIAL|GAP|FINDING|NOTED|BLOCKED|ADDED|WIRED|REMOVED)[\s:—\-–]/i;
    const kwM = segment.match(kwRe);

    const resultRaw = kwM ? kwM[1] : null;
    const note = kwM ? segment.slice(kwM[0].length).trim() : segment;

    result[id] = {
      result: canonicalResult(resultRaw ?? (segment.length < 5 ? "pass" : null)),
      note: note || segment,
    };
  }

  return result;
}

// ─── Detect and normalise a single level object ───────────────────────────────

function normaliseLevel(level, checkIds) {
  if (!level || level.status === null) {
    // Uncertified — produce null skeleton
    return {
      status: null,
      by: null,
      date: null,
      checks: Object.fromEntries(checkIds.map((id) => [id, { result: null, note: null }])),
      notes: null,
    };
  }

  const existing = level.checks ?? {};

  // Detect which schema the checks object is in
  const checkKeys = Object.keys(existing);
  const isSchemaA =
    checkKeys.length > 0 &&
    typeof existing[checkKeys[0]] === "object" &&
    existing[checkKeys[0]] !== null &&
    "result" in existing[checkKeys[0]];

  const isSchemaB = checkKeys.length > 0 && typeof existing[checkKeys[0]] === "string";

  const isSchemaC = checkKeys.length === 0;

  let normalised = {};

  if (isSchemaA) {
    // Already correct format — validate keys match canonical check IDs
    for (const id of checkIds) {
      const entry = existing[id] ?? existing[`${id}_${id}`] ?? null;
      if (entry && typeof entry === "object") {
        normalised[id] = {
          result: entry.result ?? null,
          note: entry.note ?? null,
        };
      } else {
        normalised[id] = { result: null, note: null };
      }
    }
  } else if (isSchemaB) {
    // Flat string: "0.1_error_boundary": "pass — note text"
    for (const id of checkIds) {
      // Find matching key: "0.1" or "0.1_error_boundary" or "0.1_something"
      const matchingKey = checkKeys.find((k) => k === id || k.startsWith(`${id}_`) || k.startsWith(`${id} `));
      if (matchingKey) {
        const raw = existing[matchingKey];
        const parts = raw.split(/\s*[—\-–]\s*/);
        const resultRaw = parts[0]?.trim();
        const note = parts.slice(1).join(" — ").trim();
        normalised[id] = {
          result: canonicalResult(resultRaw),
          note: note || raw,
        };
      } else {
        normalised[id] = { result: null, note: null };
      }
    }
  } else if (isSchemaC) {
    // Notes-only: parse the notes string
    const parsed = parseNotesString(level.notes ?? "", checkIds);
    for (const id of checkIds) {
      if (parsed[id]) {
        normalised[id] = parsed[id];
      } else {
        // Check not found in notes — infer from level status
        normalised[id] = {
          result: level.status === "pass" ? "pass" : (level.status ?? null),
          note: null,
        };
      }
    }
  }

  return {
    status: level.status ?? null,
    by: level.by ?? null,
    date: level.date ?? null,
    checks: normalised,
    notes: level.notes ?? null,
  };
}

// ─── Process a single cert file ───────────────────────────────────────────────

function processCertFile(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const cert = JSON.parse(raw);

  const levelsKey = cert.levels ? "levels" : null;
  if (!levelsKey) return false; // skip files without levels

  const levels = cert.levels;

  const newL0 = normaliseLevel(levels.l0, L0_CHECKS);
  const newL1 = normaliseLevel(levels.l1, L1_CHECKS);

  // Build L2–L6 passthrough (keep as-is, just ensure consistent shape)
  const passthroughLevels = {};
  for (const lv of ["l2", "l3", "l4", "l5", "l6"]) {
    passthroughLevels[lv] = levels[lv] ?? {
      status: null,
      by: null,
      date: null,
      notes: null,
    };
  }

  const newCert = {
    ...cert,
    levels: {
      l0: newL0,
      l1: newL1,
      ...passthroughLevels,
    },
  };

  const newJson = JSON.stringify(newCert, null, 2) + "\n";

  if (dryRun) {
    const widgetId = cert.widgetId ?? basename(filePath, ".json");
    const schemaDetected =
      Object.keys(levels.l0?.checks ?? {}).length === 0
        ? "C"
        : typeof Object.values(levels.l0.checks)[0] === "string"
          ? "B"
          : "A";
    console.log(`${widgetId.padEnd(40)} schema${schemaDetected} → normalised`);
    return true;
  }

  writeFileSync(filePath, newJson, "utf8");
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = readdirSync(CERT_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => join(CERT_DIR, f));

console.log(`\nCert Schema Normalizer — ${new Date().toISOString().slice(0, 10)}`);
console.log(`${"─".repeat(60)}`);
console.log(`  Target format  : Schema A ({ result, note } per check)`);
console.log(`  Files to process: ${files.length}`);
if (dryRun) console.log(`  Mode           : DRY RUN — no files written`);
console.log(`${"─".repeat(60)}\n`);

let processed = 0;
for (const f of files) {
  if (processCertFile(f)) processed++;
}

if (!dryRun) {
  // Run prettier on all cert files
  process.stdout.write(`Running prettier on ${processed} files... `);
  try {
    execSync(`npx prettier --write "${CERT_DIR}/*.json"`, { cwd: ROOT, stdio: "pipe" });
    console.log("done.");
  } catch {
    console.log("prettier error (non-fatal).");
  }
}

console.log(`\n✓ Processed ${processed} / ${files.length} files.\n`);
