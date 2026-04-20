import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.8 — UAC ArchetypeCapability registry (uac-registry-gaps #1).
 *
 * UAC owns the Python SSOT
 * (`unified_api_contracts/internal/architecture_v2/archetype_capability_manifest.json`);
 * UI `lib/architecture-v2/coverage.ts` is regenerated from it by
 * `unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh`
 * (wired into this repo's `scripts/quality-gates.sh` so every push catches drift).
 *
 * This spec covers:
 * 1. UAC manifest + UI coverage.ts exist at their canonical paths.
 * 2. UAC manifest declares exactly 18 archetypes (matches StrategyArchetypeV2).
 * 3. The PM sync --check reports the committed coverage.ts in sync with the manifest.
 * 4. coverage.ts carries the AUTO-GENERATED banner — hand-edits will be caught
 *    by the sync-check on the next push.
 * 5. Admin persona can reach `/services/strategy-catalogue/` without redirect-off
 *    (regression guard — the coverage.ts rewrite must not break the catalogue route).
 * 6. Orphan-reachability — every archetype_id from the UAC manifest appears in
 *    the rendered coverage.ts mapping.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_8_uac_archetype_capability_v2_2026_04_20.plan.md
 * UAC SSOT: unified-api-contracts/unified_api_contracts/internal/architecture_v2/archetype_capability_manifest.json
 * Codex narrative: unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md
 */

const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");
const UAC_MANIFEST = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/internal/architecture_v2/archetype_capability_manifest.json",
);
const COVERAGE_TS = resolve(UI_REPO_ROOT, "lib/architecture-v2/coverage.ts");
const SYNC_SCRIPT = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh",
);

interface ArchetypeCell {
  readonly category: string;
  readonly instrument_type: string;
  readonly status: string;
  readonly venue_ids: readonly string[];
}

interface ArchetypeManifestEntry {
  readonly archetype_id: string;
  readonly family: string;
  readonly uses_rolling_futures: boolean;
  readonly cells: readonly ArchetypeCell[];
}

interface ArchetypeManifest {
  readonly schema_version: string;
  readonly source: string;
  readonly archetype_count: number;
  readonly archetypes: readonly ArchetypeManifestEntry[];
}

function readManifest(): ArchetypeManifest {
  const raw = readFileSync(UAC_MANIFEST, "utf-8");
  return JSON.parse(raw) as ArchetypeManifest;
}

test.describe("refactor G1.8 — UAC ArchetypeCapability", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("UAC manifest + UI coverage.ts exist at canonical paths", () => {
    expect(existsSync(UAC_MANIFEST), `UAC manifest must exist at ${UAC_MANIFEST}`).toBe(true);
    expect(existsSync(COVERAGE_TS), `UI coverage.ts must exist at ${COVERAGE_TS}`).toBe(true);
    expect(existsSync(SYNC_SCRIPT), `PM sync script must exist at ${SYNC_SCRIPT}`).toBe(true);
  });

  test("UAC manifest declares exactly 18 archetypes", () => {
    const manifest = readManifest();
    expect(manifest.archetype_count).toBe(18);
    expect(manifest.archetypes.length).toBe(18);

    // Archetype IDs must be unique — defensive check against copy/paste
    // drift when the manifest is edited by a future tool.
    const ids = new Set(manifest.archetypes.map((e) => e.archetype_id));
    expect(ids.size).toBe(18);
  });

  test("PM sync --check reports coverage.ts in sync with UAC manifest", () => {
    if (!existsSync(SYNC_SCRIPT)) {
      test.skip(true, "PM sync script not reachable — likely a siloed CI checkout");
      return;
    }
    // execFileSync throws on non-zero exit. That is the failure mode we want:
    // a non-zero exit means the committed coverage.ts drifted from the UAC
    // manifest and should be regenerated with:
    //   bash unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh --write
    const stdout = execFileSync("bash", [SYNC_SCRIPT, "--check"], {
      encoding: "utf-8",
      cwd: UI_REPO_ROOT,
    });
    expect(stdout, "sync --check stdout must report coverage.ts up-to-date").toMatch(
      /coverage\.ts is up-to-date/,
    );
  });

  test("coverage.ts carries the AUTO-GENERATED banner", () => {
    const body = readFileSync(COVERAGE_TS, "utf-8");
    expect(
      body,
      "coverage.ts must start with the AUTO-GENERATED banner so hand-edits are obvious",
    ).toContain("AUTO-GENERATED from UAC archetype_capability_manifest.json");
    expect(body).toContain(
      "unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh",
    );
  });

  test("every UAC archetype_id appears in the rendered coverage.ts mapping", () => {
    const manifest = readManifest();
    const body = readFileSync(COVERAGE_TS, "utf-8");
    for (const entry of manifest.archetypes) {
      expect(
        body,
        `coverage.ts must contain a mapping row for ${entry.archetype_id}`,
      ).toContain(`${entry.archetype_id}:`);
    }
  });

  test("admin persona reaches /services/strategy-catalogue/ without redirect-off", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/strategy-catalogue/");
    expect(
      response?.status(),
      "admin persona must land on /services/strategy-catalogue/ (regression guard for UAC rewrite)",
    ).toBeLessThan(400);
    const finalPath = new URL(page.url()).pathname.replace(/\/$/, "");
    expect(finalPath, "admin must stay on /services/strategy-catalogue").toContain(
      "/services/strategy-catalogue",
    );
  });
});
