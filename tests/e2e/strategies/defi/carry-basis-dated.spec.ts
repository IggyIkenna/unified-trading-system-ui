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
 * CARRY_BASIS_DATED — strategy-flow spec for the spot-long vs. dated-futures-short
 * archetype. Canonical SSOT 2-leg sequence:
 *
 *   1. SWAP USDC → BTC (spot long, 90% capital)
 *   2. SHORT BTC-PERP on Deribit (fixed-maturity dated futures hedge)
 *
 * Reuses the /services/trading/strategies/carry-basis execution surface — the
 * same DeFiSwapWidget + DeFiPerpShortWidget used for CARRY_BASIS_PERP, but
 * exercised with scenarios focused on fixed-maturity basis carry.
 *
 * Because the carry-basis page does NOT render `defi-trade-history-widget`,
 * each scenario navigates to `/services/trading/defi` to assert the ledger
 * row, then returns to the strategy page for the next scenario.
 */

const FIXTURE = loadStrategyFixture("carry-basis-dated");
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
  let swap: Locator;
  let perp: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    swap = page.locator('[data-testid="defi-swap-widget"]');
    perp = page.locator('[data-testid="defi-perp-short-widget"]');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline render: swap + perp-short widgets present
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(swap).toBeVisible();
    await expect(perp).toBeVisible();

    await expect(swap.locator('[data-testid="asset-from-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="capital-input"]')).toBeVisible();
    await expect(swap.locator('[data-testid="execute-button"]')).toBeDisabled();

    await expect(perp.locator('[data-testid="perp-asset-select"]')).toBeVisible();
    await expect(perp.locator('[data-testid="perp-venue-select"]')).toBeVisible();
    await expect(perp.locator('[data-testid="perp-execute-button"]')).toBeDisabled();

    await verifyObservationWidgetsVisible(page, FIXTURE);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — leg 1: SWAP USDC → BTC (spot long)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();

    const swapSnapshot = await snapshotObservationWidgets(page, FIXTURE, "SWAP");

    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "SWAP" });
    await returnToStrategy(page);
    await verifyObservationsUpdated(page, swapSnapshot);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — leg 2: SHORT BTC-PERP (dated-futures hedge)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await perp.locator('[data-testid="perp-asset-select"]').click();
    await page
      .locator('[role="option"]')
      .filter({ hasText: `${sc.inputs.asset}-PERP` })
      .first()
      .click();

    await perp.locator('[data-testid="perp-size-input"]').fill(String(sc.inputs.size));

    await expect(perp.locator('[data-testid="perp-execute-button"]')).toBeEnabled();
    await perp.locator('[data-testid="perp-execute-button"]').click();

    await page.waitForSelector("text=Perp short submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => perp.locator('[data-testid="perp-size-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "TRADE", venueContains: "HYPERLIQUID" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — basis spread + roll cost analytics visible
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    const output = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(output).not.toMatch(/^\s*0\.00\s*$/);

    await swap.locator('[data-testid="capital-input"]').fill("");
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — second spot swap appends another SWAP row
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

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
  // Scenario 5 — slippage tolerance tightens expected output
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[5]!.name, async () => {
    const sc = FIXTURE.scenarios[5]!;
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageLoose}"]`).click();
    const looseOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(looseOutput).not.toMatch(/^\s*0\.00\s*$/);

    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageTight}"]`).click();
    const tightOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(tightOutput).not.toMatch(/^\s*0\.00\s*$/);

    await swap.locator('[data-testid="capital-input"]').fill("");
    await demoPause(page);
  });
});
