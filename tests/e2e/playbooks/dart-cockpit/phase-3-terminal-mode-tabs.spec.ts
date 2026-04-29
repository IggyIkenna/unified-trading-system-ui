/**
 * Phase 3 — TerminalModeTabs mount + interactions on cockpit-tier surfaces.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.2 + Phase 3 of §17.
 *
 * Acceptance:
 *   1. The 5-mode tabs render on every Trading + Observe route (the cockpit
 *      Terminal anchor surfaces).
 *   2. Each tab links to the mode's `defaultHref`.
 *   3. Click navigates AND flips `scope.terminalMode` + `scope.surface`.
 *   4. Landing on a route auto-syncs scope.terminalMode (deep-link contract).
 *
 * Mode: dev:mock on port 3100.
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

test.describe("Phase 3 — TerminalModeTabs", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("renders all 5 mode tabs on /services/trading/overview", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/trading/overview");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("terminal-mode-tab-command")).toBeVisible();
    await expect(page.getByTestId("terminal-mode-tab-markets")).toBeVisible();
    await expect(page.getByTestId("terminal-mode-tab-strategies")).toBeVisible();
    await expect(page.getByTestId("terminal-mode-tab-explain")).toBeVisible();
    await expect(page.getByTestId("terminal-mode-tab-ops")).toBeVisible();
  });

  test("active mode = Command on /services/trading/overview", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/trading/overview");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("terminal-mode-tabs")).toHaveAttribute("data-active-mode", "command");
    await expect(page.getByTestId("terminal-mode-tab-command-indicator")).toBeVisible();
  });

  test("URL drives active mode — landing on /services/observe/reconciliation activates Explain", async ({
    page,
  }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/observe/reconciliation");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("terminal-mode-tabs")).toHaveAttribute("data-active-mode", "explain");
  });

  test("URL drives active mode — landing on /services/observe/event-audit activates Ops", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/observe/event-audit");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("terminal-mode-tabs")).toHaveAttribute("data-active-mode", "ops");
  });

  test("clicking a mode tab navigates to its defaultHref", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/trading/overview");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("terminal-mode-tab-markets").click();
    await page.waitForURL(/\/services\/trading\/markets/);
    await expect(page.getByTestId("terminal-mode-tabs")).toHaveAttribute("data-active-mode", "markets");
  });

  test("route → scope auto-sync persists to localStorage", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/trading/strategies");
    await expect(page.getByTestId("terminal-mode-tabs")).toBeVisible({ timeout: 30_000 });
    // Wait for the persist write triggered by the route-driven useEffect.
    await page.waitForFunction(() => {
      const persisted = window.localStorage.getItem("dart-workspace-scope");
      if (!persisted) return false;
      try {
        const parsed = JSON.parse(persisted) as { state: { scope: { terminalMode: string | null; surface: string } } };
        return parsed.state.scope.terminalMode === "strategies" && parsed.state.scope.surface === "terminal";
      } catch {
        return false;
      }
    });
  });
});
