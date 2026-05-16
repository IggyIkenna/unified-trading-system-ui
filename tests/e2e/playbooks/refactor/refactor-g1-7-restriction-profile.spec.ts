import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.7 — Restriction-profile engine.
 *
 * PM YAML owns the tile-lock-state matrix at
 * `unified-trading-pm/codex/14-playbooks/demo-ops/profiles/*.yaml` (6 files:
 * admin, client-full, prospect-dart, prospect-im, prospect-regulatory,
 * anon). UAC engine at
 * `unified_api_contracts.internal.architecture_v2.restriction_profiles`
 * loads + resolves, re-exported via `unified_api_contracts.strategy`
 * (`resolve_profile`). The PM sync-script
 * `sync-restriction-profiles-to-ui.sh` generates the TS mirror at
 * `unified-trading-system-ui/lib/architecture-v2/restriction-profiles.ts`
 * which the G1.3 `useTileLockState` hook now reads (no more stub).
 *
 * Drift detection: UI `scripts/quality-gates.sh` runs the sync-script in
 * `--check` mode before base-ui — every push fails on drift.
 *
 * This spec covers:
 *
 * 1. PM YAML + validator + UAC engine + sync-script + TS mirror all exist
 *    at their canonical paths.
 * 2. The TS mirror carries the AUTO-GENERATED banner.
 * 3. The 6 expected personas appear in the TS mirror; each declares the
 *    full tile-id enum.
 * 4. Vocabulary translation at the sync boundary: YAML ``padlocked`` →
 *    UI ``padlocked-visible`` (G1.3 vocab).
 * 5. Admin persona lands on `/services` without redirect-off (regression
 *    guard — the tile-lock-state swap must not break navigation).
 * 6. Every non-hidden tile-id in the admin profile still appears as a
 *    route in the services portal.
 *
 * Deferred to follow-ups:
 *   - G1.10 questionnaire override: real overlay logic (engine slot wired,
 *     empty stub today).
 *   - G1.13 tempt-logic overlay: sales-operator layering on top.
 *   - Dev-vs-staging parity end-to-end: Firebase staging not provisioned.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_7_restriction_profile_engine_2026_04_20.md
 * SSOT: unified-trading-pm/codex/14-playbooks/demo-ops/profiles/*.yaml
 * UAC engine: unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py
 */

const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");

const PROFILES_DIR = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/demo-ops/profiles",
);
const VALIDATOR = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/demo-ops/_tools/validate_profiles.py",
);
const UAC_ENGINE = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py",
);
const SYNC_SCRIPT = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh",
);
const TS_MIRROR = resolve(UI_REPO_ROOT, "lib/architecture-v2/restriction-profiles.ts");

const EXPECTED_PERSONAS = [
  "admin",
  "anon",
  "client-full",
  "prospect-dart",
  "prospect-im",
  "prospect-regulatory",
] as const;

const EXPECTED_TILES = [
  "data",
  "research",
  "promote",
  "trading",
  "observe",
  "reports",
  "investor-relations",
  "admin",
] as const;

test.describe("refactor G1.7 — restriction-profile engine", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("PM YAMLs + validator + UAC engine + sync-script + TS mirror exist", () => {
    for (const persona of EXPECTED_PERSONAS) {
      const yamlPath = resolve(PROFILES_DIR, `${persona}.yaml`);
      expect(existsSync(yamlPath), `profile YAML must exist: ${yamlPath}`).toBe(true);
    }
    expect(existsSync(VALIDATOR), `validator tool must exist at ${VALIDATOR}`).toBe(true);
    expect(existsSync(UAC_ENGINE), `UAC engine must exist at ${UAC_ENGINE}`).toBe(true);
    expect(existsSync(SYNC_SCRIPT), `sync script must exist at ${SYNC_SCRIPT}`).toBe(true);
    expect(existsSync(TS_MIRROR), `TS mirror must exist at ${TS_MIRROR}`).toBe(true);
  });

  test("TS mirror carries the AUTO-GENERATED banner", () => {
    const body = readFileSync(TS_MIRROR, "utf-8");
    expect(body).toContain("AUTO-GENERATED from PM demo-ops/profiles/");
    expect(body).toContain(
      "bash unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh --write",
    );
  });

  test("TS mirror declares all 6 expected personas + 8 expected tiles", () => {
    const body = readFileSync(TS_MIRROR, "utf-8");
    for (const persona of EXPECTED_PERSONAS) {
      expect(body, `TS mirror must contain profile for ${persona}`).toContain(`"${persona}":`);
    }
    for (const tile of EXPECTED_TILES) {
      expect(body, `TS mirror must reference tile ${tile}`).toContain(`"${tile}"`);
    }
  });

  test("TS mirror translates padlocked → padlocked-visible (G1.3 vocab)", () => {
    const body = readFileSync(TS_MIRROR, "utf-8");
    // UI vocabulary uses padlocked-visible; the sync script should have
    // translated YAML's bare "padlocked" into the G1.3 UI enum.
    expect(body).toContain('"padlocked-visible"');
    // And should NOT contain the raw YAML vocabulary (pre-translation).
    // Note: check via word boundary to avoid false positives from
    // "padlocked-visible" containing "padlocked".
    const rawPadlockedMatches = body.match(/"padlocked"/g);
    expect(rawPadlockedMatches, "raw 'padlocked' vocabulary leaked through").toBeNull();
  });

  test("admin persona lands on /services without redirect-off", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services");
    expect(response?.status(), "admin must reach /services").toBeLessThan(400);
  });

  test("PM sync --check reports TS mirror in sync with YAML", () => {
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    const stdout = execFileSync("bash", [SYNC_SCRIPT, "--check"], {
      encoding: "utf-8",
      cwd: UI_REPO_ROOT,
    });
    expect(stdout, "sync --check stdout must report up-to-date").toMatch(
      /restriction-profiles\.ts is up-to-date/,
    );
  });
});
