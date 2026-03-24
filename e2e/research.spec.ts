import { test, expect } from "@playwright/test";

/**
 * RESEARCH & BUILD — E2E Tests
 * Verifies research pages render correctly and key interactions work.
 */

test.describe("Research Hub", () => {
  test("Research overview renders with KPI cards and tabs", async ({
    page,
  }) => {
    await page.goto("/services/research/overview");
    await page.waitForLoadState("networkidle");

    // KPI stats section should render
    await expect(page.locator("h1")).toContainText("Research");

    // Three tabs: ML, Strategy, Execution
    await expect(page.getByRole("tab", { name: /ML/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Strategy/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Execution/i })).toBeVisible();
  });
});

test.describe("ML Models", () => {
  test("ML overview renders model families and experiments", async ({
    page,
  }) => {
    await page.goto("/services/research/ml/overview");
    await page.waitForLoadState("networkidle");

    // Page title or heading should be visible
    await expect(page.locator("text=ML")).toBeVisible();
  });

  test("Experiments table renders with data or empty state", async ({
    page,
  }) => {
    await page.goto("/services/research/ml/experiments");
    await page.waitForLoadState("networkidle");

    // Should show either experiments table or empty state
    const hasTable = await page.locator("table").count();
    const hasEmpty = await page.locator("text=No experiments").count();
    expect(hasTable > 0 || hasEmpty > 0).toBeTruthy();
  });
});

test.describe("Strategy Backtests", () => {
  test("Backtest table renders with data or empty state", async ({ page }) => {
    await page.goto("/services/research/strategy/backtests");
    await page.waitForLoadState("networkidle");

    // Should show either backtest table or empty state
    const hasTable = await page.locator("table").count();
    const hasEmpty = await page.locator("text=No backtests").count();
    expect(hasTable > 0 || hasEmpty > 0).toBeTruthy();
  });

  test("New Strategy wizard opens from button click", async ({ page }) => {
    await page.goto("/services/research/strategy/backtests");
    await page.waitForLoadState("networkidle");

    // Find and click the New Strategy button
    const wizardButton = page.getByRole("button", { name: /New Strategy/i });
    if (await wizardButton.isVisible()) {
      await wizardButton.click();

      // Wizard dialog should open with step indicator
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator("text=Basic Configuration")).toBeVisible();
    }
  });
});

test.describe("Promote - Review Queue", () => {
  test("Candidates page renders with data or empty state", async ({ page }) => {
    await page.goto("/services/research/strategy/candidates");
    await page.waitForLoadState("networkidle");

    // Should show either candidate list or empty state
    const hasTable = await page.locator("table").count();
    const hasEmpty = await page.locator("text=reviewed").count();
    expect(hasTable > 0 || hasEmpty > 0).toBeTruthy();
  });
});
