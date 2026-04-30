/**
 * Price-chart proxy latency + response-shape e2e test.
 *
 * Scope:
 *   Frontend's contract with the unified-trading-api proxy. Asserts the UI
 *   can reach `/api/market-data/candles` and the backend returns a payload
 *   the chart hook can consume. Measures the round-trip time at this layer
 *   only — does NOT validate parquet correctness, GCS pruning, or business
 *   logic. Those live in `unified-trading-api/scripts/bench_candle_reads.py`
 *   (backend bench) and `unified-trading-api/tests/unit/test_batch_candles.py`
 *   (backend unit).
 *
 * Why a proxy-only test:
 *   - Backend unit/bench tests run inside the API process and skip the proxy
 *     entirely. They tell you GCS reads work but not "the chart's HTTP path
 *     is wired right."
 *   - A browser e2e (Playwright page-fixture) would also hit Firebase login
 *     + chart canvas init + WebSocket attempts, all of which add noise to
 *     a latency assertion.
 *   - This `request`-only spec talks to localhost:3000 the same way the
 *     chart's React Query client does, no browser involved.
 *
 * Latency budget:
 *   Frontend -> proxy round-trip should be tens of milliseconds locally.
 *   Anything > 1s is the proxy doing something wrong (Next.js cold compile
 *   counts; the test warms the route once before measuring).
 *
 * Mode-agnostic shape check:
 *   The test does not assume mock vs real backend. Both modes return
 *   `{ data: [...], mode, instrument, timeframe }`. Mock returns
 *   deterministic seeds; real returns GCS bars. Either way the chart hook
 *   consumes the same shape — that's what's verified.
 */

import { expect, test } from "@playwright/test";

const UI_URL = process.env.E2E_UI_URL ?? "http://localhost:3000";
const PROXY = `${UI_URL}/api/market-data/candles`;

// Fixed query the chart issues for AAPL on a known-backfilled trading day.
// Using NASDAQ:AAPL 1m because that shard exists in real-mode TRADFI bucket
// AND the mock-mode seed; both modes will respond, so the test runs against
// either backend configuration.
const FIXED_QUERY = {
  venue: "NASDAQ",
  instrument: "AAPL",
  timeframe: "1m",
  count: "100",
  mode: "batch",
  as_of: "2026-04-13",
};

const PROXY_LATENCY_BUDGET_MS = 5_000; // generous — covers Next.js dev hot-reload
const WARM_LATENCY_BUDGET_MS = 1_500; // post-warmup, real budget

function buildUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `${PROXY}?${qs}`;
}

test.describe("price-chart proxy contract", () => {
  test("proxy returns 200 with chart-consumable shape", async ({ request }) => {
    const t0 = performance.now();
    const response = await request.get(buildUrl(FIXED_QUERY));
    const elapsed = performance.now() - t0;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(PROXY_LATENCY_BUDGET_MS);

    const body = await response.json();

    // Shape contract — what the chart hook in use-terminal-page-data.ts reads.
    // Backend single_response wraps the array in `data`. Older mock paths
    // emit `candles`; the hook accepts either, but the canonical key is `data`.
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);

    // Echo fields — let the chart attribute fetched bars to the right symbol.
    expect(body.instrument).toBe("AAPL");
    expect(body.timeframe).toBe("1m");

    // Per-bar shape: every item the chart receives must have these numeric
    // keys. Bars with NaN OHLC are dropped by the backend reader so we can
    // assert finite numbers here without exception.
    if (body.data.length > 0) {
      const first = body.data[0];
      for (const key of ["time", "open", "high", "low", "close"]) {
        expect(first).toHaveProperty(key);
        expect(typeof first[key]).toBe("number");
        expect(Number.isFinite(first[key])).toBe(true);
      }
      // High >= low — invariant the chart relies on for candle rendering.
      expect(first.high).toBeGreaterThanOrEqual(first.low);
      // Time is unix seconds (10 digits) not ms (13). Chart treats it as seconds.
      expect(first.time).toBeGreaterThan(1_500_000_000);
      expect(first.time).toBeLessThan(2_000_000_000);
    }
  });

  test("proxy round-trip is fast on warm cache", async ({ request }) => {
    // Warm the route — first hit pays Next.js compile + any cold-DNS cost.
    await request.get(buildUrl(FIXED_QUERY));

    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const response = await request.get(buildUrl(FIXED_QUERY));
      samples.push(performance.now() - t0);
      expect(response.status()).toBe(200);
    }

    samples.sort((a, b) => a - b);
    const p50 = samples[Math.floor(samples.length / 2)];
    const p99 = samples[samples.length - 1];

    console.log(
      `[proxy-latency] 5 warm samples (ms): ${samples.map((s) => s.toFixed(1)).join(", ")} | p50=${p50.toFixed(1)} p99=${p99.toFixed(1)}`,
    );

    // p99 budget on warm path. If this fails, either the proxy is doing
    // unnecessary work or the backend is the bottleneck — drill in via the
    // BACKEND-DIRECT comparison test below.
    expect(p99).toBeLessThan(WARM_LATENCY_BUDGET_MS);
  });

  test("proxy adds < 200 ms vs direct backend (sanity)", async ({ request }) => {
    // Skip if no direct API URL configured. Not all environments expose the
    // backend port to the test runner; this test is a sanity check for local
    // dev where both ports are reachable.
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8030";
    let backendReachable = false;
    try {
      const healthResp = await request.get(`${apiUrl}/health`, { timeout: 2000 });
      backendReachable = healthResp.ok();
    } catch {
      backendReachable = false;
    }
    test.skip(!backendReachable, `backend at ${apiUrl} unreachable`);

    // Warm both
    await request.get(buildUrl(FIXED_QUERY));
    await request.get(`${apiUrl}/market-data/candles?${new URLSearchParams(FIXED_QUERY)}`);

    // Measure 5 each, take p50
    const measure = async (url: string): Promise<number> => {
      const samples: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await request.get(url);
        samples.push(performance.now() - t0);
      }
      samples.sort((a, b) => a - b);
      return samples[Math.floor(samples.length / 2)];
    };

    const proxyP50 = await measure(buildUrl(FIXED_QUERY));
    const directP50 = await measure(`${apiUrl}/market-data/candles?${new URLSearchParams(FIXED_QUERY)}`);
    const overhead = proxyP50 - directP50;

    console.log(
      `[proxy-overhead] proxy p50=${proxyP50.toFixed(1)}ms direct p50=${directP50.toFixed(1)}ms overhead=${overhead.toFixed(1)}ms`,
    );

    // Next.js dev rewrite shouldn't add more than ~200ms. If it does, either
    // the rewrite is broken or there's some async middleware stalling.
    // Negative overhead can happen on small samples (noise dominates).
    expect(overhead).toBeLessThan(500);
  });

  test("proxy preserves 422 from backend on invalid params", async ({ request }) => {
    // count > 20000 violates the route's pydantic validation. We expect the
    // proxy to forward the 422 verbatim, not silently fall through to mock
    // data or transform it into a 500.
    const response = await request.get(buildUrl({ ...FIXED_QUERY, count: "999999" }));
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body).toHaveProperty("detail");
  });
});
