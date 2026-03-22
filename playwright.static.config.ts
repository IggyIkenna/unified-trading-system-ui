import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for static smoke tests (Tier 0).
 * Expects the UI to already be running on port 3100 via:
 *   bash scripts/dev-tiers.sh --tier 0
 *
 * Run: npx playwright test --config playwright.static.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'static-smoke.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  timeout: 20000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/static-smoke-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — expects tier 0 already running
})
