import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { verifyScenarioOutcome } from "../../_shared/verify";

/**
 * CARRY_STAKED_BASIS — strategy-flow spec for the LST + lending + perp-hedge
 * archetype. Canonical SSOT 4-leg sequence (see
 * unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-staked-basis.md):
 *
 *   1. STAKE (ETH → stETH/weETH)       — acquired via DeFiSwapWidget proxy
 *   2. PLEDGE (LEND weETH on Aave)     — via DeFiLendingWidget
 *   3. BORROW (USDC from Aave)         — via DeFiLendingWidget
 *   4. SHORT PERP (ETH on Hyperliquid) — via DeFiPerpShortWidget
 *
 * All four widgets mount on /services/trading/strategies/staked-basis. The
 * transfer widget is still visible for send/bridge context but is no longer
 * driven here — the SSOT ledger legs are SWAP → LEND → BORROW → TRADE.
 *
 * Because the staked-basis page does NOT render `defi-trade-history-widget`,
 * scenarios re-navigate to `/services/trading/defi` after execute to assert
 * the ledger row via `verifyScenarioOutcome`, then return to the strategy
 * page for the next scenario.
 *
 * Playbook: docs/trading/defi/playbooks/carry-staked-basis.md
 */

const FIXTURE = loadStrategyFixture("carry-staked-basis");
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

/** Pick an option from a shadcn Select by visible text. */
async function selectByText(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click();
  await page.locator(`[role="option"]`, { hasText: text }).first().click();
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(240_000);

  let page: Page;
  let swap: Locator;
  let lending: Locator;
  let perp: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    swap = page.locator('[data-testid="defi-swap-widget"]');
    lending = page.locator('[data-testid="defi-lending-widget"]');
    perp = page.locator('[data-testid="defi-perp-short-widget"]');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline render: all four widgets are present
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(swap).toBeVisible();
    await expect(lending).toBeVisible();
    await expect(perp).toBeVisible();
    // Transfer widget still mounts for margin-bridge context, though it's no
    // longer the primary perp-margin path in the SSOT flow.
    await expect(page.locator('[data-testid="defi-transfer-widget"]')).toBeVisible();

    // Swap widget defaults to staked-basis mode (target weETH).
    await expect(swap.locator('[data-testid="asset-from-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="asset-to-select"]')).toContainText("weETH");
    await expect(swap.locator('[data-testid="execute-button"]')).toBeDisabled();

    // Lending widget — LEND / BORROW / WITHDRAW / REPAY operation buttons.
    await expect(lending.locator('[data-testid="operation-button-LEND"]')).toBeVisible();
    await expect(lending.locator('[data-testid="operation-button-BORROW"]')).toBeVisible();
    await expect(lending.locator('[data-testid="execute-button"]')).toBeDisabled();

    // Perp-short widget — asset/venue/size.
    await expect(perp.locator('[data-testid="perp-asset-select"]')).toBeVisible();
    await expect(perp.locator('[data-testid="perp-venue-select"]')).toBeVisible();
    await expect(perp.locator('[data-testid="perp-execute-button"]')).toBeDisabled();

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — leg 1: SWAP USDC → weETH (acquire LST)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), String(sc.inputs.tokenIn));
    await expect(swap.locator('[data-testid="asset-from-select"]')).toContainText(String(sc.inputs.tokenIn));
    await expect(swap.locator('[data-testid="asset-to-select"]')).toContainText(String(sc.inputs.tokenOut));

    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();
    await swap.locator('[data-testid="execute-button"]').click();

    await page.waitForSelector("text=Staked basis swap submitted", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "SWAP" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — leg 2: PLEDGE weETH on Aave (LEND)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await selectByText(page, lending.locator('[data-testid="asset-select"]'), String(sc.inputs.asset));
    await lending.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));

    await expect(lending.locator('[data-testid="execute-button"]')).toBeEnabled();
    await lending.locator('[data-testid="execute-button"]').click();

    // Lending toast is best-effort — tolerate absence.
    await page.waitForSelector(`text=${String(sc.inputs.operation)}`, { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => lending.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "LEND" });
    await returnToStrategy(page);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — leg 3: BORROW USDC against weETH collateral
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await lending.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await selectByText(page, lending.locator('[data-testid="asset-select"]'), String(sc.inputs.asset));
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
  // Scenario 4 — leg 4: SHORT ETH-PERP on Hyperliquid
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;

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
  // Scenario 5 — slippage tolerance reactivity (no execute)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[5]!.name, async () => {
    const sc = FIXTURE.scenarios[5]!;
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    // Loose slippage first.
    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageLoose}"]`).click();
    const looseOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(looseOutput).not.toMatch(/^\s*0\.00\s*$/);

    // Tighten slippage.
    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageTight}"]`).click();
    const tightOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(tightOutput).not.toMatch(/^\s*0\.00\s*$/);

    await swap.locator('[data-testid="capital-input"]').fill("");
    await demoPause(page);
  });
});
