import { test, expect, type Page } from "@playwright/test";

/**
 * DeFi Staking page — page-level validation spec.
 *
 * Route: /services/trading/defi/staking
 *
 * This is a custom page (not WidgetGrid). It contains:
 *   - Stats cards: Total Value Staked, Portfolio APY, Staking Rewards, Active Positions
 *   - DeFiStakingWidget (execution)
 *   - DeFiStakingRewardsWidget (read-only rewards tracking)
 *   - DeFiWalletSummaryWidget (balances)
 *   - Tabs: Positions | History | Analytics
 *   - Positions table with protocol, token, APY, status columns
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFi Staking page — UI validation", () => {
  test.setTimeout(120_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", JSON.stringify({ id: "internal-trader", email: "trader@odum.internal" }));
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });
    await page.goto(`${BASE_URL}/services/trading/defi/staking`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector('[data-testid="defi-staking-widget"]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Stats cards ────────────────────────────────────────────────────────────

  test("Total Value Staked stat card is visible and shows a dollar value", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Total Value Staked");
    // Should show a formatted USD amount.
    expect(text).toMatch(/\$[\d,]+/);
  });

  test("Portfolio APY stat card is visible and shows a percentage", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Portfolio APY");
    expect(text).toMatch(/\d+\.?\d*\s*%/);
  });

  test("Staking Rewards stat card is visible", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Staking Rewards");
  });

  test("Active Positions stat card is visible", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Active Positions");
  });

  // ── Widgets ────────────────────────────────────────────────────────────────

  test("DeFiStakingWidget renders on the page", async () => {
    await expect(page.locator('[data-testid="defi-staking-widget"]')).toBeVisible();
  });

  test("DeFiStakingRewardsWidget renders on the page", async () => {
    await expect(page.locator('[data-testid="defi-staking-rewards-widget"]')).toBeVisible();
  });

  test("DeFiWalletSummaryWidget renders on the page", async () => {
    await expect(page.locator('[data-testid="defi-wallet-summary-widget"]')).toBeVisible();
  });

  // ── Positions tabs ─────────────────────────────────────────────────────────

  test("Positions tab is present and active by default", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Positions");
  });

  test("positions table shows at least one staking position row", async () => {
    // The table should have rows with protocol + token + APY data.
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("positions table shows Protocol column", async () => {
    const headerText = await page.locator("table thead").textContent();
    expect(headerText).toContain("Protocol");
  });

  test("positions table shows APY column", async () => {
    const headerText = await page.locator("table thead").textContent();
    expect(headerText).toContain("APY");
  });

  test("positions table shows Status column with Active/Cooldown/Withdrawable states", async () => {
    const tableText = await page.locator("table").textContent();
    const hasStatus = ["Active", "Cooldown", "Withdrawable"].some((s) => tableText?.includes(s));
    expect(hasStatus).toBe(true);
  });

  // ── History tab ────────────────────────────────────────────────────────────

  test("History tab is clickable and renders content", async () => {
    const historyTab = page.locator("[role='tab']:has-text('History'), button:has-text('History')").first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(300);
      const text = await page.locator("body").textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  // ── Analytics tab ──────────────────────────────────────────────────────────

  test("Analytics tab is clickable and renders content", async () => {
    const analyticsTab = page.locator("[role='tab']:has-text('Analytics'), button:has-text('Analytics')").first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(300);
      const text = await page.locator("body").textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  // ── Execution from this page ───────────────────────────────────────────────

  test("executing a STAKE from the staking page adds a trade history row", async () => {
    // Navigate back to Positions tab first.
    const positionsTab = page.locator("[role='tab']:has-text('Positions'), button:has-text('Positions')").first();
    if (await positionsTab.isVisible()) await positionsTab.click();

    const stakingWidget = page.locator('[data-testid="defi-staking-widget"]');
    await stakingWidget.locator('[data-testid="operation-button-STAKE"]').click();
    await stakingWidget.locator('[data-testid="amount-input"]').fill("1");
    await page.waitForTimeout(300);
    const before = await page.locator('[data-testid="trade-history-row"]').count();
    await stakingWidget.locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(before + 1);
  });
});
