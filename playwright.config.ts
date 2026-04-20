import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "./build-artifacts/playwright-report" }],
    ["json", { outputFile: "./build-artifacts/test-results/results.json" }],
  ],
  outputDir: "./build-artifacts/test-results",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "cd ../unified-trading-api && CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local DISABLE_AUTH=true .venv/bin/uvicorn unified_trading_api.main:create_app --factory --host 0.0.0.0 --port 8030",
      url: "http://localhost:8030/health",
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "echo 'UI server running on 3100'",
      url: "http://localhost:3100",
      reuseExistingServer: true,
      timeout: 5000,
    },
  ],
});
