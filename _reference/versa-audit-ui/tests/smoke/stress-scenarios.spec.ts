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
  const jobs =
    scenario === "MISSING_DATA"
      ? []
      : scenario === "HIGH_CARDINALITY"
        ? Array.from({ length: 1000 }, (_, i) => ({
            id: `job-${i}`,
            name: `Job ${i}`,
            service: `svc-${i % 20}`,
            status: ["completed", "running", "failed"][i % 3],
            startedAt: new Date(Date.now() - i * 3600000).toISOString(),
            completedAt: null,
            shardsTotal: 100,
            shardsCompleted: 50,
            shardsFailed: i % 3 === 2 ? 10 : 0,
            category: "equity",
            date: "2026-03-10",
          }))
        : [
            {
              id: "job-001",
              name: "Test Job",
              service: "instruments-service",
              status: "completed",
              startedAt: "2026-03-10T02:00:00Z",
              completedAt: "2026-03-10T02:45:00Z",
              shardsTotal: 48,
              shardsCompleted: 48,
              shardsFailed: 0,
              category: "equity",
              date: "2026-03-09",
            },
          ];
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { status: "healthy", mock: true } }),
  );
  await page.route("**/api/jobs**", (route) =>
    route.fulfill({ json: { jobs, total: jobs.length } }),
  );
  await page.route("**/health**", (route) =>
    route.fulfill({ json: { status: "healthy", mock: true } }),
  );
  await page.route("**/batch/jobs**", (route) =>
    route.fulfill({ json: { jobs, total: jobs.length } }),
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
