import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    pool: "forks", // Prevent zombie node processes
    setupFiles: [],
    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "__tests__/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/.git/**", "**/.next/**", "tests/e2e/**"],
    coverage: {
      reporter: ["text", "json-summary"],
      // Default dir (./coverage) — the canonical quality-gates-base/base-ui.sh
      // reads `coverage/coverage-summary.json` for the MIN_UI_COVERAGE floor
      // check; keeping vitest's default here lets the shared gate work
      // without per-repo patches.
    },
  },
});
