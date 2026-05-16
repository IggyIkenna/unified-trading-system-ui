#!/usr/bin/env tsx
/**
 * validate-briefings-yaml.ts
 *
 * CI gate for the briefings YAML store. Runs two passes:
 *
 * (1) Schema validation — delegates to `lib/briefings/loader.ts` which
 *     parses every `content/briefings/*.yaml` file and throws on any
 *     structural violation (missing fields, unknown slugs, bad enum
 *     values, etc.). Catches format drift introduced by hand-editing.
 *
 * (2) Codex parity check — for every codex briefing markdown file under
 *     `unified-trading-pm/codex/14-playbooks/experience/*briefing*.md`
 *     (plus the hub file), asserts there is a corresponding YAML file.
 *     The codex slug↔YAML slug mapping is declared inline. Parity is a
 *     structural guardrail, not a content-word-for-word diff — codex is
 *     narrative Stage-2 draft; YAML is deep structured content. Drift in
 *     codex content itself is caught by the G3.5 consistency agent.
 *
 * Exit 0 on clean, 1 on any violation. Blocks PR via CI hook.
 *
 * Usage:
 *   tsx scripts/validate-briefings-yaml.ts
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getAllBriefings, getBriefingsHub, VALID_PILLAR_SLUGS } from "../lib/briefings/loader";
import type { BriefingPillarSlug } from "../lib/briefings/types";

interface CodexMapping {
  readonly codexFile: string;
  readonly yamlSlugs: readonly BriefingPillarSlug[];
}

/**
 * Codex-markdown-to-YAML-pillar mapping. Each codex briefing file covers
 * one or more YAML pillars: `dart-briefing.md` covers three DART pillars
 * (orientation / signals-in / full-pipeline) because the UI split the
 * narrative into three separate pages at G1.12. The `signals-out` pillar
 * does NOT yet have a dedicated codex file (tracked as a G3.5 follow-up);
 * parity accepts that and skips codex lookup for it.
 */
// Aligned with the 3-pillar canonical refactor (b531beb2). DART
// orientation + signals-in + full-pipeline collapsed into the single
// `dart-trading-infrastructure` pillar; regulatory-umbrella renamed to
// `regulated-operating-models`. The signals-out pillar was removed
// entirely (lives elsewhere in the marketing surface).
const CODEX_MAPPING: readonly CodexMapping[] = [
  { codexFile: "im-decision-journey.md", yamlSlugs: ["investment-management"] },
  { codexFile: "regulatory-umbrella-briefing.md", yamlSlugs: ["regulated-operating-models"] },
  { codexFile: "dart-briefing.md", yamlSlugs: ["dart-trading-infrastructure"] },
];

const YAML_ONLY_SLUGS: readonly BriefingPillarSlug[] = [];

const REPO_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(REPO_ROOT, "..");
const CODEX_DIR = path.join(WORKSPACE_ROOT, "unified-trading-pm", "codex", "14-playbooks", "experience");

function fail(errors: readonly string[]): never {
  console.error("\n❌ validate-briefings-yaml FAILED:");
  for (const e of errors) console.error(`   ${e}`);
  console.error("");
  process.exit(1);
}

function main(): void {
  const errors: string[] = [];

  // Pass 1 — schema validation via loader. Any throw = schema violation.
  let pillars: ReadonlyArray<{ readonly slug: BriefingPillarSlug; readonly title: string }>;
  try {
    pillars = getAllBriefings();
    getBriefingsHub();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    fail([`schema: ${msg}`]);
  }

  // Assert the full closed vocabulary is covered — catches a deleted YAML.
  const presentSlugs = new Set(pillars.map((p) => p.slug));
  for (const required of VALID_PILLAR_SLUGS) {
    if (!presentSlugs.has(required)) {
      errors.push(`schema: missing pillar '${required}' in content/briefings/`);
    }
  }

  // Pass 2 — codex parity. Every codex briefing file must map to a YAML
  // pillar set; every mapped YAML pillar must exist (loader already
  // proved it). Checks existence of codex file so renames get caught.
  if (!fs.existsSync(CODEX_DIR)) {
    errors.push(`codex-parity: codex directory missing at ${CODEX_DIR} — workspace layout check failed`);
    fail(errors);
  }

  // Hub parity — codex hub file must exist.
  const codexHub = path.join(CODEX_DIR, "briefings-hub.md");
  if (!fs.existsSync(codexHub)) {
    errors.push(`codex-parity: codex hub file missing at ${codexHub}`);
  }

  for (const mapping of CODEX_MAPPING) {
    const codexPath = path.join(CODEX_DIR, mapping.codexFile);
    if (!fs.existsSync(codexPath)) {
      errors.push(
        `codex-parity: codex file missing at ${codexPath} — rename or delete in codex requires a YAML update`,
      );
      continue;
    }
    for (const slug of mapping.yamlSlugs) {
      if (!presentSlugs.has(slug)) {
        errors.push(
          `codex-parity: codex '${mapping.codexFile}' maps to YAML pillar '${slug}' but YAML file is missing`,
        );
      }
    }
  }

  // Assert YAML-only slugs declare themselves so an unexpected new YAML
  // slug doesn't silently bypass codex parity.
  const mappedYamlSlugs = new Set<string>(CODEX_MAPPING.flatMap((m) => m.yamlSlugs as readonly string[]));
  for (const slug of presentSlugs) {
    const mapped = mappedYamlSlugs.has(slug);
    const yamlOnly = (YAML_ONLY_SLUGS as readonly string[]).includes(slug);
    if (!mapped && !yamlOnly) {
      errors.push(
        `codex-parity: YAML pillar '${slug}' is not referenced by CODEX_MAPPING nor declared in YAML_ONLY_SLUGS — update validate-briefings-yaml.ts`,
      );
    }
  }

  if (errors.length > 0) fail(errors);

  console.log(`✅ validate-briefings-yaml — ${pillars.length} pillars + hub validated, codex parity clean.`);
}

main();
