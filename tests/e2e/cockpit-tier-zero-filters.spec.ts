import { expect, test, type Page } from "@playwright/test";

/**
 * Tier-zero interaction-exhaustiveness tests.
 *
 * Per the audit: "every filter/dropdown/button should do one of four things:
 * filter real mock data, change workflow state, show clean empty state,
 * show clean unsupported state. It should never silently do nothing."
 *
 * These tests click each scope axis chip and assert that the scoped data
 * panels react with an observable change — row count delta, status banner,
 * or unsupported state.
 */

async function seedAdmin(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      "portal_user",
      JSON.stringify({
        id: "admin",
        email: "admin@odum.internal",
        role: "admin",
        org: { id: "odum-internal", name: "Odum Internal" },
        entitlements: ["*"],
      }),
    );
    localStorage.setItem("portal_token", "demo-token-admin");
  });
}

async function getStrategyRowCount(page: Page): Promise<number> {
  const attr = await page.locator('[data-testid="scoped-strategy-table"]').getAttribute("data-row-count");
  return Number(attr ?? "0");
}

test.describe("Tier-zero scope filters", () => {
  test("toggling DEFI chip narrows the strategy table", async ({ page }) => {
    await seedAdmin(page);
    await page.goto("/services/workspace?surface=terminal&tm=command");
    await page.locator('[data-testid="scoped-strategy-table"]').waitFor({ state: "visible", timeout: 30_000 });
    const initial = await getStrategyRowCount(page);
    expect(initial).toBeGreaterThan(0);

    // Add DEFI chip
    await page.locator('[data-testid="scope-chip-add-ag"]').click();
    await page.locator('[data-testid="scope-chip-popover-option-ag-DEFI"]').click();
    await expect(page.locator('[data-testid="scope-chip-ag-DEFI"]')).toBeVisible();

    // Wait for URL canonicalisation
    await expect.poll(async () => page.url(), { timeout: 5_000 }).toContain("ag=DEFI");

    // Row count drops to DEFI-only strategies
    await expect.poll(async () => getStrategyRowCount(page), { timeout: 5_000 }).toBeLessThan(initial);

    // Every visible row carries data-asset-group="DEFI"
    const rows = page.locator('[data-testid^="scoped-strategy-row-"]');
    const count = await rows.count();
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i)).toHaveAttribute("data-asset-group", "DEFI");
    }
  });

  test("unsupported combination surfaces an explicit unsupported state", async ({ page }) => {
    await seedAdmin(page);
    await page.goto("/services/workspace?surface=terminal&tm=command");
    await page.locator('[data-testid="scoped-strategy-table"]').waitFor({ state: "visible", timeout: 30_000 });

    // Pick an unsupported pairing — PREDICTION asset group + ARBITRAGE_STRUCTURAL family.
    // No tier-zero scenario covers this combination.
    await page.locator('[data-testid="scope-chip-add-ag"]').click();
    await page.locator('[data-testid="scope-chip-popover-option-ag-PREDICTION"]').click();
    await page.locator('[data-testid="scope-chip-add-fam"]').click();
    await page.locator('[data-testid="scope-chip-popover-option-fam-ARBITRAGE_STRUCTURAL"]').click();

    // Banner appears with status="unsupported"
    await expect(page.locator('[data-testid="scope-status-banner"][data-status="unsupported"]')).toBeVisible({
      timeout: 5_000,
    });
    // Suggestions render with at least one alternative scenario
    const suggestions = page.locator('[data-testid^="scope-suggestion-"]');
    expect(await suggestions.count()).toBeGreaterThan(0);
    // Strategy table has data-row-count="0"
    await expect(page.locator('[data-testid="scoped-strategy-table"]')).toHaveAttribute("data-row-count", "0");
  });

  test("family chip narrows the rows by family", async ({ page }) => {
    await seedAdmin(page);
    await page.goto("/services/workspace?surface=terminal&tm=command");
    await page.locator('[data-testid="scoped-strategy-table"]').waitFor({ state: "visible", timeout: 30_000 });
    const initial = await getStrategyRowCount(page);

    await page.locator('[data-testid="scope-chip-add-fam"]').click();
    await page.locator('[data-testid="scope-chip-popover-option-fam-VOL_TRADING"]').click();

    // Row count narrows to vol-trading strategies only
    await expect.poll(async () => getStrategyRowCount(page), { timeout: 5_000 }).toBeLessThanOrEqual(initial);
    const rows = page.locator('[data-testid^="scoped-strategy-row-"]');
    const count = await rows.count();
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i)).toHaveAttribute("data-family", "VOL_TRADING");
    }
  });
});
