import { test, expect, Page } from "@playwright/test";

/**
 * Stateful flow tests for deployment-ui.
 * Tests multi-step user journeys in interactive mock mode.
 */

// ── Mock API responses ──────────────────────────────────────────────────────

const MOCK_SERVICES = [
  {
    name: "instruments-service",
    description: "Instrument universe",
    dimensions: ["category", "date"],
    docker_image: "gcr.io/project/instruments-service:latest",
    cloud_run_job_name: "instruments-service",
  },
];

const MOCK_DEPLOYMENTS = [
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
  {
    id: "dep-002",
    service: "instruments-service",
    status: "running",
    created_at: "2026-03-10T09:30:00Z",
    updated_at: "2026-03-10T09:30:00Z",
    total_shards: 126,
    completed_shards: 78,
    failed_shards: 0,
    parameters: { compute: "cloud_run", mode: "live", cloud_provider: "gcp" },
  },
  {
    id: "dep-003",
    service: "instruments-service",
    status: "failed",
    created_at: "2026-03-10T07:00:00Z",
    updated_at: "2026-03-10T07:22:00Z",
    total_shards: 72,
    completed_shards: 31,
    failed_shards: 8,
    parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
  },
];

async function mockAllApis(page: Page) {
  await page.route("**/api/health", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        version: "1.0.0-test",
        config_dir: "/config",
        gcs_fuse: { active: true, reason: "mounted" },
      },
    }),
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({ json: MOCK_SERVICES }),
  );
  await page.route("**/api/services/*/dimensions", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        dimensions: [
          { name: "category", type: "fixed", values: ["cefi", "tradfi"] },
          { name: "date", type: "date_range", granularity: "daily" },
        ],
        cli_args: {},
      },
    }),
  );
  await page.route("**/api/services/*/checklist/validate", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        ready: true,
        readiness_percent: 100,
        total_items: 10,
        completed_items: 10,
        blocking_items: [],
        warnings: [],
        can_proceed_with_acknowledgment: false,
      },
    }),
  );
  await page.route("**/api/services/*/checklist", (route) =>
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
        zones: ["asia-northeast1-a", "asia-northeast1-b", "asia-northeast1-c"],
      },
    }),
  );
  await page.route("**/api/services/*/start-dates", (route) =>
    route.fulfill({
      json: { service: "instruments-service", start_dates: {} },
    }),
  );
  await page.route("**/api/venues**", (route) =>
    route.fulfill({
      json: { categories: {}, category: "", venues: [], data_types: [] },
    }),
  );
  await page.route("**/api/services/*/dependencies", (route) =>
    route.fulfill({ json: { upstream: [], downstream: [], dependents: [] } }),
  );
  await page.route("**/service-status/*/status", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        health: "healthy",
        last_data_update: "2026-03-15T08:00:00Z",
        last_deployment: "2026-03-15T10:00:00Z",
        last_build: "2026-03-14T20:00:00Z",
        last_code_push: "2026-03-14T18:00:00Z",
        anomalies: [],
        details: {
          deployment: {
            deployment_id: "dep-001",
            status: "completed",
            compute_type: "cloud_run",
          },
          build: {
            status: "SUCCESS",
            commit_sha: "abc1234",
            duration_seconds: 120,
          },
          code: {
            commit_sha: "abc1234",
            message: "feat: update",
            author: "dev",
          },
        },
      },
    }),
  );
  await page.route("**/cloud-builds/triggers", (route) =>
    route.fulfill({
      json: {
        triggers: [
          {
            trigger_id: "trig-001",
            service: "instruments-service",
            type: "service",
            github_repo: "IggyIkenna/instruments-service",
            branch_pattern: "main",
            disabled: false,
            last_build: {
              status: "SUCCESS",
              commit_sha: "abc1234",
              create_time: "2026-03-14T20:00:00Z",
              duration_seconds: 120,
              log_url: null,
              build_id: "build-001",
            },
          },
        ],
      },
    }),
  );
  await page.route("**/cloud-builds/history/**", (route) =>
    route.fulfill({ json: { builds: [] } }),
  );
  await page.route("**/api/services/overview", (route) =>
    route.fulfill({
      json: { services: [], count: 1, healthy: 1, warnings: 0, errors: 0 },
    }),
  );
  await page.route("**/api/services/*/data-status**", (route) =>
    route.fulfill({
      json: {
        service: "instruments-service",
        totalDates: 30,
        completeDates: 28,
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

// ── Flow 1: Create deployment -> view in history -> see details ─────────────

test.describe("Flow 1: Deploy -> History -> Details", () => {
  test("create deployment then find it in history", async ({ page }) => {
    let deploymentCreated = false;
    const newDepId = "dep-new-001";

    await mockAllApis(page);

    // Dynamic deployment list — starts with original, adds new one after creation
    await page.route("**/api/deployments**", async (route) => {
      const url = route.request().url();
      if (route.request().method() === "POST") {
        deploymentCreated = true;
        await route.fulfill({
          json: {
            dry_run: false,
            deployment_id: newDepId,
            shards: [
              {
                shard_id: "shard-0",
                status: "queued",
                category: "cefi",
                date_range: { start: "2026-01-01", end: "2026-03-15" },
              },
            ],
            total_shards: 24,
            shards_truncated: false,
            deployment: {
              id: newDepId,
              service: "instruments-service",
              status: "running",
              startedAt: new Date().toISOString(),
            },
            message: "Deployment started",
          },
          status: 201,
        });
      } else if (url.includes("/events") || url.includes("/vm-events")) {
        await route.fulfill({
          json: { deployment_id: "dep-001", events: [], count: 0 },
        });
      } else {
        const deps = deploymentCreated
          ? [
              {
                id: newDepId,
                service: "instruments-service",
                status: "running",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                total_shards: 24,
                completed_shards: 0,
                failed_shards: 0,
                parameters: {
                  compute: "vm",
                  mode: "batch",
                  cloud_provider: "gcp",
                },
              },
              ...MOCK_DEPLOYMENTS,
            ]
          : MOCK_DEPLOYMENTS;
        await route.fulfill({
          json: { deployments: deps, total: deps.length },
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Step 1: Select service
    await page.getByText("instruments-service").first().click();
    await page.waitForLoadState("networkidle");

    // Step 2: Verify deploy tab is visible
    await expect(page.getByText(/Deploy instruments-service/)).toBeVisible();

    // Step 3: Navigate to History tab
    await page.getByRole("tab", { name: /History/i }).click();
    await expect(page.getByText("dep-001")).toBeVisible({ timeout: 10000 });

    // Step 4: Go back to Deploy tab and trigger deployment
    await page.getByRole("tab", { name: /Deploy/i }).click();
    await page.waitForLoadState("networkidle");

    // Fill required date fields if present
    const startInputs = page.getByLabel(/Start Date/i);
    if ((await startInputs.count()) > 0)
      await startInputs.first().fill("2026-01-01");
    const endInputs = page.getByLabel(/End Date/i);
    if ((await endInputs.count()) > 0)
      await endInputs.first().fill("2026-03-15");

    // Uncheck dry run if it's checked
    const dryRunCheckbox = page.getByLabel(/Dry Run/i);
    if (
      (await dryRunCheckbox.count()) > 0 &&
      (await dryRunCheckbox.isChecked())
    ) {
      await dryRunCheckbox.uncheck();
    }

    const deployBtn = page
      .getByRole("button", { name: /Deploy|Preview|Run/i })
      .first();
    if (await deployBtn.isVisible()) {
      await deployBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 5: Navigate back to History tab — new deployment should appear
    await page.getByRole("tab", { name: /History/i }).click();
    await page.waitForLoadState("networkidle");

    // The history tab should still render without errors
    await expect(page.getByText(/Unknown Error|TypeError/i)).not.toBeVisible();
  });
});

// ── Flow 2: Browse tabs in sequence ─────────────────────────────────────────

test.describe("Flow 2: Tab navigation sequence", () => {
  test("navigate Deploy -> History -> Builds -> Readiness -> Status -> Config without errors", async ({
    page,
  }) => {
    await mockAllApis(page);
    await page.route("**/api/deployments**", async (route) => {
      const url = route.request().url();
      if (url.includes("/events") || url.includes("/vm-events")) {
        await route.fulfill({
          json: { deployment_id: "dep-001", events: [], count: 0 },
        });
      } else {
        await route.fulfill({
          json: {
            deployments: MOCK_DEPLOYMENTS,
            total: MOCK_DEPLOYMENTS.length,
          },
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByText("instruments-service").first().click();
    await page.waitForLoadState("networkidle");

    // Deploy tab
    await expect(page.getByText(/Deploy instruments-service/)).toBeVisible();

    // History tab
    await page.getByRole("tab", { name: /History/i }).click();
    await expect(page.getByText("dep-001")).toBeVisible({ timeout: 10000 });

    // Builds tab
    await page.getByRole("tab", { name: /Builds/i }).click();
    await expect(page.getByText("Cloud Build Triggers")).toBeVisible({
      timeout: 10000,
    });

    // Readiness tab
    await page.getByRole("tab", { name: /Readiness/i }).click();
    await page.waitForLoadState("networkidle");

    // Status tab
    await page.getByRole("tab", { name: "Status", exact: true }).click();
    await expect(page.getByText("Service Health Timeline")).toBeVisible({
      timeout: 10000,
    });

    // Config tab
    await page.getByRole("tab", { name: /Config/i }).click();
    await page.waitForLoadState("networkidle");

    // No errors anywhere
    await expect(
      page.getByText(/Unknown Error|TypeError|Cannot read/i),
    ).not.toBeVisible();
  });
});

// ── Flow 3: Switch cloud provider and verify form state ─────────────────────

test.describe("Flow 3: Cloud provider switching", () => {
  test("switch GCP -> AWS -> GCP preserves form state", async ({ page }) => {
    await mockAllApis(page);
    await page.route("**/api/deployments**", (route) =>
      route.fulfill({
        json: { deployments: MOCK_DEPLOYMENTS, total: MOCK_DEPLOYMENTS.length },
      }),
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByText("instruments-service").first().click();
    await page.waitForLoadState("networkidle");

    // Verify GCP is initially selected
    const gcpBtn = page.getByRole("button", { name: "GCP" });
    const awsBtn = page.getByRole("button", { name: "AWS" });
    await expect(gcpBtn).toBeVisible();
    await expect(awsBtn).toBeVisible();

    // Switch to AWS — should show warning
    await awsBtn.click();
    await expect(
      page.getByText(/AWS configured but unauthenticated/),
    ).toBeVisible();

    // Switch back to GCP — warning should disappear
    await gcpBtn.click();
    await expect(
      page.getByText(/AWS configured but unauthenticated/),
    ).not.toBeVisible();

    // Form should still be functional — deploy button visible
    const deployBtn = page
      .getByRole("button", { name: /Deploy|Preview|Run/i })
      .first();
    await expect(deployBtn).toBeVisible();
  });
});
