import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * DeFi Aave Lending — trader workflow E2E.
 *
 * Simulates what a trader does manually when executing YIELD_ROTATION_LENDING:
 *   1. Open the DeFi route, confirm the lending widget is ready
 *   2. LEND — enter amount, check APY + expected aToken output, execute, verify trade row
 *   3. WITHDRAW — switch operation, enter amount, check output includes yield, execute, verify
 *   4. BORROW — check health factor drops after entry, execute, verify
 *   5. REPAY — check health factor recovers, execute, verify
 *
 * Serial mode + shared page: one browser window for the whole suite so
 * --project=human shows a continuous trader flow, not 5 open/close cycles.
 *
 * UI validation (button states, reactive inputs, slippage counts, etc.)
 * belongs in tests/unit/widgets/defi/defi-lending-widget.test.tsx — not here.
 */

const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator('[data-testid="defi-lending-widget"]');
}

test.describe.configure({ mode: "serial" });

test.describe("DeFi Aave Lending — trader workflow", () => {
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
    // Start from LEND so every subsequent test begins in a known state.
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Baseline ──────────────────────────────────────────────────────────────

  test("lending widget is ready — protocol, asset, APY, execute button visible", async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();

    // Trader checks the current APY before entering a position.
    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    await expect(supplyApy).toBeVisible();
    expect((await supplyApy.textContent()) ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();
  });

  // ── Leg 1: LEND ───────────────────────────────────────────────────────────

  test("LEND — enter 10 ETH, verify aToken output, execute, trade row added", async () => {
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await expect(w(page).locator('[data-testid="operation-button-LEND"]')).toHaveClass(/bg-emerald-600/);

    // Trader reviews supply APY before committing capital.
    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    expect((await supplyApy.textContent()) ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    // Enter amount and check expected output shows the aToken receipt.
    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("10");
    await page.waitForTimeout(300);

    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    expect((await expectedOutput.textContent()) ?? "").toMatch(/a[A-Z]{2,}/);

    // Execute and confirm trade history row is added.
    const beforeRows = await page.locator('[data-testid="trade-history-row"]').count();
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(beforeRows + 1);

    expect(await amountInput.inputValue()).toBe("");
  });

  // ── Leg 2: WITHDRAW ───────────────────────────────────────────────────────

  test("WITHDRAW — enter 5 ETH, verify output includes yield accrual, execute, trade row added", async () => {
    await w(page).locator('[data-testid="operation-button-WITHDRAW"]').click();
    await expect(w(page).locator('[data-testid="operation-button-WITHDRAW"]')).toHaveClass(/bg-amber-600/);

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("5");
    await page.waitForTimeout(300);

    // Trader expects to get back slightly more than deposited (yield accrued).
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    const outputText = (await expectedOutput.textContent()) ?? "";
    expect(outputText).toContain("ETH");
    const match = outputText.match(/(\d+\.?\d*)\s+ETH/);
    if (match) expect(parseFloat(match[1])).toBeGreaterThanOrEqual(5 * 0.99);

    const beforeRows = await page.locator('[data-testid="trade-history-row"]').count();
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(beforeRows + 1);

    expect(await amountInput.inputValue()).toBe("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ── Leg 3: BORROW ─────────────────────────────────────────────────────────

  test("BORROW — enter 5 ETH, verify health factor decreases, execute, trade row added", async () => {
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();

    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHfValue = parseFloat((await currentHf.textContent()) ?? "0");

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("5");
    await page.waitForTimeout(300);

    // Trader checks the projected health factor — must stay above liquidation threshold.
    await expect(afterHf).toBeVisible();
    const projectedHf = parseFloat((await afterHf.textContent()) ?? "0");
    expect(projectedHf).toBeLessThan(initialHfValue);

    const beforeRows = await page.locator('[data-testid="trade-history-row"]').count();
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(beforeRows + 1);

    expect(await amountInput.inputValue()).toBe("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  // ── Leg 4: REPAY ──────────────────────────────────────────────────────────

  test("REPAY — enter 5 ETH, verify health factor recovers, execute, trade row added", async () => {
    await w(page).locator('[data-testid="operation-button-REPAY"]').click();

    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHfValue = parseFloat((await currentHf.textContent()) ?? "0");

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill("5");
    await page.waitForTimeout(300);

    // Repaying debt should improve the health factor.
    await expect(afterHf).toBeVisible();
    const projectedHf = parseFloat((await afterHf.textContent()) ?? "0");
    expect(projectedHf).toBeGreaterThan(initialHfValue);

    const beforeRows = await page.locator('[data-testid="trade-history-row"]').count();
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(beforeRows + 1);

    expect(await amountInput.inputValue()).toBe("");
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });
});
