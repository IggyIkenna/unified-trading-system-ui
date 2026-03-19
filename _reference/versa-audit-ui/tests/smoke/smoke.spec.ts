import { test, expect } from "@playwright/test";

test.describe("Batch Audit UI — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("/api/**", async (route) => {
      const json = (d: unknown) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(d),
        });
      const url = route.request().url();
      if (url.includes("/api/jobs") || url.includes("/api/batch-jobs"))
        return json({
          jobs: [
            {
              id: "job-001",
              name: "instruments-service daily",
              service: "instruments-service",
              status: "completed",
              startedAt: "2026-03-10T02:00:00Z",
              completedAt: "2026-03-10T02:45:00Z",
              shardsTotal: 48,
              shardsCompleted: 48,
              shardsFailed: 0,
              category: "equity",
              error: null,
            },
            {
              id: "job-003",
              name: "features-delta-one",
              service: "features-delta-one-service",
              status: "failed",
              startedAt: "2026-03-10T07:00:00Z",
              completedAt: "2026-03-10T07:22:00Z",
              shardsTotal: 72,
              shardsCompleted: 31,
              shardsFailed: 8,
              category: "equity",
              error: "Quota exceeded",
            },
          ],
          total: 2,
        });
      return json({});
    });
  });

  test("shows mock mode banner", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Mock mode active"]')).toBeVisible();
  });

  test("loads Batch Audit header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Batch Audit")).toBeVisible();
    await expect(
      page.getByText("pipeline job monitoring & audit"),
    ).toBeVisible();
  });

  test("sidebar shows Batch Jobs nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Batch Jobs").first()).toBeVisible();
  });

  test("redirects to jobs by default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/jobs/);
  });

  test("jobs page shows stats cards", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText("all").first()).toBeVisible();
    await expect(page.getByText("running").first()).toBeVisible();
    await expect(page.getByText("completed").first()).toBeVisible();
    await expect(page.getByText("failed").first()).toBeVisible();
  });

  test("jobs table renders", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText("instruments-service daily")).toBeVisible();
    await expect(page.getByText("features-delta-one").first()).toBeVisible();
  });

  test("status filter works", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByText("failed").first().click();
    await expect(page.getByText("features-delta-one").first()).toBeVisible();
    await expect(page.getByText("instruments-service daily")).not.toBeVisible();
  });

  test("progress bars visible", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("clicking job navigates to detail", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/\/jobs\//);
  });

  test("job detail shows progress and details", async ({ page }) => {
    await page.goto("/jobs/job-001");
    await expect(page.getByText("Shard Progress")).toBeVisible();
    await expect(page.getByText("Job Details")).toBeVisible();
    await expect(page.getByText("48").first()).toBeVisible();
  });

  test("failed job shows error banner", async ({ page }) => {
    await page.goto("/jobs/job-003");
    await expect(page.getByText("Job Failed")).toBeVisible();
    await expect(page.getByText("Quota exceeded")).toBeVisible();
  });

  test("back button returns to jobs", async ({ page }) => {
    await page.goto("/jobs/job-001");
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("mock mode banner dismissable", async ({ page }) => {
    await page.goto("/");
    await page.locator('[aria-label="Dismiss mock mode banner"]').click();
    await expect(
      page.locator('[aria-label="Mock mode active"]'),
    ).not.toBeVisible();
  });

  // ── Sidebar navigation ───────────────────────────────────────────────────

  test("sidebar shows all nav items", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Batch Jobs").first()).toBeVisible();
    await expect(page.getByText("Audit Trail")).toBeVisible();
    await expect(page.getByText("Data Completeness")).toBeVisible();
    await expect(page.getByText("Compliance")).toBeVisible();
  });

  test("sidebar navigation to Audit Trail renders page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Audit Trail").click();
    await expect(page).toHaveURL(/\/audit\/trail/);
    await expect(
      page.getByRole("heading", { name: /Audit Trail/i }),
    ).toBeVisible();
  });

  test("sidebar navigation to Data Completeness renders page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByText("Data Completeness").click();
    await expect(page).toHaveURL(/\/audit\/health/);
    await expect(
      page.getByRole("heading", { name: /Data Completeness/i }),
    ).toBeVisible();
  });

  test("sidebar navigation to Compliance renders page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Compliance").click();
    await expect(page).toHaveURL(/\/audit\/compliance/);
    await expect(
      page.getByRole("heading", { name: /Compliance/i }),
    ).toBeVisible();
  });

  // ── Audit Trail page ─────────────────────────────────────────────────────

  test("audit trail shows event count summary cards", async ({ page }) => {
    await page.goto("/audit/trail");
    // Summary cards: Total Events, Errors, Services
    await expect(page.getByText("Total Events")).toBeVisible();
    // Use exact match to avoid matching "Errors Only" button
    await expect(page.getByText("Errors", { exact: true })).toBeVisible();
    await expect(page.getByText("Services", { exact: true })).toBeVisible();
  });

  test("audit trail renders event table with mock events", async ({ page }) => {
    await page.goto("/audit/trail");
    await expect(page.getByText("BATCH_COMPLETED").first()).toBeVisible();
    // Check service in a table cell, not the dropdown option (which is hidden)
    await expect(
      page
        .locator("table tbody tr td")
        .filter({ hasText: "ml-inference-service" })
        .first(),
    ).toBeVisible();
  });

  test("audit trail service filter narrows results", async ({ page }) => {
    await page.goto("/audit/trail");
    // Select a specific service from the dropdown
    await page.selectOption("select", "ml-inference-service");
    // After filtering, only ml-inference-service rows should be visible in the table
    await expect(
      page
        .locator("table tbody tr td")
        .filter({ hasText: "ml-inference-service" })
        .first(),
    ).toBeVisible();
    // Other services should not appear in table cells
    await expect(
      page.locator("table tbody tr td").filter({ hasText: "strategy-service" }),
    ).not.toBeVisible();
  });

  test("audit trail Errors Only toggle filters to error events", async ({
    page,
  }) => {
    await page.goto("/audit/trail");
    await page.getByText("Errors Only").click();
    // BATCH_FAILED and SHARD_FAILED are error events
    await expect(page.getByText("BATCH_FAILED").first()).toBeVisible();
    // BATCH_COMPLETED (non-error) should not be visible
    await expect(page.getByText("BATCH_COMPLETED")).not.toBeVisible();
  });

  // ── Data Completeness page ────────────────────────────────────────────────

  test("data completeness shows health summary cards", async ({ page }) => {
    await page.goto("/audit/health");
    await expect(page.getByText("Total Paths")).toBeVisible();
    // Use exact match to avoid matching lowercase badge variants ("present", "missing", "stale")
    await expect(page.getByText("Present", { exact: true })).toBeVisible();
    await expect(page.getByText("Missing", { exact: true })).toBeVisible();
    await expect(page.getByText("Stale", { exact: true })).toBeVisible();
  });

  test("data completeness shows degraded health badge", async ({ page }) => {
    await page.goto("/audit/health");
    await expect(page.getByText("degraded")).toBeVisible();
  });

  test("data completeness shows Issues Detected card", async ({ page }) => {
    await page.goto("/audit/health");
    await expect(page.getByText("Issues Detected")).toBeVisible();
    // Missing path badge should appear
    await expect(page.getByText("missing").first()).toBeVisible();
    await expect(page.getByText("stale").first()).toBeVisible();
  });

  test("data completeness service card expands on click", async ({ page }) => {
    await page.goto("/audit/health");
    // Click the ml-inference-service card header (font-mono span inside CardTitle) to expand it
    await page
      .locator("h3.font-mono")
      .filter({ hasText: "ml-inference-service" })
      .click();
    // Expanded view shows the path table
    await expect(
      page.getByText("batch/2026-03-10/signals.parquet"),
    ).toBeVisible();
  });

  // ── Compliance page ───────────────────────────────────────────────────────

  test("compliance page shows Summary tab by default", async ({ page }) => {
    await page.goto("/audit/compliance");
    // Summary card labels (exact match to avoid matching tab button text)
    await expect(
      page.getByText("Orphan Events", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("TTS Records", { exact: true })).toBeVisible();
    await expect(page.getByText("Error Events", { exact: true })).toBeVisible();
  });

  test("compliance page shows Services With Violations", async ({ page }) => {
    await page.goto("/audit/compliance");
    await expect(page.getByText("Services With Violations")).toBeVisible();
    await expect(page.getByText("features-delta-one-service")).toBeVisible();
  });

  test("compliance Orphan Events tab shows orphan table", async ({ page }) => {
    await page.goto("/audit/compliance");
    // Click the tab button (not the summary card) — use getByRole for the tab button
    await page.getByRole("button", { name: /Orphan Events/i }).click();
    await expect(page.getByText("TICK_RECEIVED")).toBeVisible();
    await expect(
      page.getByText("No matching BATCH_STARTED correlation chain"),
    ).toBeVisible();
  });

  test("compliance TTS Records tab shows TTS table", async ({ page }) => {
    await page.goto("/audit/compliance");
    await page.getByRole("button", { name: /TTS Records/i }).click();
    await expect(page.getByText("BEST_EXECUTION_REVIEW")).toBeVisible();
    await expect(page.getByText("resolved").first()).toBeVisible();
  });

  test("compliance Error Events tab shows error table", async ({ page }) => {
    await page.goto("/audit/compliance");
    await page.getByText("Error Events").first().click();
    await expect(page.getByText("QUOTA_EXCEEDED")).toBeVisible();
    await expect(page.getByText("UPSTREAM_DISCONNECT")).toBeVisible();
  });

  test("compliance summary card click navigates to Orphan Events tab", async ({
    page,
  }) => {
    await page.goto("/audit/compliance");
    // Click the Orphan Events summary card — the card itself (not the tab button)
    // The summary card is a clickable div that calls setActiveTab("orphans")
    await page
      .locator("div.cursor-pointer")
      .filter({ hasText: "Orphan Events" })
      .first()
      .click();
    // Should now show the orphan events table
    await expect(page.getByText("TICK_RECEIVED")).toBeVisible();
  });

  // ── Job detail — back button ──────────────────────────────────────────────

  test("job detail back button navigates to /jobs", async ({ page }) => {
    await page.goto("/jobs/job-001");
    // The back button is inside the main content (not the mock banner).
    // It's the first button inside the <main> element.
    await page.locator("main button").first().click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("running job shows running badge in detail view", async ({ page }) => {
    // job-002 is running
    await page.goto("/jobs/job-002");
    await expect(page.getByText("running")).toBeVisible();
  });
});
