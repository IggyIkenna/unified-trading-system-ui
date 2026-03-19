/**
 * Smoke tests for Batch Audit UI package.
 *
 * The app runs on port 5182 (see vite.config.ts). All API calls are
 * intercepted at the window.fetch level by src/lib/mock-api.ts when
 * VITE_MOCK_API=true. The playwright.config.ts webServer sets that env var.
 *
 * Mock data (from src/lib/mock-api.ts):
 *   Jobs:
 *     job-001  instruments-service daily  completed  equity  48/48 shards
 *     job-002  market-tick-data batch     running    crypto  78/126 shards
 *     job-003  features-delta-one         failed     equity  31/72 shards   error: Quota exceeded
 *     job-004  ml-training weekly         completed  all     12/12 shards
 *     job-005  features-volatility        completed  equity  96/96 shards
 *
 * Covers:
 *   - App shell: header, sidebar nav items, mock mode banner
 *   - Root redirect to /jobs
 *   - Batch Jobs page: heading, stat cards (all / running / completed / failed),
 *     job table rows, status badges, navigation to job detail
 *   - Audit Trail page: heading, event list renders
 *   - Navigation: click-through with no JS errors
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5182";

// ---------------------------------------------------------------------------
// App Shell
// ---------------------------------------------------------------------------

test.describe("App Shell", () => {
  test("shows app name Batch Audit in header", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Batch Audit")).toBeVisible();
  });

  test("shows app description subtitle", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(
      page.getByText("pipeline job monitoring & audit"),
    ).toBeVisible();
  });

  test("shows mock mode banner when VITE_MOCK_API=true", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.locator('[aria-label="Mock mode active"]')).toBeVisible();
  });

  test("dismisses mock mode banner", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.locator('[aria-label="Dismiss mock mode banner"]').click();
    await expect(
      page.locator('[aria-label="Mock mode active"]'),
    ).not.toBeVisible();
  });

  test("sidebar shows Batch Jobs nav item", async ({ page }) => {
    await page.goto(BASE + "/");
    // Use the sidebar button to avoid clash with the page heading "Batch Jobs"
    await expect(
      page.getByRole("button", { name: "Batch Jobs" }),
    ).toBeVisible();
  });

  test("sidebar shows Audit Trail nav item", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Audit Trail")).toBeVisible();
  });

  test("sidebar shows Data Completeness nav item", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Data Completeness")).toBeVisible();
  });

  test("sidebar shows Compliance nav item", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Compliance")).toBeVisible();
  });

  test("sidebar shows Pipeline Ops section label", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Pipeline Ops")).toBeVisible();
  });

  test("root path redirects to /jobs", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page).toHaveURL(/\/jobs/);
  });
});

// ---------------------------------------------------------------------------
// Batch Jobs Page
// ---------------------------------------------------------------------------

test.describe("Batch Jobs Page", () => {
  test("shows Batch Jobs heading", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(
      page.getByRole("heading", { name: "Batch Jobs" }).first(),
    ).toBeVisible();
  });

  test("shows stat card: all count (5 total jobs)", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    // The subtitle under the heading says "5 total jobs"
    await expect(page.getByText("5 total jobs")).toBeVisible();
  });

  test("shows instruments-service daily job row", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("instruments-service daily")).toBeVisible();
  });

  test("shows market-tick-data batch job row", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("market-tick-data batch")).toBeVisible();
  });

  test("shows features-delta-one job row", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    // Match the job name exactly (not the service column which has features-delta-one-service)
    await expect(
      page.getByText("features-delta-one", { exact: true }),
    ).toBeVisible();
  });

  test("shows ml-training weekly job row", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("ml-training weekly")).toBeVisible();
  });

  test("shows features-volatility job row", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    // Match the job name exactly (not the service column which has features-volatility-service)
    await expect(
      page.getByText("features-volatility", { exact: true }),
    ).toBeVisible();
  });

  test("shows running badge for market-tick-data job", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("running").first()).toBeVisible();
  });

  test("shows completed badge for instruments-service job", async ({
    page,
  }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("completed").first()).toBeVisible();
  });

  test("shows failed badge for features-delta-one job", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("failed").first()).toBeVisible();
  });

  test("shows service name instruments-service in table", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByText("instruments-service").first()).toBeVisible();
  });

  test("table has Job column header", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByRole("columnheader", { name: "Job" })).toBeVisible();
  });

  test("table has Status column header", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(
      page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
  });

  test("table has Progress column header", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(
      page.getByRole("columnheader", { name: "Progress" }),
    ).toBeVisible();
  });

  test("clicking a job row navigates to job detail", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    // Click on the first job row
    await page.getByText("instruments-service daily").click();
    await expect(page).toHaveURL(/\/jobs\/.+/);
  });

  test("Refresh button is visible on jobs page", async ({ page }) => {
    await page.goto(BASE + "/jobs");
    await expect(page.getByRole("button", { name: /Refresh/ })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Audit Trail Page
// ---------------------------------------------------------------------------

test.describe("Audit Trail Page", () => {
  test("clicking Audit Trail nav navigates to /audit/trail", async ({
    page,
  }) => {
    await page.goto(BASE + "/jobs");
    await page.getByText("Audit Trail").click();
    await expect(page).toHaveURL(/\/audit\/trail/);
  });

  test("audit trail page shows event list", async ({ page }) => {
    await page.goto(BASE + "/audit/trail");
    // The audit trail table renders event rows; execution-service appears in the
    // Service cell of the table (not in a hidden <option> element)
    await expect(
      page.getByRole("cell", { name: "execution-service" }),
    ).toBeVisible();
  });

  test("audit trail page shows BATCH_COMPLETED event type", async ({
    page,
  }) => {
    await page.goto(BASE + "/audit/trail");
    await expect(page.getByText("BATCH_COMPLETED").first()).toBeVisible();
  });

  test("audit trail page shows BATCH_FAILED event", async ({ page }) => {
    await page.goto(BASE + "/audit/trail");
    await expect(page.getByText("BATCH_FAILED").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Data Completeness Page
// ---------------------------------------------------------------------------

test.describe("Data Completeness Page", () => {
  test("clicking Data Completeness nav navigates to /audit/health", async ({
    page,
  }) => {
    await page.goto(BASE + "/jobs");
    await page.getByText("Data Completeness").click();
    await expect(page).toHaveURL(/\/audit\/health/);
  });

  test("data completeness page shows degraded overall health", async ({
    page,
  }) => {
    await page.goto(BASE + "/audit/health");
    await expect(page.getByText("degraded").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation — full tour with zero JS errors
// ---------------------------------------------------------------------------

test.describe("Navigation — full tour", () => {
  test("full tour: root → jobs → audit/trail → audit/health with no JS errors", async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto(BASE + "/");
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByText("Batch Jobs").first()).toBeVisible();

    await page.getByText("Audit Trail").click();
    await expect(page).toHaveURL(/\/audit\/trail/);

    await page.getByText("Data Completeness").click();
    await expect(page).toHaveURL(/\/audit\/health/);

    await page.getByText("Batch Jobs").click();
    await expect(page).toHaveURL(/\/jobs/);

    expect(jsErrors).toHaveLength(0);
  });
});
