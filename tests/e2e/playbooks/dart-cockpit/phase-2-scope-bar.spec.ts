/**
 * Phase 2 — DartScopeBar mount + interactions on every cockpit-tier surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §6 + Phase 2 of §17.
 *
 * Acceptance:
 *   1. The bar renders on Dashboard, Trading, Observe, Research, Strategy
 *      Catalogue, Reports, Signals.
 *   2. Compact form answers "what am I looking at?" in one line.
 *   3. Expanded form lets the user reach the Engagement toggle in ≤1 click.
 *   4. The §4.3 Live confirm dialog fires on Paper → Live for entitled
 *      personas; Cancel keeps stream on paper.
 *   5. Personas without `execution-full` see Live disabled-with-tooltip
 *      (the option is reachable but `aria-disabled="true"`); clicking is a
 *      no-op — no confirm dialog opens.
 *
 * Mode: dev:mock on port 3100. NEXT_PUBLIC_AUTH_PROVIDER=demo so seedPersona
 * via DemoAuthProvider works.
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

const COCKPIT_SURFACES = [
  { name: "Dashboard", url: "/dashboard" },
  { name: "Trading", url: "/services/trading/overview" },
  { name: "Observe", url: "/services/observe/risk" },
  { name: "Research", url: "/services/research/strategies" },
  { name: "Strategy Catalogue", url: "/services/strategy-catalogue" },
  { name: "Reports", url: "/services/reports/overview" },
  { name: "Signals", url: "/services/signals/dashboard" },
] as const;

test.describe("Phase 2 — DartScopeBar mount + interactions", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  for (const surface of COCKPIT_SURFACES) {
    test(`renders on ${surface.name}`, async ({ page }) => {
      await seedPersona(page, "client-full");
      await page.goto(surface.url);
      // Bar may need a moment to mount on first compile.
      await expect(page.getByTestId("dart-scope-bar")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("dart-scope-bar-toggle")).toBeVisible();
    });
  }

  test("expand reveals chip + dial controls; Engagement toggle reachable in 1 click", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/dashboard");
    await expect(page.getByTestId("dart-scope-bar")).toBeVisible({ timeout: 30_000 });
    // Expand
    await page.getByTestId("dart-scope-bar-toggle").click();
    // ≤1 click after expand: Engagement toggle is visible
    await expect(page.getByTestId("scope-engagement-replicate")).toBeVisible();
    await page.getByTestId("scope-engagement-replicate").click();
    const persisted = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    expect(parsed.state.scope.engagement).toBe("replicate");
  });

  test("§4.3 Live confirm dialog fires on Paper → Live for entitled persona", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/dashboard");
    await expect(page.getByTestId("dart-scope-bar")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("dart-scope-bar-toggle").click();
    await page.getByTestId("scope-execution-stream-live").click();
    await expect(page.getByTestId("execution-stream-live-confirm")).toBeVisible();
    // Cancel keeps paper
    await page.getByTestId("execution-stream-live-cancel").click();
    // Cancel never mutates the store; localStorage may be null (no prior writes) or paper.
    const cancelStream = await page.evaluate(() => {
      const persisted = window.localStorage.getItem("dart-workspace-scope");
      if (!persisted) return "paper" as const; // store default
      return (JSON.parse(persisted) as { state: { scope: { executionStream: string } } }).state.scope
        .executionStream;
    });
    expect(cancelStream).toBe("paper");

    // Re-trigger + confirm flips to live
    await page.getByTestId("scope-execution-stream-live").click();
    await page.getByTestId("execution-stream-live-confirm-button").click();
    await page.waitForFunction(() => {
      const persisted = window.localStorage.getItem("dart-workspace-scope");
      if (!persisted) return false;
      try {
        return (JSON.parse(persisted) as { state: { scope: { executionStream: string } } }).state.scope
          .executionStream === "live";
      } catch {
        return false;
      }
    });
  });

  test("Live disabled-with-tooltip for personas without execution-full", async ({ page }) => {
    await seedPersona(page, "client-data-only");
    await page.goto("/dashboard");
    await expect(page.getByTestId("dart-scope-bar")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("dart-scope-bar-toggle").click();
    const liveBtn = page.getByTestId("scope-execution-stream-live");
    await expect(liveBtn).toBeVisible();
    await expect(liveBtn).toHaveAttribute("aria-disabled", "true");
    // Click is a no-op — Playwright's actionability rejects aria-disabled,
    // so use force: true to bypass and prove the underlying button truly is
    // a no-op (no confirm dialog, no state change).
    await liveBtn.click({ force: true });
    await expect(page.getByTestId("execution-stream-live-confirm")).not.toBeVisible();
    const stream = await page.evaluate(() => {
      const persisted = window.localStorage.getItem("dart-workspace-scope");
      if (!persisted) return "paper" as const;
      return (JSON.parse(persisted) as { state: { scope: { executionStream: string } } }).state.scope
        .executionStream;
    });
    expect(stream).toBe("paper");
  });
});
