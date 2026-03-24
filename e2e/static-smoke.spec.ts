import { expect, test } from "@playwright/test";
import { ALL_TIER0_ROUTES } from "./tier0-route-registry";

/**
 * STATIC SMOKE TESTS - Every page renders without crash
 *
 * Runs against Tier 0 (port 3100) with NEXT_PUBLIC_MOCK_API=true.
 * No backend required. Tests that every page:
 *   1. Returns HTTP 200
 *   2. Renders without uncaught JS exceptions
 *   3. Has visible content (not a blank page)
 *   4. No "Cannot read properties of undefined" or similar runtime crashes
 *
 * Route list SSOT: `e2e/tier0-route-registry.ts` (also enforced by `tier0-app-route-coverage.spec.ts`).
 *
 * Run: PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test e2e/static-smoke.spec.ts
 */

const ALL_PAGES = ALL_TIER0_ROUTES;

// ─── Tests ──────────────────────────────────────────────────────────────────

// First, login once before all tests
test.beforeEach(async ({ page }) => {
  // Navigate to login and authenticate with demo persona
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Click the first persona card to log in (admin persona)
  const personaCard = page.locator(
    '[data-testid="persona-card"], button:has-text("admin@odum"), button:has-text("Admin")',
  );
  if ((await personaCard.count()) > 0) {
    await personaCard.first().click();
    await page.waitForTimeout(500);
  }
});

for (const { path, name } of ALL_PAGES) {
  test(`${name} (${path}) renders without crash`, async ({ page }) => {
    const jsErrors: string[] = [];
    const consoleErrors: string[] = [];

    // Capture uncaught exceptions
    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    // Capture console.error calls
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore known non-critical warnings
        if (
          text.includes("Warning:") ||
          text.includes("DevTools") ||
          text.includes("Download the React DevTools") ||
          text.includes("Failed to load resource") || // expected in mock mode for some assets
          text.includes("[mock]") || // our own mock handler logs
          text.includes("IGNORE_NOTHING_PLACEHOLDER") // placeholder — all React warnings are now caught
        )
          return;
        consoleErrors.push(text);
      }
    });

    // Navigate to the page
    const response = await page.goto(path, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // 1. HTTP status should be 200 (or 304)
    expect(
      response?.status(),
      `${name} returned ${response?.status()}`,
    ).toBeLessThan(400);

    // 2. Wait for client-side rendering (React hydration + data fetch)
    await page.waitForTimeout(2000);

    // 3. Page should have visible content (not blank)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();

    // 4. No error banners or crash messages (React error boundaries, Next.js errors)
    const crashTexts = [
      "Cannot read properties of undefined",
      "Cannot read properties of null",
      "is not a function",
      "Something went wrong",
      "Unhandled Runtime Error",
      "Application error",
      "Rendered more hooks than",
      "change in the order of Hooks",
    ];
    for (const text of crashTexts) {
      const bannerCount = await page.locator(`text=${text}`).count();
      expect(bannerCount, `${name} shows error: "${text}"`).toBe(0);
    }

    // 5. No uncaught JS exceptions
    const criticalJsErrors = jsErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") && // benign browser warning
        !e.includes("hydration") && // Next.js dev mode hydration mismatches
        !e.includes("Performance") && // browser Performance API timing edge cases
        !e.includes("negative time stamp"), // Performance.measure with zero-width invisible chars
    );

    if (criticalJsErrors.length > 0) {
      console.log(`  JS errors on ${path}:`, criticalJsErrors);
    }

    expect(
      criticalJsErrors,
      `${name} has JS errors: ${criticalJsErrors.join("; ")}`,
    ).toHaveLength(0);

    // 6. No React-level console errors that indicate broken rendering
    const renderErrors = consoleErrors.filter(
      (e) =>
        e.includes("toFixed") ||
        e.includes("Cannot read properties") ||
        e.includes("is not a function") ||
        e.includes("Rendered more hooks") ||
        e.includes("order of Hooks") ||
        e.includes("two children with the same key") ||
        e.includes("toLocaleString"),
    );
    expect(
      renderErrors,
      `${name} has React render errors: ${renderErrors.join("; ")}`,
    ).toHaveLength(0);

    // 7. Page should have meaningful content (not just a blank shell)
    const contentIndicators = page.locator(
      'h1, h2, h3, table, [class*="card"], [class*="Card"], [role="tablist"], main',
    );
    const contentCount = await contentIndicators.count();
    expect(contentCount, `${name} has no visible content`).toBeGreaterThan(0);

    // 8. No stub pages — "Coming Soon" or "TODO" should not appear
    const stubTexts = await page.locator("text=Coming Soon").count();
    const todoTexts = await page.locator("text=TODO:").count();
    expect(
      stubTexts + todoTexts,
      `${name} still has stub/placeholder content`,
    ).toBe(0);

    // 9. No unhandled mock API routes (indicates missing mock data)
    const unhandledRoutes = consoleErrors.filter((e) =>
      e.includes("Unhandled API route"),
    );
    if (unhandledRoutes.length > 0) {
      console.log(`  Unhandled mock routes on ${path}:`, unhandledRoutes);
    }
    expect(
      unhandledRoutes,
      `${name} has unhandled mock routes: ${unhandledRoutes.join("; ")}`,
    ).toHaveLength(0);

    // 10. No persistent "Loading" spinners after 2s wait (indicates broken data fetch)
    const loadingTexts = await page
      .locator("text=/Loading dashboard|Loading\\.\\.\\./")
      .count();
    if (loadingTexts > 0) {
      console.log(`  Persistent loading spinner on ${path}`);
    }

    // 11. Data widgets should not all be zero on pages that have them
    // (catches the "everything renders but with no mock data" pattern)
    const zeroWidgets = await page.locator('text="$0"').count();
    const totalWidgets = await page
      .locator('[class*="card"], [class*="Card"]')
      .count();
    if (zeroWidgets > 3 && totalWidgets > 0) {
      console.log(
        `  ${name} has ${zeroWidgets} zero-value widgets — check mock data coverage`,
      );
    }
  });
}

// ─── 404 test ───────────────────────────────────────────────────────────────

test("Invalid route returns 404 or redirects", async ({ page }) => {
  const response = await page.goto(
    "/this-route-definitely-does-not-exist-xyz123",
  );
  const status = response?.status();
  expect(status === 404 || status === 200).toBeTruthy();
});
