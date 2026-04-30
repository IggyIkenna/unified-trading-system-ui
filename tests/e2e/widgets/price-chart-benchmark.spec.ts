/**
 * Price-chart FE-side benchmark.
 *
 * **CI-safe.**  This spec measures only the FE↔BE round-trip
 * (proxy → backend → JSON parse).  It does NOT touch GCS, does NOT
 * read real cloud data, and runs equivalently against a mock-mode
 * backend.  Sub-second total against mock; safe to run on every CI
 * pipeline that has a tier-1 stack up.
 *
 * The expensive cousin — the **backend GCS benchmark** — lives at
 * `unified-trading-api/scripts/bench_candle_reads.py`.  THAT one is
 * not CI-safe (real cloud reads, ~30s, no assertions) and is gated
 * by living in `scripts/` outside pytest's `testpaths`.  Don't confuse
 * the two.
 *
 * Scope of this file:
 *   - "Click symbol → chart paint" — single-call FE perceived latency
 *     (proxy + parsing + the wait the chart hook actually does).
 *   - "Switch symbol mid-chart" — does the new fetch land cleanly without
 *     leaving stale state from the prior symbol's response?
 *   - "Pan back through 60 days" — sequential N-call coordination from
 *     the FE side. Does the loadMoreCandles loop terminate, advance the
 *     pointer, and merge windows in order?
 *   - "Switch timeframe" — same (symbol, date), different parquet shape.
 *
 * Out of scope (covered elsewhere):
 *   - Real GCS read latency → `unified-trading-api/scripts/bench_candle_reads.py`
 *   - Per-shard parquet correctness → `unified-trading-api/tests/unit/test_batch_candles.py`
 *
 * Run:
 *   bash scripts/dev-tiers.sh --tier 1            # mock backend, fast
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 \
 *     npx playwright test \
 *       --config tests/e2e/widgets/playwright.proxy-latency.config.ts \
 *       price-chart-benchmark
 *
 * Mode-agnostic assertions: shape only ({time, open, high, low, close}
 * all finite, time monotonic across chunks).  NO timing assertions — the
 * test prints latency for the operator and passes regardless.  Mock and
 * real-mode backends both satisfy the shape contract; mock returns empty
 * arrays for symbols not in the seed (still passes — no GCS dependency
 * in this spec).
 */

import { expect, test } from "@playwright/test";

const UI = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PROXY = `${UI}/api/market-data/candles`;

const SYMBOLS: Array<{ venue: string; instrument: string }> = [
  { venue: "NASDAQ", instrument: "AAPL" },
  { venue: "NASDAQ", instrument: "MSFT" },
  { venue: "NASDAQ", instrument: "GOOGL" },
  { venue: "NYSE", instrument: "JPM" },
];

const ANCHOR_DATE = "2026-04-14";

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FetchResult {
  ms: number;
  bars: Bar[];
  ok: boolean;
}

function buildUrl(params: Record<string, string>): string {
  return `${PROXY}?${new URLSearchParams(params).toString()}`;
}

async function fetchBars(
  request: import("@playwright/test").APIRequestContext,
  params: Record<string, string>,
): Promise<FetchResult> {
  const t0 = performance.now();
  const resp = await request.get(buildUrl(params));
  const ms = performance.now() - t0;
  if (!resp.ok()) return { ms, bars: [], ok: false };
  const body = await resp.json();
  const bars = (body?.data ?? []) as Bar[];
  return { ms, bars, ok: true };
}

