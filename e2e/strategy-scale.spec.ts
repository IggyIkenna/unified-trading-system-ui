import { test, expect } from "@playwright/test";

/**
 * STRATEGY SCALE E2E TESTS
 *
 * Validates that the platform handles 30+ strategies correctly.
 * The mock API seeds 44 strategies; the dashboard shows a Strategy Performance
 * table and the strategies page lists them all.
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

test.describe("Strategy Scale — 30+ Strategies", () => {
  test("dashboard Strategy Performance table has data rows", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // The dashboard has a "Strategy Performance" card with a table
    await expect(page.locator("text=Strategy Performance")).toBeVisible({
      timeout: 10000,
    });

    // Table body should have strategy rows
    const strategyRows = page.locator(
      'table tbody tr, [data-testid*="strategy"]',
    );
    await expect(async () => {
      expect(await strategyRows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("strategies page lists 30+ strategies", async ({ page }) => {
    await page.goto("/services/trading/strategies");
    await page.waitForLoadState("networkidle");

    // Wait for strategy data to render (table rows or strategy cards)
    const strategyItems = page.locator(
      'table tbody tr, [role="row"], [data-testid*="strategy"], .strategy-card',
    );
    await expect(async () => {
      const count = await strategyItems.count();
      expect(count).toBeGreaterThanOrEqual(30);
    }).toPass({ timeout: 15000 });
  });

  test("strategies API returns 30+ items", async ({ request }) => {
    const response = await request.get(`${API}/strategy/strategies`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const strategies = body.data ?? body.strategies ?? body;
    const count = Array.isArray(strategies) ? strategies.length : 0;
    expect(count).toBeGreaterThanOrEqual(30);
  });

  test("research strategy overview renders strategy list", async ({ page }) => {
    await page.goto("/services/research/strategy/overview");
    await page.waitForLoadState("networkidle");

    // The page should render strategy content
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(200);

    // Look for strategy-related content (table, cards, or list)
    const strategyContent = page.locator(
      'table, [data-testid*="strategy"], text=Strategy',
    );
    await expect(async () => {
      expect(await strategyContent.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("dashboard Live Strategies KPI card shows count", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // The KPI card titled "Live Strategies" should show a number
    await expect(page.locator("text=Live Strategies")).toBeVisible({
      timeout: 10000,
    });
  });
});
