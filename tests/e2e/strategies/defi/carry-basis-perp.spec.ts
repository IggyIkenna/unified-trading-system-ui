import { test, expect, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { verifyScenarioOutcome } from "../../_shared/verify";

/**
 * CARRY_BASIS_PERP — strategy-flow spec for the basis-trade swap leg.
 *
 * Mirrors yield-rotation-lending.spec.ts. The carry-basis strategy page
 * (/services/trading/strategies/carry-basis) hosts a single `DeFiSwapWidget`
 * in `mode: "basis-trade"`. Swap executions push rows onto the mock trade
 * ledger with `instruction_type === "SWAP"`.
 *
 * Because the carry-basis page does NOT render `defi-trade-history-widget`,
 * the scenarios re-navigate to `/services/trading/defi` after execute to
 * assert the ledger row with the shared `verifyScenarioOutcome` helper, then
 * return to the strategy page for the next scenario.
 *
 * Playbook: docs/trading/defi/playbooks/carry-basis-perp.md
 */

const FIXTURE = loadStrategyFixture("carry-basis-perp");
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

async function verifySwapRowOnDefiPage(page: Page, beforeRows: number): Promise<void> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="trade-history-row"]', { timeout: 15_000 });
  await verifyScenarioOutcome(page, beforeRows, { tradeType: "SWAP", minRowsAdded: 1 });
}

async function returnToStrategy(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(180_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline render
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(page.locator(FIXTURE.rootSelector)).toBeVisible();
    await expect(page.locator('[data-testid="asset-from-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-to-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="capital-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="slippage-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="execute-button"]')).toBeVisible();

    // Default basis-trade mode pair is USDT → ETH.
    await expect(page.locator('[data-testid="asset-from-select"]')).toContainText("USDT");
    await expect(page.locator('[data-testid="asset-to-select"]')).toContainText("ETH");

    // Empty input => execute disabled, expected-output reads 0.00.
    expect(await page.locator('[data-testid="capital-input"]').inputValue()).toBe("");
    await expect(page.locator('[data-testid="execute-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="expected-output"]')).toContainText("0.00");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — execute the swap leg (USDT → ETH) and verify ledger append
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await page.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    const expectedOutput = page.locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    expect((await expectedOutput.textContent()) ?? "").not.toMatch(/^\s*0\.00\s*$/);

    await expect(page.locator('[data-testid="execute-button"]')).toBeEnabled();
    await page.locator('[data-testid="execute-button"]').click();

    // Basis-trade swap toast is best-effort — tolerate absence at small viewports.
    await page.waitForSelector("text=Basis trade swap submitted", { timeout: 3_000 }).catch(() => undefined);

    // Amount clears after successful submit.
    await expect
      .poll(async () => page.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    // Mock ledger fills after 200ms (placeMockOrder setTimeout). Wait so the navigation
    // away doesn't cancel the pending fill before it's persisted to localStorage.
    await page.waitForTimeout(800);

    await verifySwapRowOnDefiPage(page, beforeRows);
    await returnToStrategy(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — slippage tolerance reactivity (no execute)
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;
    await page.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    // Loose slippage first.
    await page.locator(`[data-testid="slippage-option-${sc.inputs.slippageLoose}"]`).click();

    // Route panel should render with a non-zero expected output.
    const looseOutput = (await page.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(looseOutput).not.toMatch(/^\s*0\.00\s*$/);

    // Tighten slippage — the route memo recomputes on slippage change.
    await page.locator(`[data-testid="slippage-option-${sc.inputs.slippageTight}"]`).click();

    const tightOutput = (await page.locator('[data-testid="expected-output"]').textContent()) ?? "";
    expect(tightOutput).not.toMatch(/^\s*0\.00\s*$/);

    // Clear input to avoid bleed-over into later scenarios.
    await page.locator('[data-testid="capital-input"]').fill("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — basis-trade metrics panel surfaces on input
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    await page.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));

    // Basis Trade Metrics collapsible section only renders when isBasisTrade && amountIn.
    await expect(page.getByText("Basis Trade Metrics")).toBeVisible();
    await expect(page.getByText("Funding APY")).toBeVisible();
    await expect(page.getByText("Cost of Carry")).toBeVisible();
    await expect(page.getByText("Net APY")).toBeVisible();

    await page.locator('[data-testid="capital-input"]').fill("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — second execute appends another SWAP row
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStrategy(page);

    await page.locator('[data-testid="capital-input"]').fill(String(sc.inputs.amountIn));
    await expect(page.locator('[data-testid="execute-button"]')).toBeEnabled();
    await page.locator('[data-testid="execute-button"]').click();

    await expect
      .poll(async () => page.locator('[data-testid="capital-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    // Mock ledger fills after 200ms — wait so the navigation away doesn't cancel the fill.
    await page.waitForTimeout(800);

    await verifySwapRowOnDefiPage(page, beforeRows);

    await demoPause(page);
  });
});
