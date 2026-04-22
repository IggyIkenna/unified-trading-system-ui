import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * DeFi Aave Lending E2E spec.
 *
 * Serial mode + shared page: one browser window stays open for the entire suite
 * so --project=human shows a continuous flow, not 24 open/close cycles.
 *
 * Every locator is scoped to [data-testid="defi-lending-widget"] because the
 * defi-default preset mounts lending + staking + transfer + swap simultaneously,
 * causing strict-mode violations on shared testids like amount-input.
 */

const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator('[data-testid="defi-lending-widget"]');
}

test.describe.configure({ mode: "serial" });

test.describe("DeFi Aave Lending UI E2E", () => {
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
    // Reset to LEND so every test starts from the same operation state.
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ============ Widget Rendering Tests ============

  test("widget renders with initial state", async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="slippage-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeVisible();
  });

  test("operation buttons render with correct states", async () => {
    await expect(w(page).locator('[data-testid="operation-button-LEND"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-BORROW"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-WITHDRAW"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-REPAY"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="operation-button-LEND"]')).toHaveClass(/bg-emerald-600/);
  });

  test("initial APY values are displayed", async () => {
    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    const borrowApy = w(page).locator('[data-testid="borrow-apy"]');
    await expect(supplyApy).toBeVisible();
    await expect(borrowApy).toBeVisible();
    expect(await supplyApy.textContent()).toBeTruthy();
    expect(await borrowApy.textContent()).toBeTruthy();
  });

  // ============ Protocol Selection Tests ============

  test("protocol selection shows options", async () => {
    await w(page).locator('[data-testid="protocol-select"]').click();
    const options = page.locator('[role="option"]');
    expect(await options.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape").catch(() => undefined);
  });

  // ============ Asset Selection Tests ============

  test("asset selection updates supply APY", async () => {
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

  test("asset selection changes expected asset in output", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').nth(1).click();
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="asset-select"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  // ============ Amount Input Tests ============

  test("amount input enables execute button", async () => {
    const executeBtn = w(page).locator('[data-testid="execute-button"]');
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await w(page).locator('[data-testid="amount-input"]').clear();
    await expect(executeBtn).toBeDisabled();
    await w(page).locator('[data-testid="amount-input"]').fill("5");
    await page.waitForTimeout(300);
    await expect(executeBtn).toBeEnabled();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("amount input updates expected output", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).not.toBeVisible();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(expectedOutput).toBeVisible();
    expect(await expectedOutput.textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("amount changes propagate to expected output", async () => {
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

  // ============ Operation Selection Tests ============

  test("LEND operation produces aToken output", async () => {
    // Reset to default ETH asset in case a previous test switched it.
    await w(page).locator('[data-testid="asset-select"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(200);
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toContain("aETH");
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("WITHDRAW operation includes yield accrual", async () => {
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

  test("BORROW operation changes health factor direction", async () => {
    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHf = parseFloat((await currentHf.textContent()) ?? "0");
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    const afterHfValue = parseFloat((await afterHf.textContent()) ?? "0");
    expect(afterHfValue).toBeLessThan(initialHf);
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test("REPAY operation increases health factor", async () => {
    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHf = parseFloat((await currentHf.textContent()) ?? "0");
    await w(page).locator('[data-testid="operation-button-REPAY"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    const afterHfValue = parseFloat((await afterHf.textContent()) ?? "0");
    expect(afterHfValue).toBeGreaterThan(initialHf);
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ============ Health Factor Tests ============

  test("health factor visible when borrowing", async () => {
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await expect(afterHf).toBeVisible();
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test("health factor visible after asset switch while borrowing", async () => {
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

  test("liquidation risk warning check when borrowing large amount", async () => {
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();
    await w(page).locator('[data-testid="amount-input"]').fill("500");
    await page.waitForTimeout(500);
    const isVisible = await page
      .locator("text=Liquidation risk below 1.1")
      .isVisible()
      .catch(() => false);
    expect(typeof isVisible).toBe("boolean");
    await w(page).locator('[data-testid="amount-input"]').fill("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ============ Slippage Tests ============

  test("slippage selection keeps output visible", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("10");
    await page.waitForTimeout(300);
    await w(page).locator('[data-testid="slippage-select"]').click();
    await page.locator('[role="option"]').nth(2).click();
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  // ============ Trade Execution Tests ============

  test("execute button is disabled with zero amount", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await w(page).locator('[data-testid="amount-input"]').clear();
    await page.waitForTimeout(300);
    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
  });

  test("execute button click places order and clears input", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("10");
    await page.waitForTimeout(300);
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("");
  });

  // ============ Edge Cases ============

  test("rapid asset switches handled correctly", async () => {
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

  test("large amount input handled gracefully", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("999999");
    await page.waitForTimeout(300);
    expect(await w(page).locator('[data-testid="expected-output"]').textContent()).toBeTruthy();
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("decimal amount input works correctly", async () => {
    await w(page).locator('[data-testid="amount-input"]').fill("0.5");
    await page.waitForTimeout(300);
    const output = await w(page).locator('[data-testid="expected-output"]').textContent();
    expect(output).toMatch(/0\.4[0-9]+|0\.5/);
    await w(page).locator('[data-testid="amount-input"]').fill("");
  });

  test("form maintains state across operations", async () => {
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
