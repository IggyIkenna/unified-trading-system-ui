#!/usr/bin/env tsx
/**
 * migrate-briefings-from-codex.ts
 *
 * One-shot migrator: reads the structured briefing content from
 * `lib/briefings/content.ts` (which was the canonical TypeScript store
 * shipped by G1.12 polish, seeded from
 * `unified-trading-pm/codex/14-playbooks/experience/*.md`) and emits one
 * YAML file per pillar to `content/briefings/<slug>.yaml` plus a
 * `_hub.yaml` index file.
 *
 * This script is idempotent — re-running it regenerates the YAML from the
 * current TS source. After the G3.3 migration is complete, `content.ts`
 * becomes a thin re-export of `lib/briefings/loader.ts` and the YAML store
 * is the editable SSOT.
 *
 * Usage:
 *   tsx scripts/migrate-briefings-from-codex.ts           # dry-run (stdout diff)
 *   tsx scripts/migrate-briefings-from-codex.ts --write   # write YAML files
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.plan.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import type { BriefingHub, BriefingPillar, BriefingPillarSlug } from "../lib/briefings/types";

/**
 * Display order matches `app/(public)/briefings/page.tsx`. The hub file
 * carries this so the UI reads it from YAML rather than hardcoding.
 *
 * Note: this is a one-shot migration script written against the legacy
 * 6-pillar vocabulary (pre-G1.12). Current canonical vocabulary is 3
 * pillars (see `BriefingPillarSlug` in lib/briefings/types.ts). The legacy
 * slugs here are kept as plain strings so the file typechecks against the
 * current narrow union without losing the historical migration record.
 */
const HUB_DISPLAY_ORDER: readonly string[] = [
  "platform",
  "investment-management",
  "dart-full",
  "dart-signals-in",
  "signals-out",
  "regulatory",
];

/**
 * Hub framing copy, matches the current hub page. Migrator seeds it; sales
 * iterates it via YAML PRs.
 */
const HUB_FRAMING: Pick<BriefingHub, "title" | "tldr" | "cta"> = {
  title: "Briefings",
  tldr: "How we invest, how we're regulated, and every path through our platform — from signals in, to signals out.",
  cta: { label: "Book 45-minute call", href: "/contact" },
};

const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "briefings");

/**
 * YAML dump options tuned for long prose bodies — line-width:-1 disables
 * wrapping so multi-sentence bodies stay on a single line; noRefs prevents
 * anchor/alias generation on repeated strings.
 */
const YAML_DUMP_OPTIONS: yaml.DumpOptions = {
  lineWidth: -1,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false,
  sortKeys: false,
};

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pillarToYaml(pillar: BriefingPillar): string {
  // Explicit plain-object projection so YAML has stable key order (slug,
  // title, tldr, frame, sections, keyMessages, nextCall, cta).
  const plain: Record<string, unknown> = {
    slug: pillar.slug,
    title: pillar.title,
    tldr: pillar.tldr,
    frame: pillar.frame,
    sections: pillar.sections.map((s) => {
      const section: Record<string, unknown> = {
        title: s.title,
        body: s.body,
      };
      if (s.appliesTo !== undefined) section.appliesTo = s.appliesTo;
      if (s.bullets !== undefined) section.bullets = [...s.bullets];
      if (s.bodyAfter !== undefined) section.bodyAfter = s.bodyAfter;
      return section;
    }),
    keyMessages: [...pillar.keyMessages],
    nextCall: pillar.nextCall,
    cta: { label: pillar.cta.label, href: pillar.cta.href },
  };
  return yaml.dump(plain, YAML_DUMP_OPTIONS);
}

function hubToYaml(hub: BriefingHub): string {
  const plain: Record<string, unknown> = {
    title: hub.title,
    tldr: hub.tldr,
    cta: { label: hub.cta.label, href: hub.cta.href },
    displayOrder: [...hub.displayOrder],
  };
  return yaml.dump(plain, YAML_DUMP_OPTIONS);
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");

  // Dynamic import so the migrator is decoupled from build-time statics.
  // The import path keeps working both before the loader swap (reads
  // TS literal) and after (reads YAML via the loader's re-export).
  const { BRIEFING_PILLARS } = (await import("../lib/briefings/content")) as {
    BRIEFING_PILLARS: readonly BriefingPillar[];
  };

  ensureDir(CONTENT_DIR);

  let changedCount = 0;
  const summary: string[] = [];

  for (const pillar of BRIEFING_PILLARS) {
    const yamlStr = pillarToYaml(pillar);
    const outPath = path.join(CONTENT_DIR, `${pillar.slug}.yaml`);
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
    if (existing !== yamlStr) {
      changedCount += 1;
      summary.push(`  ${existing ? "modified" : "created"}: content/briefings/${pillar.slug}.yaml`);
      if (write) fs.writeFileSync(outPath, yamlStr, "utf8");
    } else {
      summary.push(`  unchanged: content/briefings/${pillar.slug}.yaml`);
    }
  }

  const hub: BriefingHub = { ...HUB_FRAMING, displayOrder: HUB_DISPLAY_ORDER as readonly BriefingPillarSlug[] };
  const hubYaml = hubToYaml(hub);
  const hubPath = path.join(CONTENT_DIR, "_hub.yaml");
  const hubExisting = fs.existsSync(hubPath) ? fs.readFileSync(hubPath, "utf8") : "";
  if (hubExisting !== hubYaml) {
    changedCount += 1;
    summary.push(`  ${hubExisting ? "modified" : "created"}: content/briefings/_hub.yaml`);
    if (write) fs.writeFileSync(hubPath, hubYaml, "utf8");
  } else {
    summary.push(`  unchanged: content/briefings/_hub.yaml`);
  }

  console.log(`Briefing migrator — ${write ? "write" : "dry-run"} mode`);
  console.log(summary.join("\n"));
  console.log(`\n${changedCount} file(s) would be ${write ? "written" : "changed"}.`);

  if (!write && changedCount > 0) {
    console.log("\nRun with --write to persist changes.");
    process.exit(0);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("migrate-briefings-from-codex failed:", msg);
  process.exit(1);
});
