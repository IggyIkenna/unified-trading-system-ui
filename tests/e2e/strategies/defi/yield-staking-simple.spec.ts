import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { verifyScenarioOutcome } from "../../_shared/verify";

/**
 * YIELD_STAKING_SIMPLE — STAKE / UNSTAKE execution flow spec.
 *
 * SSOT: architecture-v2/archetypes/yield-staking-simple.md — canonical
 * instructions are STAKE + UNSTAKE against a validator protocol (Lido,
 * Rocket Pool, Jito, Marinade). The DeFiStakingWidget mounts on the
 * /services/trading/defi/staking page above the Positions/Validators/Rewards
 * tabs and is the execution surface this spec drives.
 *
 * Structure mirrors the yield-rotation-lending reference pattern:
 *   1. Load the JSON fixture describing persona, route, and scenarios.
 *   2. Seed the persona into localStorage (mock-mode login shortcut).
 *   3. Open ONE browser session and walk through each scenario in order.
 *   4. Scope every locator to `[data-testid="defi-staking-widget"]` so we
 *      don't accidentally drive the generic dashboard Stake/Unstake buttons
 *      on Positions rows (those share similar labels).
 *
 * One baseline assertion also checks the read-only dashboard is alongside
 * the widget — the KPI strip and Positions tab still need to render for
 * the page to be considered a valid operator surface.
 *
 * Playbook: docs/trading/defi/playbooks/yield-staking-simple.md
 */

const FIXTURE = loadStrategyFixture("yield-staking-simple");
const BASE_URL = "http://localhost:3100";
const TRADE_HISTORY_ROUTE = "/services/trading/defi";

test.describe.configure({ mode: "serial" });

async function countTradeRowsOnDefiPage(page: Page): Promise<number> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page
    .waitForSelector('[data-testid="defi-trade-history"], [data-testid="trade-history-row"]', { timeout: 15_000 })
    .catch(() => undefined);
  return page.locator('[data-testid="trade-history-row"]').count();
}

async function verifyLedgerRowOnDefiPage(
  page: Page,
  beforeRows: number,
  expected: { tradeType: string; minRowsAdded?: number },
): Promise<void> {
  await page.goto(`${BASE_URL}${TRADE_HISTORY_ROUTE}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="trade-history-row"]', { timeout: 15_000 });
  await verifyScenarioOutcome(page, beforeRows, {
    tradeType: expected.tradeType,
    minRowsAdded: expected.minRowsAdded ?? 1,
  });
}

async function returnToStaking(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
}

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(120_000);

  let page: Page;
  let widget: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    widget = page.locator(FIXTURE.rootSelector);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline: dashboard + widget render
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    // Dashboard still renders alongside the widget — one sanity check.
    await expect(page.locator('[data-testid="staking-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-kpi-strip"]')).toBeVisible();

    // Staking widget + its primary controls are all present.
    await expect(widget).toBeVisible();
    await expect(widget.locator('[data-testid="operation-button-STAKE"]')).toBeVisible();
    await expect(widget.locator('[data-testid="operation-button-UNSTAKE"]')).toBeVisible();
    await expect(widget.locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(widget.locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(widget.locator('[data-testid="execute-button"]')).toBeVisible();
    await expect(widget.locator('[data-testid="expected-apy"]')).toBeVisible();
    await expect(widget.locator('[data-testid="expected-yield"]')).toBeVisible();

    // STAKE is the default operation (emerald highlight).
    await expect(widget.locator('[data-testid="operation-button-STAKE"]')).toHaveClass(/bg-emerald-600/);

    // Expected APY renders a percentage string.
    const apyText = await widget.locator('[data-testid="expected-apy"]').textContent();
    expect(apyText ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    // Amount input empty → execute button disabled + expected-yield shows em dash.
    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");
    await expect(widget.locator('[data-testid="execute-button"]')).toBeDisabled();
    expect((await widget.locator('[data-testid="expected-yield"]').textContent()) ?? "").toBe("—");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — STAKE happy path
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStaking(page);

    // STAKE is the default, but toggle explicitly for idempotence.
    await widget.locator('[data-testid="operation-button-STAKE"]').click();
    await expect(widget.locator('[data-testid="operation-button-STAKE"]')).toHaveClass(/bg-emerald-600/);

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="execute-button"]')).toBeEnabled();

    // Annual-yield readout populates once amount is entered.
    const yieldText = (await widget.locator('[data-testid="expected-yield"]').textContent()) ?? "";
    expect(yieldText).not.toBe("—");
    expect(yieldText.trim().length).toBeGreaterThan(0);

    await widget.locator('[data-testid="execute-button"]').click();

    // Toast may appear briefly; tolerate absence.
    await page.waitForSelector("text=Staking order placed", { timeout: 3_000 }).catch(() => undefined);

    await expect
      .poll(async () => widget.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "STAKE" });
    await returnToStaking(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — UNSTAKE
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;

    const beforeRows = await countTradeRowsOnDefiPage(page);
    await returnToStaking(page);

    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await expect(widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`)).toHaveClass(/bg-rose-600/);

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="execute-button"]')).toBeEnabled();

    await widget.locator('[data-testid="execute-button"]').click();

    await expect
      .poll(async () => widget.locator('[data-testid="amount-input"]').inputValue(), { timeout: 3_000 })
      .toBe("");

    await page.waitForTimeout(800);

    await verifyLedgerRowOnDefiPage(page, beforeRows, { tradeType: "UNSTAKE" });
    await returnToStaking(page);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — protocol switch reactivity
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    // Reset to STAKE so the widget is in its default operation context.
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();

    const apyLocator = widget.locator('[data-testid="expected-apy"]');
    const beforeApy = (await apyLocator.textContent()) ?? "";

    await widget.locator('[data-testid="protocol-select"]').click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    if ((await options.count()) < 2) {
      test.skip(true, "only one staking protocol in fixture — cannot exercise protocol switch");
    }
    await options.nth(Number(sc.inputs.switchProtocolToIndex ?? 1)).click();

    // Expected APY should re-render (different protocols have different APYs).
    await expect.poll(async () => (await apyLocator.textContent()) ?? "", { timeout: 2_000 }).not.toBe(beforeApy);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — amount input updates annual-yield readout
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();

    const yieldLocator = widget.locator('[data-testid="expected-yield"]');

    // Start from empty input → yield shows em dash.
    await widget.locator('[data-testid="amount-input"]').fill("");
    expect((await yieldLocator.textContent()) ?? "").toBe("—");

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect.poll(async () => (await yieldLocator.textContent()) ?? "", { timeout: 2_000 }).not.toBe("—");

    // No execute — reactive-only scenario.
    await demoPause(page);
  });
});
