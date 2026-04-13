import { test, expect, type Page } from "@playwright/test";

/**
 * PERMISSION CATALOGUE E2E TESTS
 *
 * Tests the permission catalogue browser and catalogue-driven flows:
 *   1. Catalogue browser page loads with domain tree
 *   2. Domains expand to show categories and permissions
 *   3. Search filters permissions
 *   4. Onboard page uses catalogue-driven permission picker
 *   5. Modify page uses catalogue-driven permission picker
 *   6. Catalogue tab appears in admin tabs
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3100";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/login?persona=admin`);
  await page.waitForURL("**/dashboard**", { timeout: 10000 });
}

// ── Catalogue Browser ──

test.describe("Permission Catalogue: Browser", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("catalogue page loads with domain tree", async ({ page }) => {
    await page.goto(`${BASE}/admin/users/catalogue`);
    // Should show "Permission Catalogue" heading or similar
    await expect(page.getByText("Permission Catalogue")).toBeVisible({ timeout: 10000 });
    // Should show at least one domain (e.g. "Platform Services" or "Data Access")
    await expect(page.getByText("Platform Services").first()).toBeVisible({ timeout: 5000 });
  });

  test("catalogue tab visible in admin tabs", async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await expect(page.locator('a[href="/admin/users/catalogue"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("domain expands to show categories", async ({ page }) => {
    await page.goto(`${BASE}/admin/users/catalogue`);
    await expect(page.getByText("Platform Services").first()).toBeVisible({ timeout: 10000 });
    // Click to expand the first domain
    await page.getByText("Platform Services").first().click();
    // Should reveal categories underneath
    await expect(page.getByText("UI Sections").first()).toBeVisible({ timeout: 5000 });
  });

  test("search filters permissions", async ({ page }) => {
    await page.goto(`${BASE}/admin/users/catalogue`);
    await expect(page.getByText("Permission Catalogue")).toBeVisible({ timeout: 10000 });
    // Find search input and type a query
    const searchInput = page.getByPlaceholder("Search permissions");
    if (await searchInput.isVisible()) {
      await searchInput.fill("execution");
      // Should filter to show execution-related results
      await expect(page.getByText("Execution").first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Catalogue-Driven Onboard ──

test.describe("Permission Catalogue: Onboard Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("onboard page shows catalogue-driven permission picker", async ({ page }) => {
    await page.goto(`${BASE}/admin/users/onboard`);
    // Should show "Service Access" section with expandable domains
    await expect(page.getByText("Service Access")).toBeVisible({ timeout: 10000 });
    // Should show domain entries (from catalogue, not flat list)
    await expect(page.getByText("Platform Services").first()).toBeVisible({ timeout: 5000 });
  });

  test("onboard page expands domain and shows permissions with checkboxes", async ({ page }) => {
    await page.goto(`${BASE}/admin/users/onboard`);
    await expect(page.getByText("Platform Services").first()).toBeVisible({ timeout: 10000 });
    // Expand the first domain
    await page.getByText("Platform Services").first().click();
    // Should show a category
    await expect(page.getByText("UI Sections").first()).toBeVisible({ timeout: 5000 });
    // Expand the category
    await page.getByText("UI Sections").first().click();
    // Should show checkboxes for individual permissions
    const checkboxes = page.locator('[role="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
  });
});

// ── Catalogue-Driven Modify ──

test.describe("Permission Catalogue: Modify Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("modify page shows catalogue-driven entitlements section", async ({ page }) => {
    // Navigate to first user's modify page
    await page.goto(`${BASE}/admin/users`);
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
    // Click the first user row to go to detail
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();
    // Click the Modify button
    await page.getByText("Modify").click();
    // Should show "Entitlements" section with catalogue domains
    await expect(page.getByText("Entitlements")).toBeVisible({ timeout: 10000 });
    // Should show domain entries (from catalogue)
    await expect(page.getByText("Platform Services").first()).toBeVisible({ timeout: 5000 });
  });
});
