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
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
    coverage: {
      reporter: ["text", "json-summary"],
    },
  },
});
