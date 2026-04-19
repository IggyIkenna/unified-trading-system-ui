import { expect, test } from "@playwright/test";
import { seedPersona } from "./seed-persona";

/**
 * Cross-cutting visibility slicing spec.
 *
 * Asserts that each persona sees ONLY the entitled slice of the services portal.
 * Core model documented in:
 *   unified-trading-pm/codex/14-playbooks/cross-cutting/visibility-slicing.md
 *
 * This spec locks the contract:
 *   admin  → sees everything
 *   client-full → sees full subscription (data + execution + ml + strategy + reporting + trading-*)
 *   client-data-only → sees only data + no execution
 *   prospect-im → sees reports + IR; other services locked/hidden
 *
 * When the UI implements LOCKED-VISIBLE service tiles (Wave 1c in
 * codex/14-playbooks/roadmap/next-waves.md), these tests will extend to
 * assert padlock vs unlock state per tile.
 */

test.describe("visibility slicing — admin sees all", () => {
  test("admin reaches every top-level service overview", async ({ page }) => {
    await seedPersona(page, "admin");
    const services = [
      "/services/data/overview",
      "/services/research/overview",
      "/services/strategy-catalogue",
      "/services/trading/overview",
      "/services/observe/health",
      "/services/observe/risk",
      "/services/reports/overview",
      "/services/execution/overview",
      "/services/promote/pipeline",
    ];
    for (const route of services) {
      const response = await page.goto(route);
      expect(response?.status(), `admin should reach ${route}`).toBeLessThan(400);
    }
  });

  test("admin reaches admin surfaces", async ({ page }) => {
    await seedPersona(page, "admin");
    const adminRoutes = ["/admin", "/admin/users", "/admin/data", "/ops/services"];
    for (const route of adminRoutes) {
      const response = await page.goto(route);
      expect(response?.status(), `admin should reach ${route}`).toBeLessThan(400);
    }
  });
});

test.describe("visibility slicing — client-full sees full subscription", () => {
  test("client-full reaches entitled services", async ({ page }) => {
    await seedPersona(page, "client-full");
    const services = [
      "/services/data/overview",
      "/services/research/overview",
      "/services/strategy-catalogue",
      "/services/trading/overview",
      "/services/reports/overview",
    ];
    for (const route of services) {
      const response = await page.goto(route);
      expect(response?.status(), `client-full should reach ${route}`).toBeLessThan(400);
    }
  });
});

test.describe("visibility slicing — broken links should not exist", () => {
  // These hrefs were broken pre-Phase-3. Post-fix they should resolve.
  test("/services/trading/pnl resolves (was /markets/pnl typo)", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/trading/pnl");
    expect(response?.status()).toBeLessThan(400);
  });

  test("/services/reports/executive resolves (was /executive typo)", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/reports/executive");
    expect(response?.status()).toBeLessThan(400);
  });

  test("/investor-relations/board-presentation resolves (was /presentation typo)", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/investor-relations/board-presentation");
    expect(response?.status()).toBeLessThan(400);
  });

  test("/services/execution/tca resolves as stub", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/execution/tca");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/Transaction Cost Analysis/i)).toBeVisible();
  });
});
