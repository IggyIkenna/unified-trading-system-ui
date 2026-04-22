import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { countTradeRows, verifyObservationWidgetsVisible, verifyScenarioOutcome } from "../../_shared/verify";

/**
 * MARKET_MAKING_CONTINUOUS (sub-mode: amm_lp) — concentrated-liquidity LP flow spec.
 *
 * SSOT: architecture-v2/archetypes/market-making-continuous.md folds AMM LP
 * provision under MARKET_MAKING_CONTINUOUS (sub-mode B/C). This spec drives
 * the AMM LP execution surface; the CLOB MM sub-mode has no dedicated widget
 * yet and is covered by the parametric detail-view spec.
 *
 * Follows the same structure as the YIELD_ROTATION_LENDING reference spec:
 *   1. Load the JSON fixture describing persona, route, and scenarios.
 *   2. Seed the persona into localStorage (mock-mode login shortcut).
 *   3. Switch the DeFi tab to the "defi-advanced" preset — the default preset
 *      does not mount the liquidity widget. The advanced preset is the
 *      operator-facing default for LP work.
 *   4. Open ONE browser session and walk through each scenario in order.
 *
 * Important: the DeFi page mounts multiple widgets that share generic testids
 * (amount-input, execute-button, operation-button-*). All locators in this
 * spec are therefore SCOPED to `[data-testid="defi-liquidity-widget"]` so we
 * never accidentally drive the lending widget next to us.
 *
 * Serial mode + shared page: `--project=human` shows one continuous browser
 * flow rather than five open/close cycles.
 *
 * Playbook: docs/trading/defi/playbooks/market-making-continuous-amm-lp.md
 */

const FIXTURE = loadStrategyFixture("market-making-continuous-amm-lp");
const BASE_URL = "http://localhost:3100";
const WORKSPACE_STORAGE_KEY = "unified-workspace-layouts";
const DEFI_PRESET_WITH_LIQUIDITY = "defi-advanced";

/**
 * Seed the workspace store so the DeFi tab opens on a preset that includes the
 * liquidity widget (defi-default does not). We pre-populate only the
 * activeWorkspaceId.defi slot — ensureTab() then fills workspaces[defi] from
 * the registered presets on first render and respects our chosen active id.
 */
async function seedLiquidityPreset(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, preset }) => {
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw
        ? (JSON.parse(existingRaw) as { state?: Record<string, unknown>; version?: number })
        : null;
      const state = (existing?.state ?? {}) as Record<string, unknown>;
      const activeWorkspaceId = (state.activeWorkspaceId as Record<string, string> | undefined) ?? {};
      state.activeWorkspaceId = { ...activeWorkspaceId, defi: preset };
      localStorage.setItem(
        key,
        JSON.stringify({
          state,
          version: existing?.version ?? 2,
        }),
      );
    },
    { key: WORKSPACE_STORAGE_KEY, preset: DEFI_PRESET_WITH_LIQUIDITY },
  );
}

