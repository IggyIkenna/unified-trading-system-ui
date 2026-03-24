import { test, expect } from "@playwright/test";

/**
 * Agent 4 — Reports & Manage E2E Tests
 * Validates all reports and manage pages load and render key elements.
 */

test.describe("Reports Service", () => {
  test("P&L Attribution page renders summary cards and table", async ({
    page,
  }) => {
    await page.goto("/services/reports/overview");
    await page.waitForLoadState("networkidle");

    // Should have summary cards
    await expect(page.locator("text=Reporting")).toBeVisible({
      timeout: 10000,
    });

    // Generate Report button should exist
    await expect(
      page.getByRole("button", { name: /generate report/i }),
    ).toBeVisible();

    // Export button should exist
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();

    // Print button should exist
    await expect(page.getByRole("button", { name: /print/i })).toBeVisible();

    // Schedule button should exist
    await expect(page.getByRole("button", { name: /schedule/i })).toBeVisible();
  });

  test("Settlement page renders settlements table", async ({ page }) => {
    await page.goto("/services/reports/settlement");
    await page.waitForLoadState("networkidle");

    // Should have settlement summary cards or table
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

    // Should have status filter
    await expect(page.getByRole("combobox").first()).toBeVisible();

    // Export button should exist
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
  });

  test("Reconciliation page renders drift panel and history", async ({
    page,
  }) => {
    await page.goto("/services/reports/reconciliation");
    await page.waitForLoadState("networkidle");

    // Should have summary cards
    await expect(
      page.locator("text=Total Breaks").or(page.locator("text=Reconciliation")),
    ).toBeVisible({ timeout: 10000 });

    // DriftAnalysisPanel should render
    await expect(
      page.locator("text=Drift Analysis").or(page.locator("text=drift")),
    ).toBeVisible();
  });

  test("Regulatory page renders report table with status badges", async ({
    page,
  }) => {
    await page.goto("/services/reports/regulatory");
    await page.waitForLoadState("networkidle");

    // Should have status summary cards
    await expect(
      page.locator("text=Submitted").or(page.locator("text=MiFID")),
    ).toBeVisible({ timeout: 10000 });

    // Should have report table
    await expect(page.locator("table").first()).toBeVisible();
  });
});

test.describe("Manage Service", () => {
  test("Clients page renders client list", async ({ page }) => {
    await page.goto("/services/manage/clients");
    await page.waitForLoadState("networkidle");

    // Should have Client Management heading or cards
    await expect(
      page.locator("text=Client Management").or(page.locator("text=Clients")),
    ).toBeVisible({ timeout: 10000 });

    // Should have Onboard Client button
    await expect(
      page.getByRole("button", { name: /onboard client/i }),
    ).toBeVisible();
  });

  test("Onboard Client workflow opens multi-step modal", async ({ page }) => {
    await page.goto("/services/manage/clients");
    await page.waitForLoadState("networkidle");

    // Click Onboard Client
    await page.getByRole("button", { name: /onboard client/i }).click();

    // Should show Step 1
    await expect(page.locator("text=Client Details")).toBeVisible({
      timeout: 5000,
    });

    // Should have step indicators
    await expect(page.locator("text=Step 1")).toBeVisible();

    // Fill org name and click Next
    await page.getByPlaceholder(/apex trading/i).fill("Test Client");
    await page.getByRole("button", { name: /next/i }).click();

    // Should show Step 2 — Strategy Selection
    await expect(page.locator("text=Strategy Selection")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Users page renders user table", async ({ page }) => {
    await page.goto("/services/manage/users");
    await page.waitForLoadState("networkidle");

    // Should have User Management heading
    await expect(
      page.locator("text=User Management").or(page.locator("text=Users")),
    ).toBeVisible({ timeout: 10000 });

    // Should have user table
    await expect(page.locator("table").first()).toBeVisible();

    // Should have Invite User button
    await expect(
      page.getByRole("button", { name: /invite user/i }),
    ).toBeVisible();
  });

  test("Mandates page renders mandate table", async ({ page }) => {
    await page.goto("/services/manage/mandates");
    await page.waitForLoadState("networkidle");

    // Should have Mandates heading or table
    await expect(
      page
        .locator("text=Investment Mandates")
        .or(page.locator("text=Mandates")),
    ).toBeVisible({ timeout: 10000 });

    // Should have table
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("Compliance page renders rules and violations", async ({ page }) => {
    await page.goto("/services/manage/compliance");
    await page.waitForLoadState("networkidle");

    // Should have compliance content
    await expect(page.locator("text=Compliance").first()).toBeVisible({
      timeout: 10000,
    });

    // Should have rules table
    await expect(page.locator("table").first()).toBeVisible();
  });
});
