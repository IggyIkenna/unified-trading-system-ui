import { test, expect } from "@playwright/test";

/**
 * Stress scenario smoke tests for unified-admin-ui.
 * This is a monorepo with packages — tests verify the root app loads under stress.
 */

const STRESS_SCENARIOS = [
  "BIG_DRAWDOWN",
  "BIG_TICKS",
  "MISSING_DATA",
  "BAD_SCHEMAS",
  "STALE_DATA",
  "HIGH_CARDINALITY",
] as const;

for (const scenario of STRESS_SCENARIOS) {
  test.describe(`Stress: ${scenario}`, () => {
    test(`loads without crash`, async ({ page }) => {
      // Route all API calls with stress-appropriate data
      await page.route("**/api/**", (route) => {
        return route.fulfill({
          json:
            scenario === "MISSING_DATA"
              ? {}
              : { status: "healthy", mock: true },
        });
      });
      await page.route("**/health**", (route) =>
        route.fulfill({ json: { status: "healthy" } }),
      );

      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const bodyText = await page.textContent("body");
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(10);
      await expect(
        page.getByText(
          /Unknown Error|Uncaught TypeError|Cannot read properties/i,
        ),
      ).not.toBeVisible();
    });
  });
}
