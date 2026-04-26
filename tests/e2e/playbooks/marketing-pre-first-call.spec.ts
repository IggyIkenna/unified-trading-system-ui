import { expect, test } from "@playwright/test";
import { clearPersona } from "./seed-persona";

/**
 * pb1 — Marketing pre-first-call playbook spec.
 *
 * Anonymous visitor journey. No auth, no briefings gate, no localStorage state.
 * Canonical click path documented in:
 *   unified-trading-pm/codex/14-playbooks/playbooks/01-marketing-pre-first-call.md
 */

test.describe("pb1 — Marketing pre-first-call", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("homepage renders 200 with three-service pitch", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveTitle(/Odum Research/i);

    // Phase 3 React rebuild renders the three engagement-route cards with
    // marketing labels: Odum-Managed Strategies, DART Trading Infrastructure,
    // Regulated Operating Models.
    const allText = await page.locator("main").innerText();
    expect(allText).toMatch(/Odum-Managed Strategies/);
    expect(allText).toMatch(/DART Trading Infrastructure/);
    expect(allText).toMatch(/Regulated Operating Models/);
  });

  test("top-nav service landings all resolve 200", async ({ page }) => {
    const routes = ["/investment-management", "/platform", "/regulatory", "/who-we-are", "/contact"];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBeLessThan(400);
    }
  });

  test("login + signup pages render", async ({ page }) => {
    const loginRes = await page.goto("/login");
    expect(loginRes?.status()).toBeLessThan(400);
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();

    const signupRes = await page.goto("/signup");
    expect(signupRes?.status()).toBeLessThan(400);
  });

  test("footer legal links resolve", async ({ page }) => {
    for (const route of ["/privacy", "/terms"]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBeLessThan(400);
    }
  });

  test("DART label appears in nav (post-rename)", async ({ page }) => {
    await page.goto("/");
    // After Phase 3 nav-config DART rename, the platform nav label uses "DART".
    // If the label has not rolled out, this test documents the expectation.
    const navText = await page.locator("header nav, header a[href='/platform']").first().textContent();
    expect(navText, "platform nav label should be DART or Data/Research/Trading variant").toMatch(
      /DART|Data.*Research.*Trading/,
    );
  });
});
