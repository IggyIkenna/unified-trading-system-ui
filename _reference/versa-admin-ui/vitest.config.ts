import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "forks",
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      ["packages/*/src/**/*.test.tsx", "jsdom"],
      ["packages/*/src/**/*.spec.tsx", "jsdom"],
      ["packages/core/src/index.test.ts", "jsdom"],
      ["tests/integration/**/*.integration.test.tsx", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json-summary", "text"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: [
        "packages/core/src/**/*.ts",
        "packages/batch-audit/src/**/*.tsx",
        "packages/batch-audit/src/**/*.ts",
      ],
      exclude: [
        "packages/*/src/**/*.test.ts",
        "packages/*/src/**/*.spec.ts",
        "packages/*/src/**/*.test.tsx",
        "packages/*/src/**/*.spec.tsx",
        "packages/*/src/main.tsx",
        "packages/*/src/vite-env.d.ts",
        "packages/*/src/setupTests.ts",
        "packages/*/src/index.css",
      ],
    },
  },
});
