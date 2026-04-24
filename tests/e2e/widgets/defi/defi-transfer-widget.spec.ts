import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * DeFiTransferWidget — widget validation spec.
 *
 * Route: /services/trading/defi (defi-default preset mounts transfer widget)
 * testids: defi-transfer-widget, transfer-mode-send, transfer-mode-bridge,
 *          to-address-input, chain-from, chain-to (bridge only), asset-select,
 *          amount-input, execute-button
 */

const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator('[data-testid="defi-transfer-widget"]');
}

test.describe.configure({ mode: "serial" });

test.describe("DeFiTransferWidget — UI validation", () => {
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
    await page.waitForSelector('[data-testid="defi-transfer-widget"]', { timeout: 30_000 });
    await w(page).locator('[data-testid="transfer-mode-send"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("widget renders with SEND and BRIDGE mode buttons", async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="transfer-mode-send"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="transfer-mode-bridge"]')).toBeVisible();
  });

  test("SEND mode shows address input, chain, asset, amount, execute", async () => {
    await w(page).locator('[data-testid="transfer-mode-send"]').click();
    await expect(w(page).locator('[data-testid="to-address-input"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="chain-from"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeVisible();
  });

  // ── Execute button state (SEND mode) ──────────────────────────────────────

  test("execute button disabled with empty address and amount", async () => {
    await w(page).locator('[data-testid="to-address-input"]').clear();
    await w(page).locator('[data-testid="amount-input"]').clear();
    await page.waitForTimeout(200);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
  });

  test("execute button remains disabled with only amount filled (no address)", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("1");
    await page.waitForTimeout(200);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("execute button enables with valid address and amount", async () => {
    await w(page).locator('[data-testid="to-address-input"]').fill("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    await w(page).locator('[data-testid="amount-input"]').fill("1");
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
  });

  // ── Asset and chain selects ────────────────────────────────────────────────

  test("chain select opens and shows network options", async () => {
    await w(page).locator('[data-testid="chain-from"]').click();
    const options = page.locator('[role="option"]');
    expect(await options.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape").catch(() => undefined);
  });

  test("asset select opens and shows token options", async () => {
    await w(page).locator('[data-testid="asset-select"]').click();
    const options = page.locator('[role="option"]');
    expect(await options.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape").catch(() => undefined);
  });

  // ── BRIDGE mode ───────────────────────────────────────────────────────────

  test("BRIDGE mode shows chain-from, chain-to, asset, amount", async () => {
    await w(page).locator('[data-testid="transfer-mode-bridge"]').click();
    await page.waitForTimeout(200);
    await expect(w(page).locator('[data-testid="chain-from"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="chain-to"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="amount-input"]')).toBeVisible();
  });

  test("BRIDGE execute button disabled with no amount", async () => {
    await w(page).locator('[data-testid="amount-input"]').clear();
    await page.waitForTimeout(200);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
    await w(page).locator('[data-testid="transfer-mode-send"]').click();
  });

  // ── Execution ─────────────────────────────────────────────────────────────

  test("execute clears amount after transfer placed", async () => {
    await w(page).locator('[data-testid="transfer-mode-send"]').click();
    await w(page).locator('[data-testid="to-address-input"]').fill("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("1");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("");
  });
});
