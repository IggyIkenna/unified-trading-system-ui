import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.9 — Codex scope registry (per-audience documentation surface).
 *
 * Rule 11 declares `scope: [sales, engineer, admin, prospect, investor]`
 * frontmatter on every codex doc, with default `[engineer, admin]` when
 * absent. A build tool emits a manifest `{audience: [paths]}` at
 * `codex/14-playbooks/_generated/scope-manifest.json`; a coverage checker
 * fails CI if any codex doc lacks `scope:` frontmatter.
 *
 * This spec covers the CI-gate integration end — no UI surface consumes the
 * manifest yet (follow-up work in G2.x will wire the sales-collateral
 * generator and UI help drawer). For now:
 *
 * 1. Seed an `admin` persona so the test is executed in the audience with
 *    broadest visibility (mirrors what a future UI consumer would do when it
 *    needs to assert admin visibility).
 * 2. Shell out to `bash codex/14-playbooks/_tools/check-scope-coverage.sh`
 *    and assert exit 0 post-backfill.
 * 3. Assert the generated manifest JSON has a non-empty list for every
 *    audience in the enum (sales, engineer, admin, prospect, investor).
 * 4. Visibility-slicing vs G1.6 `access_control` — stubbed until G1.6 ships.
 *    Rule 11 scope is a per-doc consumption filter; G1.6 access_control is a
 *    per-request auth check. They compose cleanly (doc audience ∩ user
 *    audience) once G1.6 lands.
 * 5. Orphan-reachability — rule 11 is registered in `codex/00-SSOT-INDEX.md`
 *    so it is discoverable from the codex root. Assert the index file
 *    mentions `11-codex-scope-registry.md`.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_9_codex_scope_registry_2026_04_20.md
 * Rule SSOT: unified-trading-pm/codex/14-playbooks/_ssot-rules/11-codex-scope-registry.md
 * Infra spec reference: unified-trading-pm/codex/16-strategy-playbooks/infra-spec/stage-3e-refactor-plan.md §1.9
 */

// Resolve unified-trading-pm relative to process.cwd() — Playwright always
// invokes tests from the UI repo root, so cwd is stable. Avoids
// import.meta.url which requires module: esnext in tsconfig.
const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");
const PM_ROOT = resolve(WORKSPACE_ROOT, "unified-trading-pm");
const COVERAGE_CHECKER = resolve(
  PM_ROOT,
  "codex/14-playbooks/_tools/check-scope-coverage.sh",
);
const MANIFEST_PATH = resolve(
  PM_ROOT,
  "codex/14-playbooks/_generated/scope-manifest.json",
);
const RULE_11_PATH = resolve(
  PM_ROOT,
  "codex/14-playbooks/_ssot-rules/11-codex-scope-registry.md",
);
const SSOT_INDEX_PATH = resolve(PM_ROOT, "codex/00-SSOT-INDEX.md");

const SCOPE_ENUM = ["sales", "engineer", "admin", "prospect", "investor"] as const;

type ScopeManifest = Readonly<Record<(typeof SCOPE_ENUM)[number], readonly string[]>>;

function pmToolsAvailable(): boolean {
  return existsSync(COVERAGE_CHECKER) && existsSync(MANIFEST_PATH);
}

test.describe("refactor G1.9 — codex scope registry", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("rule 11 file exists + is registered in SSOT-INDEX", () => {
    // Orphan-reachability: the rule file must exist and be registered in the
    // master SSOT index so downstream consumers (sales generator, UI help
    // drawer) can discover it without trawling the repo.
    expect(existsSync(RULE_11_PATH), `rule 11 must exist at ${RULE_11_PATH}`).toBe(true);
    expect(existsSync(SSOT_INDEX_PATH), "SSOT-INDEX.md must exist").toBe(true);

    const indexText = readFileSync(SSOT_INDEX_PATH, "utf-8");
    expect(
      indexText,
      "SSOT-INDEX.md must reference 11-codex-scope-registry.md",
    ).toContain("11-codex-scope-registry.md");
  });

  test("check-scope-coverage.sh exits 0 after backfill", () => {
    // CI-gate assertion: every codex doc has `scope:` frontmatter. If this
    // fails, the backfill regressed and a new codex doc was added without a
    // scope tag.
    if (!pmToolsAvailable()) {
      test.skip(true, "PM codex tools not available in this test environment");
      return;
    }

    // execFileSync throws on non-zero exit — that is the failure mode we want.
    const stdout = execFileSync("bash", [COVERAGE_CHECKER], {
      encoding: "utf-8",
      cwd: PM_ROOT,
    });
    expect(stdout, "check-scope-coverage.sh stdout must report OK").toMatch(/^OK:/);
  });

  test("scope-manifest.json has a non-empty list per audience", () => {
    if (!existsSync(MANIFEST_PATH)) {
      test.skip(true, "scope-manifest.json not present (run build-scope-manifest.sh first)");
      return;
    }
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    const manifest = JSON.parse(raw) as ScopeManifest;

    for (const audience of SCOPE_ENUM) {
      expect(
        manifest[audience],
        `manifest must contain the ${audience} audience`,
      ).toBeTruthy();
      expect(
        manifest[audience].length,
        `manifest.${audience} must be non-empty after backfill`,
      ).toBeGreaterThan(0);
    }

    // Engineer + admin are the defaults — should be the two largest audiences.
    expect(manifest.engineer.length).toBeGreaterThan(manifest.prospect.length);
    expect(manifest.admin.length).toBeGreaterThan(manifest.investor.length);

    // Every listed path must be under codex/ and end in .md.
    for (const audience of SCOPE_ENUM) {
      for (const path of manifest[audience]) {
        expect(path, `${audience} path ${path} must start with codex/`).toMatch(
          /^codex\//,
        );
        expect(path, `${audience} path ${path} must be a markdown file`).toMatch(/\.md$/);
      }
    }
  });

  test("visibility-slicing vs G1.6 access_control — stub until G1.6 lands", async ({ page }) => {
    // Rule 11 scope is a per-doc filter: sales-collateral generator picks
    // docs where manifest.sales includes the path. G1.6 will add a
    // per-request `access_control(user, resource)` formula that composes
    // with scope by intersection: visible_doc(user) = audience(doc) ∋ role(user).
    //
    // Until G1.6 lands, stub the check: an admin persona on the UI must be
    // able to reach the help route (if/when it exists) without being
    // redirected off-path. This is a soft guardrail — if the help route is
    // not yet implemented, we skip cleanly.
    await seedPersona(page, "admin");
    const response = await page.goto("/");
    expect(response?.status(), "admin persona must land on / without redirect-off").toBeLessThan(400);

    // The help surface is deferred to a follow-up plan. When it ships, this
    // test upgrades to: navigate to /help?audience=admin and assert that the
    // manifest-derived admin entries render. For now: assert the root is
    // reachable and the persona is seeded correctly.
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname.replace(/\/$/, "") || "/", "admin must stay on /").toBe("/");
  });

  test("rule 11 declares the canonical scope enum", () => {
    // Lightweight structural assertion: rule 11's body must mention the enum
    // values so the doc and the code agree on the contract.
    const body = readFileSync(RULE_11_PATH, "utf-8");
    for (const audience of SCOPE_ENUM) {
      expect(
        body,
        `rule 11 must document the '${audience}' audience`,
      ).toContain(audience);
    }
    expect(body, "rule 11 must describe the default").toContain("[engineer, admin]");
  });
});
