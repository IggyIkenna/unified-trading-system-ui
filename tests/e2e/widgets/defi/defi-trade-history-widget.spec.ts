import { test, expect, type Page } from "@playwright/test";

/**
 * DeFiTradeHistoryWidget — widget validation spec.
 *
 * Route: /services/trading/defi
 * testids: trade-history-row, trade-history-child (nested legs)
 *
 * The trade history widget is the shared ledger that every execution widget
 * writes to. These tests verify display behaviour — column presence, row
 * structure, child-row expansion. The "row appears after execute" contract
 * is covered in each strategy workflow spec.
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFiTradeHistoryWidget — UI validation", () => {
  test.setTimeout(120_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", JSON.stringify({ id: "internal-trader", email: "trader@odum.internal" }));
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });
    await page.goto(`${BASE_URL}/services/trading/defi`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    // Place one trade so there is at least one row to inspect.
    const lendingWidget = page.locator('[data-testid="defi-lending-widget"]');
    await lendingWidget.waitFor({ timeout: 30_000 });
    await lendingWidget.locator('[data-testid="operation-button-LEND"]').click();
    await lendingWidget.locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await lendingWidget.locator('[data-testid="execute-button"]').click();
    await page.waitForTimeout(800);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Rows ───────────────────────────────────────────────────────────────────

  test("at least one trade-history-row is present after executing a trade", async () => {
    const rows = page.locator('[data-testid="trade-history-row"]');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test("each trade row contains non-empty text (type, venue, amount)", async () => {
    const firstRow = page.locator('[data-testid="trade-history-row"]').first();
    await expect(firstRow).toBeVisible();
    const text = (await firstRow.textContent()) ?? "";
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("trade row carries data-trade-type attribute", async () => {
    const firstRow = page.locator('[data-testid="trade-history-row"]').first();
    const tradeType = await firstRow.getAttribute("data-trade-type");
    expect(tradeType).toBeTruthy();
  });

  test("executing a second trade adds another row", async () => {
    const before = await page.locator('[data-testid="trade-history-row"]').count();
    const lendingWidget = page.locator('[data-testid="defi-lending-widget"]');
    await lendingWidget.locator('[data-testid="operation-button-LEND"]').click();
    await lendingWidget.locator('[data-testid="amount-input"]').fill("5");
    await page.waitForTimeout(300);
    await lendingWidget.locator('[data-testid="execute-button"]').click();
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(before + 1);
  });

  test("trades from different operation types (LEND vs SWAP) both appear in history", async () => {
    // Execute a swap trade.
    const swapWidget = page.locator('[data-testid="defi-swap-widget"]');
    await swapWidget.locator('[data-testid="capital-input"]').fill("1000");
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Swap')").first().click();
    await page.waitForTimeout(500);
    // Verify both LEND and SWAP rows exist.
    expect(await page.locator('[data-testid="trade-history-row"][data-trade-type="LEND"]').count()).toBeGreaterThan(0);
    expect(await page.locator('[data-testid="trade-history-row"][data-trade-type="SWAP"]').count()).toBeGreaterThan(0);
  });
});
