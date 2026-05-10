/**
 * Phase C — DART Terminal landing-page flow (option-c narrow scope, 2026-05-10).
 *
 * Acceptance:
 *   1. /services/dart/terminal renders for a DART-Full persona.
 *   2. Archetype rows render with per-archetype AutomationToggle in MANUAL.
 *   3. Manual-trade panel link surfaces.
 *   4. The TradeMonitor renders when an `?instruction=<id>` URL param is present.
 *   5. Non-DART personas get redirected to the locked page.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/issues/dart_manual_trade_ui_build_2026_05_10.md
 *   (Phase C — option-c narrow scope).
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

test.describe("Phase C — DART Terminal landing", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("renders the terminal page heading + archetypes section for DART-Full personas", async ({
    page,
  }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/dart/terminal");

    await expect(page.getByTestId("dart-terminal-page")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByTestId("dart-terminal-archetypes-section"),
    ).toBeVisible();
    // At least one archetype row from ARCHETYPE_METADATA renders.
    await expect(
      page.getByTestId("dart-terminal-archetype-row").first(),
    ).toBeVisible();
  });

  test("manual-trade panel link routes to /services/trading/overview", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/dart/terminal");

    await expect(page.getByTestId("dart-terminal-page")).toBeVisible({ timeout: 30_000 });
    const tradeLink = page.getByTestId("dart-terminal-trade-link").locator("a");
    await expect(tradeLink).toHaveAttribute("href", "/services/trading/overview");
  });

  test("each archetype row mounts an AutomationToggle in MANUAL mode by default", async ({
    page,
  }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/dart/terminal");

    await expect(page.getByTestId("dart-terminal-page")).toBeVisible({ timeout: 30_000 });
    const firstToggle = page.getByTestId("automation-toggle").first();
    await expect(firstToggle).toBeVisible();
    await expect(firstToggle).toHaveAttribute("data-current-mode", "MANUAL");
    // MANUAL renders only the PAPER forward transition + no kill-switch.
    await expect(firstToggle.getByTestId("automation-toggle-transition-paper")).toBeVisible();
    await expect(firstToggle.getByTestId("automation-toggle-kill-switch")).toHaveCount(0);
  });

  test("renders the TradeMonitor when ?instruction=<id> is present", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/dart/terminal?instruction=instr-test-001");

    await expect(page.getByTestId("dart-terminal-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("dart-terminal-monitor-section")).toBeVisible();
    const monitor = page.getByTestId("trade-monitor");
    await expect(monitor).toBeVisible();
    await expect(monitor).toHaveAttribute("data-instruction-id", "instr-test-001");
  });

  test("hides the TradeMonitor when no ?instruction param is present", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/dart/terminal");

    await expect(page.getByTestId("dart-terminal-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("dart-terminal-monitor-section")).toHaveCount(0);
    await expect(page.getByTestId("trade-monitor")).toHaveCount(0);
  });
});
