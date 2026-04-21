import { test, expect, type Page } from "@playwright/test";
import { seedPersona } from "../../_shared/persona";
import { demoPause } from "../../_shared/demo-pause";
import { loadStrategyFixture } from "../../_shared/fixtures";

/**
 * YIELD_STAKING_SIMPLE — read-only dashboard verification spec.
 *
 * Mirrors the yield-rotation-lending reference pattern:
 *   1. Load the JSON fixture describing persona, route, and scenarios.
 *   2. Seed the persona into localStorage (mock-mode login shortcut).
 *   3. Open ONE browser session and walk through each scenario in order.
 *
 * Unlike the lending spec, this surface is a read-only staking dashboard
 * (KPI cards + Positions/Validators/Rewards/Unstaking tabs). Scenarios here
 * verify render correctness + tab navigation rather than trade execution, so
 * verify helpers from _shared/verify.ts are intentionally not invoked.
 *
 * Playbook: docs/trading/defi/playbooks/yield-staking-simple.md
 */

const FIXTURE = loadStrategyFixture("yield-staking-simple");
const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe(`${FIXTURE.name} — operator flow`, () => {
  test.setTimeout(120_000);

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
  // Scenario 0 — baseline render: KPI strip + tab list present
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[0]!.name, async () => {
    await expect(page.locator(FIXTURE.rootSelector)).toBeVisible();

    // 4 KPI cards
    await expect(page.locator('[data-testid="staking-kpi-total-staked"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-kpi-annual-yield"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-kpi-rewards-accrued"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-kpi-active-validators"]')).toBeVisible();

    // KPI values are rendered (non-empty + contain expected formatting)
    const totalStakedText = (await page.locator('[data-testid="staking-kpi-total-staked"]').textContent()) ?? "";
    expect(totalStakedText).toMatch(/\$\d+(\.\d+)?M/);

    const annualYieldText = (await page.locator('[data-testid="staking-kpi-annual-yield"]').textContent()) ?? "";
    expect(annualYieldText).toMatch(/\d+(\.\d+)?\s*%/);

    // 4 tabs present
    await expect(page.locator('[data-testid="staking-tab-positions"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-tab-validators"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-tab-rewards"]')).toBeVisible();
    await expect(page.locator('[data-testid="staking-tab-unstaking"]')).toBeVisible();

    // Default tab is Positions
    await expect(page.locator('[data-testid="staking-positions-table"]')).toBeVisible();

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — Positions tab renders rows
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[1]!.name, async () => {
    // Positions is the default tab, but click explicitly for idempotence.
    await page.locator('[data-testid="staking-tab-positions"]').click();

    const table = page.locator('[data-testid="staking-positions-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="staking-positions-row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Each row should surface a protocol name in its first cell.
    const firstRowText = (await rows.first().textContent()) ?? "";
    expect(firstRowText.trim().length).toBeGreaterThan(0);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — switching to Validators tab swaps the visible table
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[2]!.name, async () => {
    await page.locator('[data-testid="staking-tab-validators"]').click();

    const validatorsTable = page.locator('[data-testid="staking-validators-table"]');
    await expect(validatorsTable).toBeVisible();

    // Positions table should no longer be visible (Radix Tabs hides inactive content).
    await expect(page.locator('[data-testid="staking-positions-table"]')).toBeHidden();

    const validatorRows = page.locator('[data-testid="staking-validators-row"]');
    const count = await validatorRows.count();
    expect(count).toBeGreaterThan(0);

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — Rewards tab shows monthly chart + reward-history table
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[3]!.name, async () => {
    await page.locator('[data-testid="staking-tab-rewards"]').click();

    await expect(page.locator('[data-testid="staking-monthly-rewards-chart"]')).toBeVisible();

    const rewardsTable = page.locator('[data-testid="staking-rewards-table"]');
    await expect(rewardsTable).toBeVisible();

    const rewardsRows = page.locator('[data-testid="staking-rewards-row"]');
    const count = await rewardsRows.count();
    expect(count).toBeGreaterThan(0);

    // Validators table should now be hidden.
    await expect(page.locator('[data-testid="staking-validators-table"]')).toBeHidden();

    await demoPause(page);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — Unstaking tab: Withdraw button disabled for Cooling Down rows
  // ---------------------------------------------------------------------------

  test(FIXTURE.scenarios[4]!.name, async () => {
    await page.locator('[data-testid="staking-tab-unstaking"]').click();

    const unstakingTable = page.locator('[data-testid="staking-unstaking-table"]');
    await expect(unstakingTable).toBeVisible();

    const rows = page.locator('[data-testid="staking-unstaking-row"]');
    const totalRows = await rows.count();
    expect(totalRows).toBeGreaterThan(0);

    // For every row, verify Withdraw-button enablement matches the row's status.
    for (let i = 0; i < totalRows; i++) {
      const row = rows.nth(i);
      const status = (await row.getAttribute("data-unstaking-status")) ?? "";
      const button = row.locator('[data-testid="staking-unstaking-withdraw-button"]');
      if (status === "Ready to Withdraw") {
        await expect(button).toBeEnabled();
      } else {
        await expect(button).toBeDisabled();
      }
    }

    // At least one row of each flavour should exist in the fixture so the test
    // actually exercises both branches above.
    const cooling = page.locator('[data-testid="staking-unstaking-row"][data-unstaking-status="Cooling Down"]');
    expect(await cooling.count()).toBeGreaterThan(0);

    await demoPause(page);
  });
});
