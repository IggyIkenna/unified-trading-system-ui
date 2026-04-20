import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for running against an already-running dev server.
 * Usage: npx playwright test --config=playwright.e2e.config.ts
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30000,
  outputDir: "./build-artifacts/test-results",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // No webServer — expects dev server already running
});
