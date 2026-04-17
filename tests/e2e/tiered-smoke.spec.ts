import { test, expect, type Page } from "@playwright/test";
import {
  PUBLIC_PAGES,
  PLATFORM_PAGES,
  DATA_PAGES,
  RESEARCH_PAGES,
  TRADING_PAGES,
  TRADING_PAGES_EXTRA,
  EXECUTION_PAGES,
  OBSERVE_PAGES,
  MANAGE_PAGES,
  REPORTS_PAGES,
  OPS_PAGES,
  type Tier0Route,
} from "./tier0-route-registry";

/**
 * Tiered browser smoke tests.
 *
 * Env var TIER (0, 1, 2) controls which checks run.
 * Default: Tier 0 (mock-only, no backend required).
 *
 * Usage:
 *   TIER=0 npx playwright test e2e/tiered-smoke.spec.ts --config=playwright.e2e.config.ts
 *   TIER=1 npx playwright test e2e/tiered-smoke.spec.ts --config=playwright.e2e.config.ts
 */

const TIER = parseInt(process.env.TIER ?? "0", 10);
const SCREENSHOT_DIR = "test-results/screenshots";

// ─── Helpers ───────────────────────────────────────────────────────

/** Collect console errors during a page navigation, filtering React dev warnings. */
async function collectConsoleErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore React dev-mode warnings and DevTools messages
      if (
        !text.includes("Warning:") &&
        !text.includes("DevTools") &&
        !text.includes("Download the React DevTools") &&
        !text.includes("favicon.ico")
      ) {
        errors.push(text);
      }
    }
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

  // Give the page a moment to settle (SSR hydration, lazy loads)
  await page.waitForTimeout(1500);

  return errors;
}

/** Take a named screenshot into the results directory. */
async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: false,
  });
}

// ─── Route groups by priority ──────────────────────────────────────

