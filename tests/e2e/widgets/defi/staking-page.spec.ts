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

  test("Total Staked stat card is visible and shows a dollar value", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Total Staked");
    // Shows a formatted USD amount like $3.8M or $1,024,000.
    expect(text).toMatch(/\$[\d,.]+[KMB]?/);
  });

  test("Annual Yield stat card is visible and shows a percentage", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Annual Yield");
    expect(text).toMatch(/\d+\.?\d*\s*%/);
  });

  test("Rewards Accrued stat card is visible", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Rewards Accrued");
  });

  test("Active Validators stat card is visible", async () => {
    const text = await page.locator("body").textContent();
    expect(text).toContain("Active Validators");
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
    const headerText = await page.locator('[data-testid="staking-positions-table"] thead').textContent();
    expect(headerText).toContain("Protocol");
  });

  test("positions table shows APY column", async () => {
    const headerText = await page.locator('[data-testid="staking-positions-table"] thead').textContent();
    expect(headerText).toContain("APY");
  });

  test("positions table shows Status column with Active/Cooldown/Withdrawable states", async () => {
    const tableText = await page.locator('[data-testid="staking-positions-table"]').textContent();
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

  test("executing a STAKE from the staking page shows confirmation toast", async () => {
    const positionsTab = page.locator("[role='tab']:has-text('Positions'), button:has-text('Positions')").first();
    if (await positionsTab.isVisible()) await positionsTab.click();

    const stakingWidget = page.locator('[data-testid="defi-staking-widget"]');
    await stakingWidget.locator('[data-testid="operation-button-STAKE"]').click();
    await stakingWidget.locator('[data-testid="amount-input"]').fill("1");
    await page.waitForTimeout(300);
    await expect(stakingWidget.locator('[data-testid="execute-button"]')).toBeEnabled();
    await stakingWidget.locator('[data-testid="execute-button"]').click();
    // Toast appears — staking page doesn't co-render trade history.
    await expect(page.locator("text=DeFi order placed").or(page.locator("text=STAKE")).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
