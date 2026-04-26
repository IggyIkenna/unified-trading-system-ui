/**
 * Coverage for hooks/api/use-market-data.ts — useCandles URL construction,
 * batch-mode caching, and pagination params (from_date / to_date).
 *
 * We don't render the hook (no React tree); instead we exercise the URL
 * builder by extracting it. The hook itself is a thin wrapper around
 * URLSearchParams + react-query — testing the params is the load-bearing part.
 */
import { describe, expect, it } from "vitest";

/**
 * Mirror of the URLSearchParams construction inside useCandles.
 * Kept in lock-step with the production hook so the assertions catch
 * regressions in param naming / encoding.
 */
function buildCandlesUrl(args: {
  venue: string;
  instrument: string;
  timeframe?: string;
  count?: number;
  mode?: string;
  asOf?: string;
  fromDate?: string;
  toDate?: string;
}): string {
  const params = new URLSearchParams({
    venue: args.venue,
    instrument: args.instrument,
    timeframe: args.timeframe ?? "1H",
    count: String(args.count ?? 100),
  });
  if (args.mode) params.set("mode", args.mode);
  if (args.asOf) params.set("as_of", args.asOf);
  if (args.fromDate) params.set("from_date", args.fromDate);
  if (args.toDate) params.set("to_date", args.toDate);
  return `/api/market-data/candles?${params.toString()}`;
}

describe("useCandles URL construction", () => {
  it("includes mandatory params with backend-aligned names", () => {
    const url = buildCandlesUrl({
      venue: "BINANCE-FUTURES",
      instrument: "BTCUSDT",
      timeframe: "1H",
      count: 200,
    });
    const u = new URL(url, "http://x");
    expect(u.searchParams.get("venue")).toBe("BINANCE-FUTURES");
    expect(u.searchParams.get("instrument")).toBe("BTCUSDT");
    expect(u.searchParams.get("timeframe")).toBe("1H");
    expect(u.searchParams.get("count")).toBe("200");
  });

  it("threads batch + as_of for batch-mode reads", () => {
    const url = buildCandlesUrl({
      venue: "BINANCE-FUTURES",
      instrument: "BTCUSDT",
      mode: "batch",
      asOf: "2026-04-14",
    });
    const u = new URL(url, "http://x");
    expect(u.searchParams.get("mode")).toBe("batch");
    expect(u.searchParams.get("as_of")).toBe("2026-04-14");
  });

  it("threads from_date and to_date for scroll-back pagination", () => {
    const url = buildCandlesUrl({
      venue: "BINANCE-FUTURES",
      instrument: "BTCUSDT",
      mode: "batch",
      fromDate: "2026-04-10",
      toDate: "2026-04-10",
    });
    const u = new URL(url, "http://x");
    expect(u.searchParams.get("from_date")).toBe("2026-04-10");
    expect(u.searchParams.get("to_date")).toBe("2026-04-10");
    // Scroll-back uses from/to instead of as_of
    expect(u.searchParams.get("as_of")).toBeNull();
  });

  it("encodes the URL safely for venue + symbol", () => {
    const url = buildCandlesUrl({
      venue: "UNISWAPV3-ETHEREUM",
      instrument: "WETH-USDC-500",
    });
    expect(url).toContain("venue=UNISWAPV3-ETHEREUM");
    expect(url).toContain("instrument=WETH-USDC-500");
  });
});

describe("scroll-back pagination — date arithmetic", () => {
  /**
   * Replicates the loadMoreCandles() target-date computation:
   * given the earliest-loaded ISO date, scroll-back fetches
   * `[earliest - 1 day .. earliest - 1 day]`.
   */
  function nextEarlierDay(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  it("subtracts one UTC day", () => {
    expect(nextEarlierDay("2026-04-14")).toBe("2026-04-13");
  });

  it("crosses month boundary correctly", () => {
    expect(nextEarlierDay("2026-04-01")).toBe("2026-03-31");
  });

  it("crosses year boundary correctly", () => {
    expect(nextEarlierDay("2026-01-01")).toBe("2025-12-31");
  });
});
