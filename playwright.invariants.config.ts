import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for static structural invariant tests.
 * No webServer required — tests use readFileSync/execSync only, no page navigation.
 *
 * Used by quality-gates.sh [2.6] ENVIRONMENT MODE INVARIANTS gate.
 *
 * Run: npx playwright test tests/e2e/environment-mode-invariants.spec.ts
 *        --config playwright.invariants.config.ts --project=chromium
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["environment-mode-invariants.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  // No webServer — these tests read the filesystem, not the browser
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Desktop Chrome"],
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
});
