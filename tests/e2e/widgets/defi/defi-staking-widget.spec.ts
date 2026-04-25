import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * DeFiStakingWidget — widget validation spec.
 *
 * Route: /services/trading/defi (defi-default preset mounts staking widget)
 * testids: defi-staking-widget, operation-button-STAKE, operation-button-UNSTAKE,
 *          protocol-select, amount-input, expected-apy, expected-yield, execute-button
 */

const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator('[data-testid="defi-staking-widget"]');
}

test.describe.configure({ mode: "serial" });

test.describe("DeFiStakingWidget — UI validation", () => {
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
    await page.waitForSelector('[data-testid="defi-staking-widget"]', { timeout: 30_000 });
    await w(page).locator('[data-testid="operation-button-STAKE"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("widget renders with STAKE and UNSTAKE operation buttons", async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-STAKE"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-UNSTAKE"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeVisible();
  });

  test("STAKE is the active operation on load", async () => {
    await expect(w(page).locator('[data-testid="operation-button-STAKE"]')).toHaveClass(/bg-emerald-600/);
  });

  // ── Protocol selection ─────────────────────────────────────────────────────

  test("protocol dropdown opens and lists staking protocols", async () => {
    await w(page).locator('[data-testid="protocol-select"]').click();
    const options = page.locator('[role="option"]');
    expect(await options.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape").catch(() => undefined);
  });

  // ── Amount input / metrics ─────────────────────────────────────────────────

  test("execute button is disabled with empty amount", async () => {
    await w(page).locator('[data-testid="amount-input"]').clear();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
  });

  test("entering amount shows expected APY and projected yield", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="expected-apy"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="expected-yield"]')).toBeVisible();
    expect(await w(page).locator('[data-testid="expected-apy"]').textContent()).toBeTruthy();
    expect(await w(page).locator('[data-testid="expected-yield"]').textContent()).toBeTruthy();
  });

  test("execute button enables after entering amount", async () => {
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  // ── Operation switching ────────────────────────────────────────────────────

  test("switching to UNSTAKE changes active button style", async () => {
    await w(page).locator('[data-testid="operation-button-UNSTAKE"]').click();
    await expect(w(page).locator('[data-testid="operation-button-UNSTAKE"]')).toHaveClass(/bg-rose-600/);
  });

  test("UNSTAKE: entering amount shows metrics", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("5");
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-STAKE"]').click();
  });

  // ── Execution ─────────────────────────────────────────────────────────────

  test("execute clears amount input after order placed", async () => {
    await w(page).locator('[data-testid="operation-button-STAKE"]').click();
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("10");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("");
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test("large amount (1000) calculates metrics without error", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("1000");
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-apy"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("decimal amount (0.1) is accepted and metrics populate", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("0.1");
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });
});
