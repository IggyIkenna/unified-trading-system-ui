import { defineConfig, devices } from "@playwright/test";
import { E2E_CONFIG } from "./tests/e2e/_shared/config";

// When running --project=human we force a single worker + no parallelism so
// you can actually watch one browser at a time instead of 5 windows flickering.
const isHumanMode = process.argv.some((a) => a === "human" || a === "--project=human");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: !isHumanMode,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : isHumanMode ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "./build-artifacts/playwright-report" }],
    ["json", { outputFile: "./build-artifacts/test-results/results.json" }],
  ],
  outputDir: "./build-artifacts/test-results",
  use: {
    baseURL: E2E_CONFIG.baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      // Default CI project — runs everything including widget validation specs.
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: E2E_CONFIG.default.headless,
        launchOptions: { slowMo: E2E_CONFIG.default.slowMo },
      },
    },
    {
      // Widget validation only — headless, fast, no trader workflow noise.
      // Run with: npx playwright test --project=widgets
      name: "widgets",
      testMatch: "**/e2e/widgets/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        launchOptions: { slowMo: 0 },
      },
    },
    {
      // Human demo — trader workflow only, headed, slow-mo, no widget specs.
      // Run with: npx playwright test --project=human tests/e2e/strategies/
      name: "human",
      testIgnore: "**/e2e/widgets/**",
      use: {
        ...devices["Desktop Chrome"],
        headless: E2E_CONFIG.human.headless,
        viewport: E2E_CONFIG.human.viewport,
        launchOptions: {
          slowMo: E2E_CONFIG.human.slowMo,
          args: ["--start-maximized"],
        },
      },
    },
  ],
  // Strategy/mock specs run with NEXT_PUBLIC_MOCK_API=true and don't need the real
  // backend. Set E2E_USE_REAL_API=1 to spin up the unified-trading-api uvicorn too.
  webServer: process.env.E2E_USE_REAL_API
    ? [
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
      ]
    : [
        {
          command: "echo 'UI server running on 3100'",
          url: "http://localhost:3100",
          reuseExistingServer: true,
          timeout: 5000,
        },
      ],
});
