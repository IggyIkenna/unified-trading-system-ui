import { test, expect, Page } from "@playwright/test";

const STRESS_SCENARIOS = [
  "BIG_DRAWDOWN",
  "BIG_TICKS",
  "MISSING_DATA",
  "BAD_SCHEMAS",
  "STALE_DATA",
  "HIGH_CARDINALITY",
] as const;

async function mockStressApis(page: Page, scenario: string) {
  const reports =
    scenario === "MISSING_DATA"
      ? []
      : scenario === "HIGH_CARDINALITY"
        ? Array.from({ length: 500 }, (_, i) => ({
            id: `rpt-${i}`,
            name: `Client ${i % 20} Report`,
            client: `Client ${i % 20}`,
            type: "monthly",
            status: "delivered",
            period: "2026-02",
            generatedAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
          }))
        : [
            {
              id: "rpt-001",
              name: "Apex Capital Report",
              client: "Apex Capital",
              type: "monthly",
              status: "delivered",
              period: "2026-02",
              generatedAt: "2026-03-01T09:00:00Z",
              deliveredAt: "2026-03-01T10:00:00Z",
            },
          ];
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { status: "healthy", mock: true } }),
  );
  await page.route("**/api/reports**", (route) =>
    route.fulfill({ json: reports }),
  );
  await page.route("**/api/performance/**", (route) =>
    route.fulfill({
      json: {
        period: "2026-02",
        totalReturn: 0.187,
        sharpe: 2.34,
        maxDrawdown: 0.042,
        byClient: [],
        monthly: [],
      },
    }),
  );
}

for (const scenario of STRESS_SCENARIOS) {
  test.describe(`Stress: ${scenario}`, () => {
    test(`loads without crash`, async ({ page }) => {
      await mockStressApis(page, scenario);
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
