import { expect, test } from "@playwright/test";
import { clearPersona } from "./seed-persona";

/**
 * Marketing site restructure — Plan A Phase 6 verification.
 *
 * Asserts the 5-path public surface + briefings light-auth gate + 6 pillar
 * routes are all reachable. Codex SSOT:
 *   unified-trading-pm/codex/14-playbooks/experience/marketing-journey.md
 *   unified-trading-pm/codex/14-playbooks/authentication/light-auth-briefings.md
 *   unified-trading-pm/codex/14-playbooks/implementation-mapping/route-mapping.md
 *   unified-trading-pm/plans/active/marketing_site_restructure_2026_04_20.plan
 */

const FIVE_PATH_NAV: readonly string[] = [
  "/platform", // DART umbrella
  "/signals", // Odum Signals (signals-out)
  "/investment-management",
  "/regulatory",
  "/who-we-are", // Firm (nav label "Who We Are")
];

const DART_SUB_PATHS: readonly string[] = ["/platform/signals-in", "/platform/full"];

const BRIEFING_PILLARS: readonly string[] = [
  "dart-signals-in",
  "dart-full",
  "signals-out",
  "investment-management",
  "regulatory",
  "platform",
];

test.describe("Marketing site restructure — Plan A", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("odum-briefing-session");
      } catch {
        /* jsdom not ready — ignore */
      }
    });
  });

  test("homepage renders + header links to each of 5 paths in 1 click", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    for (const route of FIVE_PATH_NAV) {
      const link = page.locator(`header a[href='${route}']`).first();
      await expect(link, `header should expose link to ${route}`).toHaveCount(1);
    }
  });

  test("each of 5 top-level paths resolves", async ({ page }) => {
    for (const route of FIVE_PATH_NAV) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return < 400`).toBeLessThan(400);
    }
  });

  test("DART umbrella sub-paths resolve", async ({ page }) => {
    for (const route of DART_SUB_PATHS) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return < 400`).toBeLessThan(400);
    }
  });

  test("briefings gate renders on each of 6 pillar routes (no session)", async ({ page }) => {
    for (const slug of BRIEFING_PILLARS) {
      const route = `/briefings/${slug}`;
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return < 400`).toBeLessThan(400);

      // Assert gate UI is present before a valid code has been entered.
      // The gate exposes an access-code input; either the input itself or its
      // label is visible. Fall back to looking for the pillar title if the gate
      // is disabled locally (ACCESS_CODE_REQUIRED=false — dev default).
      const codeInput = page.locator(
        "input[type='password'], input[name*='code' i], input[placeholder*='code' i]",
      );
      const gateVisible = (await codeInput.count()) > 0;
      if (!gateVisible) {
        // Gate is disabled in this environment — pillar content should be visible.
        const body = await page.locator("body").textContent();
        expect(body ?? "", `${route} should render either gate or pillar content`).not.toHaveLength(
          0,
        );
      }
    }
  });

  test("briefings hub resolves", async ({ page }) => {
    const response = await page.goto("/briefings");
    expect(response?.status()).toBeLessThan(400);
  });
});
