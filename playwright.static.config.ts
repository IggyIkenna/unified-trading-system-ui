import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for static smoke tests (Tier 0).
 * Expects the UI to already be running on port 3100 via:
 *   bash scripts/dev-tiers.sh --tier 0
 *
 * Run: npx playwright test --config playwright.static.config.ts
 *
 * Route-registry-only (no dev server): PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npx playwright test e2e/tier0-app-route-coverage.spec.ts --config playwright.static.config.ts
 */
export default defineConfig({
  globalSetup: "./tests/e2e/warmup.setup.ts",
  testDir: "./tests/e2e",
  testMatch: ["static-smoke.spec.ts", "tier0-app-route-coverage.spec.ts", "tier0-behavior-audit.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 3,
  timeout: 30000,
  reporter: [["list"], ["json", { outputFile: "./build-artifacts/test-results/static-smoke-results.json" }]],
  outputDir: "./build-artifacts/test-results",
  use: {
    baseURL: "http://localhost:3100",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer — expects tier 0 already running
});
