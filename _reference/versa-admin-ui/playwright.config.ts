import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./packages",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : 4,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace=packages/batch-audit -- --port 5182",
      url: "http://localhost:5182",
      reuseExistingServer: !process.env["CI"],
      env: { VITE_MOCK_API: "true" },
    },
    {
      command: "npm run dev --workspace=packages/deployment -- --port 5183",
      url: "http://localhost:5183",
      reuseExistingServer: !process.env["CI"],
      env: { VITE_MOCK_API: "true", VITE_SKIP_AUTH: "true" },
    },
  ],
});
