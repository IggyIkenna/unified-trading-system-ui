import { describe, expect, test } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";

/**
 * CI parity gate for G3.3: runs the `validate-briefings-yaml.ts` script
 * end-to-end inside vitest. Any schema violation or codex↔YAML drift
 * causes this test to fail, which blocks the UI QG gate.
 *
 * This replaces the missing pre-base-ui hook that the rollout template
 * does not yet expose. When the rollout template grows a hook (tracked
 * against the questionnaire-sync plan), this test becomes redundant.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.plan.md
 */

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

describe("briefings YAML validator CI gate (G3.3)", () => {
  test("validate-briefings-yaml.ts exits 0 against the current store", () => {
    // Use the repo-local tsx so the path resolves inside node_modules.
    // Throw-on-non-zero mode via `execSync` — the script's exit(1) becomes
    // a test failure with the error output attached.
    try {
      const out = execSync("npx --no-install tsx scripts/validate-briefings-yaml.ts", {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 60_000,
      });
      expect(out).toContain("validated, codex parity clean");
    } catch (err) {
      const detail =
        err instanceof Error && "stdout" in err
          ? `stdout: ${(err as { stdout?: string }).stdout ?? ""}\nstderr: ${(err as { stderr?: string }).stderr ?? ""}`
          : String(err);
      throw new Error(`validate-briefings-yaml.ts exited non-zero:\n${detail}`);
    }
  });
});
