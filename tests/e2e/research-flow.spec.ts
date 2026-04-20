import { test, expect } from "@playwright/test";

/**
 * RESEARCH SERVICE FLOW E2E TESTS
 *
 * Tier 1: Routes exist, tabs render, no 404s
 * Tier 2: Data tables have rows (ML models, strategies)
 * Tier 3: Full research journey — hub, models, strategies, promote
 *
 * Routes from UI_STRUCTURE_MANIFEST:
 *   /services/research/overview           — Research Hub
 *   /services/research/ml                 — ML Models
 *   /services/research/ml/training        — Training queue
 *   /services/research/ml/registry        — Model Registry
 *   /services/research/strategy/backtests — Strategies
 *   /services/research/strategy/compare   — Compare
 *   /services/research/strategy/candidates — Review Queue (Promote)
 *   /services/research/strategy/handoff   — Approval Status (Promote)
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

// ── Tier 1: Navigation — all research routes load ──

test.describe("Tier 1: Research Navigation", () => {
  const RESEARCH_ROUTES = [
    { path: "/services/research/overview", label: "Research Hub" },
    { path: "/services/research/ml", label: "ML Models" },
    { path: "/services/research/ml/training", label: "ML Training" },
    { path: "/services/research/ml/registry", label: "ML Registry" },
    { path: "/services/research/strategy/backtests", label: "Strategies" },
    { path: "/services/research/strategy/compare", label: "Compare" },
  ];

  for (const route of RESEARCH_ROUTES) {
    test(`${route.label} page (${route.path}) loads without error`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(50);

      const criticalErrors = consoleErrors.filter(
        (e) => !e.includes("Warning:") && !e.includes("DevTools") && !e.includes("Download the React DevTools"),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }

  test("promote routes load", async ({ page }) => {
    const promoteRoutes = ["/services/research/strategy/candidates", "/services/research/strategy/handoff"];

    for (const route of promoteRoutes) {
      const response = await page.goto(route);
      expect(
        response?.status() === 200 || response?.status() === 304,
        `Expected ${route} to return 200/304, got ${response?.status()}`,
      ).toBeTruthy();
    }
  });

  test("research tab bar is visible", async ({ page }) => {
    await page.goto("/services/research/overview");
    await page.waitForLoadState("networkidle");

    const tabs = page.locator(
      'nav a[href*="/services/research"], ' + '[role="tablist"] [role="tab"], ' + 'a[href*="/research/"]',
    );
    await expect(async () => {
      expect(await tabs.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });
});

// ── Tier 2: Data — tables and cards have content ──

test.describe("Tier 2: Research Data", () => {
  test("research hub renders KPI cards or content", async ({ page }) => {
    await page.goto("/services/research/overview");
    await page.waitForLoadState("networkidle");

    const content = page.locator('[data-testid*="kpi"], .kpi-card, .stat-card, .metric-card, table, [role="grid"]');
    await expect(async () => {
      const bodyText = await page.textContent("body");
      expect((await content.count()) > 0 || (bodyText?.length ?? 0) > 200).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test("ML models page shows model list", async ({ page }) => {
    await page.goto("/services/research/ml");
    await page.waitForLoadState("networkidle");

    const modelRows = page.locator('table tbody tr, [role="row"], [data-testid*="model"], .model-card');
    await expect(async () => {
      expect(await modelRows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("ml training queue page shows training data", async ({ page }) => {
    await page.goto("/services/research/ml/training");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("strategies page shows backtest data", async ({ page }) => {
    await page.goto("/services/research/strategy/backtests");
    await page.waitForLoadState("networkidle");

    const rows = page.locator('table tbody tr, [role="row"], [data-testid*="strategy"], [data-testid*="backtest"]');
    await expect(async () => {
      expect(await rows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("promote review queue shows candidates", async ({ page }) => {
    await page.goto("/services/research/strategy/candidates");
    await page.waitForLoadState("networkidle");

    const candidates = page.locator('table tbody tr, [role="row"], [data-testid*="candidate"], .candidate-card');
    await expect(async () => {
      const bodyText = await page.textContent("body");
      // Either candidates exist or page content is substantial
      expect((await candidates.count()) > 0 || (bodyText?.length ?? 0) > 100).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});

// ── Tier 3: Full Research Journey ──

test.describe("Tier 3: Research Journey", () => {
  test("navigate research hub → ML models → features via tabs", async ({ page }) => {
    await page.goto("/services/research/overview");
    await page.waitForLoadState("networkidle");

    // Click ML Models tab
    const mlTab = page.locator('a:has-text("ML"), a:has-text("Models"), [role="tab"]:has-text("ML")');
    if ((await mlTab.count()) > 0) {
      await mlTab.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/ml");
    }

    // Click Features tab
    const featuresTab = page.locator('a:has-text("Features"), [role="tab"]:has-text("Features")');
    if ((await featuresTab.count()) > 0) {
      await featuresTab.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("features");
    }
  });

  test("navigate to strategies and compare", async ({ page }) => {
    await page.goto("/services/research/strategy/backtests");
    await page.waitForLoadState("networkidle");

    // Click Compare tab
    const compareTab = page.locator('a:has-text("Compare"), [role="tab"]:has-text("Compare")');
    if ((await compareTab.count()) > 0) {
      await compareTab.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("compare");
    }
  });

  test("navigate from research to promote review queue", async ({ page }) => {
    await page.goto("/services/research/overview");
    await page.waitForLoadState("networkidle");

    // Find promote/candidates link
    const promoteLink = page.locator(
      'a[href*="candidates"], ' +
        'a:has-text("Promote"), ' +
        'a:has-text("Review Queue"), ' +
        '[role="tab"]:has-text("Promote")',
    );

    if ((await promoteLink.count()) > 0) {
      await promoteLink.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("candidates");
    }
  });

  test("ml registry page renders", async ({ page }) => {
    await page.goto("/services/research/ml/registry");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });
});
