import { test, expect } from "@playwright/test";

/**
 * LATENCY SIMULATION E2E TESTS
 *
 * With simulated network latency, skeleton placeholders should be visible
 * while data loads. Verifies the loading UX is correct.
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

test.describe("Latency Simulation — Skeleton Placeholders", () => {
  test("skeleton elements appear during data loading", async ({ page }) => {
    // Delay every API response by 2 seconds to guarantee skeletons are visible
    await page.route(`${API}/**`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Navigate to a data-heavy page
    await page.goto("/services/trading/positions");

    // Skeletons should be visible while data is loading
    await expect(async () => {
      const skeletons = page.locator(
        '[class*="skeleton"], [class*="Skeleton"], [data-slot="skeleton"], .animate-pulse',
      );
      const loaders = page.locator('[class*="animate-spin"], [role="progressbar"], text=Loading');
      const total = (await skeletons.count()) + (await loaders.count());
      expect(total).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test("skeleton elements appear on dashboard during data loading", async ({ page }) => {
    // Delay every API response by 2 seconds
    await page.route(`${API}/**`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/dashboard");

    // Look for skeleton/loading states
    await expect(async () => {
      const skeletons = page.locator(
        '[class*="skeleton"], [class*="Skeleton"], [data-slot="skeleton"], .animate-pulse',
      );
      const loaders = page.locator('[class*="animate-spin"], [role="progressbar"], text=Loading');
      const total = (await skeletons.count()) + (await loaders.count());
      expect(total).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });
});
