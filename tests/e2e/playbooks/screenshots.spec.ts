import { expect, test } from "@playwright/test";
import { seedPersona, clearPersona } from "./seed-persona";

/**
 * Screenshots spec — generates the presentation assets for
 *   unified-trading-pm/codex/14-playbooks/presentations/target-experience-post-refactor.md
 *
 * Run standalone to produce PNG fixtures, then copy into the PM repo's
 * codex/14-playbooks/presentations/screenshots/ directory.
 *
 * Viewport locked at 1280 × 720 (standard presentation asset size).
 *
 * Each test:
 *   1. Seeds the persona (or clears to simulate anonymous),
 *   2. Navigates to the target route,
 *   3. Waits for the page to settle (network-idle or a visible landmark),
 *   4. Emits a screenshot named <persona>-<route-slug>.png under test-results/.
 *
 * Mapping back to Stage 3D slides:
 *   slide 11 — anonymous homepage  → anon-home.png
 *   slide 12 — briefings hub       → prospect-im-briefings.png
 *   slide 13 — persona dashboards  → admin-dashboard.png, client-full-dashboard.png,
 *                                    prospect-im-dashboard.png
 *   slide 14 — strategy catalogue  → admin-strategy-catalogue.png
 *                                    prospect-im-reports-overview.png
 *
 * Deliberately does NOT use Playwright's built-in visual-regression compare —
 * these are presentation assets, not assertions. We only assert the page
 * renders without a hard 4xx/5xx so the screenshot is meaningful.
 */

const VIEWPORT = { width: 1280, height: 720 };

test.use({ viewport: VIEWPORT });

test.describe("screenshots — pb1 anonymous marketing", () => {
  test("anonymous homepage", async ({ page }) => {
    await clearPersona(page);
    const response = await page.goto("/");
    expect(response?.status(), "/ should render").toBeLessThan(400);
    // Give hero/landing animations a beat to settle.
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/anon-home.png",
      fullPage: false,
    });
  });
});

test.describe("screenshots — pb2 post-light-auth briefings", () => {
  test("briefings hub landing", async ({ page }) => {
    await seedPersona(page, "prospect-im");
    const response = await page.goto("/briefings");
    // /briefings may 404 today (pre-Stage-3E G1 briefings content is in experience/)
    // — fall back to /investor-relations/overview which mirrors the briefing structure.
    if (response && response.status() >= 400) {
      await page.goto("/investor-relations");
      await page.waitForLoadState("networkidle");
    } else {
      await page.waitForLoadState("networkidle");
    }
    await page.screenshot({
      path: "test-results/screenshots/prospect-im-briefings.png",
      fullPage: false,
    });
  });
});

test.describe("screenshots — pb3 per-persona dashboards", () => {
  test("admin dashboard (full universe)", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/dashboard");
    if (response && response.status() >= 400) {
      // Fall back to a canonical landing the admin persona always reaches.
      await page.goto("/services/observe/health");
    }
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard.png",
      fullPage: false,
    });
  });

  test("client-full dashboard (paid DART breadth)", async ({ page }) => {
    await seedPersona(page, "client-full");
    const response = await page.goto("/dashboard");
    if (response && response.status() >= 400) {
      await page.goto("/services/trading/overview");
    }
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/client-full-dashboard.png",
      fullPage: false,
    });
  });

  test("prospect-im dashboard (IM-scoped reporting surface)", async ({ page }) => {
    await seedPersona(page, "prospect-im");
    const response = await page.goto("/dashboard");
    if (response && response.status() >= 400) {
      await page.goto("/services/reports/overview");
    }
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/prospect-im-dashboard.png",
      fullPage: false,
    });
  });
});

test.describe("screenshots — catalogue + reports surfaces", () => {
  test("admin — strategy catalogue master matrix", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/services/strategy-catalogue");
    expect(response?.status(), "catalogue should render for admin").toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/admin-strategy-catalogue.png",
      fullPage: false,
    });
  });

  test("prospect-im — reports overview", async ({ page }) => {
    await seedPersona(page, "prospect-im");
    const response = await page.goto("/services/reports/overview");
    expect(response?.status(), "reports overview should render for prospect-im").toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/screenshots/prospect-im-reports-overview.png",
      fullPage: false,
    });
  });
});
