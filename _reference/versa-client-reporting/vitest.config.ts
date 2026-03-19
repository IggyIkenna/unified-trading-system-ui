import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    pool: "forks",
    teardownTimeout: 5000,
    setupFiles: ["./src/setupTests.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/integration/**/*.integration.test.{ts,tsx}",
    ],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/setupTests.ts",
        "src/lib/mock-api.ts",
        "playwright.config.ts",
        "dist/**",
        "e2e/**",
        "tests/**",
        "*.config.{ts,js,cjs}",
        ".eslintrc.cjs",
        "src/**/*.test.{ts,tsx}",
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
