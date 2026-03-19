import { test, expect, Page } from "@playwright/test";

/**
 * Stress scenario smoke tests for deployment-ui.
 * Verifies the UI does not crash under any stress scenario.
 *
 * Note: VITE_STRESS_SCENARIO is baked at build time, so these tests
 * use Playwright's page.route() to simulate stress data instead.
 */

const STRESS_SCENARIOS = [
  "BIG_DRAWDOWN",
  "BIG_TICKS",
  "MISSING_DATA",
  "BAD_SCHEMAS",
  "STALE_DATA",
  "HIGH_CARDINALITY",
] as const;

function getStressDeployments(scenario: string) {
  if (scenario === "MISSING_DATA") return [];
  if (scenario === "HIGH_CARDINALITY") {
    return Array.from({ length: 500 }, (_, i) => ({
      id: `dep-hc-${i}`,
      service: `service-${i % 20}`,
      status: ["completed", "running", "failed"][i % 3],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date(Date.now() - i * 1800000).toISOString(),
      total_shards: 100,
      completed_shards: i % 3 === 2 ? 50 : 100,
      failed_shards: i % 3 === 2 ? 20 : 0,
      parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
    }));
  }
  if (scenario === "BIG_DRAWDOWN") {
    return [
      {
        id: "dep-fail-001",
        service: "risk-manager",
        status: "failed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_shards: 200,
        completed_shards: 0,
        failed_shards: 200,
        parameters: { compute: "vm", mode: "emergency", cloud_provider: "gcp" },
      },
    ];
  }
  if (scenario === "BAD_SCHEMAS") {
    return [
      {
        id: "",
        service: "",
        status: "unknown",
        created_at: "invalid-date",
        updated_at: "2099-99-99T99:99:99Z",
        total_shards: -1,
        completed_shards: -5,
        failed_shards: -3,
        parameters: {},
      },
    ];
  }
  if (scenario === "STALE_DATA") {
    return [
      {
        id: "dep-stale-001",
        service: "instruments-service",
        status: "running",
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        total_shards: 48,
        completed_shards: 12,
        failed_shards: 0,
        parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
      },
    ];
  }
  // BIG_TICKS — normal data
  return [
    {
      id: "dep-001",
      service: "instruments-service",
      status: "completed",
      created_at: "2026-03-10T08:00:00Z",
      updated_at: "2026-03-10T08:45:00Z",
      total_shards: 48,
      completed_shards: 48,
      failed_shards: 0,
      parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
    },
  ];
}

async function mockStressApis(page: Page, scenario: string) {
  const deps = getStressDeployments(scenario);

  await page.route("**/api/health", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        version: "test",
        config_dir: "/config",
        gcs_fuse: { active: true, reason: "mounted" },
      },
    }),
  );
  await page.route("**/api/services", (route) => {
    if (scenario === "MISSING_DATA") return route.fulfill({ json: [] });
    if (scenario === "HIGH_CARDINALITY") {
      return route.fulfill({
        json: Array.from({ length: 100 }, (_, i) => ({
          name: `service-${i}`,
          description: `Service ${i}`,
          dimensions: ["date"],
        })),
      });
    }
    return route.fulfill({
      json: [
        {
          name: "instruments-service",
          description: "Instrument universe",
          dimensions: ["category", "date"],
        },
      ],
    });
  });
  await page.route("**/api/deployments**", async (route) => {
    const url = route.request().url();
    if (url.includes("/events") || url.includes("/vm-events")) {
      await route.fulfill({
        json: { deployment_id: "dep-001", events: [], count: 0 },
      });
    } else {
      await route.fulfill({ json: { deployments: deps, total: deps.length } });
    }
  });
  await page.route("**/api/services/*/dimensions", (route) =>
    route.fulfill({
      json: { service: "instruments-service", dimensions: [], cli_args: {} },
    }),
  );
  await page.route("**/api/services/*/checklist**", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        overallScore: 87,
        isBlocked: false,
        categories: [],
      },
    }),
  );
  await page.route("**/api/config/region", (route) =>
    route.fulfill({
      json: {
        gcs_region: "asia-northeast1",
        storage_region: "asia-northeast1",
        cloud_provider: "gcp",
        zones: [],
      },
    }),
  );
  await page.route("**/api/services/*/start-dates", (route) =>
    route.fulfill({
      json: { service: "instruments-service", start_dates: {} },
    }),
  );
  await page.route("**/api/venues**", (route) =>
    route.fulfill({ json: { categories: {}, venues: [] } }),
  );
  await page.route("**/api/services/*/dependencies", (route) =>
    route.fulfill({ json: { upstream: [], downstream: [] } }),
  );
  await page.route("**/service-status/**", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        health: "healthy",
        anomalies: [],
      },
    }),
  );
  await page.route("**/cloud-builds/**", (route) =>
    route.fulfill({ json: { triggers: [], builds: [] } }),
  );
  await page.route("**/api/services/overview", (route) =>
    route.fulfill({ json: { services: [], count: 0 } }),
  );
  await page.route("**/api/services/*/data-status**", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        totalDates: 0,
        completeDates: 0,
        missingDates: [],
      },
    }),
  );
  await page.route("**/api/cache/clear", (route) =>
    route.fulfill({ json: { cleared: true } }),
  );
  await page.route("**/api/deployments/*/quota**", (route) =>
    route.fulfill({
      json: {
        total_shards: 24,
        max_concurrent: 2000,
        estimated_duration_min: 5,
      },
    }),
  );
}

for (const scenario of STRESS_SCENARIOS) {
  test.describe(`Stress: ${scenario}`, () => {
    test(`loads main page without crash under ${scenario}`, async ({
      page,
    }) => {
      await mockStressApis(page, scenario);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Page should not be blank
      const bodyText = await page.textContent("body");
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(10);

      // No uncaught exceptions
      await expect(
        page.getByText(
          /Unknown Error|Uncaught TypeError|Cannot read properties/i,
        ),
      ).not.toBeVisible();
    });

    test(`UI remains interactive under ${scenario}`, async ({ page }) => {
      await mockStressApis(page, scenario);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Try clicking first visible button to verify interactivity
      const button = page.getByRole("button").first();
      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        await button.click();
        // Should not crash
        await expect(
          page.getByText(/Unknown Error|Uncaught TypeError/i),
        ).not.toBeVisible();
      }
    });
  });
}
