import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { verifyScenarioOutcome } from "../../_shared/verify";

/**
 * CARRY_STAKED_BASIS — strategy-flow spec for the LST + perp-hedge archetype.
 *
 * Mirrors carry-basis-perp.spec.ts. The staked-basis strategy page
 * (/services/trading/strategies/staked-basis) hosts two widgets stacked
 * vertically:
 *   1. `DeFiSwapWidget` in `mode: "staked-basis"` — swaps stable → weETH
 *      (LST leg). Emits rows with `instruction_type === "SWAP"`.
 *   2. `DeFiTransferWidget` (send mode default) — moves stable margin to the
 *      perp venue (Hyperliquid, done via a placeholder address in the demo).
 *      Emits rows with `instruction_type === "TRANSFER"`.
 *
 * Because the staked-basis page does NOT render `defi-trade-history-widget`,
 * the scenarios re-navigate to `/services/trading/defi` after execute to
 * assert the ledger row with the shared `verifyScenarioOutcome` helper, then
 * return to the strategy page for the next scenario.
 *
 * Both widgets share generic testids (`execute-button`, `amount-input`,
 * `asset-select`) so all locators are scoped to the specific widget root
 * (`defi-swap-widget` or `defi-transfer-widget`) to avoid picking up the
 * sibling's controls.
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

async function verifyLedgerRowOnDefiPage(page: Page, beforeRows: number, tradeType: string): Promise<void> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="trade-history-row"]', { timeout: 15_000 });
  await verifyScenarioOutcome(page, beforeRows, { tradeType, minRowsAdded: 1 });
}

async function returnToStrategy(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
}

/**
 * Pick an option from a shadcn Select by visible text. Works for both swap
 * asset selectors and transfer chain/asset selectors because shadcn renders
 * the options into a portalled `[role="listbox"]` with per-item `[role="option"]`.
 */
async function selectByText(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click();
  await page.locator(`[role="option"]`, { hasText: text }).first().click();
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(180_000);

  let page: Page;
  let swap: Locator;
  let transfer: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    swap = page.locator('[data-testid="defi-swap-widget"]');
    transfer = page.locator('[data-testid="defi-transfer-widget"]');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline render: swap (staked-basis) + transfer both present
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(swap).toBeVisible();
    await expect(transfer).toBeVisible();

    // Swap widget — staked-basis mode defaults to USDT → weETH.
    await expect(swap.locator('[data-testid="asset-from-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="asset-to-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="capital-input"]')).toBeVisible();
    await expect(swap.locator('[data-testid="slippage-select"]')).toBeVisible();
    await expect(swap.locator('[data-testid="execute-button"]')).toBeVisible();
    await expect(swap.locator('[data-testid="asset-to-select"]')).toContainText("weETH");

    // Empty input => execute disabled, expected-output reads 0.00.
    expect(await swap.locator('[data-testid="capital-input"]').inputValue()).toBe("");
    await expect(swap.locator('[data-testid="execute-button"]')).toBeDisabled();
    await expect(swap.locator('[data-testid="expected-output"]')).toContainText("0.00");

    // Transfer widget — default mode is "send" (per DeFiDataContext initial state).
    await expect(transfer.locator('[data-testid="transfer-mode-send"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="transfer-mode-bridge"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="to-address-input"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="chain-from"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(transfer.locator('[data-testid="execute-button"]')).toBeDisabled();

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — execute the LST swap leg (USDC → weETH) and verify ledger append
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    // Swap-widget staked-basis mode defaults tokenIn to USDT; flip to USDC.
    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), String(sc.inputs.tokenIn));
    await expect(swap.locator('[data-testid="asset-from-select"]')).toContainText(String(sc.inputs.tokenIn));
    await expect(swap.locator('[data-testid="asset-to-select"]')).toContainText(String(sc.inputs.tokenOut));

    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    const expectedOutput = swap.locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    expect((await expectedOutput.textContent()) ?? "").not.toMatch(/^\s*0\.00\s*$/);

    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();
    await swap.locator('[data-testid="execute-button"]').click();

    // Staked-basis swap toast is best-effort — tolerate absence at small viewports.
    await page.waitForSelector("text=Staked basis swap submitted", { timeout: 3_000 }).catch(() => undefined);

    // Amount clears after successful submit.
    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    // Mock ledger fills after 200ms (placeMockOrder setTimeout). Wait so the navigation
    // away doesn't cancel the pending fill before it's persisted to localStorage.
    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, "SWAP");
    await returnToStrategy(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — execute the margin-transfer leg (USDC → Hyperliquid placeholder)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    // Transfer widget is in send mode by default; be explicit for idempotence.
    await transfer.locator('[data-testid="transfer-mode-send"]').click();

    // Pick USDC as the token to send.
    await selectByText(page, transfer.locator('[data-testid="asset-select"]'), String(sc.inputs.transferToken));

    await transfer.locator('[data-testid="to-address-input"]').fill(String(sc.inputs.transferToAddress));
    await transfer.locator('[data-testid="amount-input"]').fill(String(sc.inputs.transferAmount));

    await expect(transfer.locator('[data-testid="execute-button"]')).toBeEnabled();
    await transfer.locator('[data-testid="execute-button"]').click();

    // Transfer submitted toast is best-effort.
    await page.waitForSelector("text=Transfer submitted", { timeout: 3_000 }).catch(() => undefined);

    // Amount clears after successful submit.
    await expect
      .poll(async () => transfer.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    // Mock ledger fills after 200ms — wait so the navigation away doesn't cancel the fill.
    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, "TRANSFER");
    await returnToStrategy(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — second swap execute appends another SWAP row
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    // tokenIn may have reverted to USDT on remount — switch back to USDC.
    await selectByText(page, swap.locator('[data-testid="asset-from-select"]'), String(sc.inputs.tokenIn));

    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(swap.locator('[data-testid="execute-button"]')).toBeEnabled();
    await swap.locator('[data-testid="execute-button"]').click();

    await expect
      .poll(async () => swap.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, "SWAP");
    await returnToStrategy(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — slippage tolerance reactivity (no execute)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;
    await swap.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    // Loose slippage first.
    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageLoose}"]`).click();
    const looseOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(looseOutput).not.toMatch(/^\s*0\.00\s*$/);

    // Tighten slippage — the route memo recomputes on slippage change.
    await swap.locator(`[data-testid="slippage-option-${sc.inputs.slippageTight}"]`).click();
    const tightOutput = (await swap.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(tightOutput).not.toMatch(/^\s*0\.00\s*$/);

    // Clear input to avoid bleed-over.
    await swap.locator('[data-testid="capital-input"]').fill("");

    await demoPause(page);
  });
});
