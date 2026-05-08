import { expect, test } from "@playwright/test";
import { clearPersona } from "../seed-persona";

/**
 * Refactor G1.12 — Public-site IA + briefings polish.
 *
 * Walks the canonical click-path for an anonymous visitor across the nine public
 * pages and the three briefing slug pages. Assertions:
 *
 * 1. Every public page renders the consolidated `<SiteHeader>` — identified by
 *    `[data-shell="site-header"]`.
 * 2. Every `/briefings/*` page (hub + three slug pages) renders a `<BriefingHero>`
 *    — identified by `[data-briefing-hero]`.
 * 3. No LOCKED-VISIBLE service tile appears on public surfaces (G1.3 LOCKED-VISIBLE
 *    is for gated surfaces only).
 * 4. Visibility-slicing formula vs G1.6 `access_control` — stubbed until G1.6
 *    ships. An anonymous visitor should only ever reach public surfaces.
 * 5. Orphan-reachability — every public page is reachable from the main nav.
 *
 * Plan: plans/active/refactor_g1_12_public_site_ia_and_briefings_polish_2026_04_20.plan
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/experience/marketing-journey.md
 *             unified-trading-pm/codex/14-playbooks/experience/briefings-hub.md
 */

const PUBLIC_PAGES = [
  "/",
  "/investment-management",
  "/platform",
  "/regulatory",
  "/who-we-are",
  "/contact",
  "/demo",
  "/signup",
  "/login",
] as const;

const BRIEFING_PAGES = [
  "/briefings",
  "/briefings/investment-management",
  "/briefings/platform",
  "/briefings/regulatory",
] as const;

test.describe("refactor G1.12 — public-site IA + briefings polish", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    // Clear the light-auth briefings session so the tests exercise the shell
    // consistently. When NEXT_PUBLIC_BRIEFING_ACCESS_CODE is empty (dev/CI
    // default) the gate is open; when set, the gate renders its own minimal
    // page which still carries the SiteHeader via the public layout.
    await page.addInitScript(() => {
      localStorage.removeItem("odum-briefing-session");
    });
  });

  /** Goto with retry — dev servers occasionally drop the first connect under load. */
  async function gotoWithRetry(page: import("@playwright/test").Page, route: string): Promise<number> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
        return response?.status() ?? 0;
      } catch (err) {
        if (attempt === 3) throw err;
        await page.waitForTimeout(1_000 * attempt);
      }
    }
    return 0;
  }

  test("every public page renders the consolidated SiteHeader shell", async ({ page }) => {
    for (const route of PUBLIC_PAGES) {
      const status = await gotoWithRetry(page, route);
      expect(status, `${route} must not 4xx/5xx`).toBeLessThan(400);
      const shell = page.locator('[data-shell="site-header"]').first();
      await expect(shell, `${route} must render [data-shell="site-header"]`).toBeAttached({ timeout: 20_000 });
    }
  });

  test("every /briefings/* page renders BriefingHero + SiteHeader", async ({ page }) => {
    for (const route of BRIEFING_PAGES) {
      const status = await gotoWithRetry(page, route);
      expect(status, `${route} must not 4xx/5xx`).toBeLessThan(400);

      const shell = page.locator('[data-shell="site-header"]').first();
      await expect(shell, `${route} must render SiteHeader`).toBeAttached({ timeout: 20_000 });

      const hero = page.locator("[data-briefing-hero]").first();
      await expect(hero, `${route} must render [data-briefing-hero]`).toBeVisible({ timeout: 20_000 });

      // Single primary CTA within the hero — rule 02 "one CTA above the fold".
      const cta = hero.locator('[data-testid="briefing-primary-cta"]');
      await expect(cta, `${route} hero must expose a single primary CTA`).toHaveCount(1);
    }
  });

  test("public pages do not expose LOCKED-VISIBLE service tiles", async ({ page }) => {
    // G1.3 LOCKED-VISIBLE is a gated-surface pattern; public surfaces never carry it.
    for (const route of PUBLIC_PAGES) {
      await gotoWithRetry(page, route);
      const locked = page.locator('[data-locked-visible="true"]');
      await expect(locked, `${route} must not render [data-locked-visible]`).toHaveCount(0);
    }
  });

  test("visibility-slicing — anon stays on public surfaces (G1.6 stub)", async ({ page }) => {
    // Until G1.6 `access_control` lands, stub the check: an anonymous visitor
    // navigating the canonical public click-path should never see a forced
    // redirect to an authenticated route. If G1.6 later adds a formal
    // access_control formula, this test upgrades to consume it.
    for (const route of [...PUBLIC_PAGES, ...BRIEFING_PAGES]) {
      const status = await gotoWithRetry(page, route);
      expect(status, `${route} must not 4xx/5xx for anon`).toBeLessThan(400);
      const finalUrl = new URL(page.url());
      // Anon should remain on the requested path (allowing for trailing slash).
      expect(finalUrl.pathname.replace(/\/$/, "") || "/", `${route} must not redirect anon off-path`).toBe(
        route.replace(/\/$/, "") || "/",
      );
    }
  });

  test("orphan-reachability — every public page is linked from the main nav", async ({ page }) => {
    await gotoWithRetry(page, "/");
    const shell = page.locator('[data-shell="site-header"]').first();
    await expect(shell).toBeAttached({ timeout: 20_000 });

    // Every non-auth public page should be reachable from the header nav or its
    // Spaces dropdown. Auth-entry pages (/signup, /login) are reachable via the
    // right-hand CTA block; /demo, /briefings/* are reached via the Spaces
    // dropdown or content links. Assert at least one anchor exists per route.
    const navReachable = [
      "/",
      "/investment-management",
      "/platform",
      "/regulatory",
      "/who-we-are",
      "/contact",
      "/login",
      "/signup",
    ] as const;

    for (const route of navReachable) {
      const anchor = page.locator(`header a[href='${route}']`).first();
      await expect(anchor, `${route} must be linked from the site header`).toBeAttached();
    }
  });
});
