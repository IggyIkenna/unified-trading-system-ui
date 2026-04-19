import { expect, test } from "@playwright/test";
import { clearPersona } from "./seed-persona";

/**
 * pb2 — Research & Documentation playbook spec.
 *
 * Light-auth briefings gate (not Firebase). Post-first-call prospect journey.
 * Canonical click path documented in:
 *   unified-trading-pm/codex/14-playbooks/playbooks/02-research-and-documentation.md
 */

test.describe("pb2 — Research & Documentation", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    await page.addInitScript(() => {
      localStorage.removeItem("odum-briefing-session");
    });
  });

  test("briefings root resolves 200", async ({ page }) => {
    const response = await page.goto("/briefings");
    expect(response?.status()).toBeLessThan(400);
  });

  test("three briefing pillars are reachable", async ({ page }) => {
    const pillars = [
      "/briefings/investment-management",
      "/briefings/platform",
      "/briefings/regulatory",
    ];
    for (const route of pillars) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBeLessThan(400);
    }
  });

  test("developer docs resolve", async ({ page }) => {
    const response = await page.goto("/docs");
    expect(response?.status()).toBeLessThan(400);
  });
});
