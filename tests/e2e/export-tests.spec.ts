import { test, expect } from "@playwright/test";

/**
 * EXPORT FUNCTIONALITY E2E TESTS
 *
 * Validates that the ExportDropdown component on data tables triggers
 * CSV and Excel downloads correctly.
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

test.describe("Export Functionality", () => {
  test("positions page has Export button that opens dropdown", async ({ page }) => {
    await page.goto("/services/trading/positions");
    await page.waitForLoadState("networkidle");

    // Find the Export button (from ExportDropdown component)
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(async () => {
      expect(await exportBtn.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Click to open dropdown
    await exportBtn.first().click();

    // Dropdown menu should show CSV and Excel options
    const csvOption = page.locator('[role="menuitem"]:has-text("CSV")');
    const excelOption = page.locator('[role="menuitem"]:has-text("Excel")');

    await expect(csvOption).toBeVisible({ timeout: 3000 });
    await expect(excelOption).toBeVisible({ timeout: 3000 });
  });

  test("clicking Export CSV triggers a file download", async ({ page }) => {
    await page.goto("/services/trading/positions");
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await expect(async () => {
      const rows = page.locator("table tbody tr");
      expect(await rows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Open export dropdown
    const exportBtn = page.locator('button:has-text("Export")');
    await exportBtn.first().click();

    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

    // Click CSV option
    const csvOption = page.locator('[role="menuitem"]:has-text("CSV")');
    await csvOption.click();

    // Verify download triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("orders page also has Export dropdown", async ({ page }) => {
    await page.goto("/services/trading/orders");
    await page.waitForLoadState("networkidle");

    const exportBtn = page.locator('button:has-text("Export")');
    await expect(async () => {
      expect(await exportBtn.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    await exportBtn.first().click();

    // Verify dropdown items are present
    await expect(page.locator('[role="menuitem"]:has-text("CSV")')).toBeVisible({ timeout: 3000 });
  });
});
