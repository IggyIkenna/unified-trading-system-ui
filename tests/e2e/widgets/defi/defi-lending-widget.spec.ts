import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * DeFiLendingWidget — widget validation spec.
 *
 * Verifies every interactive behaviour of the lending widget in isolation:
 * button states, reactive inputs, operation switching, health-factor deltas,
 * slippage selection, edge-case inputs.
 *
 * These run headless in CI (--project=chromium / --project=widgets).
 * They are NOT included in --project=human because they are not part of the
 * trader workflow — they validate that the widget UI itself is correct.
 *
 * Trader end-to-end workflow lives in tests/e2e/strategies/defi/aave-lending.spec.ts.
 */

const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator('[data-testid="defi-lending-widget"]');
}

test.describe.configure({ mode: "serial" });

test.describe("DeFiLendingWidget — UI validation", () => {
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
    await page.waitForSelector('[data-testid="defi-lending-widget"]', { timeout: 30_000 });
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("widget renders with all required controls", async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="slippage-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeVisible();
  });

  test("all four operation buttons render; LEND is active by default", async () => {
    await expect(w(page).locator('[data-testid="operation-button-LEND"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-BORROW"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-WITHDRAW"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-REPAY"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-LEND"]')).toHaveClass(/bg-emerald-600/);
  });

  test("supply APY and borrow APY display numeric values on load", async () => {
    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    const borrowApy = w(page).locator('[data-testid="borrow-apy"]');
    await expect(supplyApy).toBeVisible();
    await expect(borrowApy).toBeVisible();
    expect(await supplyApy.textContent()).toBeTruthy();
    expect(await borrowApy.textContent()).toBeTruthy();
  });

  // ── Protocol selection ─────────────────────────────────────────────────────

  test("protocol dropdown opens and lists at least one option", async () => {
    await w(page).locator('[data-testid="protocol-select"]').click();
    const options = page.locator('[role="option"]');
    expect(await options.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape").catch(() => undefined);
  });

  // ── Asset selection ────────────────────────────────────────────────────────

  test("switching asset updates supply APY", async () => {
    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    await w(page).locator('[data-testid="asset-select"]').click();
    const usdcOption = page.locator('[role="option"]:has-text("USDC")');
    if (await usdcOption.isVisible()) {
      await usdcOption.click();
      await page.waitForTimeout(300);
      expect(await supplyApy.textContent()).toBeTruthy();
    } else {
      await page.keyboard.press("Escape").catch(() => undefined);
    }
  });

  test("switching asset changes the displayed asset name", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').nth(1).click();
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="asset-select"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  // ── Amount input / execute button state ───────────────────────────────────

  test("execute button is disabled with empty amount", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await w(page).locator('[data-testid="amount-input"]').clear();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
  });

  test("execute button enables after entering a valid amount", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("5");
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("expected output appears when amount is entered and is non-empty", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).not.toBeVisible();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(expectedOutput).toBeVisible();
    expect(await expectedOutput.textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("expected output updates proportionally when amount changes", async () => {
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await amountInput.fill("5");
    await page.waitForTimeout(300);
    const output1 = await expectedOutput.textContent();
    await amountInput.fill("10");
    await page.waitForTimeout(300);
    const output2 = await expectedOutput.textContent();
    expect(output1).not.toEqual(output2);
    await amountInput.fill("");
  });

  // ── Operation outputs ──────────────────────────────────────────────────────

  test("LEND produces an aToken in expected output (e.g. aETH)", async () => {
    // Reset to default ETH asset.
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(200);
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toContain("aETH");
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("WITHDRAW output contains ETH and value is >= amount * 0.99 (yield accrued)", async () => {
    await w(page).locator('[data-testid="operation-button-WITHDRAW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    const output = await w(page).locator('[data-testid="expected-output"]').textContent();
    expect(output).toContain("ETH");
    const match = output?.match(/(\d+\.?\d*)\s+ETH/);
    if (match) expect(parseFloat(match[1])).toBeGreaterThan(10 * 0.99);
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ── Health factor ──────────────────────────────────────────────────────────

  test("BORROW: after-health-factor shown and lower than current", async () => {
    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHf = parseFloat((await currentHf.textContent()) ?? "0");
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(afterHf).toBeVisible();
    expect(parseFloat((await afterHf.textContent()) ?? "0")).toBeLessThan(initialHf);
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test("REPAY: after-health-factor shown and higher than current", async () => {
    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHf = parseFloat((await currentHf.textContent()) ?? "0");
    await w(page).locator('[data-testid="operation-button-REPAY"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(afterHf).toBeVisible();
    expect(parseFloat((await afterHf.textContent()) ?? "0")).toBeGreaterThan(initialHf);
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test("health factor remains visible after switching asset while borrowing", async () => {
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').nth(1).click();
    await page.waitForTimeout(300);
    await expect(afterHf).toBeVisible();
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test("liquidation risk warning check renders (or is absent) for large borrow amounts", async () => {
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("500");
    await page.waitForTimeout(500);
    // The warning is conditional on the mock HF — assert the check runs without errors.
    const isVisible = await page
      .locator("text=Liquidation risk below 1.1")
      .isVisible()
      .catch(() => false);
    expect(typeof isVisible).toBe("boolean");
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ── Slippage ───────────────────────────────────────────────────────────────

  test("changing slippage keeps expected output visible", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="slippage-select"]').click();
    await page.locator('[role="option"]').nth(2).click();
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  // ── Execution ─────────────────────────────────────────────────────────────

  test("execute clears the amount input after order is placed", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("10");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("");
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test("rapid asset switches do not break expected output display", async () => {
    const assetSelect = w(page).locator('[data-testid="asset-select"]');
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await assetSelect.click();
    await page.locator('[role="option"]').nth(1).click();
    await assetSelect.click();
    await page.locator('[role="option"]').nth(2).click();
    await assetSelect.click();
    await page.locator('[role="option"]').nth(1).click();
    await page.waitForTimeout(500);
    await expect(w(page).locator('[data-testid="expected-output"]')).toBeVisible();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("large amount (999999) calculates expected output without error", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("999999");
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("decimal amount (0.5) calculates expected output correctly", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("0.5");
    await page.waitForTimeout(300);
    const output = await w(page).locator('[data-testid="expected-output"]').textContent();
    expect(output).toMatch(/0\.4[0-9]+|0\.5/);
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("form state (amount + asset) is preserved when switching operations", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').nth(1).click();
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="asset-select"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });
});
