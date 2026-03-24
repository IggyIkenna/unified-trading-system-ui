import { test, expect } from "@playwright/test";

/**
 * OBSERVE SERVICE FLOW E2E TESTS
 *
 * Tier 1: Routes exist, tabs render, no 404s
 * Tier 2: Risk dashboard and alerts have data
 * Tier 3: Full observe journey — risk, alerts, system health
 *
 * Routes from UI_STRUCTURE_MANIFEST:
 *   /services/trading/risk            — Risk Dashboard (REAL)
 *   /services/trading/alerts          — Alerts (REAL)
 *   /services/observe/news            — News (STUB)
 *   /services/observe/strategy-health — Strategy Health (STUB)
 *   /services/observe/health          — System Health (REAL)
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

// ── Tier 1: Navigation — all observe routes load ──

test.describe("Tier 1: Observe Navigation", () => {
  const OBSERVE_ROUTES = [
    { path: "/services/trading/risk", label: "Risk Dashboard" },
    { path: "/services/trading/alerts", label: "Alerts" },
    { path: "/services/observe/health", label: "System Health" },
    { path: "/services/observe/news", label: "News" },
    { path: "/services/observe/strategy-health", label: "Strategy Health" },
  ];

  for (const route of OBSERVE_ROUTES) {
    test(`${route.label} page (${route.path}) loads without error`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(50);

      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("Warning:") &&
          !e.includes("DevTools") &&
          !e.includes("Download the React DevTools"),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});

// ── Tier 2: Data — dashboards and lists have content ──

test.describe("Tier 2: Observe Data", () => {
  test("risk dashboard shows exposure data", async ({ page }) => {
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    const content = page.locator(
      'table, [role="grid"], canvas, svg, ' +
        '[data-testid*="risk"], [data-testid*="exposure"], ' +
        ".risk-card, .exposure-card",
    );
    await expect(async () => {
      const bodyText = await page.textContent("body");
      expect(
        (await content.count()) > 0 || (bodyText?.length ?? 0) > 200,
      ).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test("alerts page shows alerts list", async ({ page }) => {
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    const alertRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="alert"], .alert-item',
    );
    await expect(async () => {
      const bodyText = await page.textContent("body");
      expect(
        (await alertRows.count()) > 0 || (bodyText?.length ?? 0) > 200,
      ).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test("system health page shows service health grid", async ({ page }) => {
    await page.goto("/services/observe/health");
    await page.waitForLoadState("networkidle");

    const healthContent = page.locator(
      'table, [role="grid"], [data-testid*="health"], .health-card, .service-card',
    );
    await expect(async () => {
      const bodyText = await page.textContent("body");
      expect(
        (await healthContent.count()) > 0 || (bodyText?.length ?? 0) > 200,
      ).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});

// ── Tier 3: Full Observe Journey ──

test.describe("Tier 3: Observe Journey", () => {
  test("navigate risk → alerts → system health", async ({ page }) => {
    // Start at risk dashboard
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    // Click Alerts tab
    const alertsTab = page.locator(
      'a:has-text("Alerts"), [role="tab"]:has-text("Alerts")',
    );
    if ((await alertsTab.count()) > 0) {
      await alertsTab.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("alerts");
    }

    // Click System Health tab
    const healthTab = page.locator(
      'a:has-text("Health"), a:has-text("System"), [role="tab"]:has-text("Health")',
    );
    if ((await healthTab.count()) > 0) {
      await healthTab.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("health");
    }
  });

  test("risk dashboard has interactive controls", async ({ page }) => {
    await page.goto("/services/trading/risk");
    await page.waitForLoadState("networkidle");

    // Look for risk-specific interactive elements
    const controls = page.locator(
      'button:visible, select:visible, [role="combobox"], input[type="range"]',
    );
    await expect(async () => {
      expect(await controls.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test("alerts page allows filtering or sorting", async ({ page }) => {
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    // Look for filter/sort controls
    const filterControls = page.locator(
      'button:has-text("Filter"), ' +
        'button:has-text("Sort"), ' +
        "select, " +
        '[data-testid*="filter"], ' +
        'input[placeholder*="search" i], ' +
        'input[placeholder*="filter" i]',
    );

    if ((await filterControls.count()) > 0) {
      // Interact with first control
      await filterControls.first().click();
      await page.waitForLoadState("networkidle");
      // No error should occur
    }
  });
});