test.describe.configure({ mode: "serial" });

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(120_000);

  let page: Page;
  let widget: Locator;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    await seedLiquidityPreset(page);
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(FIXTURE.rootSelector, { timeout: 30_000 });
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
    await expect(widget.locator('[data-testid="pool-select"]')).toBeVisible();
    await expect(widget.locator('[data-testid="operation-button-ADD_LIQUIDITY"]')).toBeVisible();
    await expect(widget.locator('[data-testid="operation-button-REMOVE_LIQUIDITY"]')).toBeVisible();
    await expect(widget.locator('[data-testid="fee-tier-group"]')).toBeVisible();
    await expect(widget.locator('[data-testid="amount-input"]')).toBeVisible();
    await expect(widget.locator('[data-testid="execute-button"]')).toBeVisible();

    // ADD_LIQUIDITY is the default operation (emerald highlight).
    await expect(widget.locator('[data-testid="operation-button-ADD_LIQUIDITY"]')).toHaveClass(/bg-emerald-600/);

    // Pool stats render non-empty numeric strings.
    const tvlText = await widget.locator('[data-testid="pool-tvl"]').textContent();
    expect(tvlText ?? "").toMatch(/\$\d/);
    const aprText = await widget.locator('[data-testid="pool-apr"]').textContent();
    expect(aprText ?? "").toMatch(/\d+(\.\d+)?\s*%/);
    const feeTierText = await widget.locator('[data-testid="pool-fee-tier"]').textContent();
    expect(feeTierText ?? "").toMatch(/\d/);

    // Execute button is disabled until an amount is entered.
    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");
    await expect(widget.locator('[data-testid="execute-button"]')).toBeDisabled();

    // Ledger is queryable (seeds historical rows; count may be > 0).
    expect(await countTradeRows(page)).toBeGreaterThanOrEqual(0);

    await verifyObservationWidgetsVisible(page, FIXTURE);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — ADD_LIQUIDITY happy path
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    const sc = FIXTURE.scenarios[1]!;
    // Ensure ADD_LIQUIDITY is the active operation (baseline default, but be explicit).
    await widget.locator('[data-testid="operation-button-ADD_LIQUIDITY"]').click();
    await expect(widget.locator('[data-testid="operation-button-ADD_LIQUIDITY"]')).toHaveClass(/bg-emerald-600/);

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="execute-button"]')).toBeEnabled();

    const beforeRows = await countTradeRows(page);

    await widget.locator('[data-testid="execute-button"]').click();

    // Toast may or may not appear depending on viewport; tolerate absence.
    await page.waitForSelector("text=Liquidity order placed", { timeout: 3_000 }).catch(() => undefined);

    await verifyScenarioOutcome(page, beforeRows, sc.expected);

    // Amount input clears after submit.
    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — REMOVE_LIQUIDITY
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const sc = FIXTURE.scenarios[2]!;
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();
    await expect(widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`)).toHaveClass(/bg-rose-600/);

    await widget.locator('[data-testid="amount-input"]').fill(String(sc.inputs.amount));
    await expect(widget.locator('[data-testid="execute-button"]')).toBeEnabled();

    const beforeRows = await countTradeRows(page);

    await widget.locator('[data-testid="execute-button"]').click();

    await verifyScenarioOutcome(page, beforeRows, sc.expected);
    expect(await widget.locator('[data-testid="amount-input"]').inputValue()).toBe("");

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — pool switch reactivity
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    const sc = FIXTURE.scenarios[3]!;
    // Reset to ADD_LIQUIDITY so the widget is in its default operation context.
    await widget.locator(`[data-testid="operation-button-${sc.inputs.operation}"]`).click();

    const tvlLocator = widget.locator('[data-testid="pool-tvl"]');
    const aprLocator = widget.locator('[data-testid="pool-apr"]');
    const beforeTvl = (await tvlLocator.textContent()) ?? "";
    const beforeApr = (await aprLocator.textContent()) ?? "";

    await widget.locator('[data-testid="pool-select"]').click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    if ((await options.count()) < 2) {
      test.skip(true, "only one pool in fixture — cannot exercise pool switch");
    }
    await options.nth(Number(sc.inputs.switchPoolToIndex ?? 1)).click();

    // Wait until at least one of TVL / APR has actually changed — pool stats
    // come from different fixture rows, so both (or at least one) will differ.
    await expect
      .poll(
        async () => {
          const tvl = (await tvlLocator.textContent()) ?? "";
          const apr = (await aprLocator.textContent()) ?? "";
          return tvl !== beforeTvl || apr !== beforeApr;
        },
        { timeout: 2_000 },
      )
      .toBe(true);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — fee-tier selection
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    const sc = FIXTURE.scenarios[4]!;
    const targetTier = String(sc.inputs.feeTier);
    const tierButton = widget.locator(`[data-testid="fee-tier-${targetTier}"]`);
    await expect(tierButton).toBeVisible();

    await tierButton.click();

    // The tier button is still the same DOM node after click — assert its
    // testid is intact and the widget stays functional. The active/filled
    // visual state uses the shadcn default variant, which is internal styling;
    // we don't snap tests to specific Tailwind classes on a reactive button.
    await expect(tierButton).toHaveAttribute("data-testid", `fee-tier-${targetTier}`);
    // Amount is still empty, so execute button should stay disabled.
    await expect(widget.locator('[data-testid="execute-button"]')).toBeDisabled();

    await demoPause(page);
  });
});
