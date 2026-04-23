#!/usr/bin/env node
/**
 * Audits widget certification coverage.
 *
 * Checks:
 *   NEW      — registered widget with no JSON file in docs/manifest/widget-certification/
 *   ORPHANED — JSON file exists but widget is no longer in any register.ts
 *   OK       — both exist (not printed unless --verbose)
 *
 * Usage:
 *   node scripts/audit-widget-certification.mjs
 *   node scripts/audit-widget-certification.mjs --verbose
 *   node scripts/audit-widget-certification.mjs --scaffold   (creates skeleton JSON for NEW widgets)
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CERT_DIR = join(ROOT, "docs/manifest/widget-certification");
const WIDGETS_DIR = join(ROOT, "components/widgets");

const verbose = process.argv.includes("--verbose");
const scaffold = process.argv.includes("--scaffold");

// ─── 1. Collect all registered widget IDs from register.ts files ─────────────

function getRegisteredWidgets() {
  const registered = new Map(); // widgetId → { label, description, category, availableOn, file }

  const registerFiles = readdirSync(WIDGETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(WIDGETS_DIR, d.name, "register.ts"))
    .filter((f) => {
      try {
        readFileSync(f);
        return true;
      } catch {
        return false;
      }
    });

  for (const file of registerFiles) {
    const content = readFileSync(file, "utf8");

    // Match each registerWidget({ ... }) block
    const blocks = content.split("registerWidget(");
    for (const block of blocks.slice(1)) {
      const idMatch = block.match(/^\s*\{[^}]*\bid:\s*["']([^"']+)["']/s);
      if (!idMatch) continue;
      const widgetId = idMatch[1];

      const labelMatch = block.match(/\blabel:\s*["']([^"']+)["']/);
      const descMatch = block.match(/\bdescription:\s*["']([^"']+)["']/);
      const categoryMatch = block.match(/\bcategory:\s*["']([^"']+)["']/);
      const availableOnMatch = block.match(/\bavailableOn:\s*\[([^\]]+)\]/);

      registered.set(widgetId, {
        label: labelMatch?.[1] ?? widgetId,
        description: descMatch?.[1] ?? "",
        category: categoryMatch?.[1] ?? "",
        availableOn: availableOnMatch
          ? availableOnMatch[1]
              .replace(/['"]/g, "")
              .split(",")
              .map((s) => s.trim())
          : [],
        registerFile: file.replace(ROOT + "/", ""),
      });
    }
  }

  return registered;
}

// ─── 2. Collect all JSON files in docs/manifest/widget-certification/ ─────────────────

function getCertifiedWidgets() {
  return new Set(
    readdirSync(CERT_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => basename(f, ".json")),
  );
}

// ─── 3. Scaffold a minimal JSON for a new widget ─────────────────────────────

const EMPTY_LEVELS = {
  l0: { status: null, by: null, date: null, notes: null },
  l1: { status: null, by: null, date: null, notes: null },
  l2: { status: null, by: null, date: null, notes: null },
  l3: { status: null, by: null, date: null, notes: null },
  l4: { status: null, by: null, date: null, notes: null },
  l5: { status: null, by: null, date: null, notes: null },
  l6: { status: null, by: null, date: null, notes: null },
};

function scaffoldJson(widgetId, meta) {
  return {
    widgetId,
    label: meta.label,
    priority: null,
    domain: meta.category.toLowerCase(),
    file: meta.registerFile.replace("register.ts", `${widgetId}-widget.tsx`),
    class: null,
    description: meta.description,
    levels: EMPTY_LEVELS,
    knownIssues: [],
    findings: [],
    updatedBy: null,
    updatedAt: null,
  };
}

// ─── 4. Run ───────────────────────────────────────────────────────────────────

const registered = getRegisteredWidgets();
const certified = getCertifiedWidgets();

const newWidgets = [...registered.keys()].filter((id) => !certified.has(id));
const orphaned = [...certified].filter((id) => !registered.has(id));
const ok = [...registered.keys()].filter((id) => certified.has(id));

console.log(`\nWidget Certification Audit — ${new Date().toISOString().slice(0, 10)}`);
console.log(`${"─".repeat(60)}`);
console.log(`  Registered in registry : ${registered.size}`);
console.log(`  JSON files present     : ${certified.size}`);
console.log(`  Coverage               : ${ok.length} / ${registered.size}`);
console.log(`${"─".repeat(60)}\n`);

if (newWidgets.length === 0 && orphaned.length === 0) {
  console.log("✓ All registered widgets have certification files. Nothing to do.\n");
} else {
  if (newWidgets.length > 0) {
    console.log(`NEW — ${newWidgets.length} registered widget(s) with no certification file:`);
    for (const id of newWidgets) {
      const meta = registered.get(id);
      console.log(`  + ${id}  (${meta.category} / ${meta.registerFile})`);
      if (scaffold) {
        const outPath = join(CERT_DIR, `${id}.json`);
        writeFileSync(outPath, JSON.stringify(scaffoldJson(id, meta), null, 2) + "\n");
        console.log(`    → scaffolded docs/manifest/widget-certification/${id}.json`);
      }
    }
    if (!scaffold) {
      console.log(`\n  Run with --scaffold to auto-create skeleton JSON files.\n`);
    } else {
      console.log();
    }
  }

  if (orphaned.length > 0) {
    console.log(`ORPHANED — ${orphaned.length} JSON file(s) with no matching registered widget:`);
    for (const id of orphaned) {
      console.log(`  - ${id}  (docs/manifest/widget-certification/${id}.json)`);
    }
    console.log(`\n  These widgets may have been deleted or renamed.`);
    console.log(`  Review and delete the JSON files manually if no longer needed.\n`);
  }
}

if (verbose && ok.length > 0) {
  console.log(`OK — ${ok.length} widgets with coverage:`);
  for (const id of ok.sort()) {
    console.log(`  ✓ ${id}`);
  }
  console.log();
}
