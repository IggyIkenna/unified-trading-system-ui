import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.2 — Instruction-schema validator middleware (stage-3e §1.2).
 *
 * Stage-3b defines the 8-field client-instruction schema
 * (`codex/14-playbooks/infra-spec/stage-3b-instruction-schema-contract.md` §2).
 * G1.2 ships a UAC-owned validator
 * (`unified-api-contracts/unified_api_contracts/internal/validation/instruction.py`,
 *  re-exported via `unified_api_contracts.instruction`) wired through an
 * execution-service pre-handler at
 * `execution-service/execution_service/validation/instruction_validator_middleware.py`.
 * Successful validations emit the rule-10
 * ``INSTRUCTION_INTEGRATION_DEPTH_OBSERVED`` UTL event (registered in
 *  `unified-trading-library/unified_trading_library/events/event_types.py`)
 * that the G1.6 derivation engine's `cost()` formula consumes.
 *
 * This spec covers the CI-gate integration end — there is no UI instruction-
 * submission surface today, so assertions focus on:
 *
 * 1. Canonical file presence — validator module, middleware, UTL event,
 *    UAC public facade, UAC unit tests, execution-service middleware tests.
 * 2. Orphan-reachability of the nearest live surface (`/services/execution/`)
 *    so the catalogue route stays navigable as a landing page for future
 *    instruction-submission UI work.
 * 3. Admin persona can reach that route without redirect-off (regression
 *    guard — the G1.2 middleware must not break the execution surface).
 *
 * Intentionally skipped until the UI submission surface ships:
 *
 *   - Live 400/200 matrix of invalid + valid instructions through `request.post`.
 *   - Integration-depth score rendering in a UI "preview" panel.
 *   - FieldError[] copy rendering in a form.
 *
 * Those assertions are tracked in ``test.fixme`` blocks below with TODO-G2.x
 * follow-up notes — they will light up once the UI adds an instruction
 * submission form.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_2_instruction_schema_validation_service_2026_04_20.plan
 * UAC SSOT: unified-api-contracts/unified_api_contracts/internal/validation/instruction.py
 * Stage-3b: unified-trading-pm/codex/14-playbooks/infra-spec/stage-3b-instruction-schema-contract.md
 * Rule 10: unified-trading-pm/codex/14-playbooks/_ssot-rules/10-strategy-instruction-schema-principles.md
 */

const UI_REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(UI_REPO_ROOT, "..");

const UAC_VALIDATOR = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/internal/validation/instruction.py",
);
const UAC_FACADE = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/unified_api_contracts/instruction.py",
);
const UAC_TESTS = resolve(
  WORKSPACE_ROOT,
  "unified-api-contracts/tests/internal/unit/test_instruction_validator.py",
);
const EXECUTION_MIDDLEWARE = resolve(
  WORKSPACE_ROOT,
  "execution-service/execution_service/validation/instruction_validator_middleware.py",
);
const EXECUTION_TESTS = resolve(
  WORKSPACE_ROOT,
  "execution-service/tests/unit/test_instruction_validator_middleware.py",
);
const UTL_EVENT_TYPES = resolve(
  WORKSPACE_ROOT,
  "unified-trading-library/unified_trading_library/events/event_types.py",
);

test.describe("refactor G1.2 — instruction-schema validator", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("UAC validator + public facade exist at canonical paths", () => {
    expect(existsSync(UAC_VALIDATOR), `UAC validator must exist at ${UAC_VALIDATOR}`).toBe(true);
    expect(existsSync(UAC_FACADE), `UAC instruction facade must exist at ${UAC_FACADE}`).toBe(true);
    expect(existsSync(UAC_TESTS), `UAC validator tests must exist at ${UAC_TESTS}`).toBe(true);
  });

  test("execution-service middleware + tests exist at canonical paths", () => {
    expect(
      existsSync(EXECUTION_MIDDLEWARE),
      `execution-service middleware must exist at ${EXECUTION_MIDDLEWARE}`,
    ).toBe(true);
    expect(
      existsSync(EXECUTION_TESTS),
      `middleware test must exist at ${EXECUTION_TESTS}`,
    ).toBe(true);
  });

  test("UTL event type registered in event_types.py", () => {
    expect(existsSync(UTL_EVENT_TYPES), "UTL event_types.py must exist").toBe(true);
    // Light structural check — verify the event symbol is declared. The
    // authoritative import check lives in the UTL test suite.
    const body = require("node:fs").readFileSync(UTL_EVENT_TYPES, "utf-8");
    expect(
      body,
      "UTL event_types.py must declare INSTRUCTION_INTEGRATION_DEPTH_OBSERVED",
    ).toContain("INSTRUCTION_INTEGRATION_DEPTH_OBSERVED");
    expect(body).toContain("INSTRUCTION_VALIDATION_EVENT_TYPES");
  });

  test("admin persona reaches /services/execution/ without redirect-off", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/execution/");
    expect(
      response?.status(),
      "admin persona must land on /services/execution/ (regression guard for G1.2 middleware)",
    ).toBeLessThan(400);
    const finalPath = new URL(page.url()).pathname.replace(/\/$/, "");
    expect(finalPath, "admin must stay on /services/execution").toContain("/services/execution");
  });

  test.fixme("valid instruction POST returns 200 + integration_depth surfaced", () => {
    // TODO(G2.x submission-UI): once the UI ships an instruction-submission
    // surface (`/services/execution/submit` or similar), drive a matrix of
    // structured-vs-loose instructions via `request.post` and assert the
    // integration_depth score appears in the response body or a preview
    // panel. Reference: stage-3b §2 rich schema + rule-10 uplift table.
  });

  test.fixme("invalid instruction POST returns 400 + structured FieldError[]", () => {
    // TODO(G2.x submission-UI): submit missing-field, unsupported-venue, and
    // BL-*-triggered instructions; assert HTTP 400 + body shape
    // { errors: [{ field, violation, allowed, why }, ...], error_count: N }.
    // Reference: execution-service middleware `InstructionRejected.to_response_body()`.
  });

  test.fixme(
    "integration_depth score gradient: structured > hybrid > loose",
    () => {
      // TODO(G2.x submission-UI): assert increasing integration_depth for
      // minimal → richer → custom-allocator instructions to verify the rule-10
      // uplift signal wires through to the G1.6 `cost()` formula.
    },
  );
});
