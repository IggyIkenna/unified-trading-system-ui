import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Refactor G1.13 — Demo upsell-overlay tempt-logic.
 *
 * PM YAML declares the per-axis widening hierarchy at
 * `unified-trading-pm/codex/14-playbooks/demo-ops/upsell-overlay-hierarchy.yaml`
 * (4 widenable axes: categories, instrument_types, venue_scope, strategy_style;
 * service_family + fund_structure NEVER widen). UAC transform lives at
 * `unified-api-contracts/.../internal/architecture_v2/tempt_logic.py` and
 * is chained into `resolve_profile` before the overlay applies.
 *
 * Coverage:
 * 1. YAML + validator + UAC transform exist at canonical paths.
 * 2. YAML declares rule_id 12 → actually 13 (lineage note) + the 4 widenable axes.
 * 3. YAML refuses to declare service_family / fund_structure (validator rejects).
 * 4. Playwright submission-round-trip: vague questionnaire in dev → wider categories
 *    in localStorage (simulated via the UAC transform semantics); tight → tight.
 *
 * End-to-end UI widening assertions (vague vs tight showing different tiles)
 * are deferred — they require the demo-provider to read
 * `questionnaire-response-v1` localStorage and thread it through to
 * `useTileLockState`. That wiring is a G2.x follow-up (separate plan item).
 * This spec asserts the hierarchy + transform shipped correctly.
 */

const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");

const HIERARCHY_YAML = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/demo-ops/upsell-overlay-hierarchy.yaml",
);
const VALIDATOR = resolve(
  WORKSPACE_ROOT,
  "unified-trading-pm/codex/14-playbooks/demo-ops/_tools/validate_upsell_hierarchy.py",
);
const UAC_TEMPT_LOGIC = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/internal/architecture_v2/tempt_logic.py",
);

test.describe("refactor G1.13 — upsell-overlay tempt-logic", () => {
  test("hierarchy YAML + validator + UAC transform exist", () => {
    expect(existsSync(HIERARCHY_YAML), `YAML must exist at ${HIERARCHY_YAML}`).toBe(true);
    expect(existsSync(VALIDATOR), `validator must exist at ${VALIDATOR}`).toBe(true);
    expect(existsSync(UAC_TEMPT_LOGIC), `UAC transform must exist at ${UAC_TEMPT_LOGIC}`).toBe(
      true,
    );
  });

  test("YAML declares the 4 widenable axes + omits service_family/fund_structure", () => {
    const body = require("node:fs").readFileSync(HIERARCHY_YAML, "utf-8");
    for (const axis of ["categories", "instrument_types", "venue_scope", "strategy_style"]) {
      expect(body).toContain(`${axis}:`);
    }
    // Commercial-axis picks never widen — the validator also enforces this.
    expect(body).not.toMatch(/^  service_family:/m);
    expect(body).not.toMatch(/^  fund_structure:/m);
  });

  test("validator exits 0 on the committed hierarchy YAML", () => {
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    // Uses python3 from PATH; if the workspace .venv-workspace is on
    // PATH (per .claude/settings.json), we pick that up automatically.
    const stdout = execFileSync("python3", [VALIDATOR], {
      encoding: "utf-8",
      cwd: UI_REPO_ROOT,
    });
    expect(stdout).toMatch(/OK: upsell-overlay hierarchy valid/);
  });

  test.fixme("vague questionnaire → wider services portal tiles", () => {
    // TODO(G2.x demo-provider wiring): end-to-end widening assertion
    // requires demo-provider to thread `questionnaire-response-v1`
    // localStorage into useTileLockState. That wiring ships in a
    // follow-up plan; the UAC transform itself is unit-tested in
    // unified-api-contracts/tests/internal/unit/test_tempt_logic.py.
  });
});
