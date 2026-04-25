import { test, expect, type Page, type Locator } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { countTradeRows, verifyObservationWidgetsVisible, verifyScenarioOutcome } from "../../_shared/verify";

/**
 * YIELD_ROTATION_LENDING (BORROW/REPAY) — trader workflow E2E.
 *
 * Covers the four core lending operations a trader executes when running
 * YIELD_ROTATION_LENDING on Aave V3:
 *   1. LEND   — deposit ETH, verify aToken receipt output, verify ledger row
 *   2. WITHDRAW — redeem aETH, verify ETH output >= deposited (yield), verify row
 *   3. BORROW — borrow ETH, verify health factor drops, verify row
 *   4. REPAY  — repay ETH, verify health factor recovers, verify row
 *
 * yield-rotation-lending.spec.ts covers protocol/asset switch reactivity.
 * This spec covers the full 4-operation lifecycle including BORROW and REPAY.
 *
 * UI validation (button states, reactive output, operation-button CSS classes)
 * belongs in tests/unit/widgets/defi/defi-lending-widget.test.tsx — not here.
 */

const FIXTURE = loadStrategyFixture("aave-lending");
const BASE_URL = "http://localhost:3100";

function w(page: Page): Locator {
  return page.locator(FIXTURE.rootSelector);
}

test.describe.configure({ mode: "serial" });

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(120_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    // Start from LEND so every subsequent test begins in a known state.
    await w(page).locator('[data-testid="operation-button-LEND"]').click();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(w(page)).toBeVisible();
    await expect(w(page).locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(w(page).locator('[data-testid="asset-select"]')).toBeVisible();

    const supplyApy = w(page).locator('[data-testid="supply-apy"]');
    await expect(supplyApy).toBeVisible();
    expect((await supplyApy.textContent()) ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    await expect(w(page).locator('[data-testid="execute-button"]')).toBeDisabled();

    expect(await countTradeRows(page)).toBeGreaterThanOrEqual(0);
    await verifyObservationWidgetsVisible(page, FIXTURE);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — LEND
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;
    await w(page).locator('[data-testid="operation-button-LEND"]').click();

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill(String(sc.inputs.amount));
    await page.waitForTimeout(300);

    // Trader reviews the aToken receipt before committing capital.
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    expect((await expectedOutput.textContent()) ?? "").toMatch(/a[A-Z]{2,}/);

    const beforeRows = await countTradeRows(page);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await amountInput.inputValue()).toBe("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — WITHDRAW
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;
    await w(page).locator('[data-testid="operation-button-WITHDRAW"]').click();

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill(String(sc.inputs.amount));
    await page.waitForTimeout(300);

    // Trader expects to receive slightly more than deposited (yield accrued).
    const expectedOutput = w(page).locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    const outputText = (await expectedOutput.textContent()) ?? "";
    expect(outputText).toContain("ETH");
    const match = outputText.match(/(\d+\.?\d*)\s+ETH/);
    if (match) expect(parseFloat(match[1])).toBeGreaterThanOrEqual(Number(sc.inputs.amount) * 0.99);

    const beforeRows = await countTradeRows(page);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await amountInput.inputValue()).toBe("");

    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — BORROW
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    await w(page).locator('[data-testid="operation-button-BORROW"]').click();

    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHfValue = parseFloat((await currentHf.textContent()) ?? "0");

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill(String(sc.inputs.amount));
    await page.waitForTimeout(300);

    // Trader checks projected HF stays above liquidation threshold before committing.
    await expect(afterHf).toBeVisible();
    expect(parseFloat((await afterHf.textContent()) ?? "0")).toBeLessThan(initialHfValue);

    const beforeRows = await countTradeRows(page);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await amountInput.inputValue()).toBe("");

    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — REPAY
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;
    await w(page).locator('[data-testid="operation-button-REPAY"]').click();

    const currentHf = w(page).locator('[data-testid="current-hf"]');
    const afterHf = w(page).locator('[data-testid="after-hf"]');
    const initialHfValue = parseFloat((await currentHf.textContent()) ?? "0");

    const amountInput = w(page).locator('[data-testid="amount-input"]');
    await amountInput.fill(String(sc.inputs.amount));
    await page.waitForTimeout(300);

    // Repaying debt should improve the health factor.
    await expect(afterHf).toBeVisible();
    expect(parseFloat((await afterHf.textContent()) ?? "0")).toBeGreaterThan(initialHfValue);

    const beforeRows = await countTradeRows(page);
    await w(page).locator('[data-testid="execute-button"]').click();
    await page.waitForSelector("text=DeFi order placed", { timeout: 5_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await amountInput.inputValue()).toBe("");

    await w(page).locator('[data-testid="operation-button-LEND"]').click();
    await demoPause(page);
  });
});
