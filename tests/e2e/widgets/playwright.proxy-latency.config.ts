/**
 * Lightweight Playwright config for chart proxy + FE benchmark specs.
 *
 * Both specs hit a running tier-1 stack on :3000 + :8030 — they don't
 * touch GCS, don't need real cloud, just exercise the FE → proxy → backend
 * round-trip.  Mock-mode backend is fine.
 *
 * The default `playwright.config.ts` spins up its own webServer on :3100,
 * so it can't share runtime with these specs without port conflicts.  This
 * config skips webServer entirely and assumes the tier-1 stack is already
 * up.  That's the only reason this config exists; the specs themselves are
 * normal `.spec.ts` files.
 *
 * Run from the UI repo root:
 *
 *   # Contract test — shape + per-call latency budget
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 \
 *     npx playwright test \
 *       --config tests/e2e/widgets/playwright.proxy-latency.config.ts \
 *       price-chart-proxy-latency
 *
 *   # FE benchmark — multi-symbol, multi-window perceived latency.
 *   # Mock-mode backend is fine; numbers represent the FE↔BE round-trip
 *   # only (no GCS).  Backend GCS read latency is measured separately
 *   # by `unified-trading-api/scripts/bench_candle_reads.py`.
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 \
 *     npx playwright test \
 *       --config tests/e2e/widgets/playwright.proxy-latency.config.ts \
 *       price-chart-benchmark
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["price-chart-proxy-latency.spec.ts", "price-chart-benchmark.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  // Per-test timeout 120s — benchmark scenarios can fetch many days serially.
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "off",
  },
  projects: [
    {
      name: "request-only",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
  // No webServer — both specs assume the tier-1 stack is already running.
});
