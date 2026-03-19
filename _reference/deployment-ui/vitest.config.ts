import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      react: path.resolve("node_modules/react"),
      "react-dom": path.resolve("node_modules/react-dom"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.integration.test.{ts,tsx}",
    ],
    // Use forks pool to avoid memory issues with V8 coverage on macOS
    // (threads pool causes SIGURG/exit-144 when all 178 tests run with coverage)
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: [
        // Build output (not source code)
        "dist/**",
        // Entry points and config
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/setupTests.ts",
        "src/lib/mock-api.ts",
        "playwright.config.ts",
        "vite.config.ts",
        "vitest.config.ts",
        "*.config.{ts,js,cjs}",
        "src/*.config.{ts,js}",
        "eslint.config.js",
        // Test files themselves
        "src/**/*.test.{ts,tsx}",
        "tests/**",
        // Auth flows (OAuth/Cognito - integration tested, not unit)
        "src/auth/**",
        // Pages (router-driven, tested via e2e/smoke)
        "src/pages/**",
        // React hooks (async fetch hooks - tested via component integration)
        "src/hooks/**",
        // Large visualization components (complex UI - tested via e2e/smoke)
        "src/components/DataStatusTab.tsx",
        "src/components/DeploymentDetails.tsx",
        "src/components/ExecutionDataStatus.tsx",
        "src/components/ServiceDetails.tsx",
        "src/components/ServiceStatusTab.tsx",
        "src/components/HeatmapCalendar.tsx",
        "src/components/ReadinessTab.tsx",
        "src/components/ServicesOverviewTab.tsx",
        "src/components/DeploymentResult.tsx",
        "src/components/CloudBuildsTab.tsx",
        "src/components/CloudConfigBrowser.tsx",
        // Complex multi-handler form components (covered by e2e tests)
        "src/components/DeployForm.tsx",
        "src/components/DeploymentHistory.tsx",
        "src/App.tsx",
        // Radix UI dialog (complex portal component)
        "src/components/ui/dialog.tsx",
        // Barrel type exports
        "src/types/index.ts",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
