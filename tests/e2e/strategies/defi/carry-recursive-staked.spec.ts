import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import {
  snapshotObservationWidgets,
  verifyObservationWidgetsVisible,
  verifyObservationsUpdated,
  verifyScenarioOutcome,
} from "../../_shared/verify";

/**
 * CARRY_RECURSIVE_STAKED — strategy-flow spec for the recursive LST leverage loop.
 * Canonical SSOT multi-leg sequence:
 *
 *   1. LEND stETH on Aave (collateral deposit, loop round 1)
 *   2. BORROW USDC against stETH collateral (at LTV70)
 *   3. re-SWAP USDC → weETH via DeFiSwapWidget (re-stake proceeds)
 *   4. second LEND weETH (deepen the loop, round 2)
 *
 * Reuses the /services/trading/strategies/staked-basis execution surface —
 * DeFiSwapWidget + DeFiLendingWidget + DeFiPerpShortWidget + DeFiTransferWidget.
 *
 * Because staked-basis page does NOT render `defi-trade-history-widget`,
 * each execution scenario navigates to /services/trading/defi to assert
 * the ledger row, then returns to the strategy page for the next leg.
 */

const FIXTURE = loadStrategyFixture("carry-recursive-staked");
const BASE_URL = "http://localhost:3100";
const TRADE_HISTORY_ROUTE = "/services/trading/defi";

test.describe.configure({ mode: "serial" });

async function countTradeRowsOnDefiPage(page: Page): Promise<number> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page
    .waitForSelector('[data-testid="defi-trade-history"], [data-testid="trade-history-row"]', {
      timeout: 15_000,
    })
    .catch(() => undefined);
  return page.locator('[data-testid="trade-history-row"]').count();
}

async function verifyLedgerRowOnDefiPage(
  page: Page,
  beforeRows: number,
  expected: { tradeType: string; venueContains?: string; minRowsAdded?: number },
): Promise<void> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="trade-history-row"]', { timeout: 15_000 });
  await verifyScenarioOutcome(page, beforeRows, {
    tradeType: expected.tradeType,
    minRowsAdded: expected.minRowsAdded ?? 1,
    ...(expected.venueContains ? { venueContains: expected.venueContains } : {}),
  });
}

async function returnToStrategy(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
}

async function selectByText(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click();
  await page.locator(`[role="option"]`, { hasText: text }).first().click();
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(240_000);

  let page: Page;
  let lending: Locator;
  let swap: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    lending = page.locator('[data-testid="defi-lending-widget"]');
    swap = page.locator('[data-testid="defi-swap-widget"]');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline: all four execution widgets mount
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(lending).toBeVisible();
    await expect(swap).toBeVisible();
    await expect(page.locator('[data-testid="defi-perp-short-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="defi-transfer-widget"]')).toBeVisible();

    await expect(lending.locator('[data-testid="operation-button-LEND"]')).toBeVisible();
    await expect(lending.locator('[data-testid="operation-button-BORROW"]')).toBeVisible();
    await expect(lending.locator('[data-testid="execute-button"]')).toBeDisabled();

    await expect(swap.locator('[data-testid="capital-input"]')).toBeVisible();
    await expect(swap.locator('[data-testid="execute-button"]')).toBeDisabled();

    await verifyObservationWidgetsVisible(page, FIXTURE);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — loop leg 1: LEND stETH (collateral deposit)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await lending.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));

    await expect(lending.locator('[data-testid="execute-button"]')).toBeEnabled();

    const lendSnapshot = await snapshotObservationWidgets(page, FIXTURE, "LEND");

    await lending.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=LEND", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => lending.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "LEND" });
    await returnToStrategy(page);
    await verifyObservationsUpdated(page, lendSnapshot);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — loop leg 2: BORROW USDC against stETH
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await lending.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));

    await expect(lending.locator('[data-testid="execute-button"]')).toBeEnabled();
    await lending.locator('[data-testid="execute-button"]').click();

    await expect
      .poll(async () => lending.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "BORROW" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — loop leg 3: re-SWAP USDC → weETH (deepen the loop)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), String(sc.inputs.tokenIn));
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();
    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "SWAP" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — loop leg 4: second LEND (deepens leverage to round 2)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await lending.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));

    await expect(lending.locator('[data-testid="execute-button"]')).toBeEnabled();
    await lending.locator('[data-testid="execute-button"]').click();

    await expect
      .poll(async () => lending.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "LEND" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 5 — health factor and leverage metrics visible
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[5]!.name, async () => {
    const sc = FIXTURE.scenarios[5]!;

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await lending.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));

    // Health factor panel should surface once an amount is entered.
    await expect(lending.locator('[data-testid="current-hf"]')).toBeVisible();
    await expect(lending.locator('[data-testid="after-hf"]')).toBeVisible();

    await lending.locator('[data-testid="amount-input"]').fill("");
    await demoPause(page);
  });
});
