import { test, expect, type Locator, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";
import { countTradeRows, verifyObservationWidgetsVisible, verifyScenarioOutcome } from "../../_shared/verify";

/**
 * LIQUIDATION_CAPTURE — strategy-flow spec for flash-loan-powered liquidation arb.
 * Canonical SSOT atomic flow:
 *
 *   FLASH_BORROW → [SWAP / custom ops bundle] → FLASH_REPAY
 *
 * The DeFiFlashLoansWidget wraps the full atomic bundle — auto-prepends
 * FLASH_BORROW and auto-appends FLASH_REPAY around operator-defined steps.
 * This spec drives:
 *   1. asserting the widget mounts with disabled Execute bundle button
 *   2. adding a SWAP step to enable execution
 *   3. executing the bundle and verifying a FLASH_BORROW ledger row appears
 *   4. asserting the P&L preview panel is reactive
 *
 * Uses /services/trading/defi which co-renders DeFiFlashLoansWidget and
 * DeFiTradeHistoryWidget. The flash loans widget is at grid row y:36 in the
 * "defi-full" preset — we seed localStorage to activate that preset on load.
 * scrollIntoViewIfNeeded() handles the scroll automatically.
 */

const FIXTURE = loadStrategyFixture("liquidation-capture");
const BASE_URL = "http://localhost:3100";

// timeout covers beforeAll (page load of heavy /defi grid) + each test
test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(180_000);

  let page: Page;
  let flash: Locator;

  test.beforeAll(async ({ browser }) => {
    // Extend this hook's timeout — /defi grid is heavy; default 30s is too short.
    test.setTimeout(180_000);
    const context = await browser.newContext();
    page = await context.newPage();
    await seedPersona(page, FIXTURE.persona);
    // Seed the "defi-full" preset as the active workspace so the flash loans widget
    // (at grid y:36 in defi-full) is mounted on page load. The default preset
    // ("defi-default") does not include defi-flash-loans.
    await page.addInitScript(() => {
      localStorage.setItem(
        "unified-workspace-layouts",
        JSON.stringify({
          state: {
            workspaces: {},
            activeWorkspaceId: { defi: "defi-full" },
            editMode: true,
            customPanels: [],
            snapshots: {},
            profiles: [],
            activeProfileId: "",
          },
          version: 3,
        }),
      );
    });
    await page.goto(`${BASE_URL}${FIXTURE.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    // Flash widget at y:36 renders lazily — wait for any top-level widget first,
    // then let each test call scrollIntoViewIfNeeded() before interacting.
    await page.waitForSelector('[data-testid="defi-swap-widget"]', { timeout: 60_000 });
    flash = page.locator(FIXTURE.rootSelector);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ---------------------------------------------------------------------------
  // Scenario 0 — baseline: flash loans widget present, execute disabled
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await flash.scrollIntoViewIfNeeded();
    await expect(flash).toBeVisible();

    // Add-step button must be visible — this is the entry point for building bundles.
    await expect(flash.locator('[data-testid="flash-add-step-button"]')).toBeVisible();

    // Execute button must be disabled with no steps.
    await expect(flash.locator('[data-testid="flash-execute-button"]')).toBeDisabled();

    await verifyObservationWidgetsVisible(page, FIXTURE);
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — add a SWAP step to the bundle
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    await flash.scrollIntoViewIfNeeded();

    // evaluate-based click bypasses resize handle overlay on the /defi grid page.
    await flash.locator('[data-testid="flash-add-step-button"]').evaluate((el) => (el as HTMLButtonElement).click());

    // A step card should appear in the operations list.
    await expect(flash.locator("text=Step 1")).toBeVisible({ timeout: 3_000 });

    // Execute bundle becomes enabled once there is at least one step.
    await expect(flash.locator('[data-testid="flash-execute-button"]')).toBeEnabled({ timeout: 3_000 });

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — execute flash bundle; FLASH_BORROW row appears in ledger
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    const beforeRows = await countTradeRows(page);

    await flash.scrollIntoViewIfNeeded();
    await flash.locator('[data-testid="flash-execute-button"]').evaluate((el) => (el as HTMLButtonElement).click());

    await page.waitForSelector("text=Flash loan executed", { timeout: 5_000 }).catch(() => undefined);

    await page.waitForTimeout(800);

    await verifyScenarioOutcome(page, beforeRows, {
      tradeType: "FLASH_BORROW",
      minRowsAdded: 1,
    });
    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — P&L preview visible after second step added
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    await flash.scrollIntoViewIfNeeded();

    // Add another step to confirm the P&L preview panel stays reactive.
    await flash.locator('[data-testid="flash-add-step-button"]').evaluate((el) => (el as HTMLButtonElement).click());

    // P&L preview section shows gross profit, flash fee, gas estimate, net P&L.
    await expect(flash.locator("text=P&L preview")).toBeVisible({ timeout: 3_000 });
    await expect(flash.locator("text=Gross profit")).toBeVisible();
    await expect(flash.locator("text=Flash fee")).toBeVisible();
    await expect(flash.locator("text=Net P&L")).toBeVisible();

    await demoPause(page);
  });
});
