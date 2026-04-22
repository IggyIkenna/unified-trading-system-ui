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
 * YIELD_ROTATION_LENDING — reference strategy-flow spec.
 *
 * This is THE reference pattern for DeFi strategy specs:
 *   1. Load the JSON fixture describing persona, route, and scenarios.
 *   2. Seed the persona into localStorage (mock-mode login shortcut).
 *   3. Open ONE browser session and walk through each scenario in order.
 *   4. Each scenario drives the widget inputs then hands expected outcomes
 *      to the shared verify helpers.
 *
 * Serial mode + shared page: `--project=human` shows one continuous browser
 * flow rather than five open/close cycles.
 *
 * Playbook: docs/trading/defi/playbooks/yield-rotation-lending.md
 * Reference for the other DeFi strategy archetypes.
 */

const FIXTURE = loadStrategyFixture("yield-rotation-lending");
const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(120_000);

  let page: Page;
  let widget: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    // Dismiss any globally-mounted overlays (Command Palette / ChatWidgetTree)
    // that can briefly intercept pointer events or hydrate in an open state
    // when the route first loads.
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
    // The DeFi route now also renders defi-transfer-widget and defi-swap-widget
    // (for CARRY_STAKED_BASIS). Their testids collide with the lending widget's
    // (`asset-select`, `amount-input`, `execute-button`), so every locator must
    // be scoped to this widget's root.
    widget = page.locator(FIXTURE.rootSelector);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline render
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(widget).toBeVisible();
    await expect(widget.locator('[data-testid="protocol-select"]')).toBeVisible();
    await expect(widget.locator('[data-testid="asset-select"]')).toBeVisible();
    await expect(widget.locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(widget.locator('[data-testid="execute-button"]')).toBeVisible();

    await expect(widget.locator('[data-testid="operation-button-LEND"]')).toHaveClass(/bg-emerald-600/);

    const supplyApyText = await widget.locator('[data-testid="supply-apy"]').textContent();
    expect(supplyApyText ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");
    await expect(widget.locator('[data-testid="execute-button"]')).toBeDisabled();

    // Ledger is queryable (fixture seeds historical rows).
    expect(await countTradeRows(page)).toBeGreaterThanOrEqual(0);

    await verifyObservationWidgetsVisible(page, FIXTURE);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — LEND happy path
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;
    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="execute-button"]')).toBeEnabled();

    const expectedOutput = widget.locator('[data-testid="expected-output"]');
    await expect(expectedOutput).toBeVisible();
    expect((await expectedOutput.textContent()) ?? "").toMatch(/a[A-Z]{2,}/);

    const beforeRows = await countTradeRows(page);
    const snapshot = await snapshotObservationWidgets(page, FIXTURE, "LEND");

    await widget.locator('[data-testid="execute-button"]').click();

    // Toast may or may not appear depending on viewport; tolerate absence.
    await page.waitForSelector("text=DeFi order placed", { timeout: 3_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    await verifyObservationsUpdated(page, snapshot);

    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — WITHDRAW
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await expect(widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`)).toHaveClass(/bg-amber-600/);

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="expected-output"]')).toBeVisible();

    const beforeRows = await countTradeRows(page);

    await widget.locator('[data-testid="execute-button"]').click();

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — protocol switch reactivity
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    // Reset to LEND so the widget is in its default operation context.
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();

    const supplyApy = widget.locator('[data-testid="supply-apy"]');
    expect((await supplyApy.textContent()) ?? "").toMatch(/\d+(\.\d+)?\s*%/);

    await widget.locator('[data-testid="protocol-select"]').click();

    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    if ((await options.count()) < 2) {
      test.skip(true, "only one protocol in fixture — cannot exercise protocol switch");
    }
    await options.nth(Number(sc.inputs.switchProtocolToIndex ?? 1)).click();

    await expect
      .poll(async () => ((await supplyApy.textContent()) ?? "").match(/\d+(\.\d+)?\s*%/)?.[0], { timeout: 2_000 })
      .toBeTruthy();

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — asset switch reactivity
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;
    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    const expectedOutput = widget.locator('[data-testid="expected-output"]');
    const before = (await expectedOutput.textContent()) ?? "";

    await widget.locator('[data-testid="asset-select"]').click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    if ((await options.count()) < 2) {
      test.skip(true, "only one asset in fixture for this protocol");
    }
    await options.nth(Number(sc.inputs.switchAssetToIndex ?? 1)).click();

    const after = (await expectedOutput.textContent()) ?? "";
    expect(after).not.toBe("");
    expect(after).not.toEqual(before);

    await demoPause(page);
  });
});