function assertBarShape(bars: Bar[], context: string): void {
  for (const b of bars) {
    for (const k of ["time", "open", "high", "low", "close"] as const) {
      expect(typeof b[k], `${context}: ${k} must be number`).toBe("number");
      expect(Number.isFinite(b[k]), `${context}: ${k} must be finite`).toBe(true);
    }
    expect(b.high, `${context}: high >= low`).toBeGreaterThanOrEqual(b.low);
  }
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("price-chart FE benchmark — mode-agnostic", () => {
  test.beforeAll(async ({ request }) => {
    // Next.js dev compiles routes lazily on first hit. Without this warmup
    // the first scenario blocks for 20-30s on route compilation, which
    // pollutes every subsequent timing measurement. One throwaway hit
    // pays the compile cost outside any timed test.
    console.log("[warmup] priming Next.js proxy route…");
    const t0 = performance.now();
    await request.get(
      buildUrl({
        venue: "NASDAQ",
        instrument: "AAPL",
        timeframe: "1m",
        count: "1",
        mode: "batch",
        as_of: ANCHOR_DATE,
      }),
      { timeout: 60_000 },
    );
    console.log(`[warmup] proxy ready (${(performance.now() - t0).toFixed(0)} ms)`);
  });

  test("[FE-1] click symbol → chart paint, all 4 symbols, single date", async ({ request }) => {
    // What the chart's first useCandles() call looks like. One call per
    // symbol. Asserts the response shape is what the chart hook expects.
    console.log("\n[FE-1] symbol click — single-call latency, fixed date");
    for (const sym of SYMBOLS) {
      const r = await fetchBars(request, {
        venue: sym.venue,
        instrument: sym.instrument,
        timeframe: "1m",
        count: "400",
        mode: "batch",
        as_of: ANCHOR_DATE,
      });
      console.log(
        `  ${sym.venue.padEnd(8)} ${sym.instrument.padEnd(6)} → ${r.bars.length} bars in ${r.ms.toFixed(0)} ms`,
      );
      expect(r.ok).toBe(true);
      assertBarShape(r.bars, `${sym.instrument} initial`);
    }
  });

  test("[FE-2] switch symbol mid-chart, no stale state", async ({ request }) => {
    // User clicks AAPL, waits, clicks MSFT. Two independent fetches; the
    // second must return MSFT bars (not AAPL leftovers). Test verifies the
    // backend echoes the right `instrument` field per response.
    console.log("\n[FE-2] symbol switch — back-to-back, instrument echo check");
    const a = await fetchBars(request, {
      venue: "NASDAQ",
      instrument: "AAPL",
      timeframe: "1m",
      count: "400",
      mode: "batch",
      as_of: ANCHOR_DATE,
    });
    const b = await fetchBars(request, {
      venue: "NASDAQ",
      instrument: "MSFT",
      timeframe: "1m",
      count: "400",
      mode: "batch",
      as_of: ANCHOR_DATE,
    });
    console.log(`  AAPL → ${a.bars.length} bars in ${a.ms.toFixed(0)} ms`);
    console.log(`  MSFT → ${b.bars.length} bars in ${b.ms.toFixed(0)} ms`);
    expect(a.ok && b.ok).toBe(true);

    // Bars don't carry instrument identity per row, but the response body
    // does. Re-fetch with a small body inspect to confirm echo (covered
    // by the contract test; this is a sanity recheck during the bench).
    const aResp = await request.get(
      buildUrl({
        venue: "NASDAQ",
        instrument: "AAPL",
        timeframe: "1m",
        count: "10",
        mode: "batch",
        as_of: ANCHOR_DATE,
      }),
    );
    const bResp = await request.get(
      buildUrl({
        venue: "NASDAQ",
        instrument: "MSFT",
        timeframe: "1m",
        count: "10",
        mode: "batch",
        as_of: ANCHOR_DATE,
      }),
    );
    expect((await aResp.json()).instrument).toBe("AAPL");
    expect((await bResp.json()).instrument).toBe("MSFT");
  });

  test("[FE-3] pan back 60 days — chunked windows, monotonic merge", async ({ request }) => {
    // Models loadMoreCandles: 9 sequential 7-day windows back from ANCHOR.
    // FE-side concerns:
    //   - Each window response shape matches.
    //   - Window timestamps go strictly older as we paginate left.
    //   - Total wall-clock for the operator to see (no assertion; environment-dependent).
    //
    // Backend latency for this same path is in
    // unified-trading-api/scripts/bench_candle_reads.py scenario_scrollback_chunks.
    // What FE adds over that: Next.js proxy + JSON parse + array allocations.
    console.log("\n[FE-3] scroll-back panel — 9× 7-day windows (chunked), per-symbol totals");
    for (const sym of SYMBOLS) {
      let anchor = new Date(`${ANCHOR_DATE}T00:00:00Z`);
      const allWindows: Bar[][] = [];
      const windowMs: number[] = [];
      const startWall = performance.now();
      for (let i = 0; i < 9; i++) {
        const to = i === 0 ? new Date(anchor) : new Date(anchor);
        if (i > 0) to.setUTCDate(to.getUTCDate() - 1);
        const from = new Date(to);
        from.setUTCDate(from.getUTCDate() - 6);
        const r = await fetchBars(request, {
          venue: sym.venue,
          instrument: sym.instrument,
          timeframe: "1m",
          count: "5000",
          mode: "batch",
          from_date: from.toISOString().slice(0, 10),
          to_date: to.toISOString().slice(0, 10),
        });
        windowMs.push(r.ms);
        allWindows.push(r.bars);
        anchor = from;
      }
      const totalMs = performance.now() - startWall;
      const totalBars = allWindows.reduce((a, w) => a + w.length, 0);

      console.log(
        `  ${sym.instrument.padEnd(6)} 9 windows, total ${totalBars} bars in ${(totalMs / 1000).toFixed(2)} s | per-window ms: ${windowMs.map((m) => m.toFixed(0)).join(", ")}`,
      );

      // Shape per window
      for (const [idx, win] of allWindows.entries()) {
        assertBarShape(win, `${sym.instrument} window ${idx + 1}`);
      }

      // Monotonic ordering across windows — within a window timestamps go
      // forward; the next window's last bar must be older than the prior
      // window's first bar (chunks are non-overlapping). Mock or real, this
      // invariant must hold.
      for (let i = 1; i < allWindows.length; i++) {
        const prev = allWindows[i - 1];
        const cur = allWindows[i];
        if (prev.length === 0 || cur.length === 0) continue;
        expect(
          cur[cur.length - 1].time,
          `${sym.instrument} window ${i + 1} last bar must be older than window ${i} first bar (non-overlapping chunks)`,
        ).toBeLessThan(prev[0].time);
      }
    }
  });

  test("[FE-4] switch timeframe (1m → 5m → 1H) on same symbol+date", async ({ request }) => {
    // FE-side: timeframe button click triggers a fresh useCandles call with
    // updated key. Each timeframe yields a different bar count for the same
    // window — verify the count actually changes (i.e. we're not getting
    // cached bars from a prior timeframe).
    console.log("\n[FE-4] timeframe switch — same (symbol, date), three timeframes");
    for (const sym of SYMBOLS) {
      const counts: Record<string, number> = {};
      for (const tf of ["1m", "5m", "1H"]) {
        const r = await fetchBars(request, {
          venue: sym.venue,
          instrument: sym.instrument,
          timeframe: tf,
          count: "400",
          mode: "batch",
          as_of: ANCHOR_DATE,
        });
        counts[tf] = r.bars.length;
        assertBarShape(r.bars, `${sym.instrument} ${tf}`);
        console.log(`  ${sym.instrument.padEnd(6)} ${tf.padEnd(3)} → ${r.bars.length} bars (${r.ms.toFixed(0)} ms)`);
      }
      // Only assert the bar-count invariant when the backend has data
      // for these symbols. Mock mode has different symbol keys (composite
      // venue:symbol) — empty results are valid in that case; the call
      // still measures proxy round-trip latency.
      if (counts["1m"] > 0 && counts["1H"] > 0) {
        expect(counts["1m"], `${sym.instrument}: 1m must have more bars than 1H`).toBeGreaterThan(counts["1H"]);
      }
    }
  });
});
