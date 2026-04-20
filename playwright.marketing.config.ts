import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke: public marketing routes against an already-running server.
 *
 * **Recommended (reliable shadow + hydration):** production server after a build — avoids dev
 * HMR/WebSocket issues that can leave the marketing client boundary stuck without hydrating:
 *   `pnpm exec next build && NEXT_PUBLIC_MOCK_API=false pnpm exec next start -p 3011`
 *   `MARKETING_TEST_URL=http://127.0.0.1:3011 pnpm exec playwright test tests/e2e/marketing-public-shell.spec.ts --config playwright.marketing.config.ts`
 *
 * **Dev:** `pnpm dev` uses webpack (`next dev --webpack`) for reliable marketing shadow hydration.
 *   `NEXT_PUBLIC_MOCK_API=false pnpm dev --port 3010`
 * Use `pnpm dev:turbo` only if you explicitly want Turbopack; if shadow assertions flake, use `next start` as above.
 *
 * Shadow marketing HTML exposes `data-testid="marketing-static-host"` and
 * `data-marketing-shadow="ready"` once the open shadow root is attached (for Playwright / MCP).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["marketing-public-shell.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.MARKETING_TEST_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3010",
    viewport: { width: 1440, height: 900 },
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