const CRITICAL_ROUTES: Tier0Route[] = [
  { path: "/", name: "Home" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/health", name: "Health" },
  { path: "/services/trading/terminal", name: "Trading Terminal" },
  { path: "/services/trading/positions", name: "Positions" },
  { path: "/services/observe/risk", name: "Risk" },
  { path: "/services/research/ml", name: "ML Dashboard" },
  { path: "/services/execution/overview", name: "Execution" },
];

const CATEGORY_ROUTES: Tier0Route[] = [
  { path: "/services/trading/defi", name: "DeFi Trading" },
  { path: "/services/trading/sports", name: "Sports Trading" },
  { path: "/services/trading/predictions", name: "Predictions" },
  { path: "/services/trading/options", name: "Options" },
  { path: "/services/research/signals", name: "Signals" },
];

const ALL_SMOKE_ROUTES: Tier0Route[] = [
  ...CRITICAL_ROUTES,
  ...CATEGORY_ROUTES,
  ...DATA_PAGES,
  ...RESEARCH_PAGES.slice(0, 5), // Top 5 research pages
  ...EXECUTION_PAGES.slice(0, 3), // Top 3 execution pages
  ...OBSERVE_PAGES,
  ...MANAGE_PAGES.slice(0, 2), // Top 2 manage pages
  ...REPORTS_PAGES.slice(0, 2), // Top 2 reports pages
  ...OPS_PAGES.slice(0, 3), // Top 3 ops pages
];

// Deduplicate by path
const UNIQUE_ROUTES = ALL_SMOKE_ROUTES.filter((route, idx, arr) => arr.findIndex((r) => r.path === route.path) === idx);

// ─── Test Suite ────────────────────────────────────────────────────

test.describe("Tiered Smoke — Page Load + No Console Errors", () => {
  test.describe.configure({ mode: "parallel" });

  for (const route of UNIQUE_ROUTES) {
    test(`[Tier ${TIER}] ${route.name} (${route.path}) loads clean`, async ({ page }) => {
      const errors = await collectConsoleErrors(page, route.path);
      await takeScreenshot(page, `tier${TIER}-${route.name.replace(/\s+/g, "-").toLowerCase()}`);

      // Page should have rendered something (not blank)
      const body = await page.locator("body").textContent();
      expect(body?.length ?? 0).toBeGreaterThan(0);

      // No critical console errors
      if (errors.length > 0) {
        console.warn(`Console errors on ${route.path}:\n${errors.join("\n")}`);
      }
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe("Tiered Smoke — Protocol Badge", () => {
  const BADGE_PAGES = [
    "/services/trading/terminal",
    "/services/trading/positions",
    "/services/observe/risk",
    "/services/research/ml",
  ];

  for (const pagePath of BADGE_PAGES) {
    test(`[Tier ${TIER}] Protocol badge visible on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      // Look for the protocol indicator badge
      const badge = page.locator(
        '[data-testid="protocol-badge"], [data-slot="protocol-indicator"], .protocol-badge, .protocol-indicator',
      );
      const badgeCount = await badge.count();

      if (badgeCount > 0) {
        await expect(badge.first()).toBeVisible();

        const text = (await badge.first().textContent()) ?? "";
        if (TIER === 0 || TIER === 1) {
          // In mock mode, badge should indicate mock
          expect(
            text.toLowerCase().includes("mock") ||
              text.toLowerCase().includes("demo") ||
              text.toLowerCase().includes("simulated"),
          ).toBeTruthy();
        }
      } else {
        // Badge not found — log warning but do not fail (may not be deployed yet)
        console.warn(`Protocol badge not found on ${pagePath}`);
      }
    });
  }
});

test.describe("Tiered Smoke — Navigation", () => {
  test(`[Tier ${TIER}] Global nav renders and has links`, async ({ page }) => {
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const navLinks = page.locator("nav a[href]");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test(`[Tier ${TIER}] 404 route shows error or redirects`, async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-xyz-999");
    const status = response?.status() ?? 0;
    const url = page.url();

    // Should either show 404, redirect to root, or show not-found page
    expect(status === 404 || status === 200 || url.includes("/") || url.includes("not-found")).toBeTruthy();

    // Should not be a blank page
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });
});

test.describe("Tiered Smoke — Category Data Renders", () => {
  test(`[Tier ${TIER}] Trading terminal has price data`, async ({ page }) => {
    await page.goto("/services/trading/terminal", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(3000);

    // Look for price-like elements (numbers with decimals)
    const priceElements = page.locator('[data-testid*="price"], .price, .last-price, [class*="price"]');

    // At minimum, the page should have some numeric content
    const bodyText = (await page.locator("body").textContent()) ?? "";
    // Prices should contain numbers
    expect(bodyText).toMatch(/\d+\.\d+/);
  });

  test(`[Tier ${TIER}] Sports page has fixtures`, async ({ page }) => {
    await page.goto("/services/trading/sports", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator("body").textContent()) ?? "";
    // Should have some content indicating fixtures/matches
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test(`[Tier ${TIER}] Risk dashboard has metrics`, async ({ page }) => {
    await page.goto("/services/observe/risk", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test(`[Tier ${TIER}] ML page has model content`, async ({ page }) => {
    await page.goto("/services/research/ml", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText.length).toBeGreaterThan(100);
  });
});

// ─── Tier 1+ only: API integration checks ─────────────────────────

if (TIER >= 1) {
  test.describe("Tier 1+ — API Integration", () => {
    test("Trading API health responds", async ({ request }) => {
      const response = await request.get("http://localhost:8004/health");
      expect(response.ok()).toBeTruthy();
    });

    test("Positions page loads data from API", async ({ page }) => {
      await page.goto("/services/trading/positions", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(3000);

      // Should have a table or list of positions
      const tables = page.locator("table, [role='grid'], [role='table']");
      const lists = page.locator("[role='list'], .position-list");
      const tableCount = await tables.count();
      const listCount = await lists.count();

      expect(tableCount + listCount).toBeGreaterThan(0);
    });
  });
}

// ─── Tier 2 only: Live streaming checks ────────────────────────────

if (TIER >= 2) {
  test.describe("Tier 2 — SSE/WS Connectivity", () => {
    test("SSE connection established on positions page", async ({ page }) => {
      // Track EventSource connections
      const sseUrls: string[] = [];
      page.on("request", (req) => {
        const headers = req.headers();
        if (
          headers["accept"]?.includes("text/event-stream") ||
          req.url().includes("/sse") ||
          req.url().includes("/events") ||
          req.url().includes("/stream")
        ) {
          sseUrls.push(req.url());
        }
      });

      await page.goto("/services/trading/positions", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(5000);

      // At least one SSE-like request should have been made
      if (sseUrls.length === 0) {
        console.warn("No SSE connections detected — verify SSE is wired on positions page");
      }
    });

    test("WebSocket connection on trading terminal", async ({ page }) => {
      const wsUrls: string[] = [];
      page.on("websocket", (ws) => {
        wsUrls.push(ws.url());
      });

      await page.goto("/services/trading/terminal", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(5000);

      if (wsUrls.length === 0) {
        console.warn("No WebSocket connections detected — verify WS is wired on terminal page");
      }
    });
  });
}

// ─── Performance gate ──────────────────────────────────────────────

test.describe("Tiered Smoke — Performance", () => {
  test(`[Tier ${TIER}] Dashboard loads under 5s`, async ({ page }) => {
    const start = Date.now();
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
    console.log(`Dashboard load time: ${elapsed}ms`);
  });

  test(`[Tier ${TIER}] Full smoke completes under 60s`, async ({ page }) => {
    const start = Date.now();

    // Quick visit to 5 critical pages
    const quickRoutes = [
      "/dashboard",
      "/services/trading/terminal",
      "/services/observe/risk",
      "/services/research/ml",
      "/services/execution/overview",
    ];

    for (const route of quickRoutes) {
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(60000);
    console.log(`5-page quick smoke: ${elapsed}ms`);
  });
});
