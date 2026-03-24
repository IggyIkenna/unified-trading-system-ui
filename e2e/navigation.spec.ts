import { test, expect } from "@playwright/test";

/**
 * NAVIGATION E2E TESTS — Agent 1
 *
 * Tests lifecycle navigation, tab routing, persona switching, and debug footer.
 * Runs against the UI (port 3000) in mock mode.
 */

const BASE = "http://localhost:3000";

test.describe("Lifecycle Navigation", () => {
  test("admin sees all 8 lifecycle stages", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    // 8 stages: Acquire, Build, Promote, Run, Execute, Observe, Manage, Report
    const stages = [
      "Acquire",
      "Build",
      "Promote",
      "Run",
      "Execute",
      "Observe",
      "Manage",
      "Report",
    ];
    for (const stage of stages) {
      await expect(page.locator(`button:has-text("${stage}")`)).toBeVisible();
    }
  });

  test("client-data-only sees limited stages with upgrade badges", async ({
    page,
  }) => {
    await page.goto(`${BASE}/login?persona=client-data-only`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    // Acquire should be accessible
    await expect(page.locator('button:has-text("Acquire")')).toBeVisible();

    // Locked stages should show lock icon or upgrade badge
    await page.click('button:has-text("Run")');
    await expect(page.locator("text=Upgrade")).toBeVisible();
  });

  test("clicking lifecycle dropdown lands on first tab, not card landing", async ({
    page,
  }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    // Click Acquire > Data
    await page.click('button:has-text("Acquire")');
    await page.click('a:has-text("Data")');
    await expect(page).toHaveURL(/\/services\/data\/overview/);

    // Click Run > Trading Terminal
    await page.click('button:has-text("Run")');
    await page.click('a:has-text("Trading Terminal")');
    await expect(page).toHaveURL(/\/services\/trading\/overview/);

    // Click Execute > Execution Analytics
    await page.click('button:has-text("Execute")');
    await page.click('a:has-text("Execution Analytics")');
    await expect(page).toHaveURL(/\/services\/execution\/overview/);
  });

  test("removed routes redirect to dashboard", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    // /services/overview should redirect to /dashboard
    await page.goto(`${BASE}/services/overview`);
    await expect(page).toHaveURL(/\/dashboard/);

    // /portal should redirect to /dashboard
    await page.goto(`${BASE}/portal`);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Debug Footer", () => {
  test("debug footer visible in mock mode", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    await expect(page.locator('[data-slot="debug-footer"]')).toBeVisible();
    await expect(page.locator("text=Mock Mode")).toBeVisible();
    await expect(page.locator("text=Reset Demo")).toBeVisible();
  });

  test("reset demo button reloads to clean state", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    await page.click('button:has-text("Reset Demo")');
    // Should redirect to root
    await expect(page).toHaveURL(`${BASE}/`);
  });
});

test.describe("Command Palette", () => {
  test("Cmd+K opens command palette", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");

    await page.keyboard.press("Meta+k");
    await expect(page.locator('[data-slot="command-input"]')).toBeVisible();
  });
});

test.describe("Service Tabs", () => {
  test("trading service shows correct tabs", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.goto(`${BASE}/services/trading/overview`);

    const tabs = ["Terminal", "Positions", "Orders", "Accounts", "Markets"];
    for (const tab of tabs) {
      await expect(page.locator(`a:has-text("${tab}")`)).toBeVisible();
    }
    // Execution Analytics should NOT be in trading tabs (moved to Execute)
    await expect(
      page.locator('a:has-text("Execution Analytics")'),
    ).not.toBeVisible();
  });

  test("execution service shows EXECUTE_TABS with Candidates and Handoff", async ({
    page,
  }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.goto(`${BASE}/services/execution/overview`);

    const tabs = [
      "Analytics",
      "Algos",
      "Venues",
      "TCA",
      "Benchmarks",
      "Candidates",
      "Handoff",
    ];
    for (const tab of tabs) {
      await expect(page.locator(`a:has-text("${tab}")`)).toBeVisible();
    }
  });
});

test.describe("Breadcrumbs", () => {
  test("breadcrumbs show Home > Service > Tab", async ({ page }) => {
    await page.goto(`${BASE}/login?persona=admin`);
    await page.click('button:has-text("Sign In")');
    await page.goto(`${BASE}/services/data/coverage`);

    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    await expect(page.locator('a:has-text("Data")')).toBeVisible();
  });
});
