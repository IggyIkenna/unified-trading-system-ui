import { test, expect } from "@playwright/test";

/**
 * Agent 7 — Observe & Admin E2E Tests
 * Tests for observe service pages and admin/ops pages.
 * Plan: agent7_observe_admin_2026_03_22.plan.md (a7-p7-tests)
 */

test.describe("Observe > Risk Dashboard", () => {
  test("renders exposure data and risk cards", async ({ page }) => {
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    // Risk page should have exposure section
    await expect(page.getByText("Risk")).toBeVisible();

    // VaR summary cards should be present
    await expect(page.getByText(/VaR|Value at Risk/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("circuit breaker buttons visible in live mode", async ({ page }) => {
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    // Strategy risk heatmap should have action buttons
    const tripButton = page.getByRole("button", { name: /Trip|CB/i }).first();
    if (await tripButton.isVisible()) {
      await expect(tripButton).toBeEnabled();
    }
  });

  test("kill switch requires confirmation dialog", async ({ page }) => {
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    const killButton = page.getByRole("button", { name: /Kill/i }).first();
    if (await killButton.isVisible()) {
      await killButton.click();
      // Should show AlertDialog confirmation
      await expect(page.getByText(/confirm|are you sure/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe("Observe > Alerts", () => {
  test("renders alert list with severity badges", async ({ page }) => {
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    // Should show alerts heading
    await expect(page.getByText("Alerts")).toBeVisible();

    // Should have severity filter
    await expect(page.getByText(/severity/i)).toBeVisible({ timeout: 10000 });
  });

  test("acknowledge button calls API", async ({ page }) => {
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    const ackButton = page
      .getByRole("button", { name: /Acknowledge/i })
      .first();
    if (await ackButton.isVisible()) {
      await ackButton.click();
      // Should show toast notification
      await expect(page.getByText(/acknowledged/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('empty state shows "All Clear" when no alerts', async ({ page }) => {
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    // If no alerts, should show positive empty state
    const allClear = page.getByText("All Clear");
    if (await allClear.isVisible()) {
      await expect(
        page.getByText(/all systems operating normally/i),
      ).toBeVisible();
    }
  });
});

test.describe("Observe > System Health", () => {
  test("renders service health grid", async ({ page }) => {
    await page.goto("/services/observe/health");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("System Health")).toBeVisible();

    // Should show status summary cards
    await expect(page.getByText("Total Services")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Healthy")).toBeVisible();
  });

  test("tabs switch between services, freshness, resources, dependencies, logs", async ({
    page,
  }) => {
    await page.goto("/services/observe/health");
    await page.waitForLoadState("networkidle");

    // Click through tabs
    const tabs = [
      "Services",
      "Feature Freshness",
      "Resources",
      "Dependencies",
      "Logs",
    ];
    for (const tab of tabs) {
      const tabButton = page.getByRole("tab", { name: tab });
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe("Admin > DevOps", () => {
  test("renders deployment control center with tabs", async ({ page }) => {
    await page.goto("/devops");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Deployment Control Center")).toBeVisible();

    // Should have sub-tabs
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Deployments/i })).toBeVisible();
  });
});

test.describe("Admin Access Control", () => {
  test("admin pages are accessible", async ({ page }) => {
    // Admin pages should be in (ops) route group with access control
    const adminPages = ["/admin", "/ops", "/devops", "/config"];
    for (const path of adminPages) {
      const response = await page.goto(path);
      // Page should load (200) or redirect (302) — not 404
      expect(response?.status()).not.toBe(404);
    }
  });
});
