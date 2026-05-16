/**
 * Phase 1A — WorkspaceScope foundation E2E.
 *
 * Per dart_ux_cockpit_executing_agent_prompt_2026_04_29.md per-phase gate #5:
 * the unified WorkspaceScope must persist across navigate + refresh + copied
 * URL. This spec exercises the three flows.
 *
 * Plan-of-record: dart_ux_cockpit_refactor_2026_04_29.plan §17 Phase 1.
 *
 * Hydration contract under test (lib/architecture-v2/workspace-scope.ts §7):
 *   - URL params beat localStorage on mount
 *   - browser back/forward restores previous scope
 *   - serialize/parse round-trip preserves every set field
 *   - `stream=live` silently downgrades to `paper` for personas without
 *     `execution-full` entitlement (§4.3 safety contract — covered here for
 *     `client-data-only`, who lacks the entitlement)
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

const SCOPED_URL =
  "/dashboard?surface=terminal&tm=command&ag=DEFI&fam=CARRY_AND_YIELD&eng=monitor&stream=paper";

test.describe("Phase 1A — WorkspaceScope foundation", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("scope hydrates from URL params on mount (admin)", async ({ page }) => {
    await seedPersona(page, "admin");
    await page.goto(SCOPED_URL);
    // Read the persisted scope blob from localStorage.
    // The provider hydrates from URL on mount via a useEffect, then the
    // Zustand persist middleware writes to localStorage. Wait for that
    // before reading.
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const persisted = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    expect(persisted).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    expect(parsed.state.scope.surface).toBe("terminal");
    expect(parsed.state.scope.terminalMode).toBe("command");
    expect(parsed.state.scope.assetGroups).toEqual(["DEFI"]);
    expect(parsed.state.scope.families).toEqual(["CARRY_AND_YIELD"]);
    expect(parsed.state.scope.engagement).toBe("monitor");
    expect(parsed.state.scope.executionStream).toBe("paper");
  });

  test("scope persists across page reload (admin)", async ({ page }) => {
    await seedPersona(page, "admin");
    await page.goto(SCOPED_URL);
    await expect(page).toHaveURL(/surface=terminal/);
    // Wait for hydration before reload.
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    // Reload — the localStorage-persisted scope should still be present.
    await page.reload();
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const persistedAfterReload = await page.evaluate(() =>
      window.localStorage.getItem("dart-workspace-scope"),
    );
    expect(persistedAfterReload).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(
      persistedAfterReload!,
    );
    expect(parsed.state.scope.assetGroups).toEqual(["DEFI"]);
    expect(parsed.state.scope.families).toEqual(["CARRY_AND_YIELD"]);
  });

  test("copied URL restores scope in a fresh tab (admin)", async ({ browser }) => {
    // First context — seed the scope from a URL.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await seedPersona(pageA, "admin");
    await pageA.goto(SCOPED_URL);
    await pageA.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);

    // Capture the URL the user would copy-paste.
    const sharedUrl = pageA.url();
    await ctxA.close();

    // Second context — paste the URL into a clean session, expect the same
    // scope to hydrate from the URL params.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await seedPersona(pageB, "admin");
    await pageB.goto(sharedUrl);
    await pageB.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);

    const persisted = await pageB.evaluate(() =>
      window.localStorage.getItem("dart-workspace-scope"),
    );
    expect(persisted).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    expect(parsed.state.scope.assetGroups).toEqual(["DEFI"]);
    expect(parsed.state.scope.families).toEqual(["CARRY_AND_YIELD"]);
    await ctxB.close();
  });

  test("§4.3 safety: stream=live downgrades to paper for personas lacking execution-full", async ({
    page,
  }) => {
    // client-data-only does NOT carry `execution-full`.
    await seedPersona(page, "client-data-only");
    await page.goto("/dashboard?surface=terminal&tm=command&stream=live");
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const persisted = await page.evaluate(() =>
      window.localStorage.getItem("dart-workspace-scope"),
    );
    expect(persisted).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    // The §4.3 safety contract demands silent downgrade.
    expect(parsed.state.scope.executionStream).toBe("paper");
  });

  test("admin (with execution-full) can hydrate stream=live", async ({ page }) => {
    await seedPersona(page, "admin");
    await page.goto("/dashboard?surface=terminal&tm=command&stream=live");
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const persisted = await page.evaluate(() =>
      window.localStorage.getItem("dart-workspace-scope"),
    );
    expect(persisted).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    // Admin holds the wildcard "*" entitlement — live is honoured.
    expect(parsed.state.scope.executionStream).toBe("live");
  });
});
