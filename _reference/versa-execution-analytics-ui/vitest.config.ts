import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@unified-trading/ui-kit/globals.css": path.resolve(
        __dirname,
        "packages/ui-kit/src/globals.css",
      ),
      "@unified-trading/ui-kit": path.resolve(
        __dirname,
        "packages/ui-kit/src/index.ts",
      ),
      "@unified-trading/ui-auth": path.resolve(
        __dirname,
        "packages/ui-auth/src/index.ts",
      ),
      "@unified-admin/core": path.resolve(
        __dirname,
        "packages/admin-core/src/index.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "forks",
    teardownTimeout: 5000,
    setupFiles: ["./src/setupTests.ts"],
    passWithNoTests: true,
    exclude: ["**/node_modules/**", "**/tests/smoke/**"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.integration.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: [
        "dist/**",
        "*.config.{ts,js,cjs}",
        "eslint.config.js",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/setupTests.ts",
        "src/lib/mock-api.ts",
        "src/**/*.test.{ts,tsx}",
        "e2e/**",
        "tests/**",
        "playwright.config.ts",
        "src/api/types.ts",
        "src/api/deploymentClient.ts",
        "src/api/client.ts",
        "src/pages/AlgorithmComparison.tsx",
        "src/pages/ConfigBrowser.tsx",
        "src/pages/ConfigGenerator.tsx",
        "src/pages/DeepDive.tsx",
        "src/pages/InstructionAvailability.tsx",
        "src/pages/InstrumentDefinitions.tsx",
        "src/pages/LoadResults.tsx",
        "src/pages/MarketTickData.tsx",
        "src/pages/RunBacktest.tsx",
        "src/pages/DeploymentsPage.tsx",
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
