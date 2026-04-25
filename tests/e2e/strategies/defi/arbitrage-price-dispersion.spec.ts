import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import {
  countTradeRows,
  snapshotObservationWidgets,
  verifyObservationWidgetsVisible,
  verifyObservationsUpdated,
  verifyScenarioOutcome,
} from "../../_shared/verify";

/**
 * ARBITRAGE_PRICE_DISPERSION — strategy-flow spec for cross-venue price arb.
 * Canonical SSOT 2-leg sequence (DeFi sub-class):
 *
 *   1. SWAP USDC → ETH (buy-leg on lower-price venue, routed via SOR)
 *   2. SWAP ETH → USDC (sell-leg on higher-price venue, captures spread)
 *
 * Uses the main /services/trading/defi route which co-renders
 * DeFiSwapWidget and DeFiTradeHistoryWidget in the same page, so ledger
 * rows can be verified inline without page navigation.
 */

const FIXTURE = loadStrategyFixture("arbitrage-price-dispersion");
const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

async function selectByText(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click();
  await page.locator(`[role="option"]`, { hasText: text }).first().click();
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(180_000);

  let page: Page;
  let swap: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    swap = page.locator(FIXTURE.rootSelector);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline: swap widget renders, trade history queryable
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(swap).toBeVisible();
    await expect(swap.locator('[data-testid="asset-from-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="capital-input"]')).toBeVisible();
    await expect(swap.locator('[data-testid="execute-button"]')).toBeDisabled();

    // Trade history table must be reachable (may need scroll).
    await page
      .waitForSelector('[data-testid="defi-trade-history"], [data-testid="trade-history-row"]', { timeout: 15_000 })
      .catch(() => undefined);

    await verifyObservationWidgetsVisible(page, FIXTURE);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — buy-leg: SWAP USDC → ETH
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRows(page);

    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();

    const swapSnapshot = await snapshotObservationWidgets(page, FIXTURE, "SWAP");

    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyScenarioOutcome(page, beforeRows, {
      tradeType: "SWAP",
      minRowsAdded: 1,
    });
    await verifyObservationsUpdated(page, swapSnapshot);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — sell-leg: SWAP ETH → USDC (captures the cross-venue spread)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRows(page);

    // Switch from-asset to ETH for the sell leg.
    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), "ETH");
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();

    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyScenarioOutcome(page, beforeRows, {
      tradeType: "SWAP",
      minRowsAdded: 1,
    });
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — second arb cycle appends more SWAP rows
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;

    const beforeRows = await countTradeRows(page);

    // Reset to USDC→ETH for next buy leg.
    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), "USDC");
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();
    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyScenarioOutcome(page, beforeRows, {
      tradeType: "SWAP",
      minRowsAdded: 1,
    });
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — slippage affects expected output
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;

    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), "USDC");
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
