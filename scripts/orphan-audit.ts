#!/usr/bin/env node
/**
 * Orphan-route audit — Next.js app/ directory.
 *
 * Detects pages / route handlers that exist on disk but are not reachable from any
 * declared navigation surface. See codex/06-coding-standards/orphan-audit.md for the
 * 3-phase rollout policy.
 *
 * Usage:
 *   tsx scripts/orphan-audit.ts                      # advisory (exit 0 always)
 *   tsx scripts/orphan-audit.ts --advisory           # same as above
 *   tsx scripts/orphan-audit.ts --blocking           # exit 1 on new orphans vs baseline
 *   tsx scripts/orphan-audit.ts --write-baseline     # rewrite .orphan-audit-baseline.json
 *   tsx scripts/orphan-audit.ts --json               # machine-readable report only
 *
 * Reachability sources:
 *   1. lib/config/services.ts              — SERVICE_REGISTRY[*].href + subRoutes[*].href
 *   2. lib/lifecycle-mapping.ts            — stageServiceMap + lifecycleStages
 *   3. lib/lifecycle-route-mappings.ts     — routeMappings[*].path
 *   4. components/shell/*.tsx              — breadcrumbs, nav, lifecycle-nav, etc.
 *   5. components/platform/quick-actions.tsx
 *   6. Transitive `<Link href="...">` closure across app/, components/, hooks/, lib/
 *   7. scripts/.orphan-audit-whitelist.json (intentional direct-URL-only pages)
 *
 * Route discovery: walks app/** for page.tsx, page.ts, route.ts, route.tsx. Strips
 * route-group wrappers "(name)" and preserves dynamic "[slug]" / catch-all "[[...slug]]"
 * segments. Dynamic routes are considered reachable when any literal OR template-
 * literal href matches the segment pattern.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { filePathToRoute, resolveTemplate, routeToMatcher } from "./orphan-audit-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");
const APP_DIR = join(REPO_ROOT, "app");

const BASELINE_PATH = join(__dirname, ".orphan-audit-baseline.json");
const WHITELIST_PATH = join(__dirname, ".orphan-audit-whitelist.json");
const REPORT_PATH = join(__dirname, ".orphan-audit-report.json");

interface WhitelistEntry {
  readonly path: string;
  readonly reason: string;
}

interface WhitelistFile {
  readonly version: number;
  readonly entries: readonly WhitelistEntry[];
}

interface BaselineFile {
  readonly version: number;
  readonly generated_at: string;
  readonly orphans: readonly string[];
}

interface Report {
  readonly orphans: readonly string[];
  readonly whitelisted: readonly string[];
  readonly reachable_count: number;
  readonly total_count: number;
  readonly timestamp: string;
}

// ─── CLI args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const MODE = argv.includes("--blocking")
  ? "blocking"
  : argv.includes("--write-baseline")
    ? "write-baseline"
    : "advisory";
const JSON_ONLY = argv.includes("--json");
const VERBOSE = argv.includes("--verbose");

// ─── Walk app/ and enumerate declared routes ─────────────────────────────────
const ROUTE_FILE_PATTERN = /\/(page|route)\.(tsx?|jsx?)$/;

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p, acc);
    } else if (ROUTE_FILE_PATTERN.test(p)) {
      acc.push(p);
    }
  }
  return acc;
}

const routeFiles = existsSync(APP_DIR) ? walk(APP_DIR, []) : [];
const declaredRoutes = [...new Set(routeFiles.map((p) => filePathToRoute(p, APP_DIR)))].sort();

// ─── Collect reachable hrefs ─────────────────────────────────────────────────
// Walk source tree (app/, components/, hooks/, lib/) looking for every:
//   href="..."
//   href={"..."}
//   href={`...${...}...`}
//   path: "..."   (in route mappings + lifecycle mapping)
//
// Template literals with ${} get the `${...}` interior replaced with `__PARAM__`
// so they still match dynamic [slug] patterns.

const SOURCE_DIRS = ["app", "components", "hooks", "lib"];
const SOURCE_FILE_PATTERN = /\.(tsx?|jsx?|mjs|cjs)$/;

function walkAll(dir: string, acc: string[]): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "build-artifacts") continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      walkAll(p, acc);
    } else if (SOURCE_FILE_PATTERN.test(p)) {
      acc.push(p);
    }
  }
  return acc;
}

const sourceFiles = SOURCE_DIRS.flatMap((d) => walkAll(join(REPO_ROOT, d), []));

// Regexes for href / path extraction. We do two passes:
//   Pass 1: harvest `const NAME = "/path"` or `const NAME = `/path`` — build a
//           lookup map so template literals that concatenate a base constant
//           with a suffix (e.g. `${PROMOTE_LIFECYCLE_BASE}/champion`) can be
//           resolved to their full path.
//   Pass 2: extract href/path literals and template literals, substituting
//           known constants before matching.

const CONST_STRING_RE = /\b(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*(?::\s*[^=]+)?=\s*["']([^"']+)["']/g;
const CONST_TEMPLATE_RE = /\b(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*(?::\s*[^=]+)?=\s*`([^`]*)`/g;
// Object-literal `KEY: "/path"` entries with all-caps keys (STAGE_HREFS, etc.).
const OBJECT_KEY_STRING_RE = /\b([A-Z_][A-Z0-9_]*)\s*:\s*["']([^"']+)["']/g;

const HREF_STRING_RE = /\bhref\s*[:=]\s*\{?\s*["']([^"']+?)["']/g;
const PATH_STRING_RE = /\bpath\s*:\s*["']([^"']+?)["']/g;
const HREF_TEMPLATE_RE = /\bhref\s*=\s*\{\s*`([^`]+)`\s*\}/g;
// Any backtick-template containing `${...}` or a leading "/" — broader catch.
const ANY_TEMPLATE_RE = /`([^`]*\$\{[^}]*\}[^`]*)`/g;
// `redirect("/...")` / `router.push("/...")` / `router.replace("/...")`.
const NAV_CALL_RE = /\b(?:redirect|router\.(?:push|replace))\s*\(\s*["']([^"']+?)["']/g;
// Generic literal-path catch: any "/..." or `/...` starting with a URL-ish
// segment. Over-includes (strings in comments, fs paths), but over-including
// only makes the scanner more permissive — orphan count strictly decreases
// as more reachable hrefs are collected.
const GENERIC_PATH_STRING_RE = /["']\/([a-zA-Z][\w\-\/\[\]]*)["']/g;

const constMap = new Map<string, string>();
const fileContents = new Map<string, string>();

// Pass 1 — build the constant map.
for (const file of sourceFiles) {
  let content: string;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  fileContents.set(file, content);
  CONST_STRING_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CONST_STRING_RE.exec(content)) !== null) {
    const [, name, value] = m;
    if (value.startsWith("/")) constMap.set(name, value);
  }
  CONST_TEMPLATE_RE.lastIndex = 0;
  while ((m = CONST_TEMPLATE_RE.exec(content)) !== null) {
    const [, name, rawValue] = m;
    // Resolve ${NAME} references already seen; leave unresolved tokens as placeholders.
    const value = rawValue.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
      const ident = expr.trim();
      return constMap.get(ident) ?? "__PARAM__";
    });
    if (value.startsWith("/")) constMap.set(name, value);
  }
  OBJECT_KEY_STRING_RE.lastIndex = 0;
  while ((m = OBJECT_KEY_STRING_RE.exec(content)) !== null) {
    // Only treat as a href-const if the value is path-looking.
    const [, name, value] = m;
    if (value.startsWith("/") && !constMap.has(name)) constMap.set(name, value);
  }
}

const rawHrefs = new Set<string>();

// Pass 2 — extract all href / path candidates.
for (const [, content] of fileContents) {
  for (const re of [HREF_STRING_RE, PATH_STRING_RE, NAV_CALL_RE, GENERIC_PATH_STRING_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const href = re === GENERIC_PATH_STRING_RE ? "/" + m[1] : m[1];
      if (href.startsWith("/")) rawHrefs.add(href);
    }
  }
  for (const re of [HREF_TEMPLATE_RE, ANY_TEMPLATE_RE]) {
    re.lastIndex = 0;
    let tm: RegExpExecArray | null;
    while ((tm = re.exec(content)) !== null) {
      const resolved = resolveTemplate(tm[1], constMap);
      if (resolved.startsWith("/")) rawHrefs.add(resolved);
      // Also add every `/...` substring from the template (handles
      // concatenations where the base was unresolved).
      const parts = resolved.split(/__PARAM__/);
      for (const part of parts) {
        if (part.startsWith("/")) rawHrefs.add(part);
      }
    }
  }
}

// ─── Whitelist ───────────────────────────────────────────────────────────────
let whitelist: readonly WhitelistEntry[] = [];
if (existsSync(WHITELIST_PATH)) {
  try {
    const raw = readFileSync(WHITELIST_PATH, "utf8");
    const parsed = JSON.parse(raw) as WhitelistFile;
    whitelist = parsed.entries ?? [];
  } catch (err) {
    console.error(`[orphan-audit] Failed to parse whitelist at ${WHITELIST_PATH}:`, err);
    process.exit(2);
  }
}
const whitelistSet = new Set(whitelist.map((e) => e.path));

// ─── Match declared routes against reachable hrefs ────────────────────────────
const orphans: string[] = [];
const reachable: string[] = [];

for (const route of declaredRoutes) {
  const matcher = routeToMatcher(route);
  let isReachable = false;
  for (const href of rawHrefs) {
    // Normalise "__PARAM__" token so it matches single dynamic segments.
    const normalized = href.replace(/__PARAM__/g, "__p__");
    if (matcher.test(normalized)) {
      isReachable = true;
      break;
    }
  }
  if (isReachable) {
    reachable.push(route);
  } else {
    orphans.push(route);
  }
}

const nonWhitelistedOrphans = orphans.filter((o) => !whitelistSet.has(o));
const whitelistedHits = orphans.filter((o) => whitelistSet.has(o));

const report: Report = {
  orphans: nonWhitelistedOrphans,
  whitelisted: whitelistedHits,
  reachable_count: reachable.length,
  total_count: declaredRoutes.length,
  timestamp: new Date().toISOString(),
};

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

// ─── Handle modes ────────────────────────────────────────────────────────────
function printReport(): void {
  if (JSON_ONLY) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const pct = ((reachable.length / Math.max(1, declaredRoutes.length)) * 100).toFixed(1);
  console.log("");
  console.log("═══ Orphan-route audit ═══");
  console.log(
    `Declared routes: ${declaredRoutes.length}   Reachable: ${reachable.length} (${pct}%)   Whitelisted: ${whitelistedHits.length}   Orphans: ${nonWhitelistedOrphans.length}`,
  );
  if (nonWhitelistedOrphans.length > 0) {
    console.log("");
    console.log("Orphans (unreachable, not whitelisted):");
    for (const o of nonWhitelistedOrphans) console.log(`  - ${o}`);
  }
  if (VERBOSE && whitelistedHits.length > 0) {
    console.log("");
    console.log("Whitelisted (documented direct-URL-only):");
    for (const o of whitelistedHits) {
      const reason = whitelist.find((w) => w.path === o)?.reason ?? "(no reason)";
      console.log(`  - ${o}  —  ${reason}`);
    }
  }
  console.log("");
  console.log(`Full machine-readable report: ${relative(REPO_ROOT, REPORT_PATH)}`);
}

if (MODE === "write-baseline") {
  const baseline: BaselineFile = {
    version: 1,
    generated_at: new Date().toISOString(),
    orphans: nonWhitelistedOrphans.slice().sort(),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
  if (!JSON_ONLY) {
    console.log(
      `[orphan-audit] Wrote baseline with ${baseline.orphans.length} orphans to ${relative(REPO_ROOT, BASELINE_PATH)}`,
    );
  }
  printReport();
  process.exit(0);
}

if (MODE === "blocking") {
  if (!existsSync(BASELINE_PATH)) {
    console.error(
      `[orphan-audit] --blocking requested but baseline not found at ${BASELINE_PATH}. ` +
        `Run 'npm run orphan-audit -- --write-baseline' first.`,
    );
    process.exit(2);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as BaselineFile;
  const baselineSet = new Set(baseline.orphans);
  const newOrphans = nonWhitelistedOrphans.filter((o) => !baselineSet.has(o));
  printReport();
  if (newOrphans.length > 0) {
    console.log("");
    console.log(`[orphan-audit] ❌ ${newOrphans.length} NEW orphan(s) introduced since baseline:`);
    for (const o of newOrphans) console.log(`  - ${o}`);
    console.log("");
    console.log("Fix options:");
    console.log("  1. WIRE — link from a nav surface (SERVICE_REGISTRY, lifecycle-mapping,");
    console.log("            lifecycle-route-mappings, quick-actions, or any reachable page).");
    console.log("  2. DELETE — remove the page if it is obsolete.");
    console.log("  3. WHITELIST — add to scripts/.orphan-audit-whitelist.json with a reason.");
    console.log("");
    process.exit(1);
  }
  // If the baseline shrank (orphans removed), that's fine — a human can rebaseline.
  console.log("[orphan-audit] ✅ No new orphans vs baseline.");
  process.exit(0);
}

// advisory
printReport();
process.exit(0);
