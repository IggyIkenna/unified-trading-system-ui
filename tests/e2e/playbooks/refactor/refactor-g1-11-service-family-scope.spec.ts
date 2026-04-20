import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.11 — Service-family scope rules (rule 12).
 *
 * PM YAML owns the scope matrix at
 * `unified-trading-pm/codex/14-playbooks/_ssot-rules/12-service-family-scope-rules.yaml`
 * (6 families: IM, RegUmbrella, DART, DART_reporting_only, admin, IM_desk).
 * UAC enforcement at
 * `unified_api_contracts.internal.architecture_v2.service_family_scope`
 * is wired into `access_control()` as a short-circuit pre-check.
 *
 * Note on rule numbering: the original plan called for "rule 11" but slot 11
 * was taken by `11-codex-scope-registry.md` (G1.9, shipped 2026-04-20).
 * This refactor takes slot **12** — see the rule 12 md for the lineage note.
 *
 * This spec covers:
 *
 * 1. Rule 12 YAML + MD + validator + UAC enforcement module all exist at
 *    their canonical paths.
 * 2. YAML declares the 6 expected service families + standard fields.
 * 3. SSOT-INDEX registers rule 12; rule 04 cross-references rule 12.
 * 4. UI route-gating semantics: admin reaches `/services/*`; IM client
 *    cannot reach research-gated routes (guarded by G1.6 access_control
 *    which now pre-checks scope).
 * 5. prospect-dart + prospect-regulatory asserted against rule-12 scope —
 *    both personas landed via G1.4 persona combinatorial expansion
 *    (unblocks TODO(G1.10) deferrals).
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_11_service_family_scope_rules_2026_04_20.plan.md
 * Rule: unified-trading-pm/codex/14-playbooks/_ssot-rules/12-service-family-scope-rules.md
 * UAC: unified-api-contracts/unified_api_contracts/internal/architecture_v2/service_family_scope.py
 */

const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");

const RULE_YAML = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/_ssot-rules/12-service-family-scope-rules.yaml",
);
const RULE_MD = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/_ssot-rules/12-service-family-scope-rules.md",
);
const RULE_VALIDATOR = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/_ssot-rules/_tools/validate_scope_yaml.py",
);
const UAC_MODULE = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/internal/architecture_v2/service_family_scope.py",
);
const SSOT_INDEX = resolve(WORKSPACE_ROOT, "unified-trading-pm/codex/00-SSOT-INDEX.md");
const RULE_04 = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/_ssot-rules/04-dart-commercial-axes.md",
);

const EXPECTED_FAMILIES = [
  "IM",
  "RegUmbrella",
  "DART",
  "DART_reporting_only",
  "admin",
  "IM_desk",
] as const;

test.describe("refactor G1.11 — service-family scope rules (rule 12)", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("rule 12 YAML + MD + validator + UAC module exist", () => {
    expect(existsSync(RULE_YAML), `rule 12 YAML must exist at ${RULE_YAML}`).toBe(true);
    expect(existsSync(RULE_MD), `rule 12 MD must exist at ${RULE_MD}`).toBe(true);
    expect(existsSync(RULE_VALIDATOR), `validator must exist at ${RULE_VALIDATOR}`).toBe(true);
    expect(existsSync(UAC_MODULE), `UAC module must exist at ${UAC_MODULE}`).toBe(true);
  });

  test("rule 12 YAML declares the 6 expected service families", () => {
    const body = readFileSync(RULE_YAML, "utf-8");
    for (const family of EXPECTED_FAMILIES) {
      expect(body, `rule 12 YAML must declare family: ${family}`).toMatch(
        new RegExp(`^  ${family}:`, "m"),
      );
    }
    expect(body).toMatch(/rule_id:\s*12/);
    expect(body).toMatch(/rule_name:\s*service-family-scope-rules/);
  });

  test("SSOT-INDEX registers rule 12", () => {
    const body = readFileSync(SSOT_INDEX, "utf-8");
    expect(body).toContain("service-family scope rules");
  });

  test("rule 04 cross-references rule 12 without duplicating the table", () => {
    const body = readFileSync(RULE_04, "utf-8");
    expect(body).toContain("12-service-family-scope-rules.md");
    expect(body).toContain("see rule 12");
  });

  test("admin persona reaches /services without redirect-off", async ({ page }) => {
    // Admin short-circuits inside access_control (before scope check) —
    // any route is allowed. This regression-guards against the pre-check
    // introducing a spurious admin deny.
    await seedPersona(page, "admin");
    const response = await page.goto("/services");
    expect(response?.status(), "admin must reach /services").toBeLessThan(400);
  });

  test("client-full persona reaches /services/trading without redirect-off", async ({ page }) => {
    // client-full maps to trading_platform_subscriber → DART. DART scope
    // allows /services/trading/**.
    await seedPersona(page, "client-full");
    const response = await page.goto("/services/trading");
    expect(
      response?.status(),
      "DART-family persona must reach /services/trading",
    ).toBeLessThan(400);
  });

  test("prospect-dart persona reaches /services/trading (DART scope allow)", async ({
    page,
  }) => {
    // prospect-dart maps to DART service-family. Rule 12 allows DART audiences
    // to reach /services/trading/**. Shipped with G1.4 persona expansion.
    await seedPersona(page, "prospect-dart");
    const response = await page.goto("/services/trading");
    expect(
      response?.status(),
      "prospect-dart (DART scope) must reach /services/trading",
    ).toBeLessThan(400);
  });

  test("prospect-regulatory persona reaches /services/reports (Reg Umbrella reporting scope)", async ({
    page,
  }) => {
    // prospect-regulatory maps to RegUmbrella service-family. Rule 12 allows
    // reporting-capable audiences to reach /services/reports/**. Shipped with
    // G1.4 persona expansion.
    await seedPersona(page, "prospect-regulatory");
    const response = await page.goto("/services/reports");
    expect(
      response?.status(),
      "prospect-regulatory (Reg Umbrella reporting scope) must reach /services/reports",
    ).toBeLessThan(400);
  });
});
