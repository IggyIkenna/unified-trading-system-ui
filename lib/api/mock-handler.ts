/**
 * Client-side mock fetch interceptor for static visual preview mode.
 *
 * When NEXT_PUBLIC_MOCK_API=true, this intercepts all /api/* fetch calls
 * and returns realistic mock data without requiring any backend services.
 *
 * Install once at app startup via installMockHandler().
 */

import type { DocumentArtifact, OnboardingApplication } from "@/lib/api/mock-onboarding-state";
import { addApplication, addDocument, getOnboardingState, updateApplication } from "@/lib/api/mock-onboarding-state";
import { applyFilledOrder, getPositions as getLedgerPositions } from "@/lib/api/mock-position-ledger";
import type { MockOrganization, MockUser, MockVenueApiKey } from "@/lib/api/mock-provisioning-state";
import {
  addApiKey,
  addOrganization,
  addRequest,
  addUser,
  getState as getProvisioningState,
  persist,
  removeApiKey,
  updateOrganization,
  updateRequest,
  updateUser,
} from "@/lib/api/mock-provisioning-state";
import {
  amendMockOrder,
  cancelMockOrder,
  getOrders as getLedgerOrders,
  placeMockOrder,
} from "@/lib/api/mock-trade-ledger";
import {
  MOCK_BALANCE_BREAKDOWN as PERF_MOCK_BALANCES,
  MOCK_CLIENTS as PERF_MOCK_CLIENTS,
  MOCK_COIN_BREAKDOWN as PERF_MOCK_COINS,
  MOCK_ORGANISATIONS as PERF_MOCK_ORGANISATIONS,
  MOCK_POSITIONS as PERF_MOCK_POSITIONS,
  MOCK_STRATEGIES as PERF_MOCK_STRATEGIES,
  MOCK_TRADES as PERF_MOCK_TRADES,
  getMockPerformanceSummary,
} from "@/lib/mocks/fixtures/client-performance";
import { MOCK_CATALOGUE } from "@/lib/mocks/fixtures/data-service";
import { LENDING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-lending";
import { LIQUIDITY_POOLS } from "@/lib/mocks/fixtures/defi-liquidity";
import { STAKING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-staking";
import { MOCK_SWAP_ROUTE, SWAP_TOKENS } from "@/lib/mocks/fixtures/defi-swap";
import {
  MOCK_ALGO_BACKTESTS,
  MOCK_EXECUTION_ALGOS,
  MOCK_EXECUTION_CANDIDATES,
  MOCK_VENUES
} from "@/lib/mocks/fixtures/execution-platform";
import {
  CHAMPION_CHALLENGER_PAIRS,
  DATASET_SNAPSHOTS,
  EXPERIMENTS,
  FEATURE_SET_VERSIONS,
  GPU_QUEUE_STATUS,
  LIVE_DEPLOYMENTS,
  ML_ALERTS,
  ML_PIPELINE_STATUS,
  MODEL_FAMILIES,
  MODEL_VERSIONS,
  RUN_COMPARISONS,
  UNIFIED_TRAINING_RUNS,
  VALIDATION_PACKAGES,
  buildSyntheticRunComparisons
} from "@/lib/mocks/fixtures/ml-data";
import { MOCK_ARB_STREAM, MOCK_BETS, MOCK_FIXTURES, MOCK_ODDS } from "@/lib/mocks/fixtures/sports-data";
import {
  BOOKMAKERS,
  FOOTBALL_LEAGUES,
  ODDS_MARKETS,
  SUBSCRIBED_BOOKMAKERS,
} from "@/lib/mocks/fixtures/sports-fixtures";
import {
  STRATEGY_ALERTS,
  STRATEGY_CANDIDATES,
  STRATEGY_TEMPLATES
} from "@/lib/mocks/fixtures/strategy-platform";
import {
  ACCOUNTS,
  CLIENTS,
  ORGANIZATIONS,
  STRATEGIES,
  getAggregatedPnL,
  getAggregatedTimeSeries,
  getLiveBatchDelta,
  getStrategyPerformance,
} from "@/lib/mocks/fixtures/trading-data";
import { MOCK_TRANSFER_HISTORY } from "@/lib/mocks/fixtures/transfer-history";
import { ALL_INSTRUMENTS, SNAPSHOT_META, type Instrument } from "@/lib/registry/instruments";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export const MOCK_MODE = typeof window !== "undefined" && isMockDataMode();

function json(data: unknown, delay = 50): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }, delay);
  });
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function parseMockJsonBody(opts?: RequestInit): Record<string, unknown> {
  if (!opts?.body || typeof opts.body !== "string") return {};
  try {
    return JSON.parse(opts.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Standard paginated response matching backend's exact shape.
 * Backend: unified-trading-api/models/standard.py → paginated_response()
 */
function paginatedMockResponse(
  records: unknown[],
  opts?: { page?: number; pageSize?: number; mode?: string; asOf?: string | null; extra?: Record<string, unknown> },
): Record<string, unknown> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const total = records.length;
  const start = (page - 1) * pageSize;
  const sliced = records.slice(start, start + pageSize);
  return {
    data: sliced,
    pagination: { page, page_size: pageSize, total, has_next: start + pageSize < total },
    mode: opts?.mode ?? "live",
    as_of: opts?.asOf ?? null,
    ...(opts?.extra ?? {}),
  };
}

/** Parse page/page_size from URL query string */
function parsePaginationParams(path: string): { page: number; pageSize: number; mode: string; asOf: string | null } {
  const url = new URL(path, "http://localhost");
  return {
    page: parseInt(url.searchParams.get("page") ?? "1", 10),
    pageSize: Math.min(parseInt(url.searchParams.get("page_size") ?? "50", 10), 200),
    mode: url.searchParams.get("mode") ?? "live",
    asOf: url.searchParams.get("as_of") ?? null,
  };
}

function jsonStatus(status: number, data: unknown, delay = 50): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        new Response(JSON.stringify(data), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }, delay);
  });
}

const defaultFilter = {
  organizationIds: [] as string[],
  clientIds: [] as string[],
  strategyIds: [] as string[],
  mode: "live" as const,
  date: getToday(),
};

function mockRoute(path: string, opts?: RequestInit): Promise<Response> | null {
  // Pass through to real Next.js API routes that need server-side execution (file I/O)
  if (path.startsWith("/api/onboarding/")) return null;

  // Strip query params for matching
  const route = path.split("?")[0];

  // ─── Shared computed data (single source of truth for all endpoints) ───
  // All position/PnL/exposure numbers derive from this so they're consistent
  const perf = getStrategyPerformance(defaultFilter);
  const totalExposure = perf.reduce((s, p) => s + p.exposure, 0);
  const totalNav = perf.reduce((s, p) => s + p.nav, 0);
  const totalPnl = perf.reduce((s, p) => s + p.pnl, 0);
  const totalMargin = totalExposure * 0.22; // ~22% margin usage
  const liveCount = perf.filter((p) => p.status === "live").length;
  const pausedCount = perf.filter((p) => p.status === "paused" || p.status === "stopped").length;

  // Generate one position per strategy (consistent with perf data)
  // Map strategy names to domain-correct instruments and venues
  function getStrategyInstrumentAndVenue(name: string): {
    instrument: string;
    venue: string;
  } {
    const n = name.toLowerCase();
    // Sports strategies
    if (n.includes("nba")) return { instrument: "NBA:GAME:LAL-GSW", venue: "BETFAIR" };
    if (n.includes("nfl")) return { instrument: "NFL:GAME:KC-SF", venue: "PINNACLE" };
    if (n.includes("football") && !n.includes("market")) return { instrument: "EPL:MATCH:MUN-LIV", venue: "BET365" };
    if (n.includes("epl")) return { instrument: "EPL:MATCH:MUN-LIV", venue: "BETFAIR" };
    if (n.includes("la liga") || n.includes("laliga")) return { instrument: "LALIGA:MATCH:BAR-RMA", venue: "PINNACLE" };
    // Prediction market strategies
    if (n.includes("prediction") && n.includes("cefi"))
      return {
        instrument: "POLYMARKET:BINARY:BTC-100K@YES",
        venue: "POLYMARKET",
      };
    if (n.includes("prediction")) return { instrument: "KALSHI:BINARY:FED-RATE-CUT@YES", venue: "KALSHI" };
    // DeFi strategies
    if (n.includes("morpho")) return { instrument: "MORPHO:SUPPLY:USDC", venue: "MORPHO-ETHEREUM" };
    if (n.includes("uniswap") || n.includes("uni v3") || n.includes("lp"))
      return { instrument: "UNISWAPV3:LP:ETH-USDC", venue: "UNISWAPV3-ETHEREUM" };
    if (n.includes("aave") || (n.includes("lending") && n.includes("aave")))
      return { instrument: "AAVE_V3:SUPPLY:USDT", venue: "AAVEV3-ETHEREUM" };
    if (n.includes("recursive") || n.includes("staked basis"))
      return { instrument: "AAVE_V3:SUPPLY:WEETH", venue: "AAVEV3-ETHEREUM" };
    if (n.includes("eth basis")) return { instrument: "ETH-PERP", venue: "HYPERLIQUID" };
    // CeFi strategies — match by asset name in strategy
    if (n.includes("btc") && n.includes("basis")) return { instrument: "BTC-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("btc") && n.includes("market making")) return { instrument: "BTC-USDT", venue: "BINANCE-SPOT" };
    if (n.includes("btc")) return { instrument: "BTC-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("eth") && n.includes("options")) return { instrument: "ETH-26JUN26-3000-C", venue: "DERIBIT" };
    if (n.includes("eth") && n.includes("momentum")) return { instrument: "ETH-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("eth") && n.includes("mean rev")) return { instrument: "ETH-USDT", venue: "OKX-SPOT" };
    if (n.includes("eth")) return { instrument: "ETH-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("sol")) return { instrument: "SOL-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("doge")) return { instrument: "DOGE-USDT", venue: "BINANCE-SPOT" };
    if (n.includes("avax")) return { instrument: "AVAX-PERP", venue: "BINANCE-FUTURES" };
    if (n.includes("link")) return { instrument: "LINK-PERP", venue: "HYPERLIQUID" };
    if (n.includes("arb") && n.includes("mean")) return { instrument: "ARB-USDT", venue: "OKX-SPOT" };
    if (n.includes("spy")) return { instrument: "SPY", venue: "NASDAQ" };
    if (n.includes("bond")) return { instrument: "TLT", venue: "NASDAQ" };
    if (n.includes("cme") || n.includes("commodity")) return { instrument: "ES-PERP", venue: "CME" };
    if (n.includes("multi-venue") || n.includes("arbitrage")) return { instrument: "BTC-USDT", venue: "MULTI_VENUE" };
    // Fallback
    return { instrument: "BTC-PERP", venue: "BINANCE-FUTURES" };
  }

  const allPositions = perf
    .filter((p) => p.status === "live")
    .map((s, i) => {
      const { instrument, venue } = getStrategyInstrumentAndVenue(s.name);
      const basePrice = instrument.includes("BTC")
        ? 42000
        : instrument.includes("ETH")
          ? 3200
          : instrument.includes("SOL")
            ? 145
            : instrument.includes("SPY")
              ? 520
              : instrument.includes("TLT")
                ? 92
                : 1;
      return {
        id: `pos-${i}`,
        strategy_id: s.id,
        strategy_name: s.name,
        instrument,
        side: (s.pnl >= 0 ? "LONG" : "SHORT") as "LONG" | "SHORT",
        quantity: basePrice > 0 ? Math.abs(s.exposure) / basePrice : Math.abs(s.exposure),
        entry_price: basePrice,
        current_price: basePrice * (1 + s.pnl / Math.max(s.nav, 1)),
        pnl: s.pnl,
        pnl_pct: s.nav > 0 ? (s.pnl / s.nav) * 100 : 0,
        unrealized_pnl: s.pnl,
        venue,
        margin: s.exposure * 0.22,
        leverage: Math.round(s.exposure / Math.max(s.nav * 0.3, 1)),
        updated_at: new Date().toISOString(),
        health_factor: s.assetClass === "DeFi" ? 1.45 : undefined,
        venueLabel: venue,
        used: s.exposure * 0.22,
        available: s.nav - s.exposure * 0.22,
        total: s.nav,
        utilization: Math.round(((s.exposure * 0.22) / Math.max(s.nav, 1)) * 100),
        trend: (s.pnlChange > 1 ? "up" : s.pnlChange < -1 ? "down" : "stable") as "up" | "down" | "stable",
        marginCallDistance: Math.max(5, 30 - Math.round(((s.exposure * 0.22) / Math.max(s.nav, 1)) * 30)),
        lastUpdate: new Date().toISOString(),
      };
    });

  // Venue-level balance aggregation (from ACCOUNTS, consistent)
  const totalAccountBalance = ACCOUNTS.reduce((s, a) => s + a.balanceUSD, 0);
  const totalAccountMarginUsed = ACCOUNTS.reduce((s, a) => s + a.marginUsed, 0);

  // --- Positions ---
  if (route === "/api/positions/active") {
    // Merge strategy-derived positions with trade-ledger positions
    const tradePositions = getLedgerPositions().map((p) => ({
      id: p.id,
      strategy_id: p.strategy_id,
      strategy_name: p.strategy_id ?? "Manual",
      instrument: p.instrument_id,
      side: p.side.toUpperCase() as "LONG" | "SHORT",
      quantity: p.quantity,
      entry_price: p.entry_price,
      current_price: p.current_price,
      pnl: p.unrealized_pnl + p.realized_pnl,
      pnl_pct: p.entry_price > 0 ? ((p.current_price - p.entry_price) / p.entry_price) * 100 : 0,
      unrealized_pnl: p.unrealized_pnl,
      venue: p.venue,
      margin: p.quantity * p.current_price * 0.1,
      leverage: 10,
      updated_at: p.updated_at,
      venueLabel: p.venue,
      used: p.quantity * p.current_price * 0.1,
      available: 0,
      total: p.quantity * p.current_price,
      utilization: 10,
      trend: (p.unrealized_pnl > 0 ? "up" : p.unrealized_pnl < 0 ? "down" : "stable") as "up" | "down" | "stable",
      marginCallDistance: 20,
      lastUpdate: p.updated_at,
    }));
    const allPos = [...allPositions, ...tradePositions];
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(allPos, pg));
  }

  if (route === "/api/positions/summary") {
    const byVenue: Record<string, number> = {};
    let longCount = 0;
    let shortCount = 0;
    allPositions.forEach((p) => {
      byVenue[p.venue] = (byVenue[p.venue] || 0) + 1;
      if (p.side === "LONG") longCount++;
      else shortCount++;
    });
    return json({
      totalPositions: allPositions.length,
      totalExposure,
      totalUnrealizedPnl: totalPnl,
      totalMargin,
      byVenue,
      bySide: { long: longCount, short: shortCount },
    });
  }

  if (route === "/api/positions/balances") {
    const balances = ACCOUNTS.map((a) => ({
      venue: a.venue,
      account: a.name,
      free: a.marginAvailable,
      locked: a.marginUsed,
      total: a.balanceUSD,
      currency: "USD",
    }));
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(balances, pg));
  }

  if (route === "/api/accounts/transfer-history") {
    const pgTransfers = parsePaginationParams(path);
    return json(paginatedMockResponse(MOCK_TRANSFER_HISTORY, pgTransfers));
  }

  // --- Trading ---
  if (route === "/api/trading/organizations") {
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(ORGANIZATIONS, pg));
  }
  if (route === "/api/trading/clients") {
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(CLIENTS, pg));
  }
  if (route === "/api/trading/pnl") {
    return json(getAggregatedPnL(defaultFilter));
  }
  if (route === "/api/trading/timeseries") {
    const ts = getAggregatedTimeSeries(defaultFilter);
    return json({ timeseries: ts });
  }
  if (route === "/api/trading/performance") {
    // Enrich with fields the strategies page needs (performance sub-object, venues, etc.)
    const perf = getStrategyPerformance(defaultFilter);
    const enriched = perf.map((s, i) => ({
      ...s,
      description: `${s.archetype} strategy on ${s.assetClass}`,
      strategyType: s.archetype,
      version: "1.0.0",
      venues: STRATEGIES[i]?.venues ?? ["BINANCE-SPOT"],
      instructionTypes: ["LIMIT", "MARKET"],
      dataArchitecture: { executionMode: s.executionMode ?? "event_driven" },
      performance: {
        sharpe: s.sharpe,
        returnPct: s.pnlChange ?? 0,
        maxDrawdown: s.maxDrawdown,
        pnlMTD: s.pnl,
      },
      sparklineData: Array.from({ length: 20 }, (_, j) => s.pnl * (0.5 + Math.sin(j * 0.3) * 0.5)),
    }));
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(enriched, pg));
  }
  if (route === "/api/trading/live-batch-delta") {
    return json(getLiveBatchDelta(defaultFilter));
  }

  // --- Market Data ---
  if (route === "/api/market-data/tickers") {
    const RESTRICTED_SYMBOLS = ["DOGE-USDT", "SHIB-USDT"];
    const DEFI_VENUES = ["Uniswap", "Aave", "Hyperliquid", "SushiSwap", "Curve", "Morpho"];
    const tickers = [
      "BTC-USDT",
      "ETH-USDT",
      "SOL-USDT",
      "BNB-USDT",
      "XRP-USDT",
      "DOGE-USDT",
      "ADA-USDT",
      "AVAX-USDT",
    ].map((sym, i) => {
      const venueName = i % 2 === 0 ? "BINANCE-SPOT" : "OKX-SPOT";
      const entitlement = RESTRICTED_SYMBOLS.includes(sym)
        ? ("restricted" as const)
        : DEFI_VENUES.includes(venueName)
          ? ("delayed" as const)
          : ("live" as const);
      return {
        symbol: sym,
        venue: venueName,
        last: 40000 / (i + 1),
        bid: 40000 / (i + 1) - 5,
        ask: 40000 / (i + 1) + 5,
        volume24h: 1000000000 / (i + 1),
        change24h: (i % 3 === 0 ? -1 : 1) * (1.5 + i * 0.3),
        high24h: 41000 / (i + 1),
        low24h: 39000 / (i + 1),
        timestamp: new Date().toISOString(),
        entitlement,
      };
    });
    return json({ tickers, venue: "all" });
  }
  if (route === "/api/market-data/candles") {
    const nowSec = Math.floor(Date.now() / 1000);
    const intervalSec = 3600; // 1H — LightweightCharts needs Unix seconds, not ISO strings
    const candles = Array.from({ length: 100 }, (_, i) => {
      const base = 87000 + Math.sin(i * 0.15) * 2000;
      return {
        time: nowSec - (100 - i) * intervalSec, // Unix seconds — key must be "time"
        open: base,
        high: base + 200 + Math.random() * 300,
        low: base - 200 - Math.random() * 300,
        close: base + (Math.random() - 0.5) * 400,
        volume: 1000000 + Math.random() * 5000000,
      };
    });
    return json({ candles });
  }
  if (route === "/api/market-data/orderbook") {
    const mid = 42000;
    return json({
      bids: Array.from({ length: 20 }, (_, i) => ({
        price: mid - i * 5,
        size: 10 + Math.random() * 50,
      })),
      asks: Array.from({ length: 20 }, (_, i) => ({
        price: mid + i * 5,
        size: 10 + Math.random() * 50,
      })),
      timestamp: new Date().toISOString(),
    });
  }
  if (route === "/api/market-data/trades") {
    const trades = Array.from({ length: 50 }, (_, i) => ({
      id: `t-${i}`,
      price: 42000 + (Math.random() - 0.5) * 100,
      size: Math.random() * 5,
      side: i % 2 === 0 ? "buy" : "sell",
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
    }));
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(trades, pg));
  }

  // --- Derivatives ---
  if (route === "/api/derivatives/options-chain") {
    const strikes = [35000, 37500, 40000, 42500, 45000, 47500, 50000];
    return json({
      options: strikes.flatMap((strike) =>
        ["call", "put"].map((type) => ({
          strike,
          type,
          expiry: "2026-04-25",
          bid: type === "call" ? Math.max(0, 42000 - strike) + 500 : Math.max(0, strike - 42000) + 500,
          ask: type === "call" ? Math.max(0, 42000 - strike) + 700 : Math.max(0, strike - 42000) + 700,
          iv: 0.55 + Math.random() * 0.2,
          delta: type === "call" ? 0.5 : -0.5,
          gamma: 0.001,
          theta: -50,
          vega: 120,
          volume: Math.round(Math.random() * 1000),
          openInterest: Math.round(Math.random() * 5000),
        })),
      ),
    });
  }
  if (route === "/api/derivatives/vol-surface") {
    return json({
      surface: [7, 14, 30, 60, 90].map((dte) => ({
        dte,
        strikes: [0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2].map((moneyness) => ({
          moneyness,
          iv: 0.4 + (moneyness - 1) * (moneyness - 1) * 2 + dte * 0.001,
        })),
      })),
    });
  }
  if (route === "/api/derivatives/portfolio-greeks") {
    return json({
      portfolio: {
        delta: 12.5,
        gamma: 0.45,
        theta: -2400,
        vega: 85000,
        rho: 1200,
      },
      per_underlying: [
        {
          underlying: "BTC",
          delta: 8.2,
          gamma: 0.3,
          theta: -1600,
          vega: 55000,
          rho: 800,
        },
        {
          underlying: "ETH",
          delta: 4.3,
          gamma: 0.15,
          theta: -800,
          vega: 30000,
          rho: 400,
        },
      ],
    });
  }

  // --- Execution ---

  // Cancel order: PUT /api/execution/orders/{id}/cancel
  const cancelMatch = route.match(/^\/api\/execution\/orders\/([^/]+)\/cancel$/);
  if (cancelMatch && opts?.method === "PUT") {
    const result = cancelMockOrder(cancelMatch[1]);
    return json({ order: result });
  }

  // Amend order: PUT /api/execution/orders/{id}/amend
  const amendMatch = route.match(/^\/api\/execution\/orders\/([^/]+)\/amend$/);
  if (amendMatch && opts?.method === "PUT") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const result = amendMockOrder(amendMatch[1], body);
    return json({ order: result });
  }

  if (route === "/api/execution/orders") {
    // POST: place a new order via the stateful ledger
    if (opts?.method === "POST") {
      const body = opts.body ? JSON.parse(opts.body as string) : {};
      const result = placeMockOrder({
        strategy_id: body.strategy_id ?? null,
        client_id: body.client_id ?? "internal-trader",
        instrument_id: body.instrument ?? body.instrument_id ?? "BTC-PERP",
        venue: body.venue ?? "BINANCE-SPOT",
        side: body.side ?? "buy",
        order_type: body.order_type ?? "market",
        quantity: body.quantity ?? 1,
        price: body.price ?? 0,
        asset_class: body.asset_class ?? "CeFi",
        lane: body.lane ?? "book",
        algo_type: body.algo ?? null,
      });
      // Position-update-on-trade: if order filled, update position ledger
      if (result.status === "filled" && result.average_fill_price !== null) {
        applyFilledOrder({
          instrument_id: result.instrument_id,
          venue: result.venue,
          side: result.side,
          quantity: result.filled_quantity,
          price: result.average_fill_price,
          strategy_id: result.strategy_id,
          asset_class: result.asset_class,
        });
      }
      return json({ order: result });
    }

    // GET: merge static TCA orders with stateful ledger orders
    const tcaVenues = [
      "BINANCE-SPOT",
      "OKX-SPOT",
      "HYPERLIQUID",
      "DERIBIT",
      "AAVEV3-ETHEREUM",
      "UNISWAPV3-ETHEREUM",
      "POLYMARKET",
      "BETFAIR",
    ];
    const tcaAlgos = ["TWAP", "VWAP", "IS", "Sniper"];
    const tcaInstruments = [
      "BTC-PERP",
      "ETH-PERP",
      "SOL-PERP",
      "BTC-USDT",
      "ETH-USDT",
      "DOGE-USDT",
      "BTC-26JUN26",
      "ETH-26JUN26-60000-C",
      "AAVE_V3:SUPPLY:USDC",
      "UNISWAPV3:LP:ETH-USDC",
      "POLYMARKET:BINARY:BTC-100K@YES",
      "BETFAIR:EPL:MUN-LIV",
    ];
    const tcaOrders = Array.from({ length: 24 }, (_, i) => {
      const instrument = tcaInstruments[i % tcaInstruments.length];
      const venue = tcaVenues[i % tcaVenues.length];
      const algo = tcaAlgos[i % tcaAlgos.length];
      const side = i % 3 === 0 ? "SELL" : "BUY";
      const basePrice = instrument.includes("BTC")
        ? 42000
        : instrument.includes("ETH")
          ? 3200
          : instrument.includes("SOL")
            ? 145
            : instrument.includes("DOGE")
              ? 0.18
              : instrument.includes("AVAX")
                ? 38
                : instrument.includes("LINK")
                  ? 16
                  : instrument.includes("AAVE")
                    ? 1
                    : instrument.includes("UNISWAP")
                      ? 1
                      : instrument.includes("POLYMARKET") || instrument.includes("BETFAIR")
                        ? 0.65
                        : 100;
      const arrivalPrice = basePrice * (1 + Math.sin(i * 0.7) * 0.002);
      const slippageBps = parseFloat((Math.sin(i * 1.3) * 3 + 1.5).toFixed(1));
      const avgFillPrice = arrivalPrice * (1 + (slippageBps / 10000) * (side === "BUY" ? 1 : -1));
      const quantity = instrument.includes("BTC")
        ? 0.5 + i * 0.1
        : instrument.includes("ETH")
          ? 2 + i * 0.5
          : 10 + i * 5;
      const fillRate = parseFloat((95 + Math.random() * 5).toFixed(1));
      const durationMs = 500 + Math.round(Math.random() * 4500);
      const marketImpact = parseFloat((slippageBps * 0.4).toFixed(1));
      const timingCost = parseFloat((slippageBps * 0.25).toFixed(1));
      const totalCost = parseFloat((Math.abs(slippageBps) + marketImpact * 0.3).toFixed(1));
      const vwap = arrivalPrice * (1 + (Math.random() - 0.5) * 0.001);
      const twap = arrivalPrice * (1 + (Math.random() - 0.5) * 0.0008);
      return {
        id: `ord-tca-${i + 1}`,
        order_id: `ord-tca-${i + 1}`,
        instrument,
        venue,
        algo,
        side,
        type: algo,
        quantity,
        price: arrivalPrice,
        avgPrice: parseFloat(avgFillPrice.toFixed(4)),
        filled: Math.round(((quantity * fillRate) / 100) * 100) / 100,
        status: "FILLED",
        fillRate,
        durationMs,
        strategy_id: `strat-${i % 6}`,
        strategy_name: `Strategy ${i % 6}`,
        edge_bps: parseFloat((-slippageBps).toFixed(1)),
        instant_pnl: Math.round((avgFillPrice - arrivalPrice) * quantity * (side === "SELL" ? -1 : 1)),
        created_at: new Date(Date.now() - i * 1800000).toISOString(),
        tca: {
          slippage: slippageBps,
          marketImpact,
          timingCost,
          totalCost,
          arrivalPrice: parseFloat(arrivalPrice.toFixed(4)),
          vwap: parseFloat(vwap.toFixed(4)),
          twap: parseFloat(twap.toFixed(4)),
          implementationShortfall: parseFloat((slippageBps + marketImpact).toFixed(1)),
        },
      };
    });
    const ledgerOrders = getLedgerOrders().map((o) => ({
      id: o.id,
      order_id: o.id,
      instrument: o.instrument_id,
      venue: o.venue,
      algo: o.algo_type ?? "MANUAL",
      side: o.side.toUpperCase(),
      type: o.order_type.toUpperCase(),
      quantity: o.quantity,
      price: o.price,
      avgPrice: o.average_fill_price ?? o.price,
      filled: o.filled_quantity,
      status: o.status.toUpperCase(),
      fillRate: o.quantity > 0 ? (o.filled_quantity / o.quantity) * 100 : 0,
      durationMs: 0,
      strategy_id: o.strategy_id ?? "",
      strategy_name: o.strategy_id ?? "Manual",
      edge_bps: 0,
      instant_pnl: 0,
      created_at: o.created_at,
      tca: null,
    }));

    const allOrders = [...ledgerOrders, ...tcaOrders];
    const pgOrders = parsePaginationParams(path);
    return json({
      ...paginatedMockResponse(allOrders, pgOrders),
      tcaBreakdown: [
        { name: "Spread Cost", value: 12450, color: "#3b82f6" },
        { name: "Market Impact", value: 8320, color: "#8b5cf6" },
        { name: "Timing Cost", value: 3150, color: "#f59e0b" },
        { name: "Opportunity Cost", value: 5680, color: "#10b981" },
        { name: "Commission", value: 2100, color: "#6b7280" },
      ],
      executionTimeline: Array.from({ length: 20 }, (_, i) => {
        const base = 42000 + Math.sin(i * 0.3) * 120;
        return {
          time: i * 5,
          price: parseFloat((base + Math.sin(i * 0.7) * 40).toFixed(2)),
          vwap: parseFloat((base + 15 + Math.cos(i * 0.4) * 20).toFixed(2)),
          twap: parseFloat((base + 10).toFixed(2)),
        };
      }),
      slippageDistribution: [
        { range: "<-2bps", count: 3, color: "#10b981" },
        { range: "-2 to 0", count: 5, color: "#6ee7b7" },
        { range: "0 to 2", count: 8, color: "#fbbf24" },
        { range: "2 to 4", count: 5, color: "#f97316" },
        { range: "4 to 6", count: 2, color: "#ef4444" },
        { range: ">6bps", count: 1, color: "#dc2626" },
      ],
    });
  }
  if (route === "/api/execution/algos") {
    return json({ data: MOCK_EXECUTION_ALGOS });
  }
  if (route === "/api/execution/venues") {
    return json({ data: MOCK_VENUES });
  }
  if (route === "/api/execution/backtests") {
    return json(MOCK_ALGO_BACKTESTS);
  }
  if (route === "/api/execution/metrics") {
    return json({
      data: {
        ordersExecuted: 847,
        volumeTraded: 124500000,
        avgSlippage: 1.2,
        avgFillRate: 98.5,
        avgLatency: 32,
        rejects: 3,
      },
    });
  }
  if (route === "/api/execution/candidates") {
    return json(MOCK_EXECUTION_CANDIDATES);
  }
  if (route.startsWith("/api/execution/handoff")) {
    return json({ handoffs: [], total: 0 });
  }

  // --- Execution fills (Plan 2 p2-3: missing backend mock) ---
  if (route === "/api/execution/fills") {
    const orders = getLedgerOrders();
    const fills = orders
      .filter((o) => o.status === "filled" || o.status === "partially_filled")
      .map((o, i) => ({
        fill_id: `fill-${o.id}-${i}`,
        order_id: o.id,
        instrument: o.instrument_id,
        venue: o.venue,
        side: o.side,
        quantity: o.filled_quantity || o.quantity,
        price: o.average_fill_price ?? o.price,
        fee: (o.average_fill_price ?? o.price) * (o.filled_quantity || o.quantity) * 0.0005,
        timestamp: o.updated_at ?? o.created_at,
        settlement_status: "settled",
      }));
    const pgFills = parsePaginationParams(path);
    return json(paginatedMockResponse(fills, pgFills));
  }

  // --- Execution grid configs (Plan 2 p2-3) ---
  if (route === "/api/execution/grid-configs") {
    return json({
      data: [
        { id: "grid-twap-default", name: "TWAP Default", algo: "TWAP", params: { interval_sec: 60, urgency: 0.5 } },
        { id: "grid-vwap-passive", name: "VWAP Passive", algo: "VWAP", params: { max_participation: 0.1 } },
        { id: "grid-is-aggressive", name: "IS Aggressive", algo: "IS", params: { aggressiveness: 0.8 } },
      ],
      pagination: { page: 1, page_size: 50, total: 3 },
      mode: "live",
      as_of: null,
    });
  }

  // --- Sports bet placement + listing (Plan 2 p2-3) ---
  if (route === "/api/execution/sports/bets" && opts?.method === "POST") {
    const body = parseMockJsonBody(opts);
    const betInstrument = (body.instrument ?? "SPORTS:FIXTURE:UNKNOWN") as string;
    const betVenue = (body.venue ?? "MULTI_VENUE") as string;
    const betStake = (body.stake ?? 100) as number;
    const betOdds = (body.odds ?? 2.1) as number;
    // Position-update-on-trade: sports bets create positions
    applyFilledOrder({
      instrument_id: betInstrument,
      venue: betVenue,
      side: "buy",
      quantity: betStake,
      price: betOdds,
      strategy_id: (body.strategy_id ?? null) as string | null,
      asset_class: "Sports",
    });
    return json({
      data: {
        bet_id: `bet-${Date.now()}`,
        instrument: betInstrument,
        venue: betVenue,
        side: body.side ?? "back",
        stake: betStake,
        odds: betOdds,
        status: "pending",
        placed_at: new Date().toISOString(),
      },
    });
  }
  if (route === "/api/execution/sports/bets") {
    return json({
      data: [
        {
          bet_id: "bet-001",
          instrument: "SPORTS:FIXTURE:EPL:ARSENAL-CHELSEA",
          venue: "BETFAIR",
          side: "back",
          stake: 500,
          odds: 1.85,
          status: "open",
          placed_at: "2026-03-27T14:00:00Z",
        },
        {
          bet_id: "bet-002",
          instrument: "SPORTS:FIXTURE:LA_LIGA:BARCELONA-REAL_MADRID",
          venue: "PINNACLE",
          side: "back",
          stake: 250,
          odds: 2.45,
          status: "settled",
          placed_at: "2026-03-27T18:00:00Z",
          pnl: 361.25,
        },
        {
          bet_id: "bet-003",
          instrument: "SPORTS:FIXTURE:BUNDESLIGA:BAYERN-DORTMUND",
          venue: "BET365",
          side: "lay",
          stake: 300,
          odds: 1.55,
          status: "open",
          placed_at: "2026-03-27T19:30:00Z",
        },
      ],
      pagination: { page: 1, page_size: 50, total: 3 },
      mode: "live",
      as_of: null,
    });
  }

  // --- DeFi execution (Plan 2 p2-3) ---
  if (route === "/api/execution/defi/execute" && opts?.method === "POST") {
    const body = parseMockJsonBody(opts);
    const opType = (body.operation_type ?? "SWAP") as string;
    const defiVenue = (body.venue ?? "AAVEV3-ETHEREUM") as string;
    const defiInstrument = (body.instrument ?? "AAVEV3-ETHEREUM:A_TOKEN:AUSDC") as string;
    const defiAmount = (body.amount ?? 1) as number;
    const defiPrice = (body.price ?? 1) as number;
    // Position-update-on-trade: DeFi executions create positions
    applyFilledOrder({
      instrument_id: defiInstrument,
      venue: defiVenue,
      side: opType === "WITHDRAW" || opType === "UNSTAKE" ? "sell" : "buy",
      quantity: defiAmount,
      price: defiPrice,
      strategy_id: (body.strategy_id ?? null) as string | null,
      asset_class: "DeFi",
    });
    return json({
      data: {
        tx_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        operation_type: opType,
        venue: body.venue ?? "AAVEV3-ETHEREUM",
        instrument: body.instrument ?? "AAVEV3-ETHEREUM:A_TOKEN:AUSDC",
        amount: body.amount ?? 10000,
        gas_used: 185000 + Math.floor(Math.random() * 50000),
        gas_price_gwei: 12.5 + Math.random() * 5,
        effective_price: opType === "SWAP" ? 1.0002 : undefined,
        health_factor: opType === "LEND" || opType === "BORROW" ? 1.38 + Math.random() * 0.5 : undefined,
        status: "confirmed",
        block_number: 19500000 + Math.floor(Math.random() * 100000),
        timestamp: new Date().toISOString(),
      },
    });
  }
  if (route === "/api/execution/defi/execute") {
    return json({
      data: [
        {
          tx_hash: "0xabc123",
          operation_type: "LEND",
          venue: "AAVEV3-ETHEREUM",
          instrument: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC",
          amount: 50000,
          gas_used: 195000,
          status: "confirmed",
          timestamp: "2026-03-27T10:00:00Z",
        },
        {
          tx_hash: "0xdef456",
          operation_type: "SWAP",
          venue: "UNISWAPV3-ETHEREUM",
          instrument: "UNISWAPV3-ETHEREUM:POOL:WETH-USDC-3000",
          amount: 5,
          gas_used: 210000,
          status: "confirmed",
          timestamp: "2026-03-27T11:30:00Z",
        },
        {
          tx_hash: "0xghi789",
          operation_type: "STAKE",
          venue: "LIDO-ETHEREUM",
          instrument: "LIDO-ETHEREUM:STAKING:STETH",
          amount: 10,
          gas_used: 120000,
          status: "confirmed",
          timestamp: "2026-03-27T12:15:00Z",
        },
      ],
      pagination: { page: 1, page_size: 50, total: 3 },
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/compliance/pre-trade-check") {
    const body = opts?.body ? JSON.parse(opts.body as string) : {};
    const instrument = (body.instrument ?? "") as string;
    const quantity = (body.quantity ?? 0) as number;
    const price = (body.price ?? 0) as number;
    if (instrument.toUpperCase().includes("DOGE") || instrument.toUpperCase().includes("SHIB")) {
      return json({
        approved: false,
        checks: [
          {
            rule: "Restricted List",
            passed: false,
            reason: "Instrument on restricted list — requires risk committee override",
          },
        ],
      });
    }
    if (quantity * price > 1_000_000) {
      return json({
        approved: true,
        checks: [
          {
            rule: "Single Order Limit",
            passed: true,
            warning: "Order exceeds $1M — flagged for post-trade review",
          },
          { rule: "Restricted List", passed: true },
          { rule: "Position Limit", passed: true },
        ],
      });
    }
    return json({
      approved: true,
      checks: [
        { rule: "Restricted List", passed: true },
        { rule: "Position Limit", passed: true },
        { rule: "Concentration Limit", passed: true },
      ],
    });
  }

  // --- Instruments ---
  if (route === "/api/instruments/list") {
    const DEFI_CATEGORIES = ["defi"];
    const RESTRICTED_BASES = ["DOGE", "SHIB"];
    const venueMap: Record<string, { venue: string; category: string; instruments: number; coverage: number }> = {};
    const enrichedInstruments = ALL_INSTRUMENTS.map((inst: Instrument) => {
      if (!venueMap[inst.venue])
        venueMap[inst.venue] = {
          venue: inst.venue,
          category: inst.category,
          instruments: 0,
          coverage: 85 + Math.random() * 15,
        };
      venueMap[inst.venue].instruments++;
      const baseCur = inst.base_asset;
      const entitlement =
        baseCur && RESTRICTED_BASES.includes(baseCur)
          ? ("restricted" as const)
          : DEFI_CATEGORIES.includes(inst.category)
            ? ("delayed" as const)
            : ("live" as const);
      return { ...inst, entitlement };
    });
    const pgInst = parsePaginationParams(path);
    return json({
      ...paginatedMockResponse(enrichedInstruments, pgInst),
      persona: "admin",
      venues: Object.values(venueMap),
    });
  }
  if (route === "/api/instruments/catalogue") {
    const DEFI_CATEGORIES = ["defi"];
    const RESTRICTED_BASES = ["DOGE", "SHIB"];
    const SYMBOLOGY_MAP: Record<string, { bloomberg: string | null; reuters: string | null; coingecko: string }> = {
      BTC: {
        bloomberg: "BTCUSD Curncy",
        reuters: "BTC=",
        coingecko: "bitcoin",
      },
      ETH: {
        bloomberg: "ETHUSD Curncy",
        reuters: "ETH=",
        coingecko: "ethereum",
      },
      SOL: { bloomberg: null, reuters: null, coingecko: "solana" },
      BNB: { bloomberg: null, reuters: null, coingecko: "binancecoin" },
      XRP: { bloomberg: null, reuters: null, coingecko: "ripple" },
      DOGE: { bloomberg: null, reuters: null, coingecko: "dogecoin" },
      ADA: { bloomberg: null, reuters: null, coingecko: "cardano" },
      AVAX: { bloomberg: null, reuters: null, coingecko: "avalanche-2" },
      LINK: { bloomberg: null, reuters: null, coingecko: "chainlink" },
      ARB: { bloomberg: null, reuters: null, coingecko: "arbitrum" },
      USDT: { bloomberg: null, reuters: null, coingecko: "tether" },
      USDC: { bloomberg: null, reuters: null, coingecko: "usd-coin" },
    };
    const enrichedCatalogue = MOCK_CATALOGUE.map((entry) => {
      const inst = entry.instrument;
      const baseCur = inst.baseCurrency;
      const entitlement =
        baseCur && RESTRICTED_BASES.includes(baseCur)
          ? ("restricted" as const)
          : DEFI_CATEGORIES.includes(inst.category)
            ? ("delayed" as const)
            : ("live" as const);
      const symData = baseCur ? SYMBOLOGY_MAP[baseCur] : undefined;
      const symbology = {
        internal: inst.instrumentKey,
        bloomberg: symData?.bloomberg ?? null,
        reuters: symData?.reuters ?? null,
        coingecko: symData?.coingecko ?? (baseCur ? baseCur.toLowerCase() : "unknown"),
      };
      return { ...entry, entitlement, symbology };
    });
    return json({
      catalogue: enrichedCatalogue,
      total: enrichedCatalogue.length,
    });
  }

  // --- Instruments registry (Plan 2 p2-3: full snapshot browse) ---
  if (route === "/api/instruments/registry") {
    const params = new URLSearchParams(path.split("?")[1] ?? "");
    const category = params.get("category");
    const venue = params.get("venue");
    const instrumentType = params.get("instrument_type");
    const search = params.get("search")?.toUpperCase();
    const status = params.get("status");
    const page = parseInt(params.get("page") ?? "1", 10);
    const pageSize = parseInt(params.get("page_size") ?? "100", 10);
    let filtered: Instrument[] = ALL_INSTRUMENTS;
    if (category) filtered = filtered.filter((i) => i.category === category);
    if (venue) filtered = filtered.filter((i) => i.venue === venue);
    if (instrumentType) filtered = filtered.filter((i) => i.instrument_type === instrumentType);
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (search)
      filtered = filtered.filter((i) => {
        const key = (i.instrument_key ?? "").toUpperCase();
        const sym = (i.raw_symbol ?? "").toUpperCase();
        const base = (i.base_asset ?? "").toUpperCase();
        return key.includes(search) || sym.includes(search) || base.includes(search);
      });
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return json({
      data: paged,
      pagination: { page, page_size: pageSize, total },
      mode: "live",
      as_of: null,
      summary: SNAPSHOT_META,
    });
  }

  // --- Alerts ---
  if (route === "/api/alerts/active") {
    // Notification bell uses this — return unacknowledged alerts
    const unacked = STRATEGY_ALERTS.filter((a) => !a.acknowledgedAt);
    return json({
      alerts: unacked.map((a) => ({
        id: a.id,
        severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "medium",
        title: a.message,
        timestamp: a.triggeredAt,
        source: "strategy-service",
      })),
      total: unacked.length,
    });
  }
  if (route === "/api/alerts/list") {
    const alertList = STRATEGY_ALERTS.map((a) => ({
      id: a.id,
      severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "medium",
      status: a.resolvedAt ? "resolved" : a.acknowledgedAt ? "acknowledged" : "active",
      title: a.message,
      description: a.message,
      source: "strategy-service",
      entity: a.configId ?? "unknown",
      entityType: "strategy" as const,
      timestamp: a.triggeredAt,
      value: a.details ? JSON.stringify(a.details) : undefined,
      threshold: undefined,
      recommendedAction: "Review strategy configuration",
    }));
    const pgAlerts = parsePaginationParams(path);
    return json(paginatedMockResponse(alertList, pgAlerts));
  }
  if (route === "/api/alerts/summary") {
    // Use same severity mapping as /api/alerts/list (critical→critical, warning→high, info→medium)
    const critCount = STRATEGY_ALERTS.filter((a) => a.severity === "critical").length;
    const highCount = STRATEGY_ALERTS.filter((a) => a.severity === "warning").length;
    const medCount = STRATEGY_ALERTS.filter((a) => a.severity === "info").length;
    const unacked = STRATEGY_ALERTS.filter((a) => !a.acknowledgedAt).length;
    return json({
      total: STRATEGY_ALERTS.length,
      critical: critCount,
      high: highCount,
      medium: medCount,
      warning: highCount,
      info: medCount,
      unacknowledged: unacked,
    });
  }
  // Acknowledge / escalate / resolve — mutate STRATEGY_ALERTS in place
  if (route === "/api/alerts/acknowledge" || route === "/api/alerts/escalate" || route === "/api/alerts/resolve") {
    const action = route.split("/").pop() as string;
    // alertId from POST body
    let alertId: string | undefined;
    try {
      alertId = opts?.body ? JSON.parse(opts.body as string).alertId : undefined;
    } catch {
      /* noop */
    }
    const alert = alertId ? STRATEGY_ALERTS.find((a) => a.id === alertId) : undefined;
    if (alert) {
      if (action === "acknowledge") alert.acknowledgedAt = new Date().toISOString();
      if (action === "resolve") {
        alert.acknowledgedAt = alert.acknowledgedAt ?? new Date().toISOString();
        alert.resolvedAt = new Date().toISOString();
      }
      if (action === "escalate") {
        if (alert.severity === "info") alert.severity = "warning";
        else if (alert.severity === "warning") alert.severity = "critical";
      }
    }
    return json({ ok: true });
  }
  // Bell uses /api/alerts/{id}/acknowledge
  if (route.match(/^\/api\/alerts\/[^/]+\/acknowledge$/)) {
    const alertId = route.split("/")[3];
    const alert = STRATEGY_ALERTS.find((a) => a.id === alertId);
    if (alert) alert.acknowledgedAt = new Date().toISOString();
    return json({ ok: true });
  }

  // --- Risk exposure (Plan 2 p2-3: missing from mock) ---
  if (route === "/api/risk/exposure") {
    return json({
      data: {
        total_gross: totalExposure,
        total_net: totalExposure * 0.35,
        by_category: {
          cefi: { gross: totalExposure * 0.45, net: totalExposure * 0.15 },
          defi: { gross: totalExposure * 0.25, net: totalExposure * 0.12 },
          tradfi: { gross: totalExposure * 0.2, net: totalExposure * 0.05 },
          sports: { gross: totalExposure * 0.1, net: totalExposure * 0.03 },
        },
        by_venue: [
          { venue: "BINANCE-SPOT", gross: totalExposure * 0.15, net: totalExposure * 0.05 },
          { venue: "DERIBIT", gross: totalExposure * 0.12, net: totalExposure * 0.02 },
          { venue: "AAVEV3-ETHEREUM", gross: totalExposure * 0.1, net: totalExposure * 0.08 },
          { venue: "HYPERLIQUID", gross: totalExposure * 0.08, net: totalExposure * 0.03 },
        ],
      },
      mode: "live",
      as_of: null,
    });
  }

  // --- Risk ---
  if (route === "/api/risk/limits") {
    return json({
      limits: [
        {
          id: "rl-1",
          name: "Max Position Size",
          value: 2500000,
          limit: 5000000,
          unit: "USD",
          category: "exposure",
          entity: "Odum Research",
          entityType: "company",
          level: 0,
        },
        {
          id: "rl-2",
          name: "Max Drawdown",
          value: 3.2,
          limit: 10,
          unit: "%",
          category: "exposure",
          entity: "Quant Fund",
          entityType: "client",
          level: 1,
          parentId: "rl-1",
        },
        {
          id: "rl-3",
          name: "Leverage Limit",
          value: 7.5,
          limit: 10,
          unit: "x",
          category: "margin",
          entity: "Delta One",
          entityType: "account",
          level: 1,
          parentId: "rl-1",
        },
        {
          id: "rl-4",
          name: "Concentration Limit",
          value: 28,
          limit: 30,
          unit: "%",
          category: "concentration",
          entity: "BTC-PERP",
          entityType: "instrument",
          level: 2,
          parentId: "rl-3",
        },
        {
          id: "rl-5",
          name: "DeFi LTV",
          value: 0.72,
          limit: 0.85,
          unit: "ratio",
          category: "ltv",
          entity: "Aave V3",
          entityType: "strategy",
          level: 1,
          parentId: "rl-1",
        },
        {
          id: "rl-6",
          name: "Margin Utilization",
          value: 79,
          limit: 90,
          unit: "%",
          category: "margin",
          entity: "IBKR",
          entityType: "account",
          level: 1,
          parentId: "rl-1",
        },
      ],
      // Health Factor time series (7 days with 1.2 emergency threshold)
      hfTimeSeries: [
        { day: 1, hf: 1.82 },
        { day: 2, hf: 1.75 },
        { day: 3, hf: 1.68 },
        { day: 4, hf: 1.55 },
        { day: 5, hf: 1.48 },
        { day: 6, hf: 1.38 },
        { day: 7, hf: 1.45 },
      ],
      // Distance to liquidation per venue
      distanceToLiquidation: [
        { venue: "Aave V3 (Ethereum)", metric: "HF 1.45", distToLiq: 31 },
        { venue: "Morpho (Ethereum)", metric: "HF 1.72", distToLiq: 42 },
        { venue: "IBKR (CeFi)", metric: "Margin 79%", distToLiq: 21 },
        { venue: "Binance Futures", metric: "Margin 55%", distToLiq: 45 },
      ],
      // Exposure rows — 23 risk types across 5 categories
      exposureRows: [
        // first_order
        { component: "Delta", category: "first_order", pnl: -12500, exposure: "$2.8M", limit: "$5M", utilization: 56 },
        { component: "Funding", category: "first_order", pnl: 8400, exposure: "$1.4M", limit: "$3M", utilization: 47 },
        { component: "Basis", category: "first_order", pnl: 2100, exposure: "$0.6M", limit: "$2M", utilization: 30 },
        { component: "Spread", category: "first_order", pnl: 1850, exposure: "$0.3M", limit: "$1M", utilization: 30 },
        // second_order
        { component: "Gamma", category: "second_order", pnl: -3200, exposure: "$0.8M", limit: "$2M", utilization: 40 },
        { component: "Vega", category: "second_order", pnl: -1100, exposure: "$0.4M", limit: "$1.5M", utilization: 27 },
        { component: "Theta", category: "second_order", pnl: 4800, exposure: "$1.1M", limit: "$2M", utilization: 55 },
        { component: "Volga", category: "second_order", pnl: -900, exposure: "$0.2M", limit: "$0.8M", utilization: 25 },
        { component: "Vanna", category: "second_order", pnl: -600, exposure: "$0.1M", limit: "$0.5M", utilization: 20 },
        // structural
        { component: "Concentration", category: "structural", pnl: 0, exposure: "28%", limit: "30%", utilization: 93 },
        { component: "Liquidity", category: "structural", pnl: 0, exposure: "35%", limit: "40%", utilization: 88 },
        { component: "Duration", category: "structural", pnl: 0, exposure: "4.2y", limit: "7y", utilization: 60 },
        { component: "Correlation", category: "structural", pnl: 0, exposure: "0.72", limit: "0.85", utilization: 85 },
        // operational
        {
          component: "Venue/Protocol",
          category: "operational",
          pnl: 0,
          exposure: "$1.2M",
          limit: "$3M",
          utilization: 40,
        },
        {
          component: "Interest Rate",
          category: "operational",
          pnl: -400,
          exposure: "$0.3M",
          limit: "$1M",
          utilization: 30,
        },
        // domain_specific
        {
          component: "Staking/LTV",
          category: "domain_specific",
          pnl: 0,
          exposure: "0.72",
          limit: "0.85",
          utilization: 85,
        },
        {
          component: "Protocol Risk",
          category: "domain_specific",
          pnl: 0,
          exposure: "Medium",
          limit: "High",
          utilization: 60,
        },
        {
          component: "Impermanent Loss",
          category: "domain_specific",
          pnl: -2100,
          exposure: "$0.5M",
          limit: "$1.5M",
          utilization: 33,
        },
        {
          component: "Edge Decay",
          category: "domain_specific",
          pnl: 0,
          exposure: "1.8%/day",
          limit: "3%/day",
          utilization: 60,
        },
        {
          component: "Market Suspension",
          category: "domain_specific",
          pnl: 0,
          exposure: "0 events",
          limit: "2 events",
          utilization: 0,
        },
        {
          component: "Slide",
          category: "domain_specific",
          pnl: -200,
          exposure: "$0.1M",
          limit: "$0.5M",
          utilization: 20,
        },
        { component: "Rho", category: "second_order", pnl: 150, exposure: "$0.05M", limit: "$0.3M", utilization: 17 },
        { component: "Convexity", category: "structural", pnl: 0, exposure: "0.12", limit: "0.5", utilization: 24 },
      ],
      // Exposure time series (13 weeks)
      exposureTimeSeries: Array.from({ length: 90 }, (_, i) => ({
        day: i + 1,
        Delta: Math.round(2800000 + (Math.random() - 0.5) * 400000),
        Funding: Math.round(1400000 + (Math.random() - 0.5) * 200000),
        Concentration: Math.round(25 + (Math.random() - 0.5) * 6),
      })),
      // Strategy risk heatmap
      heatmap: [
        { strategy: "ETH Basis Trade", BASIS_TRADE: "high", YIELD: "low", MARKET_MAKING: "low", ARBITRAGE: "low" },
        { strategy: "Aave Yield", BASIS_TRADE: "low", YIELD: "high", MARKET_MAKING: "low", ARBITRAGE: "low" },
        { strategy: "BTC Market Making", BASIS_TRADE: "low", YIELD: "low", MARKET_MAKING: "high", ARBITRAGE: "low" },
        { strategy: "Football Arb", BASIS_TRADE: "low", YIELD: "low", MARKET_MAKING: "low", ARBITRAGE: "high" },
      ],
    });
  }
  if (route === "/api/risk/var") {
    return json({
      portfolioVaR: 185000,
      confidence: 0.99,
      horizon: "1D",
      method: "Historical",
      breakdown: [
        { asset: "BTC", var: 95000 },
        { asset: "ETH", var: 55000 },
        { asset: "SOL", var: 35000 },
      ],
    });
  }
  if (route === "/api/risk/greeks") {
    return json({
      portfolio: {
        delta: 12.5,
        gamma: 0.45,
        theta: -2400,
        vega: 85000,
        rho: 1200,
      },
      positions: [],
      timeSeries: [],
      secondOrder: { volga: 0.02, vanna: 0.01, slide: 0.005 },
    });
  }
  if (route === "/api/risk/stress") {
    return json({
      scenarios: [
        {
          id: "covid-crash",
          name: "COVID Crash (Mar 2020)",
          description: "60% equity drawdown, crypto -50%",
          multiplier: -0.5,
          pnlImpact: -3200000,
          varImpact: -4200000,
          positionsBreaching: 18,
          largestLoss: "BTC-PERP: -$1.2M",
        },
        {
          id: "btc-may-2021",
          name: "BTC Flash Crash (May 2021)",
          description: "BTC -35% in 24h, cascading liquidations",
          multiplier: -0.35,
          pnlImpact: -1800000,
          varImpact: -2500000,
          positionsBreaching: 14,
          largestLoss: "BTC-PERP: -$850K",
        },
        {
          id: "ftx-collapse",
          name: "FTX Collapse (Nov 2022)",
          description: "Exchange failure, liquidity crisis",
          multiplier: -0.4,
          pnlImpact: -2600000,
          varImpact: -3400000,
          positionsBreaching: 16,
          largestLoss: "ETH-PERP: -$720K",
        },
        {
          id: "rate-hike",
          name: "Fed Rate Shock (+200bp)",
          description: "Aggressive tightening, duration risk",
          multiplier: 0.02,
          pnlImpact: -900000,
          varImpact: -1300000,
          positionsBreaching: 8,
          largestLoss: "TLT: -$380K",
        },
        {
          id: "market-crash-20",
          name: "Market Crash -20%",
          description: "Broad market selloff across all asset classes",
          multiplier: -0.2,
          pnlImpact: -2400000,
          varImpact: -3100000,
          positionsBreaching: 12,
          largestLoss: "BTC-PERP: -$850K",
        },
        {
          id: "vol-spike",
          name: "Vol Spike +50%",
          description: "Volatility surge, option gamma squeeze",
          multiplier: 1.5,
          pnlImpact: -800000,
          varImpact: -1200000,
          positionsBreaching: 5,
          largestLoss: "ETH-PERP: -$320K",
        },
      ],
    });
  }
  if (route === "/api/risk/var-summary") {
    return json({
      historical_var_99: 2100000,
      parametric_var_99: 1850000,
      cvar_99: 2450000,
      monte_carlo_var_99: 1920000,
      marginalVaR: [
        { asset: "BTC", mvar: 0.45 },
        { asset: "ETH", mvar: 0.3 },
      ],
    });
  }
  if (route.startsWith("/api/risk/stress-test")) {
    return json({
      scenario: "custom",
      pnlImpact: -1200000,
      positions: 24,
      worstPosition: { instrument: "BTC-PERP", loss: -450000 },
    });
  }
  if (route === "/api/risk/regime") {
    return json({
      regime: "normal",
      current: "normal",
      confidence: 0.78,
      indicators: { vix: 18.5, btcVol: 42, corrIndex: 0.65 },
    });
  }
  if (route === "/api/risk/correlation-matrix") {
    return json({
      labels: ["BTC", "ETH", "SOL", "SPY", "TLT"],
      matrix: [
        [1, 0.85, 0.72, 0.35, -0.15],
        [0.85, 1, 0.78, 0.32, -0.12],
        [0.72, 0.78, 1, 0.28, -0.1],
        [0.35, 0.32, 0.28, 1, -0.45],
        [-0.15, -0.12, -0.1, -0.45, 1],
      ],
    });
  }
  if (route === "/api/risk/venue-circuit-breakers") {
    return json(
      ["BINANCE-SPOT", "OKX-SPOT", "HYPERLIQUID", "DERIBIT"].map((v) => ({
        venue: v,
        status: "armed",
        tripCount: 0,
        lastTrip: null,
      })),
    );
  }
  if (route === "/api/risk/circuit-breaker" || route === "/api/risk/kill-switch") {
    return json({ ok: true });
  }
  if (route === "/api/risk/exposure-types") {
    return json({
      riskTypes: [
        {
          id: "delta",
          name: "Delta",
          category: "first_order",
          currentValue: 12.5,
          threshold: 25,
          unit: "notional_pct",
          status: "OK",
          subscribedStrategies: ["CEFI_BTC_MM", "DEFI_ETH_BASIS", "TRADFI_SPY_ML"],
        },
        {
          id: "gamma",
          name: "Gamma",
          category: "second_order",
          currentValue: 0.45,
          threshold: 1.0,
          unit: "notional_pct",
          status: "OK",
          subscribedStrategies: ["CEFI_ETH_OPT_MM"],
        },
        {
          id: "vega",
          name: "Vega",
          category: "second_order",
          currentValue: 85000,
          threshold: 200000,
          unit: "usd",
          status: "OK",
          subscribedStrategies: ["CEFI_ETH_OPT_MM"],
        },
        {
          id: "theta",
          name: "Theta",
          category: "second_order",
          currentValue: -2400,
          threshold: -5000,
          unit: "usd_per_day",
          status: "OK",
          subscribedStrategies: ["CEFI_ETH_OPT_MM"],
        },
        {
          id: "funding",
          name: "Funding Rate",
          category: "first_order",
          currentValue: 0.012,
          threshold: -0.01,
          unit: "pct_8h",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_BASIS", "DEFI_ETH_STAKED_BASIS"],
        },
        {
          id: "basis",
          name: "Basis Spread",
          category: "first_order",
          currentValue: 0.15,
          threshold: 0.5,
          unit: "pct",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_BASIS"],
        },
        {
          id: "aave_liquidation",
          name: "Aave Health Factor",
          category: "structural",
          currentValue: 1.45,
          threshold: 1.2,
          unit: "ratio",
          status: "WARNING",
          subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"],
        },
        {
          id: "protocol_risk",
          name: "Protocol Risk (LST Depeg)",
          category: "structural",
          currentValue: 0.3,
          threshold: 2.0,
          unit: "pct_deviation",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_STAKED_BASIS", "DEFI_ETH_RECURSIVE_BASIS"],
        },
        {
          id: "liquidity",
          name: "Liquidity",
          category: "structural",
          currentValue: 15000000,
          threshold: 5000000,
          unit: "usd",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_BASIS", "CEFI_BTC_MM"],
        },
        {
          id: "venue_protocol",
          name: "Venue Protocol Risk",
          category: "operational",
          currentValue: 0,
          threshold: 1,
          unit: "incidents",
          status: "OK",
          subscribedStrategies: ["ALL"],
        },
        {
          id: "concentration",
          name: "Concentration",
          category: "operational",
          currentValue: 35,
          threshold: 50,
          unit: "pct",
          status: "OK",
          subscribedStrategies: ["CEFI_BTC_MM"],
        },
        {
          id: "adverse_selection",
          name: "Adverse Selection",
          category: "domain_specific",
          currentValue: 12,
          threshold: 25,
          unit: "pct_toxic",
          status: "OK",
          subscribedStrategies: ["CEFI_BTC_MM"],
        },
        {
          id: "bankroll_dd",
          name: "Bankroll Drawdown",
          category: "domain_specific",
          currentValue: 4.2,
          threshold: 20,
          unit: "pct",
          status: "OK",
          subscribedStrategies: ["SPORTS_NFL_ARB", "SPORTS_NBA_ML"],
        },
        {
          id: "suspension",
          name: "Market Suspension",
          category: "domain_specific",
          currentValue: 0,
          threshold: 1,
          unit: "active_suspensions",
          status: "OK",
          subscribedStrategies: ["SPORTS_BETFAIR_MM"],
        },
        {
          id: "model_confidence",
          name: "Model Confidence Decay",
          category: "domain_specific",
          currentValue: 0.82,
          threshold: 0.6,
          unit: "score",
          status: "OK",
          subscribedStrategies: ["TRADFI_SPY_ML", "SPORTS_NBA_ML"],
        },
        {
          id: "borrow_cost",
          name: "Borrow Cost (WETH APR)",
          category: "first_order",
          currentValue: 3.2,
          threshold: 8.0,
          unit: "pct_annual",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"],
        },
        {
          id: "flash_liquidity",
          name: "Flash Loan Availability",
          category: "structural",
          currentValue: 50000000,
          threshold: 10000000,
          unit: "usd",
          status: "OK",
          subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"],
        },
        {
          id: "regime",
          name: "Market Regime",
          category: "structural",
          currentValue: 0.78,
          threshold: 0.4,
          unit: "normal_prob",
          status: "OK",
          subscribedStrategies: ["TRADFI_BOND_MR"],
        },
      ],
      totalTypes: 23,
      populatedTypes: 18,
    });
  }
  if (route === "/api/risk/defi-health") {
    return json({
      currentHF: 1.45,
      currentLTV: 0.69,
      thresholds: { deleverage: 1.5, emergency: 1.2, liquidation: 1.0 },
      timeSeries: [
        { timestamp: "2026-03-16T00:00:00Z", hf: 1.82 },
        { timestamp: "2026-03-17T00:00:00Z", hf: 1.75 },
        { timestamp: "2026-03-18T00:00:00Z", hf: 1.68 },
        { timestamp: "2026-03-19T00:00:00Z", hf: 1.55 },
        { timestamp: "2026-03-20T00:00:00Z", hf: 1.48 },
        { timestamp: "2026-03-21T00:00:00Z", hf: 1.42 },
        { timestamp: "2026-03-22T00:00:00Z", hf: 1.45 },
      ],
      distanceToLiquidation: [
        {
          venue: "Aave V3 (Ethereum)",
          healthFactor: 1.45,
          distancePct: 31,
          status: "warning",
        },
        {
          venue: "Morpho (Ethereum)",
          healthFactor: 1.72,
          distancePct: 42,
          status: "ok",
        },
      ],
      collateralDebt: {
        totalCollateral: 2850000,
        totalDebt: 1965000,
        netEquity: 885000,
        leverage: 3.22,
      },
    });
  }

  // --- DeFi domain endpoints (Plan 2 p2-7) ---
  if (route === "/api/defi/lending") {
    const pg = parsePaginationParams(path);
    const chainFilter = new URL(path, "http://localhost").searchParams.get("chain");
    const filtered = chainFilter
      ? LENDING_PROTOCOLS.filter((p) => p.chain === chainFilter.toUpperCase())
      : LENDING_PROTOCOLS;
    return json(paginatedMockResponse(filtered, pg));
  }
  if (route === "/api/defi/pools") {
    const pg = parsePaginationParams(path);
    const venueFilter = new URL(path, "http://localhost").searchParams.get("venue");
    const filtered = venueFilter
      ? LIQUIDITY_POOLS.filter((p) => p.venue_id === venueFilter.toUpperCase())
      : LIQUIDITY_POOLS;
    return json(paginatedMockResponse(filtered, pg));
  }
  if (route === "/api/defi/staking") {
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(STAKING_PROTOCOLS, pg));
  }
  if (route === "/api/defi/swap/quote") {
    const url = new URL(path, "http://localhost");
    const fromToken = url.searchParams.get("from") ?? "ETH";
    const toToken = url.searchParams.get("to") ?? "USDC";
    const amount = parseFloat(url.searchParams.get("amount") ?? "1");
    return json({
      ...MOCK_SWAP_ROUTE,
      path: [fromToken.toUpperCase(), toToken.toUpperCase()],
      pools: [`UNISWAPV3-ETHEREUM ${fromToken}/${toToken} 0.05%`],
      expectedOutput: MOCK_SWAP_ROUTE.expectedOutput * amount,
      gasEstimateEth: MOCK_SWAP_ROUTE.gasEstimateEth,
      gasEstimateUsd: MOCK_SWAP_ROUTE.gasEstimateUsd,
      availableTokens: [...SWAP_TOKENS],
    });
  }
  if (route === "/api/defi/treasury") {
    return json({
      totalValue: 2850000,
      chains: [
        { chain: "ETHEREUM", value: 2100000, wallets: 3, pctOfTotal: 73.7 },
        { chain: "ARBITRUM", value: 450000, wallets: 2, pctOfTotal: 15.8 },
        { chain: "SOLANA", value: 300000, wallets: 1, pctOfTotal: 10.5 },
      ],
      assets: [
        { asset: "ETH", value: 1200000, chain: "ETHEREUM", wallet: "treasury-main" },
        { asset: "USDC", value: 850000, chain: "ETHEREUM", wallet: "treasury-main" },
        { asset: "WBTC", value: 350000, chain: "ETHEREUM", wallet: "treasury-btc" },
        { asset: "USDC", value: 450000, chain: "ARBITRUM", wallet: "arb-trading" },
        { asset: "SOL", value: 300000, chain: "SOLANA", wallet: "sol-trading" },
      ],
      // Per-share-class breakdown — aligns with UAC ShareClass enum (USDT | ETH | BTC)
      share_class_breakdown: [
        {
          share_class: "USDT",
          nav_usd: 1300000,
          nav_denominated: 1300000,
          pct_of_total: 45.6,
          strategies: ["AAVE_LENDING", "BASIS_TRADE"],
          target_delta: 0,
          actual_delta: 0.0003,
          unrealised_pnl_usd: 12400,
          unrealised_pnl_denominated: 12400,
        },
        {
          share_class: "ETH",
          nav_usd: 1050000,
          nav_denominated: 300.0, // ETH units at ~$3,500/ETH
          pct_of_total: 36.8,
          strategies: ["STAKED_BASIS", "RECURSIVE_STAKED_BASIS"],
          target_delta: 1.0, // fully ETH-denominated, neutral in ETH terms
          actual_delta: 1.02,
          unrealised_pnl_usd: 8750,
          unrealised_pnl_denominated: 2.5, // ETH
        },
        {
          share_class: "BTC",
          nav_usd: 500000,
          nav_denominated: 7.14, // BTC units at ~$70K/BTC
          pct_of_total: 17.5,
          strategies: ["BASIS_TRADE"],
          target_delta: 1.0,
          actual_delta: 0.98,
          unrealised_pnl_usd: 3200,
          unrealised_pnl_denominated: 0.046, // BTC
        },
      ],
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/defi/funding-rates") {
    return json({
      data: [
        {
          venue: "HYPERLIQUID",
          instrument: "ETH-PERP",
          rate8h: 0.0012,
          annualized: 5.26,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "HYPERLIQUID",
          instrument: "BTC-PERP",
          rate8h: 0.0008,
          annualized: 3.51,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "BINANCE-FUTURES",
          instrument: "ETH-PERP",
          rate8h: 0.001,
          annualized: 4.38,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "BINANCE-FUTURES",
          instrument: "BTC-PERP",
          rate8h: 0.0006,
          annualized: 2.63,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "BINANCE-FUTURES",
          instrument: "SOL-PERP",
          rate8h: 0.0015,
          annualized: 6.57,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "DERIBIT",
          instrument: "ETH-PERP",
          rate8h: 0.0009,
          annualized: 3.94,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "DERIBIT",
          instrument: "BTC-PERP",
          rate8h: 0.0005,
          annualized: 2.19,
          timestamp: "2026-03-28T08:00:00Z",
        },
        {
          venue: "OKX-SPOT",
          instrument: "ETH-PERP",
          rate8h: 0.0011,
          annualized: 4.82,
          timestamp: "2026-03-28T08:00:00Z",
        },
      ],
      mode: "live",
      as_of: null,
    });
  }

  // --- DeFi risk monitoring endpoints ---
  if (route === "/api/defi/risk-monitor") {
    return json({
      as_of: new Date().toISOString(),
      oracle_depeg: [
        { asset: "weETH", reference: "ETH", depeg_pct: 0.12, status: "healthy", threshold_pct: 2.0 },
        { asset: "stETH", reference: "ETH", depeg_pct: 0.08, status: "healthy", threshold_pct: 2.0 },
        { asset: "USDC", reference: "USD", depeg_pct: 0.01, status: "healthy", threshold_pct: 0.5 },
        { asset: "USDT", reference: "USD", depeg_pct: 0.02, status: "healthy", threshold_pct: 0.5 },
        { asset: "DAI", reference: "USD", depeg_pct: 0.04, status: "healthy", threshold_pct: 0.5 },
      ],
      borrow_staking_spread: [
        {
          strategy: "RECURSIVE_STAKED_BASIS",
          staking_apy: 4.2,
          borrow_apy: 2.8,
          net_spread: 1.4,
          leveraged_spread: 4.2,
          min_viable: 2.0,
          status: "healthy",
        },
        {
          strategy: "AAVE_LENDING",
          staking_apy: null,
          borrow_apy: null,
          net_spread: 3.1,
          leveraged_spread: 3.1,
          min_viable: 1.0,
          status: "healthy",
        },
        {
          strategy: "STAKED_BASIS",
          staking_apy: 4.2,
          borrow_apy: 0.0,
          net_spread: 4.2,
          leveraged_spread: 4.2,
          min_viable: 1.5,
          status: "healthy",
        },
      ],
      stablecoin_peg: [
        { asset: "USDC", peg: 1.0, price: 1.0001, deviation_pct: 0.01, status: "healthy" },
        { asset: "USDT", peg: 1.0, price: 1.0002, deviation_pct: 0.02, status: "healthy" },
        { asset: "DAI", peg: 1.0, price: 0.9996, deviation_pct: 0.04, status: "healthy" },
      ],
      withdrawal_delay: [
        { protocol: "Aave V3", asset: "ETH", delay_hours: 0, status: "instant", risk: "low" },
        { protocol: "Aave V3", asset: "USDC", delay_hours: 0, status: "instant", risk: "low" },
        { protocol: "weETH (ether.fi)", asset: "ETH", delay_hours: 168, status: "7d queue", risk: "medium" },
        { protocol: "stETH (Lido)", asset: "ETH", delay_hours: 72, status: "3d queue", risk: "medium" },
      ],
      rebalance_cost_estimate: [
        { strategy: "BASIS_TRADE", est_cost_usd: 420, pct_nav: 0.014, gas_usd: 35, slippage_usd: 385, est_minutes: 12 },
        { strategy: "AAVE_LENDING", est_cost_usd: 85, pct_nav: 0.003, gas_usd: 85, slippage_usd: 0, est_minutes: 3 },
        {
          strategy: "RECURSIVE_STAKED_BASIS",
          est_cost_usd: 1240,
          pct_nav: 0.041,
          gas_usd: 140,
          slippage_usd: 1100,
          est_minutes: 45,
        },
        { strategy: "STAKED_BASIS", est_cost_usd: 310, pct_nav: 0.01, gas_usd: 90, slippage_usd: 220, est_minutes: 8 },
      ],
      emergency_close_cost: [
        { strategy: "BASIS_TRADE", est_cost_usd: 2800, pct_nav: 0.093, est_minutes: 35 },
        { strategy: "AAVE_LENDING", est_cost_usd: 180, pct_nav: 0.006, est_minutes: 5 },
        { strategy: "RECURSIVE_STAKED_BASIS", est_cost_usd: 6200, pct_nav: 0.207, est_minutes: 180 },
        { strategy: "STAKED_BASIS", est_cost_usd: 1100, pct_nav: 0.037, est_minutes: 25 },
      ],
    });
  }

  if (route === "/api/defi/client-config") {
    return json({
      client_id: "patrick",
      client_name: "Patrick Bouchard",
      org: "Elysium Capital",
      overrides: {
        venue_allowlist: ["OKX", "BYBIT", "BINANCE-FUTURES"],
        venue_denylist: ["HYPERLIQUID"],
        coin_allowlist: ["ETH"],
        multi_coin_rotation: false,
        max_leverage: 4.0,
        max_single_venue_pct: 50,
      },
      feature_access: {
        multi_coin_rotation: false,
        cross_chain_sor: false,
        flash_loans: true,
        recursive_staking: true,
        prediction_markets: false,
      },
      tier: "DeFi Client",
      notes: "Patrick's mandate: ETH-only, no HyperLiquid (regulatory), max 4x leverage.",
    });
  }

  // --- Sports domain endpoints (Plan 2 p2-8) ---
  if (route === "/api/sports/fixtures") {
    const pg = parsePaginationParams(path);
    const url = new URL(path, "http://localhost");
    const league = url.searchParams.get("league");
    const status = url.searchParams.get("status");
    let filtered = MOCK_FIXTURES;
    if (league) filtered = filtered.filter((f) => f.league === league);
    if (status) filtered = filtered.filter((f) => f.status === status);
    return json(paginatedMockResponse(filtered, pg));
  }
  if (route === "/api/sports/odds") {
    const pg = parsePaginationParams(path);
    const url = new URL(path, "http://localhost");
    const fixtureId = url.searchParams.get("fixture_id");
    const market = url.searchParams.get("market");
    let filtered = MOCK_ODDS;
    if (fixtureId) filtered = filtered.filter((o) => o.fixtureId === fixtureId);
    if (market) filtered = filtered.filter((o) => o.market === market);
    return json(paginatedMockResponse(filtered, pg));
  }
  if (route === "/api/sports/arb") {
    const pg = parsePaginationParams(path);
    const url = new URL(path, "http://localhost");
    const minEdge = parseFloat(url.searchParams.get("min_edge") ?? "0");
    const filtered = minEdge > 0 ? MOCK_ARB_STREAM.filter((a) => a.arbPct >= minEdge) : MOCK_ARB_STREAM;
    return json(paginatedMockResponse(filtered, pg));
  }
  if (route === "/api/sports/bookmakers") {
    return json({
      data: BOOKMAKERS.map((bm) => ({
        id: bm,
        name: bm.charAt(0).toUpperCase() + bm.slice(1).replace(/_/g, " "),
        subscribed: SUBSCRIBED_BOOKMAKERS.includes(bm),
        status: SUBSCRIBED_BOOKMAKERS.includes(bm) ? "active" : "locked",
      })),
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/sports/leagues") {
    return json({
      data: FOOTBALL_LEAGUES.map((league) => ({
        id: league.toLowerCase().replace(/\s/g, "-"),
        name: league,
        fixtureCount: MOCK_FIXTURES.filter((f) => f.league === league).length,
      })),
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/sports/markets") {
    return json({
      data: ODDS_MARKETS.map((m) => ({ id: m.toLowerCase().replace(/[\s/]/g, "-"), name: m })),
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/sports/bets/history") {
    const pg = parsePaginationParams(path);
    return json(paginatedMockResponse(MOCK_BETS, pg));
  }

  // --- Analytics period endpoints (Plan 2 p2-3) ---
  if (route === "/api/analytics/period-changes") {
    return json({
      data: {
        periods: ["1d", "1w", "1m", "3m", "ytd"],
        metrics: {
          pnl: { "1d": 12500, "1w": 87300, "1m": 342100, "3m": 1205000, ytd: 2810000 },
          sharpe: { "1d": 1.8, "1w": 2.1, "1m": 1.95, "3m": 2.3, ytd: 2.15 },
          max_drawdown: { "1d": -0.8, "1w": -2.1, "1m": -4.5, "3m": -6.2, ytd: -8.1 },
          volume: { "1d": 15200000, "1w": 89400000, "1m": 412000000, "3m": 1340000000, ytd: 3150000000 },
        },
      },
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/analytics/period-summary") {
    return json({
      data: [
        { period: "1d", pnl: 12500, return_pct: 0.12, sharpe: 1.8, max_dd: -0.8, trades: 47, win_rate: 0.62 },
        { period: "1w", pnl: 87300, return_pct: 0.87, sharpe: 2.1, max_dd: -2.1, trades: 312, win_rate: 0.58 },
        { period: "1m", pnl: 342100, return_pct: 3.42, sharpe: 1.95, max_dd: -4.5, trades: 1420, win_rate: 0.55 },
        { period: "3m", pnl: 1205000, return_pct: 12.05, sharpe: 2.3, max_dd: -6.2, trades: 4100, win_rate: 0.56 },
        { period: "ytd", pnl: 2810000, return_pct: 28.1, sharpe: 2.15, max_dd: -8.1, trades: 9800, win_rate: 0.54 },
      ],
      pagination: { page: 1, page_size: 50, total: 5 },
      mode: "live",
      as_of: null,
    });
  }
  if (route === "/api/analytics/settlements") {
    return json({
      data: [
        {
          id: "stl-001",
          date: "2026-03-27",
          venue: "BINANCE-SPOT",
          currency: "USDT",
          amount: 125000,
          status: "settled",
          type: "trade",
        },
        {
          id: "stl-002",
          date: "2026-03-27",
          venue: "DERIBIT",
          currency: "BTC",
          amount: 0.85,
          status: "pending",
          type: "expiry",
        },
        {
          id: "stl-003",
          date: "2026-03-26",
          venue: "AAVEV3-ETHEREUM",
          currency: "USDC",
          amount: 50000,
          status: "settled",
          type: "lending_interest",
        },
      ],
      pagination: { page: 1, page_size: 50, total: 3 },
      mode: "live",
      as_of: null,
    });
  }

  // --- Analytics / Strategy ---
  if (route === "/api/analytics/strategy-configs") {
    return json(STRATEGY_TEMPLATES);
  }
  if (route === "/api/analytics/strategy-candidates") {
    return json(STRATEGY_CANDIDATES);
  }
  if (
    route.match(/\/api\/analytics\/strategies\/[^/]+\/promote/) ||
    route.match(/\/api\/analytics\/strategies\/[^/]+\/reject/)
  ) {
    return json({ ok: true });
  }
  if (route.match(/\/api\/analytics\/strategies\/[^/]+\/scale/)) {
    return json({ ok: true });
  }
  if (route === "/api/analytics/strategy-handoffs") {
    return json([]);
  }
  if (route === "/api/analytics/strategies/health") {
    // Let the hook use its built-in SEED_STRATEGIES fallback
    return json({ data: [] });
  }

  // --- ML (unified v2 API — changelog ML_MOCK_DATA_CHANGELOG.md) ---
  {
    const mlUrl = new URL(path, "http://mock.local");
    const mlPath = mlUrl.pathname;

    if (mlPath === "/api/ml/pipeline/status" && (!opts?.method || opts.method === "GET")) {
      return json(ML_PIPELINE_STATUS);
    }
    if (mlPath === "/api/ml/training/queue" && (!opts?.method || opts.method === "GET")) {
      return json(GPU_QUEUE_STATUS);
    }
    if (mlPath === "/api/ml/alerts" && (!opts?.method || opts.method === "GET")) {
      return json(ML_ALERTS);
    }
    if (mlPath === "/api/ml/registry/models" && (!opts?.method || opts.method === "GET")) {
      return json({ data: MODEL_VERSIONS });
    }

    const cancelMatch = mlPath.match(/^\/api\/ml\/training\/runs\/([^/]+)\/cancel$/);
    if (cancelMatch && opts?.method === "POST") {
      const runId = cancelMatch[1];
      const run = UNIFIED_TRAINING_RUNS.find((r) => r.id === runId);
      if (!run) {
        return jsonStatus(404, { error: "run_not_found" });
      }
      return json({ status: "cancelled" as const, run_id: runId });
    }

    if (mlPath === "/api/ml/training/runs" && opts?.method === "POST") {
      const body = parseMockJsonBody(opts);
      const template = UNIFIED_TRAINING_RUNS.find((r) => r.status === "queued");
      if (!template) {
        return jsonStatus(500, { error: "no_template" });
      }
      const clone = JSON.parse(JSON.stringify(template)) as (typeof UNIFIED_TRAINING_RUNS)[number];
      const famId = (typeof body.model_family_id === "string" && body.model_family_id) || clone.model_family_id;
      const fam = MODEL_FAMILIES.find((f) => f.id === famId);
      clone.id = `run-${Date.now()}`;
      clone.name = (typeof body.name === "string" && body.name.trim()) || `New run — ${clone.id}`;
      clone.description = (typeof body.description === "string" && body.description) || clone.description;
      clone.model_family_id = famId;
      clone.model_family_name = fam?.name ?? clone.model_family_name;
      clone.created_at = new Date().toISOString();
      clone.created_by = (typeof body.created_by === "string" && body.created_by) || "demo.user";
      if (body.config && typeof body.config === "object") {
        clone.config = {
          ...clone.config,
          ...(body.config as object),
        };
      }
      return json(clone);
    }

    if (mlPath === "/api/ml/training/runs" && (!opts?.method || opts.method === "GET")) {
      let list = [...UNIFIED_TRAINING_RUNS];
      const st = mlUrl.searchParams.get("status");
      const family = mlUrl.searchParams.get("family");
      if (st && st !== "all") {
        list = list.filter((r) => r.status === st);
      }
      if (family) {
        list = list.filter((r) => r.model_family_id === family);
      }
      return json(list);
    }

    const runDetailMatch = mlPath.match(/^\/api\/ml\/training\/runs\/([^/]+)$/);
    if (runDetailMatch && (!opts?.method || opts.method === "GET")) {
      const runId = runDetailMatch[1];
      const run = UNIFIED_TRAINING_RUNS.find((r) => r.id === runId);
      if (!run) {
        return jsonStatus(404, { error: "run_not_found" });
      }
      return json(run);
    }

    const analysisRunMatch = mlPath.match(/^\/api\/ml\/analysis\/runs\/([^/]+)$/);
    if (analysisRunMatch && (!opts?.method || opts.method === "GET")) {
      const runId = analysisRunMatch[1];
      const run = UNIFIED_TRAINING_RUNS.find((r) => r.id === runId);
      if (!run?.analysis) {
        return jsonStatus(404, { error: "analysis_not_available" });
      }
      return json(run.analysis);
    }

    if (mlPath === "/api/ml/analysis/compare" && opts?.method === "POST") {
      const body = parseMockJsonBody(opts);
      const a = String(body.run_a_id ?? "");
      const rawIds = body.run_b_ids;
      const single = body.run_b_id;
      let compareIds: string[] = [];
      if (Array.isArray(rawIds)) {
        compareIds = rawIds
          .map((x) => String(x))
          .filter((id) => id.length > 0 && id !== a)
          .slice(0, 3);
      } else if (single) {
        compareIds = [String(single)].filter((id) => id !== a);
      }
      const merged: typeof RUN_COMPARISONS = [];
      for (const b of compareIds) {
        const matched = RUN_COMPARISONS.filter((c) => c.run_a_id === a && c.run_b_id === b);
        if (matched.length > 0) {
          merged.push(...matched);
        } else {
          merged.push(...buildSyntheticRunComparisons(a, b));
        }
      }
      return json(merged);
    }
  }

  // --- ML ---
  if (route === "/api/ml/model-families") {
    // Enrich with activeExperiments and deployedVersions counts
    const enriched = MODEL_FAMILIES.map((fam, i) => ({
      ...fam,
      activeExperiments: [3, 1, 2, 1, 4, 2][i] ?? 1,
      deployedVersions: [2, 1, 1, 1, 2, 1][i] ?? 1,
    }));
    return json({ data: enriched, families: enriched });
  }
  if (route === "/api/ml/experiments") return json({ data: EXPERIMENTS, experiments: EXPERIMENTS });
  if (route.match(/\/api\/ml\/experiments\/[^/]+$/)) return json(EXPERIMENTS[0]);
  if (route === "/api/ml/training-runs") return json(UNIFIED_TRAINING_RUNS);
  if (route === "/api/ml/training-jobs") return json({ ok: true, jobId: "job-mock-001" });
  if (route === "/api/ml/versions") return json({ data: MODEL_VERSIONS });
  if (route.match(/\/api\/ml\/models\/[^/]+\/promote/)) return json({ ok: true });
  if (route === "/api/ml/deployments") return json({ deployments: LIVE_DEPLOYMENTS, championChallengerPairs: CHAMPION_CHALLENGER_PAIRS });
  if (route === "/api/ml/features") return json(FEATURE_SET_VERSIONS);
  if (route === "/api/ml/datasets") return json(DATASET_SNAPSHOTS);
  if (route === "/api/ml/validation-results") return json(VALIDATION_PACKAGES);
  if (route === "/api/ml/monitoring") return json({ alerts: [], drift: [], performance: {} });
  if (route === "/api/ml/governance") return json({ policies: [], approvals: [] });
  if (route === "/api/ml/config") return json({ hyperparameters: {}, featureFlags: {} });
  if (route.startsWith("/api/ml/feature-groups")) {
    const fgUrl = new URL(path, "http://mock.local");
    const cat = fgUrl.searchParams.get("category") ?? "CEFI";
    const groupsByCategory: Record<string, string[]> = {
      CEFI: ["price_momentum", "volume_profile", "volatility_surface", "orderbook_imbalance", "funding_rate", "open_interest", "whale_flow", "correlation_regime"],
      TRADFI: ["macro_indicators", "yield_curve", "equity_momentum", "fx_carry", "credit_spread", "sector_rotation"],
      SPORTS: ["team_form", "player_stats", "market_movement", "weather_impact", "historical_h2h", "venue_effect"],
    };
    return json({ data: { category: cat, feature_groups: groupsByCategory[cat] ?? groupsByCategory.CEFI } });
  }
  if (route.startsWith("/api/ml/grid-configs")) {
    if (route === "/api/ml/grid-configs") {
      return json({
        data: [
          { name: "cefi-full", category: "CEFI", description: "All CeFi feature groups", feature_groups: ["price_momentum", "volume_profile", "volatility_surface", "orderbook_imbalance", "funding_rate", "open_interest"], exclude_features: [], created_at: "2026-03-01T10:00:00Z" },
          { name: "cefi-momentum-only", category: "CEFI", description: "Momentum + volume features only", feature_groups: ["price_momentum", "volume_profile"], exclude_features: ["whale_flow"], created_at: "2026-03-05T14:00:00Z" },
          { name: "sports-core", category: "SPORTS", description: "Core sports prediction features", feature_groups: ["team_form", "player_stats", "historical_h2h"], exclude_features: [], created_at: "2026-03-10T09:00:00Z" },
        ],
        total: 3, page: 1, page_size: 50,
      });
    }
    return json({ data: { name: "cefi-full", category: "CEFI", feature_groups: ["price_momentum", "volume_profile", "volatility_surface"], exclude_features: [] } });
  }

  // --- Reports ---
  if (route === "/api/reporting/reports") {
    // Build per-client portfolio summary that sums to $45.2M AUM
    const clientAums = [
      12500000, 9800000, 7600000, 5400000, 3900000, 2800000, 1500000, 900000, 500000, 200000, 60000, 40000,
    ];
    const portfolioSummary = CLIENTS.slice(0, 12).map((c, i) => ({
      clientId: c.id,
      name: c.name,
      aum: clientAums[i] ?? 500000,
      mtdReturn: parseFloat((1.0 + Math.sin(i * 0.8) * 3.5).toFixed(1)),
      ytdReturn: parseFloat((6 + Math.sin(i * 0.5) * 8).toFixed(1)),
    }));
    // Force average mtdReturn ≈ 3.2%
    const avgMtd = portfolioSummary.reduce((s, c) => s + c.mtdReturn, 0) / portfolioSummary.length;
    const mtdDelta = 3.2 - avgMtd;
    portfolioSummary.forEach((c) => {
      c.mtdReturn = parseFloat((c.mtdReturn + mtdDelta).toFixed(1));
    });
    return json({
      data: Array.from({ length: 47 }, (_, i) => ({
        id: `rpt-${i + 1}`,
        clientId: portfolioSummary[i % portfolioSummary.length].clientId,
        type: ["daily-pnl", "risk-summary", "execution-quality", "regulatory-mifid", "settlement-summary"][i % 5],
        name: `${["Daily PnL", "Risk Summary", "Execution Quality", "MiFID II", "Settlement"][i % 5]} Report`,
        status: i < 40 ? "delivered" : "pending",
        generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        format: i % 3 === 0 ? "pdf" : "xlsx",
      })),
      portfolioSummary,
      invoices: CLIENTS.slice(0, 5).map((c, i) => ({
        id: `inv-${i + 1}`,
        clientId: c.id,
        amount: 5000 + i * 2500,
        status: i < 3 ? "paid" : "pending",
        dueDate: new Date(Date.now() + (30 - i * 7) * 86400000).toISOString().split("T")[0],
      })),
    });
  }
  if (route.match(/^\/api\/reporting\/settlements\/[^/]+\/confirm$/) && opts?.method === "PUT") {
    const settlementId = route.split("/").at(-2);
    return json({ ok: true, settlement_id: settlementId, status: "confirmed" });
  }
  if (route === "/api/reporting/settlements") {
    const statuses = ["confirmed", "pending", "failed", "disputed", "confirmed", "pending"] as const;
    return json({
      settlements: CLIENTS.slice(0, 6).flatMap((c, ci) =>
        Array.from({ length: 3 }, (_, i) => ({
          id: `stl-${ci * 3 + i + 1}`,
          clientId: c.id,
          amount: 50000 + Math.round(ci * 30000 + i * 80000),
          currency: "USD",
          status: statuses[(ci + i) % statuses.length],
          settledAt:
            statuses[(ci + i) % statuses.length] === "confirmed"
              ? new Date(Date.now() - i * 86400000).toISOString()
              : null,
          venue: ["BINANCE-SPOT", "OKX-SPOT", "DERIBIT"][i % 3],
        })),
      ),
      accountBalances: ACCOUNTS.map((a) => ({
        venue: a.venue,
        currency: "USD",
        balance: a.balanceUSD,
        available: a.marginAvailable,
        locked: a.marginUsed,
      })),
      recentTransfers: [
        {
          time: new Date(Date.now() - 120000).toISOString(),
          from: "BINANCE-SPOT",
          to: "OKX-SPOT",
          amount: "$250,000",
          status: "confirmed" as const,
          confirmations: "12/12",
          txHash: "0xabc...def",
        },
        {
          time: new Date(Date.now() - 3600000).toISOString(),
          from: "OKX-SPOT",
          to: "DERIBIT",
          amount: "$180,000",
          status: "settled" as const,
          confirmations: "6/6",
          txHash: "0x123...456",
        },
        {
          time: new Date(Date.now() - 600000).toISOString(),
          from: "HYPERLIQUID",
          to: "BINANCE-SPOT",
          amount: "$320,000",
          status: "confirming" as const,
          confirmations: "4/12",
          txHash: "0x789...abc",
        },
      ],
    });
  }
  // --- Reporting Subscriptions ---
  if (route.match(/^\/api\/reporting\/subscriptions\/[^/]+\/approve$/) && opts?.method === "PUT") {
    const subId = route.split("/").at(-2);
    return json({ ok: true, subscription_id: subId, status: "active" });
  }
  if (route === "/api/reporting/subscriptions/subscribe" && opts?.method === "POST") {
    return json({
      subscription: { id: `sub-new-${Date.now()}`, status: "pending_approval" },
    });
  }
  if (route === "/api/reporting/subscriptions") {
    return json({
      subscriptions: [
        {
          id: "sub-001",
          client_id: "alpha-main",
          org_id: "alpha-capital",
          package: "Daily Execution Summary",
          frequency: "daily",
          format: "PDF",
          status: "active",
          next_run: "2026-03-24T06:00:00Z",
          created_at: "2026-02-01T00:00:00Z",
        },
        {
          id: "sub-002",
          client_id: "alpha-main",
          org_id: "alpha-capital",
          package: "Monthly Regulatory Pack",
          frequency: "monthly",
          format: "PDF+Excel",
          status: "active",
          next_run: "2026-04-01T00:00:00Z",
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "sub-003",
          client_id: "vertex-core",
          org_id: "vertex-partners",
          package: "Weekly Risk Report",
          frequency: "weekly",
          format: "PDF",
          status: "pending_approval",
          next_run: null,
          created_at: "2026-03-20T00:00:00Z",
        },
      ],
      total: 3,
    });
  }

  if (route === "/api/reporting/reconciliation")
    return json({
      breaks: [
        {
          id: "BRK-001",
          type: "position",
          instrument: "BTC-PERP",
          venue: "BINANCE-SPOT",
          internal_qty: 2.5,
          external_qty: 2.3,
          diff: 0.2,
          status: "unresolved",
          severity: "high",
          detected_at: "2026-03-23T10:15:00Z",
          correlation_id: "corr-brk-001",
        },
        {
          id: "BRK-002",
          type: "pnl",
          instrument: "ETH-USDT",
          venue: "HYPERLIQUID",
          internal_qty: 15420.5,
          external_qty: 15380.25,
          diff: 40.25,
          status: "unresolved",
          severity: "medium",
          detected_at: "2026-03-23T09:30:00Z",
          correlation_id: "corr-brk-002",
        },
        {
          id: "BRK-003",
          type: "fee",
          instrument: "SOL-PERP",
          venue: "BINANCE-SPOT",
          internal_qty: 125.0,
          external_qty: 132.5,
          diff: -7.5,
          status: "resolved",
          severity: "low",
          detected_at: "2026-03-22T16:00:00Z",
          correlation_id: "corr-brk-003",
        },
        {
          id: "BRK-004",
          type: "position",
          instrument: "AAVE_V3:SUPPLY:USDT",
          venue: "AAVEV3-ETHEREUM",
          internal_qty: 50000,
          external_qty: 49850,
          diff: 150,
          status: "unresolved",
          severity: "medium",
          detected_at: "2026-03-23T08:00:00Z",
          correlation_id: "corr-brk-004",
        },
      ],
      total: 4,
    });
  if (route === "/api/reporting/reconciliation/resolve" && opts?.method === "POST") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    return json({ ok: true, break_id: body.break_id, status: "resolved" });
  }
  // --- Client Performance Dashboard ---
  if (route === "/api/reporting/clients") {
    return json({
      clients: PERF_MOCK_CLIENTS,
      organisations: PERF_MOCK_ORGANISATIONS,
      strategies: PERF_MOCK_STRATEGIES,
    });
  }
  if (route === "/api/reporting/performance/summary") {
    const qs = new URLSearchParams(path.split("?")[1] ?? "");
    return json(getMockPerformanceSummary(qs.get("client_id") ?? "PR"));
  }
  if (route === "/api/reporting/performance/positions") {
    const qs = new URLSearchParams(path.split("?")[1] ?? "");
    return json({ client_id: qs.get("client_id") ?? "PR", positions: PERF_MOCK_POSITIONS });
  }
  if (route === "/api/reporting/performance/coin-breakdown") {
    const qs = new URLSearchParams(path.split("?")[1] ?? "");
    return json({ client_id: qs.get("client_id") ?? "PR", coins: PERF_MOCK_COINS });
  }
  if (route === "/api/reporting/performance/balances") {
    const qs = new URLSearchParams(path.split("?")[1] ?? "");
    return json({ client_id: qs.get("client_id") ?? "PR", ...PERF_MOCK_BALANCES });
  }
  if (route === "/api/reporting/trades") {
    const qs = new URLSearchParams(path.split("?")[1] ?? "");
    const clientId = qs.get("client_id") ?? "PR";
    const symbol = qs.get("symbol");
    const side = qs.get("side");
    const limit = parseInt(qs.get("limit") ?? "50", 10);
    const offset = parseInt(qs.get("offset") ?? "0", 10);
    let trades = [...PERF_MOCK_TRADES];
    if (symbol) trades = trades.filter((t) => t.symbol === symbol);
    if (side) trades = trades.filter((t) => t.side === side);
    const total = trades.length;
    trades = trades.slice(offset, offset + limit);
    const totalVolume = PERF_MOCK_TRADES.reduce((s, t) => s + t.notional_usd, 0);
    const totalFees = PERF_MOCK_TRADES.reduce((s, t) => s + t.fee, 0);
    const netPnl = PERF_MOCK_TRADES.reduce((s, t) => s + t.realized_pnl, 0);
    return json({
      client_id: clientId,
      trades,
      total,
      offset,
      limit,
      aggregates: {
        total_trades: PERF_MOCK_TRADES.length,
        total_volume_usd: Math.round(totalVolume * 100) / 100,
        total_fees_usd: Math.round(totalFees * 100) / 100,
        net_realized_pnl: Math.round(netPnl * 100) / 100,
      },
    });
  }

  if (route === "/api/reporting/regulatory") return json([]);
  if (route === "/api/reporting/pnl-attribution") return json({ factors: [], total: 0 });
  if (route === "/api/reporting/executive-summary")
    return json({
      aum: 45200000,
      pnlMtd: 1446400,
      sharpe: 2.1,
      strategies: 12,
    });
  // --- Invoices (fee management) ---
  if (route === "/api/reporting/invoices") {
    const url = new URL(path, "http://localhost");
    const orgFilter = url.searchParams.get("org_id");
    const mockInvoices = [
      {
        invoice_id: "INV-2026-0401",
        org_id: "org-alpha",
        type: "performance_fee",
        period_month: "2026-03",
        status: "issued",
        currency: "USD",
        subtotal: 48750.0,
        tax: 4875.0,
        total: 53625.0,
        description: "Performance fee for March 2026 - Alpha Capital",
        issued_at: "2026-04-01T09:00:00Z",
        due_date: "2026-04-15",
        opening_aum: 12500000,
        closing_aum: 12987500,
        pnl: 487500,
        trader_hwm_before: 12400000,
        odum_hwm_before: 12300000,
        trader_fee: 24375.0,
        odum_fee: 24375.0,
        is_underwater: false,
        server_cost: 0,
        payment_txid: null,
        notes: "Standard 10% performance fee on profits above HWM",
      },
      {
        invoice_id: "INV-2026-0402",
        org_id: "org-alpha",
        type: "management_fee",
        period_month: "2026-03",
        status: "paid",
        currency: "USD",
        subtotal: 20833.33,
        tax: 2083.33,
        total: 22916.66,
        description: "Management fee for March 2026 - Alpha Capital",
        issued_at: "2026-04-01T09:00:00Z",
        due_date: "2026-04-15",
        opening_aum: 12500000,
        closing_aum: 12987500,
        pnl: 487500,
        trader_hwm_before: 12400000,
        odum_hwm_before: 12300000,
        trader_fee: 10416.67,
        odum_fee: 10416.67,
        is_underwater: false,
        server_cost: 0,
        payment_txid: "0xabc123def456",
        notes: "2% annual management fee (monthly: 1/12)",
      },
      {
        invoice_id: "INV-2026-0403",
        org_id: "org-beta",
        type: "performance_fee",
        period_month: "2026-03",
        status: "draft",
        currency: "USD",
        subtotal: 0,
        tax: 0,
        total: 0,
        description: "Performance fee for March 2026 - Beta Fund (underwater)",
        issued_at: "2026-04-02T10:30:00Z",
        due_date: "2026-04-16",
        opening_aum: 9800000,
        closing_aum: 9650000,
        pnl: -150000,
        trader_hwm_before: 10200000,
        odum_hwm_before: 10100000,
        trader_fee: 0,
        odum_fee: 0,
        is_underwater: true,
        server_cost: 1250.0,
        payment_txid: null,
        notes: "No performance fee - portfolio below HWM. Server cost applied.",
      },
    ];
    const filtered = orgFilter ? mockInvoices.filter((inv) => inv.org_id === orgFilter) : mockInvoices;
    return json(filtered);
  }
  if (route === "/api/reporting/invoices/generate" && opts?.method === "POST") {
    const body = parseMockJsonBody(opts);
    return json({
      invoice_id: `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      org_id: body.org_id ?? "org-alpha",
      type: body.invoice_type ?? "performance_fee",
      period_month: body.period_month ?? "2026-04",
      status: "draft",
      currency: body.currency ?? "USD",
      subtotal: 15000,
      tax: 1500,
      total: 16500,
      description: `Fee invoice for ${String(body.period_month ?? "2026-04")}`,
      issued_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      opening_aum: 10000000,
      closing_aum: 10300000,
      pnl: 300000,
      trader_hwm_before: 9900000,
      odum_hwm_before: 9800000,
      trader_fee: 7500,
      odum_fee: 7500,
      is_underwater: false,
      server_cost: 0,
      payment_txid: null,
      notes: "",
    });
  }
  if (route.match(/^\/api\/reporting\/invoices\/[^/]+\/transition$/) && opts?.method === "PUT") {
    const body = parseMockJsonBody(opts);
    const statusMap: Record<string, string> = {
      issue: "issued",
      accept: "accepted",
      pay: "paid",
      dispute: "disputed",
      void: "voided",
      reissue: "issued",
    };
    return json({
      ok: true,
      status: statusMap[String(body.action)] ?? "issued",
    });
  }
  if (route.match(/^\/api\/reporting\/invoices\/[^/]+\/download$/)) {
    return json({ url: "https://storage.example.com/invoices/mock-invoice.pdf" });
  }
  if (route.match(/^\/api\/reporting\/invoices\/[^/]+$/) && !route.includes("/generate")) {
    // Single invoice detail
    const invoiceId = route.split("/").pop();
    const allMock = [
      {
        invoice_id: "INV-2026-0401",
        org_id: "org-alpha",
        type: "performance_fee",
        period_month: "2026-03",
        status: "issued",
        currency: "USD",
        subtotal: 48750.0,
        tax: 4875.0,
        total: 53625.0,
        description: "Performance fee for March 2026 - Alpha Capital",
        issued_at: "2026-04-01T09:00:00Z",
        due_date: "2026-04-15",
        opening_aum: 12500000,
        closing_aum: 12987500,
        pnl: 487500,
        trader_hwm_before: 12400000,
        odum_hwm_before: 12300000,
        trader_fee: 24375.0,
        odum_fee: 24375.0,
        is_underwater: false,
        server_cost: 0,
        payment_txid: null,
        notes: "Standard 10% performance fee on profits above HWM",
      },
      {
        invoice_id: "INV-2026-0402",
        org_id: "org-alpha",
        type: "management_fee",
        period_month: "2026-03",
        status: "paid",
        currency: "USD",
        subtotal: 20833.33,
        tax: 2083.33,
        total: 22916.66,
        description: "Management fee for March 2026 - Alpha Capital",
        issued_at: "2026-04-01T09:00:00Z",
        due_date: "2026-04-15",
        opening_aum: 12500000,
        closing_aum: 12987500,
        pnl: 487500,
        trader_hwm_before: 12400000,
        odum_hwm_before: 12300000,
        trader_fee: 10416.67,
        odum_fee: 10416.67,
        is_underwater: false,
        server_cost: 0,
        payment_txid: "0xabc123def456",
        notes: "2% annual management fee (monthly: 1/12)",
      },
      {
        invoice_id: "INV-2026-0403",
        org_id: "org-beta",
        type: "performance_fee",
        period_month: "2026-03",
        status: "draft",
        currency: "USD",
        subtotal: 0,
        tax: 0,
        total: 0,
        description: "Performance fee for March 2026 - Beta Fund (underwater)",
        issued_at: "2026-04-02T10:30:00Z",
        due_date: "2026-04-16",
        opening_aum: 9800000,
        closing_aum: 9650000,
        pnl: -150000,
        trader_hwm_before: 10200000,
        odum_hwm_before: 10100000,
        trader_fee: 0,
        odum_fee: 0,
        is_underwater: true,
        server_cost: 1250.0,
        payment_txid: null,
        notes: "No performance fee - portfolio below HWM. Server cost applied.",
      },
    ];
    const found = allMock.find((inv) => inv.invoice_id === invoiceId);
    return json(found ?? { error: "Not found" });
  }
  if (route.startsWith("/api/reporting/reconciliation/")) return json({ ok: true });
  if (route === "/api/reporting/generate") return json({ ok: true, reportId: "rpt-mock-001" });
  if (route === "/api/reporting/schedules") return json([]);

  // --- NAV / IBOR / SAFT (Haruko gap pages) ---
  if (route === "/api/reporting/nav") {
    return json({
      currentNav: 45_200_000,
      navPerUnit: 1.247,
      aum: 45_200_000,
      inceptionDate: "2024-01-15",
      mtdReturn: 3.2,
      ytdReturn: 11.8,
      hourlyTimeSeries: Array.from({ length: 168 }, (_, i) => ({
        timestamp: new Date(Date.now() - (167 - i) * 3_600_000).toISOString(),
        nav: 45_200_000 + Math.sin(i * 0.3) * 800_000 + i * 5_000,
        aum: 45_200_000 + Math.sin(i * 0.3) * 800_000 + i * 5_000,
      })),
      capitalFlows: [
        { date: "2026-03-01", type: "subscription", investor: "Vertex Partners", amount: 2_000_000 },
        { date: "2026-03-15", type: "redemption", investor: "Beta Fund", amount: -500_000 },
        { date: "2026-03-20", type: "subscription", investor: "Alpha Capital", amount: 1_200_000 },
        { date: "2026-03-28", type: "subscription", investor: "Elysium", amount: 5_000_000 },
      ],
      feeWaterfall: {
        grossPnl: 1_850_000,
        managementFee: 90_400,
        performanceFee: 351_500,
        adminFee: 18_500,
        netPnl: 1_389_600,
      },
    });
  }
  if (route === "/api/reporting/ibor") {
    return json({
      positions: [
        {
          id: "p1",
          instrument: "ETH-PERP",
          venue: "Hyperliquid",
          strategy: "BASIS_TRADE",
          quantity: 250,
          entryPrice: 3_420,
          markPrice: 3_540,
          unrealizedPnl: 30_000,
          positionDate: "2026-03-20",
          ibor_source: "execution-service",
        },
        {
          id: "p2",
          instrument: "AUSDC",
          venue: "AAVEV3-ETHEREUM",
          strategy: "AAVE_LENDING",
          quantity: 500_000,
          entryPrice: 1.0,
          markPrice: 1.0012,
          unrealizedPnl: 600,
          positionDate: "2026-03-18",
          ibor_source: "execution-service",
        },
        {
          id: "p3",
          instrument: "WEETH",
          venue: "MORPHO-ETHEREUM",
          strategy: "RECURSIVE_STAKED_BASIS",
          quantity: 300,
          entryPrice: 3_580,
          markPrice: 3_610,
          unrealizedPnl: 9_000,
          positionDate: "2026-03-15",
          ibor_source: "execution-service",
        },
        {
          id: "p4",
          instrument: "BTC-PERP",
          venue: "Binance-Futures",
          strategy: "CEFI_BTC_MM",
          quantity: 15,
          entryPrice: 68_200,
          markPrice: 69_400,
          unrealizedPnl: 18_000,
          positionDate: "2026-03-22",
          ibor_source: "execution-service",
        },
      ],
      breaks: [],
      lastReconciled: new Date(Date.now() - 7_200_000).toISOString(),
      goldenSource: "execution-service",
    });
  }
  if (route === "/api/reporting/saft") {
    return json({
      warrants: [
        {
          id: "saft-001",
          tokenSymbol: "OUM",
          investor: "Vertex Partners",
          totalTokens: 500_000,
          vestedTokens: 125_000,
          cliffDate: "2025-01-15",
          vestingEndDate: "2028-01-15",
          currentPrice: 1.82,
          npv: 227_500,
          vestingSchedule: "4yr linear, 1yr cliff",
        },
        {
          id: "saft-002",
          tokenSymbol: "OUM",
          investor: "Alpha Capital",
          totalTokens: 250_000,
          vestedTokens: 62_500,
          cliffDate: "2025-06-01",
          vestingEndDate: "2028-06-01",
          currentPrice: 1.82,
          npv: 113_750,
          vestingSchedule: "4yr linear, 1yr cliff",
        },
        {
          id: "saft-003",
          tokenSymbol: "OUM",
          investor: "Beta Fund",
          totalTokens: 100_000,
          vestedTokens: 50_000,
          cliffDate: "2024-12-01",
          vestingEndDate: "2026-12-01",
          currentPrice: 1.82,
          npv: 91_000,
          vestingSchedule: "2yr linear, immediate",
        },
      ],
      unlockTimeline: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() + i * 30 * 86_400_000).toISOString().slice(0, 7),
        tokensUnlocking: Math.round(20_000 + Math.sin(i * 0.5) * 5_000),
      })),
      totalGranted: 850_000,
      totalVested: 237_500,
      totalValue: 432_250,
    });
  }

  // --- Service Status ---
  if (route === "/api/service-status/health") {
    const now = new Date().toISOString();
    return json({
      data: [
        {
          name: "instruments-service",
          tier: "core",
          category: "data",
          status: "healthy",
          coveragePct: 99.2,
          lastRun: "5s ago",
          shardsComplete: 48,
          shardsTotal: 48,
          shardsFailed: 0,
          latencyP50: 8,
          latencyP99: 28,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.99%",
          version: "0.4.12",
          cpuPct: 15,
          memoryPct: 30,
          connections: 12,
          queueDepth: 0,
        },
        {
          name: "market-tick-data-service",
          tier: "core",
          category: "data",
          status: "healthy",
          coveragePct: 98.8,
          lastRun: "2s ago",
          shardsComplete: 120,
          shardsTotal: 122,
          shardsFailed: 0,
          latencyP50: 5,
          latencyP99: 22,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.99%",
          version: "0.3.8",
          cpuPct: 45,
          memoryPct: 55,
          connections: 64,
          queueDepth: 1,
        },
        {
          name: "features-service",
          tier: "core",
          category: "data",
          status: "healthy",
          coveragePct: 97.5,
          lastRun: "12s ago",
          shardsComplete: 95,
          shardsTotal: 98,
          shardsFailed: 1,
          latencyP50: 22,
          latencyP99: 85,
          errorRate: 0.3,
          lastHealthCheck: now,
          uptime: "99.95%",
          version: "0.2.9",
          cpuPct: 58,
          memoryPct: 62,
          connections: 18,
          queueDepth: 4,
        },
        {
          name: "strategy-service",
          tier: "critical",
          category: "trading",
          status: "healthy",
          coveragePct: 100,
          lastRun: "8s ago",
          shardsComplete: 24,
          shardsTotal: 24,
          shardsFailed: 0,
          latencyP50: 18,
          latencyP99: 62,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.99%",
          version: "0.5.1",
          cpuPct: 28,
          memoryPct: 41,
          connections: 22,
          queueDepth: 0,
          requiredForTier: "Tier 1",
        },
        {
          name: "execution-service",
          tier: "critical",
          category: "trading",
          status: "healthy",
          coveragePct: 100,
          lastRun: "1s ago",
          shardsComplete: 16,
          shardsTotal: 16,
          shardsFailed: 0,
          latencyP50: 12,
          latencyP99: 45,
          errorRate: 0.1,
          lastHealthCheck: now,
          uptime: "99.98%",
          version: "0.6.3",
          cpuPct: 34,
          memoryPct: 52,
          connections: 48,
          queueDepth: 3,
          requiredForTier: "Tier 1",
        },
        {
          name: "risk-monitoring-service",
          tier: "critical",
          category: "risk",
          status: "warning",
          coveragePct: 95.0,
          lastRun: "25s ago",
          shardsComplete: 18,
          shardsTotal: 20,
          shardsFailed: 2,
          latencyP50: 35,
          latencyP99: 180,
          errorRate: 1.2,
          lastHealthCheck: now,
          uptime: "99.7%",
          version: "0.3.4",
          cpuPct: 72,
          memoryPct: 68,
          connections: 31,
          queueDepth: 12,
          requiredForTier: "Tier 1",
          lastError: "Upstream timeout from position-monitor",
        },
        {
          name: "alerting-service",
          tier: "support",
          category: "ops",
          status: "healthy",
          coveragePct: 100,
          lastRun: "3s ago",
          shardsComplete: 8,
          shardsTotal: 8,
          shardsFailed: 0,
          latencyP50: 10,
          latencyP99: 38,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.99%",
          version: "0.4.5",
          cpuPct: 12,
          memoryPct: 22,
          connections: 6,
          queueDepth: 0,
        },
        {
          name: "position-monitor-service",
          tier: "support",
          category: "risk",
          status: "healthy",
          coveragePct: 99.5,
          lastRun: "4s ago",
          shardsComplete: 32,
          shardsTotal: 32,
          shardsFailed: 0,
          latencyP50: 20,
          latencyP99: 65,
          errorRate: 0.2,
          lastHealthCheck: now,
          uptime: "99.95%",
          version: "0.2.1",
          cpuPct: 38,
          memoryPct: 45,
          connections: 14,
          queueDepth: 2,
        },
        {
          name: "features-onchain-service",
          tier: "core",
          category: "data",
          status: "healthy",
          coveragePct: 96.8,
          lastRun: "15s ago",
          shardsComplete: 28,
          shardsTotal: 30,
          shardsFailed: 0,
          latencyP50: 30,
          latencyP99: 120,
          errorRate: 0.5,
          lastHealthCheck: now,
          uptime: "99.9%",
          version: "0.1.7",
          cpuPct: 40,
          memoryPct: 48,
          connections: 8,
          queueDepth: 2,
        },
        {
          name: "ml-inference-service",
          tier: "core",
          category: "ml",
          status: "healthy",
          coveragePct: 99.0,
          lastRun: "6s ago",
          shardsComplete: 10,
          shardsTotal: 10,
          shardsFailed: 0,
          latencyP50: 15,
          latencyP99: 55,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.97%",
          version: "0.2.4",
          cpuPct: 65,
          memoryPct: 72,
          connections: 10,
          queueDepth: 0,
        },
        {
          name: "reporting-service",
          tier: "support",
          category: "ops",
          status: "healthy",
          coveragePct: 100,
          lastRun: "10s ago",
          shardsComplete: 4,
          shardsTotal: 4,
          shardsFailed: 0,
          latencyP50: 25,
          latencyP99: 95,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.98%",
          version: "0.3.2",
          cpuPct: 20,
          memoryPct: 35,
          connections: 8,
          queueDepth: 0,
        },
        {
          name: "deployment-service",
          tier: "support",
          category: "ops",
          status: "healthy",
          coveragePct: 100,
          lastRun: "30s ago",
          shardsComplete: 2,
          shardsTotal: 2,
          shardsFailed: 0,
          latencyP50: 40,
          latencyP99: 150,
          errorRate: 0,
          lastHealthCheck: now,
          uptime: "99.99%",
          version: "0.5.0",
          cpuPct: 8,
          memoryPct: 18,
          connections: 3,
          queueDepth: 0,
        },
      ],
    });
  }
  if (route === "/api/service-status/feature-freshness") {
    const now = new Date().toISOString();
    const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
    const tenMinAgo = new Date(Date.now() - 600000).toISOString();
    return json({
      data: [
        {
          service: "features-service",
          freshness: 8,
          sla: 30,
          status: "healthy",
          region: "asia-northeast1",
          lastUpdate: now,
        },
        {
          service: "features-service",
          freshness: 12,
          sla: 30,
          status: "healthy",
          region: "us-central1",
          lastUpdate: now,
        },
        {
          service: "features-onchain-service",
          freshness: 25,
          sla: 30,
          status: "healthy",
          region: "asia-northeast1",
          lastUpdate: fiveMinAgo,
        },
        {
          service: "market-tick-data-service",
          freshness: 2,
          sla: 10,
          status: "healthy",
          region: "asia-northeast1",
          lastUpdate: now,
        },
        {
          service: "market-tick-data-service",
          freshness: 5,
          sla: 10,
          status: "healthy",
          region: "us-central1",
          lastUpdate: now,
        },
        {
          service: "instruments-service",
          freshness: 15,
          sla: 60,
          status: "healthy",
          region: "Global",
          lastUpdate: fiveMinAgo,
        },
        {
          service: "ml-inference-service",
          freshness: 45,
          sla: 30,
          status: "degraded",
          region: "asia-northeast1",
          lastUpdate: tenMinAgo,
        },
        {
          service: "position-monitor",
          freshness: 120,
          sla: 30,
          status: "unhealthy",
          region: "asia-northeast1",
          lastUpdate: tenMinAgo,
        },
      ],
    });
  }
  if (route === "/api/service-status/activity") {
    const now = new Date().toISOString();
    return json({
      data: [
        {
          id: "log-001",
          service: "execution-service",
          severity: "info",
          message: "Order batch processed: 24 orders filled",
          timestamp: now,
          correlationId: "corr-a1b2c3",
        },
        {
          id: "log-002",
          service: "risk-and-exposure-service",
          severity: "warn",
          message: "Position limit 85% utilized for strategy trend-follow-v3",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          correlationId: "corr-d4e5f6",
        },
        {
          id: "log-003",
          service: "position-monitor",
          severity: "error",
          message: "Connection pool exhausted — reconnecting",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          correlationId: "corr-g7h8i9",
        },
        {
          id: "log-004",
          service: "strategy-service",
          severity: "info",
          message: "Signal generated: momentum_breakout LONG BTC-USDT",
          timestamp: new Date(Date.now() - 180000).toISOString(),
          correlationId: "corr-j0k1l2",
        },
        {
          id: "log-005",
          service: "alerting-service",
          severity: "info",
          message: "Telegram notification sent: daily PnL summary",
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "log-006",
          service: "features-service",
          severity: "info",
          message: "Feature batch published: 12 features, avg latency 8ms",
          timestamp: new Date(Date.now() - 420000).toISOString(),
        },
        {
          id: "log-007",
          service: "position-monitor",
          severity: "critical",
          message: "Health check failed 3 consecutive times",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          correlationId: "corr-m3n4o5",
        },
        {
          id: "log-008",
          service: "market-tick-data-service",
          severity: "info",
          message: "WebSocket reconnected to Binance after 2s gap",
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
      ],
      totalToday: 142,
    });
  }
  if (route === "/api/service-status/services") {
    return json([
      {
        name: "instruments-service",
        version: "0.4.12",
        uptime: "14d 6h",
        status: "running",
      },
      {
        name: "market-tick-data-service",
        version: "0.3.8",
        uptime: "14d 6h",
        status: "running",
      },
      {
        name: "strategy-service",
        version: "0.5.1",
        uptime: "14d 6h",
        status: "running",
      },
      {
        name: "execution-service",
        version: "0.6.3",
        uptime: "14d 6h",
        status: "running",
      },
    ]);
  }

  // --- Audit ---
  if (route === "/api/audit/events")
    return json([
      {
        id: "evt-001",
        timestamp: "2026-03-23T10:30:00Z",
        actor: "admin@odum.internal",
        action: "order.placed",
        entity_type: "order",
        entity_id: "ord-001",
        correlation_id: "corr-ord-001",
        details: "BTC-PERP buy 2.5 @ $42,150 on Binance",
      },
      {
        id: "evt-002",
        timestamp: "2026-03-23T10:30:01Z",
        actor: "system",
        action: "order.filled",
        entity_type: "order",
        entity_id: "ord-001",
        correlation_id: "corr-ord-001",
        details: "Filled 2.5 BTC-PERP @ avg $42,148.50",
      },
      {
        id: "evt-003",
        timestamp: "2026-03-23T10:32:00Z",
        actor: "system",
        action: "position.updated",
        entity_type: "position",
        entity_id: "pos-btc-001",
        correlation_id: "corr-ord-001",
        details: "BTC-PERP position: 0 → 2.5 LONG",
      },
      {
        id: "evt-004",
        timestamp: "2026-03-23T10:35:00Z",
        actor: "system",
        action: "alert.triggered",
        entity_type: "alert",
        entity_id: "alrt-001",
        correlation_id: "corr-alrt-001",
        details: "Margin utilisation 78% on Binance",
      },
      {
        id: "evt-005",
        timestamp: "2026-03-23T10:36:00Z",
        actor: "admin@odum.internal",
        action: "alert.acknowledged",
        entity_type: "alert",
        entity_id: "alrt-001",
        correlation_id: "corr-alrt-001",
        details: "Admin acknowledged margin warning",
      },
      {
        id: "evt-006",
        timestamp: "2026-03-23T09:00:00Z",
        actor: "system",
        action: "reconciliation.break_detected",
        entity_type: "break",
        entity_id: "BRK-001",
        correlation_id: "corr-brk-001",
        details: "Position mismatch: BTC-PERP internal=2.5 vs exchange=2.3",
      },
      {
        id: "evt-007",
        timestamp: "2026-03-23T08:00:00Z",
        actor: "pm@alphacapital.com",
        action: "access.requested",
        entity_type: "access_request",
        entity_id: "req-001",
        correlation_id: "corr-req-001",
        details: "Requested execution-full, ml-full",
      },
      {
        id: "evt-008",
        timestamp: "2026-03-23T07:00:00Z",
        actor: "admin@odum.internal",
        action: "access.approved",
        entity_type: "access_request",
        entity_id: "req-003",
        correlation_id: "corr-req-003",
        details: "Approved reporting access for Alpha Ops Manager",
      },
      {
        id: "evt-009",
        timestamp: "2026-03-22T16:00:00Z",
        actor: "system",
        action: "strategy.deployed",
        entity_type: "strategy",
        entity_id: "DEFI_ETH_BASIS_HUF_1H",
        correlation_id: "corr-strat-001",
        details: "ETH Basis strategy promoted to live",
      },
      {
        id: "evt-010",
        timestamp: "2026-03-22T14:00:00Z",
        actor: "system",
        action: "report.generated",
        entity_type: "report",
        entity_id: "rpt-001",
        correlation_id: "corr-rpt-001",
        details: "Monthly executive summary generated for March 2026",
      },
      {
        id: "evt-011",
        timestamp: "2026-03-22T12:00:00Z",
        actor: "system",
        action: "settlement.confirmed",
        entity_type: "settlement",
        entity_id: "stl-001",
        correlation_id: "corr-stl-001",
        details: "BTC-PERP settlement confirmed on Binance",
      },
      {
        id: "evt-012",
        timestamp: "2026-03-22T10:00:00Z",
        actor: "system",
        action: "model.deployed",
        entity_type: "ml_model",
        entity_id: "mdl-btc-v3",
        correlation_id: "corr-mdl-001",
        details: "BTC direction model v3 deployed to inference",
      },
    ]);
  if (route === "/api/audit/compliance") return json({ status: "compliant", checks: [] });
  if (route === "/api/audit/data-health") return json({ status: "healthy", gaps: 0 });
  if (route === "/api/audit/batch-jobs") return json([]);

  // --- Users / Orgs ---
  if (route === "/api/users/organizations") {
    return json({
      data: ORGANIZATIONS.map((o, i) => ({
        ...o,
        status: "active",
        memberCount: 3 + i * 2,
        subscriptionTier: i === 0 ? "enterprise" : i === 1 ? "institutional" : "professional",
        monthlyFee: [0, 15000, 8000][i] ?? 5000,
        apiKeys: 2 + i,
        usageGb: 12 + i * 8,
      })),
    });
  }
  if (route.startsWith("/api/users/organizations/")) return json({ data: [] });
  if (route === "/api/users/subscriptions") {
    return json({
      data: ORGANIZATIONS.map((o, i) => ({
        orgId: o.id,
        tier: i === 0 ? "enterprise" : i === 1 ? "institutional" : "professional",
        entitlements:
          i === 0 ? ["*"] : i === 1 ? ["data-pro", "execution-full", "strategy-full", "reporting"] : ["data-basic"],
        startDate: "2025-06-01",
        renewalDate: "2026-06-01",
        monthlyFee: [0, 15000, 8000][i] ?? 5000,
      })),
    });
  }

  // --- Config ---
  if (route === "/api/config/mandates") return json([]);
  if (route === "/api/config/fee-schedules") return json([]);
  if (route === "/api/config/reload") return json({ ok: true });
  if (route === "/api/config/strategies") return json({ ok: true });

  // --- Documents ---
  if (route === "/api/documents/list") return json([]);

  // --- Deployment ---
  if (route === "/api/deployment/services") return json([]);
  if (route === "/api/deployment/deployments") return json([]);
  if (route === "/api/deployment/builds") return json([]);

  // --- News ---
  if (route === "/api/news/feed") return json({ data: [] });

  // --- Economic / corporate calendar (hooks/api/use-calendar) ---
  if (route === "/api/calendar/economic-results") {
    return json({
      data: [
        {
          id: "eco-nfp",
          event_type: "NFP",
          release_date: getToday(),
          release_time_utc: "13:30:00Z",
          actual_value: 216000,
          previous_value: 227000,
          unit: "jobs (000s)",
          status: "released" as const,
        },
        {
          id: "eco-cpi",
          event_type: "CPI m/m",
          release_date: getToday(),
          release_time_utc: "12:30:00Z",
          actual_value: 0.2,
          previous_value: 0.3,
          unit: "%",
          status: "upcoming" as const,
        },
      ],
    });
  }
  if (route === "/api/calendar/corporate-actions") {
    return json({
      data: [
        {
          id: "ca-aapl-div",
          ticker: "AAPL",
          event_type: "dividend" as const,
          event_date: getToday(),
          amount: 0.25,
          actual_eps: null,
          estimated_eps: null,
          status: "confirmed" as const,
        },
        {
          id: "ca-msft-earn",
          ticker: "MSFT",
          event_type: "earnings" as const,
          event_date: getToday(),
          amount: null,
          actual_eps: null,
          estimated_eps: 3.12,
          status: "upcoming" as const,
        },
      ],
    });
  }

  // --- Chat ---
  if (route.startsWith("/api/chat")) return json({ message: "Mock mode — chat unavailable" });

  // --- Permission Catalogue ---

  const MOCK_PERMISSION_CATALOGUE = {
    domains: [
      {
        key: "platform",
        label: "Platform Services",
        description: "Which app sections accessible",
        icon: "Shield",
        categories: [
          {
            key: "services",
            label: "Service Access",
            description: "UI and API domain access",
            permissions: [
              {
                key: "data",
                label: "Data",
                description: "Instrument catalogue, market data",
                internal_only: false,
              },
              {
                key: "research",
                label: "Research",
                description: "ML, strategy, features",
                internal_only: false,
              },
              {
                key: "trading",
                label: "Trading",
                description: "Live trading terminal",
                internal_only: false,
              },
              {
                key: "execution",
                label: "Execution",
                description: "TCA, algos, venues",
                internal_only: false,
              },
              {
                key: "observe",
                label: "Observe",
                description: "Risk, alerts, health",
                internal_only: false,
              },
              {
                key: "manage",
                label: "Manage",
                description: "Clients, mandates, compliance",
                internal_only: false,
              },
              {
                key: "reports",
                label: "Reports",
                description: "P&L, settlement, regulatory",
                internal_only: false,
              },
              {
                key: "presentations",
                label: "Presentations",
                description: "Investor relations, pitch decks, fund materials",
                internal_only: false,
              },
            ],
          },
          {
            key: "admin",
            label: "Admin Access",
            description: "Internal operations",
            permissions: [
              {
                key: "admin-dashboard",
                label: "Admin Dashboard",
                description: "System admin",
                internal_only: true,
              },
              {
                key: "user-management",
                label: "User Management",
                description: "User lifecycle",
                internal_only: true,
              },
              {
                key: "devops",
                label: "DevOps",
                description: "Deployments",
                internal_only: true,
              },
            ],
          },
        ],
      },
      {
        key: "data",
        label: "Data Access",
        description: "Venues, instruments, data types",
        icon: "Database",
        categories: [
          {
            key: "venues",
            label: "Venues",
            description: "Exchange and data source access",
            permissions: [
              {
                key: "binance",
                label: "Binance",
                description: "CeFi exchange",
                internal_only: false,
              },
              {
                key: "coinbase",
                label: "Coinbase",
                description: "CeFi exchange",
                internal_only: false,
              },
              {
                key: "bybit",
                label: "Bybit",
                description: "CeFi exchange",
                internal_only: false,
              },
              {
                key: "okx",
                label: "OKX",
                description: "CeFi exchange",
                internal_only: false,
              },
              {
                key: "deribit",
                label: "Deribit",
                description: "CeFi derivatives",
                internal_only: false,
              },
              {
                key: "databento",
                label: "Databento",
                description: "TradFi data",
                internal_only: false,
              },
              {
                key: "tardis",
                label: "Tardis",
                description: "TradFi tick data",
                internal_only: false,
              },
              {
                key: "yahoo-finance",
                label: "Yahoo Finance",
                description: "TradFi equities",
                internal_only: false,
              },
              {
                key: "aave-v3",
                label: "Aave V3",
                description: "DeFi lending",
                internal_only: false,
              },
              {
                key: "uniswap-v3",
                label: "Uniswap V3",
                description: "DeFi AMM",
                internal_only: false,
              },
              {
                key: "hyperliquid",
                label: "Hyperliquid",
                description: "Onchain perps",
                internal_only: false,
              },
              {
                key: "polymarket",
                label: "Polymarket",
                description: "Prediction market",
                internal_only: false,
              },
              {
                key: "kalshi",
                label: "Kalshi",
                description: "Prediction market (regulated)",
                internal_only: false,
              },
              {
                key: "betfair",
                label: "Betfair",
                description: "Sports exchange",
                internal_only: false,
              },
              {
                key: "pinnacle",
                label: "Pinnacle",
                description: "Sports betting",
                internal_only: false,
              },
              {
                key: "ibkr",
                label: "Interactive Brokers",
                description: "TradFi multi-asset",
                internal_only: false,
              },
            ],
          },
          {
            key: "market-categories",
            label: "Market Categories",
            description: "Asset class access",
            permissions: [
              {
                key: "cefi",
                label: "CeFi",
                description: "Centralised finance",
                internal_only: false,
              },
              {
                key: "tradfi",
                label: "TradFi",
                description: "Traditional finance",
                internal_only: false,
              },
              {
                key: "defi",
                label: "DeFi",
                description: "Decentralised finance",
                internal_only: false,
              },
              {
                key: "sports",
                label: "Sports",
                description: "Sports betting",
                internal_only: false,
              },
              {
                key: "prediction",
                label: "Prediction",
                description: "Prediction markets",
                internal_only: false,
              },
            ],
          },
          {
            key: "data-types",
            label: "Data Types",
            description: "Types of market data",
            permissions: [
              {
                key: "tick-ohlcv",
                label: "Tick OHLCV",
                description: "Open, high, low, close, volume",
                internal_only: false,
              },
              {
                key: "daily-candles",
                label: "Daily Candles",
                description: "End-of-day aggregates",
                internal_only: false,
              },
              {
                key: "order-book",
                label: "Order Book",
                description: "Level 2 depth",
                internal_only: false,
              },
              {
                key: "processed-data",
                label: "Processed Data",
                description: "Cleaned/normalised",
                internal_only: false,
              },
              {
                key: "features",
                label: "Features",
                description: "ML features and signals",
                internal_only: false,
              },
            ],
          },
        ],
      },
      {
        key: "execution",
        label: "Execution & Trading",
        description: "Algos, instructions, trading gates",
        icon: "Zap",
        categories: [
          {
            key: "trading-gate",
            label: "Trading Gates",
            description: "Hard access controls",
            permissions: [
              {
                key: "can-trade",
                label: "Can Trade",
                description: "Permission to submit orders",
                internal_only: false,
              },
              {
                key: "can-trade-live",
                label: "Can Trade Live",
                description: "Live market execution",
                internal_only: false,
              },
              {
                key: "paper-trading-only",
                label: "Paper Trading Only",
                description: "Simulated only",
                internal_only: false,
              },
            ],
          },
          {
            key: "algos",
            label: "Execution Algorithms",
            description: "Available algo strategies",
            permissions: [
              {
                key: "twap",
                label: "TWAP",
                description: "Time-weighted average price",
                internal_only: false,
              },
              {
                key: "vwap",
                label: "VWAP",
                description: "Volume-weighted average price",
                internal_only: false,
              },
              {
                key: "sor",
                label: "SOR",
                description: "Smart order routing",
                internal_only: false,
              },
              {
                key: "iceberg",
                label: "Iceberg",
                description: "Hidden quantity",
                internal_only: false,
              },
              {
                key: "pov",
                label: "POV",
                description: "Participation of volume",
                internal_only: false,
              },
              {
                key: "passive-aggressive",
                label: "Passive Aggressive",
                description: "Adaptive spread capture",
                internal_only: false,
              },
              {
                key: "adaptive-twap",
                label: "Adaptive TWAP",
                description: "Market-aware TWAP",
                internal_only: false,
              },
              {
                key: "almgren-chriss",
                label: "Almgren-Chriss",
                description: "Optimal execution",
                internal_only: false,
              },
            ],
          },
          {
            key: "instruction-types",
            label: "Instruction Types",
            description: "Order types allowed",
            permissions: [
              {
                key: "trade",
                label: "Trade",
                description: "Standard trade",
                internal_only: false,
              },
              {
                key: "swap",
                label: "Swap",
                description: "DeFi swap",
                internal_only: false,
              },
              {
                key: "futures-roll",
                label: "Futures Roll",
                description: "Roll futures position",
                internal_only: false,
              },
              {
                key: "options-combo",
                label: "Options Combo",
                description: "Multi-leg options",
                internal_only: false,
              },
              {
                key: "add-liquidity",
                label: "Add Liquidity",
                description: "LP provision",
                internal_only: false,
              },
            ],
          },
        ],
      },
      {
        key: "internal-services",
        label: "Internal Provisioning",
        description: "Slack, GitHub, M365, GCP, AWS",
        icon: "Lock",
        categories: [
          {
            key: "slack",
            label: "Slack",
            description: "Workspace and channel access",
            permissions: [
              {
                key: "workspace-access",
                label: "Workspace Access",
                description: "Join Slack workspace",
                internal_only: true,
              },
              {
                key: "channel:engineering",
                label: "#engineering",
                description: "Engineering channel",
                internal_only: true,
              },
              {
                key: "channel:ops",
                label: "#ops",
                description: "Operations channel",
                internal_only: true,
              },
              {
                key: "channel:trading",
                label: "#trading",
                description: "Trading channel",
                internal_only: true,
              },
              {
                key: "channel:alerts",
                label: "#alerts",
                description: "System alerts",
                internal_only: true,
              },
            ],
          },
          {
            key: "github",
            label: "GitHub",
            description: "Org and team membership",
            permissions: [
              {
                key: "org-membership",
                label: "Org Membership",
                description: "Join GitHub org",
                internal_only: true,
              },
              {
                key: "team:engineering",
                label: "Team: Engineering",
                description: "Engineering team",
                internal_only: true,
              },
              {
                key: "team:ops",
                label: "Team: Ops",
                description: "Operations team",
                internal_only: true,
              },
              {
                key: "team:platform",
                label: "Team: Platform",
                description: "Platform team",
                internal_only: true,
              },
            ],
          },
          {
            key: "microsoft365",
            label: "Microsoft 365",
            description: "Email and productivity",
            permissions: [
              {
                key: "account",
                label: "M365 Account",
                description: "Create M365 account",
                internal_only: true,
              },
              {
                key: "email",
                label: "Email",
                description: "Outlook email",
                internal_only: true,
              },
              {
                key: "teams-access",
                label: "Teams",
                description: "Microsoft Teams",
                internal_only: true,
              },
            ],
          },
          {
            key: "gcp",
            label: "GCP",
            description: "Google Cloud Platform",
            permissions: [
              {
                key: "project-access",
                label: "Project Access",
                description: "GCP project",
                internal_only: true,
              },
              {
                key: "iam:viewer",
                label: "IAM Viewer",
                description: "Read-only access",
                internal_only: true,
              },
              {
                key: "iam:editor",
                label: "IAM Editor",
                description: "Read-write access",
                internal_only: true,
              },
              {
                key: "iam:admin",
                label: "IAM Admin",
                description: "Full admin access",
                internal_only: true,
              },
            ],
          },
          {
            key: "aws",
            label: "AWS",
            description: "Amazon Web Services",
            permissions: [
              {
                key: "iam-user",
                label: "IAM User",
                description: "AWS IAM user",
                internal_only: true,
              },
              {
                key: "sso-access",
                label: "SSO Access",
                description: "AWS SSO login",
                internal_only: true,
              },
              {
                key: "permission-set:power-user",
                label: "Power User",
                description: "Full dev access",
                internal_only: true,
              },
              {
                key: "permission-set:read-only",
                label: "Read Only",
                description: "View-only access",
                internal_only: true,
              },
            ],
          },
        ],
      },
      {
        key: "research",
        label: "Research & ML",
        description: "ML models, strategies, signals",
        icon: "FlaskConical",
        categories: [
          {
            key: "ml",
            label: "Machine Learning",
            description: "Model lifecycle",
            permissions: [
              {
                key: "model-training",
                label: "Model Training",
                description: "Train ML models",
                internal_only: false,
              },
              {
                key: "experiments",
                label: "Experiments",
                description: "Run experiments",
                internal_only: false,
              },
              {
                key: "feature-store",
                label: "Feature Store",
                description: "Access feature store",
                internal_only: false,
              },
              {
                key: "model-registry",
                label: "Model Registry",
                description: "Browse models",
                internal_only: false,
              },
              {
                key: "deployment",
                label: "Model Deployment",
                description: "Deploy to production",
                internal_only: false,
              },
            ],
          },
          {
            key: "strategy",
            label: "Strategy",
            description: "Backtesting and strategy management",
            permissions: [
              {
                key: "backtesting",
                label: "Backtesting",
                description: "Run backtests",
                internal_only: false,
              },
              {
                key: "candidates",
                label: "Candidates",
                description: "Strategy candidates",
                internal_only: false,
              },
              {
                key: "handoff",
                label: "Handoff",
                description: "Promote to live",
                internal_only: false,
              },
            ],
          },
        ],
      },
      {
        key: "reporting",
        label: "Reporting & Regulatory",
        description: "P&L, settlement, compliance",
        icon: "FileText",
        categories: [
          {
            key: "reports",
            label: "Reports",
            description: "Financial reporting",
            permissions: [
              {
                key: "pnl-attribution",
                label: "P&L Attribution",
                description: "Profit & loss breakdown",
                internal_only: false,
              },
              {
                key: "settlement",
                label: "Settlement",
                description: "Trade settlement",
                internal_only: false,
              },
              {
                key: "reconciliation",
                label: "Reconciliation",
                description: "Book reconciliation",
                internal_only: false,
              },
              {
                key: "regulatory",
                label: "Regulatory",
                description: "MiFID/FCA reporting",
                internal_only: false,
              },
              {
                key: "client-reporting",
                label: "Client Reporting",
                description: "Client-facing reports",
                internal_only: false,
              },
            ],
          },
        ],
      },
      {
        key: "regulatory-onboarding",
        label: "Regulatory & Onboarding",
        description: "Client onboarding, regulatory umbrella, fund structures",
        icon: "Shield",
        categories: [
          {
            key: "onboarding",
            label: "Client Onboarding",
            description: "Onboarding programme access",
            permissions: [
              {
                key: "regulatory-umbrella",
                label: "Regulatory Umbrella (AR)",
                description: "FCA Appointed Representative services",
                internal_only: false,
              },
              {
                key: "investment-management",
                label: "Investment Management",
                description: "FCA-authorised investment management",
                internal_only: false,
              },
              {
                key: "fund-crypto-spot",
                label: "Fund Structure — Crypto Spot",
                description: "Pure crypto spot fund vehicles",
                internal_only: false,
              },
              {
                key: "fund-derivatives-tradfi",
                label: "Fund Structure — Derivatives & TradFi (EU Regulated)",
                description: "Crypto derivatives, options, futures, traditional markets — EU-regulated fund vehicles",
                internal_only: false,
              },
              {
                key: "advisory-engagement",
                label: "Advisory Engagement",
                description: "Strategic advisory role under supervision",
                internal_only: false,
              },
            ],
          },
          {
            key: "documents",
            label: "Document Types",
            description: "Required onboarding documents",
            permissions: [
              {
                key: "proof-of-address",
                label: "Proof of Address",
                description: "Utility bill, bank statement",
                internal_only: false,
              },
              {
                key: "identity",
                label: "Identity Document",
                description: "Passport, national ID",
                internal_only: false,
              },
              {
                key: "source-of-funds",
                label: "Source of Funds",
                description: "Wealth origin declaration",
                internal_only: false,
              },
              {
                key: "wealth-declaration",
                label: "Wealth Self-Declaration",
                description: "Net worth self-certification",
                internal_only: false,
              },
              {
                key: "management-agreement",
                label: "Management Agreement",
                description: "Signed advisory/management agreement",
                internal_only: false,
              },
              {
                key: "invoice-or-tax",
                label: "Invoicing / Tax",
                description: "W-9, VAT registration, invoice templates",
                internal_only: false,
              },
            ],
          },
          {
            key: "tiers",
            label: "Subscription Tiers",
            description: "Service tier levels",
            permissions: [
              {
                key: "tier-basic",
                label: "Basic",
                description: "Essential compliance and reporting",
                internal_only: false,
              },
              {
                key: "tier-professional",
                label: "Professional",
                description: "Full compliance + execution",
                internal_only: false,
              },
              {
                key: "tier-institutional",
                label: "Institutional",
                description: "Multi-strategy + fund operations",
                internal_only: false,
              },
              {
                key: "tier-enterprise",
                label: "Enterprise",
                description: "Custom engagement + dedicated support",
                internal_only: false,
              },
            ],
          },
        ],
      },
      {
        key: "presentations",
        label: "Presentations & Investor Relations",
        description: "Pitch decks, fund materials, investor updates",
        icon: "Presentation",
        categories: [
          {
            key: "decks",
            label: "Pitch Decks & Materials",
            description: "Presentation materials and fund documents",
            permissions: [
              {
                key: "pitch-deck",
                label: "Pitch Deck",
                description: "Main investor pitch deck",
                internal_only: false,
              },
              {
                key: "fund-factsheet",
                label: "Fund Factsheet",
                description: "Fund performance factsheet",
                internal_only: false,
              },
              {
                key: "strategy-overview",
                label: "Strategy Overview",
                description: "Strategy methodology",
                internal_only: false,
              },
              {
                key: "risk-framework",
                label: "Risk Framework",
                description: "Risk management framework",
                internal_only: false,
              },
              {
                key: "compliance-pack",
                label: "Compliance Pack",
                description: "Regulatory documentation",
                internal_only: false,
              },
              {
                key: "tech-architecture",
                label: "Tech Architecture",
                description: "Technology architecture",
                internal_only: true,
              },
            ],
          },
          {
            key: "investor-portal",
            label: "Investor Portal",
            description: "Investor-facing portal and updates",
            permissions: [
              {
                key: "investor-dashboard",
                label: "Investor Dashboard",
                description: "Live investor performance",
                internal_only: false,
              },
              {
                key: "quarterly-letters",
                label: "Quarterly Letters",
                description: "Quarterly investor updates",
                internal_only: false,
              },
              {
                key: "monthly-reports",
                label: "Monthly Reports",
                description: "Monthly performance reports",
                internal_only: false,
              },
              {
                key: "nav-statements",
                label: "NAV Statements",
                description: "Net asset value statements",
                internal_only: false,
              },
              {
                key: "capital-calls",
                label: "Capital Calls & Distributions",
                description: "Capital call notices",
                internal_only: false,
              },
            ],
          },
          {
            key: "meetings",
            label: "Meetings & Events",
            description: "Investor meetings and events",
            permissions: [
              {
                key: "annual-meeting",
                label: "Annual Meeting",
                description: "Annual investor meeting",
                internal_only: false,
              },
              {
                key: "quarterly-review",
                label: "Quarterly Review",
                description: "Quarterly review call",
                internal_only: false,
              },
              {
                key: "ad-hoc-meetings",
                label: "Ad-Hoc Meetings",
                description: "Request meeting with team",
                internal_only: false,
              },
              {
                key: "due-diligence",
                label: "Due Diligence",
                description: "DD materials and sessions",
                internal_only: false,
              },
            ],
          },
          {
            key: "data-room",
            label: "Data Room",
            description: "Secure document sharing",
            permissions: [
              {
                key: "data-room-read",
                label: "Data Room (Read)",
                description: "Read access to data room",
                internal_only: false,
              },
              {
                key: "data-room-upload",
                label: "Data Room (Upload)",
                description: "Upload documents",
                internal_only: true,
              },
              {
                key: "data-room-admin",
                label: "Data Room (Admin)",
                description: "Manage data room",
                internal_only: true,
              },
            ],
          },
        ],
      },
      {
        key: "org-scoping",
        label: "Organisation Scoping",
        description: "Org-level access boundaries",
        icon: "Building2",
        categories: [
          {
            key: "subscription-tier",
            label: "Subscription Tier",
            description: "Org subscription level",
            permissions: [
              {
                key: "basic",
                label: "Basic",
                description: "Entry-level access",
                internal_only: false,
              },
              {
                key: "pro",
                label: "Pro",
                description: "Professional access",
                internal_only: false,
              },
              {
                key: "enterprise",
                label: "Enterprise",
                description: "Full enterprise",
                internal_only: false,
              },
              {
                key: "internal",
                label: "Internal",
                description: "Internal (wildcard)",
                internal_only: true,
              },
            ],
          },
        ],
      },
    ],
  };

  if (route === "/api/auth/catalogue") {
    return json(MOCK_PERMISSION_CATALOGUE);
  }
  if (route.match(/^\/api\/auth\/catalogue\/search\/[^/]+$/)) {
    const queryStr = decodeURIComponent(route.split("/").pop() ?? "").toLowerCase();
    const results: Array<{
      domain: string;
      domain_label: string;
      category: string;
      category_label: string;
      key: string;
      label: string;
      description: string;
      internal_only: string;
    }> = [];
    for (const domain of MOCK_PERMISSION_CATALOGUE.domains) {
      for (const cat of domain.categories) {
        for (const perm of cat.permissions) {
          if (
            perm.key.toLowerCase().includes(queryStr) ||
            perm.label.toLowerCase().includes(queryStr) ||
            perm.description.toLowerCase().includes(queryStr)
          ) {
            results.push({
              domain: domain.key,
              domain_label: domain.label,
              category: cat.key,
              category_label: cat.label,
              key: perm.key,
              label: perm.label,
              description: perm.description,
              internal_only: perm.internal_only ? "True" : "False",
            });
          }
        }
      }
    }
    return json({ results, total: results.length });
  }
  if (route.match(/^\/api\/auth\/catalogue\/[^/]+$/) && !route.includes("search")) {
    const domainKey = route.split("/").pop();
    const domain = MOCK_PERMISSION_CATALOGUE.domains.find((d) => d.key === domainKey);
    if (domain) return json({ domain });
    return json({ error: "Domain not found" });
  }

  // --- Provisioning (user lifecycle management) — stateful via mock-provisioning-state.ts ---

  if (route === "/api/auth/provisioning/users") {
    const { users } = getProvisioningState();
    return json({ users, total: users.length });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+\/offboard$/)) {
    const userId = route.split("/").at(-2);
    if (!userId) return json({ error: "Missing user id" });
    const offboardedServices: Record<string, string> = {
      github: "not_applicable",
      slack: "not_applicable",
      microsoft365: "not_applicable",
      gcp: "not_applicable",
      aws: "not_applicable",
      portal: "not_applicable",
    };
    const updated = updateUser(userId, {
      status: "offboarded",
      services: offboardedServices,
    });
    return json({ user: updated ?? { error: "User not found" } });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+\/reprovision$/)) {
    const userId = route.split("/").at(-2);
    return json({ execution_name: `mock-reprovision-${userId}-${Date.now()}` });
  }
  if (
    route.match(/^\/api\/auth\/provisioning\/users\/[^/]+$/) &&
    !route.includes("onboard") &&
    !route.includes("quota")
  ) {
    const userId = route.split("/").pop();
    if (opts?.method === "PUT") {
      const body = opts.body ? JSON.parse(opts.body as string) : {};
      const updated = updateUser(userId ?? "", body as Partial<MockUser>);
      return json({ user: updated ?? { error: "User not found" } });
    }
    const { users } = getProvisioningState();
    const user = users.find((u) => u.firebase_uid === userId || u.id === userId);
    return json({ user: user ?? users[0] });
  }
  if (route === "/api/auth/provisioning/users/onboard") {
    const body = opts?.body ? JSON.parse(opts.body as string) : {};
    const now = new Date().toISOString();
    const newUser: MockUser = {
      id: (body.email ?? "new").split("@")[0],
      firebase_uid: `uid-${Date.now()}`,
      name: body.name ?? "New User",
      email: body.email ?? "new@example.com",
      role: body.role ?? "collaborator",
      github_handle: body.github_handle,
      product_slugs: body.product_slugs ?? [],
      status: "active",
      provisioned_at: now,
      last_modified: now,
      services: {
        github: "provisioned",
        slack: "provisioned",
        microsoft365: "provisioned",
        gcp: "provisioned",
        aws: "provisioned",
        portal: "provisioned",
      },
    };
    addUser(newUser);
    return json({
      user: newUser,
      provisioning_steps: [
        {
          service: "github",
          label: "GitHub",
          status: "success",
          message: "GitHub org/team mappings processed.",
        },
        {
          service: "slack",
          label: "Slack",
          status: "success",
          message: "Slack invite processed.",
        },
        {
          service: "microsoft365",
          label: "Microsoft 365",
          status: "success",
          message: "M365 user created.",
        },
        {
          service: "gcp",
          label: "GCP IAM",
          status: "success",
          message: "GCP IAM binding upserted.",
        },
        {
          service: "aws",
          label: "AWS IAM",
          status: "success",
          message: "AWS breakglass disabled.",
        },
        {
          service: "portal",
          label: "Portal",
          status: "success",
          message: "Portal provisioning processed.",
        },
      ],
    });
  }
  if (route === "/api/auth/provisioning/users/quota-check") {
    return json({ quota: { ok: true, checks: [], message: "" } });
  }
  if (route === "/api/auth/provisioning/access-templates") {
    return json({ templates: [], total: 0 });
  }
  if (route === "/api/auth/provisioning/access-requests") {
    if (opts?.method === "POST") {
      const body = opts?.body ? JSON.parse(opts.body as string) : {};
      const now = new Date().toISOString();
      const newReq = {
        id: `req-${Date.now()}`,
        requester_email: body.requester_email ?? "you@example.com",
        requester_name: body.requester_name ?? "You",
        org_id: body.org_id ?? "",
        requested_entitlements: body.requested_entitlements ?? [],
        requested_role: body.requested_role ?? null,
        reason: body.reason ?? "",
        status: "pending" as const,
        admin_note: "",
        reviewed_by: "",
        created_at: now,
        updated_at: now,
      };
      addRequest(newReq);
      return json({ request: newReq });
    }
    // Support ?status= filter
    const urlObj = new URL(route, "http://localhost");
    const statusFilter = urlObj.searchParams.get("status");
    const { requests } = getProvisioningState();
    const filtered = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests;
    return json({ requests: filtered, total: filtered.length });
  }
  if (route.match(/^\/api\/auth\/provisioning\/access-requests\/[^/]+\/review$/)) {
    const reqId = route.split("/").at(-2);
    const body = opts?.body ? JSON.parse(opts.body as string) : {};
    const action = body.action as "approve" | "deny";
    const newStatus = action === "deny" ? "denied" : "approved";
    const updated = updateRequest(reqId ?? "", {
      status: newStatus,
      admin_note: body.admin_note ?? "",
      reviewed_by: "admin@odum.internal",
    });
    if (updated && action === "approve") {
      const state = getProvisioningState();
      const existing = state.users.find((u) => u.email === updated.requester_email);
      const entitlements = [...new Set([...updated.requested_entitlements, "reporting"])];
      const orgSlug = updated.org_id || updated.requester_email.split("@")[1]?.split(".")[0] || "unknown";
      let orgId = "";
      const existingOrg = state.organizations.find(
        (o) => o.slug === orgSlug || o.contact_email === updated.requester_email,
      );
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const orgName = orgSlug.charAt(0).toUpperCase() + orgSlug.slice(1);
        const newOrg: MockOrganization = {
          id: `org-${Date.now()}`,
          name: orgName,
          slug: orgSlug,
          type: "external",
          contact_email: updated.requester_email,
          contact_name: updated.requester_name,
          status: "onboarding",
          tier: "Standard",
          api_keys: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addOrganization(newOrg);
        orgId = newOrg.id;
      }
      if (existing) {
        const merged = [...new Set([...existing.product_slugs, ...entitlements])];
        updateUser(existing.id, { product_slugs: merged, org_id: orgId });
      } else {
        addUser({
          id: `user-${Date.now()}`,
          firebase_uid: `uid-${Date.now()}`,
          name: updated.requester_name,
          email: updated.requester_email,
          role: updated.requested_role || "client",
          org_id: orgId,
          product_slugs: entitlements,
          status: "active",
          provisioned_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          services: { portal: "provisioned" },
        });
      }
    }
    if (updated) return json({ request: updated });
    return json({
      request: {
        id: reqId,
        status: newStatus,
        admin_note: body.admin_note ?? "",
        reviewed_by: "admin@odum.internal",
        updated_at: new Date().toISOString(),
      },
    });
  }
  // --- Mock Signup (standalone, no UMU needed) ---
  if (route === "/api/v1/signup" && opts?.method === "POST") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const uid = `uid-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const orgSlug = (body.company || body.email.split("@")[1]?.split(".")[0] || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const newUser: MockUser = {
      id: userId,
      firebase_uid: uid,
      name: body.name,
      email: body.email,
      password: body.password,
      role: "client",
      org_id: "",
      product_slugs: [],
      status: "pending",
      onboarding_stage: "registered",
      onboarding_data: {
        service_type: body.service_type,
        selected_options: body.selected_options || [],
        expected_aum: body.expected_aum,
        company: body.company,
        phone: body.phone,
        applicant_type: body.applicant_type,
        docs_uploaded: [],
        current_step: 1,
      },
      provisioned_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      services: { portal: "pending" },
    };
    addUser(newUser);
    // Also add to demo personas so they can log in
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("mock-signup-users");
      const signupUsers = existing ? JSON.parse(existing) : [];
      signupUsers.push({ id: userId, email: body.email, password: body.password, uid });
      localStorage.setItem("mock-signup-users", JSON.stringify(signupUsers));
    }
    return json({
      user: { firebase_uid: uid, name: body.name, email: body.email, status: "pending_approval" },
      onboarding_request_id: `onb-${Date.now()}`,
    });
  }
  // --- Get user application state (for resume) ---
  if (route.match(/^\/api\/v1\/users\/[^/]+\/application$/) && (!opts?.method || opts.method === "GET")) {
    const uid = route.split("/")[4];
    const state = getProvisioningState();
    const user = state.users.find((u) => u.firebase_uid === uid || u.id === uid);
    if (user?.onboarding_data) {
      return json({ application: user.onboarding_data, stage: user.onboarding_stage, user_id: user.id });
    }
    return json({ application: null });
  }
  // --- Update user application state ---
  if (route.match(/^\/api\/v1\/users\/[^/]+\/application$/) && opts?.method === "PUT") {
    const uid = route.split("/")[4];
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const state = getProvisioningState();
    const user = state.users.find((u) => u.firebase_uid === uid || u.id === uid);
    if (user) {
      user.onboarding_data = { ...user.onboarding_data, ...body };
      if (body.current_step) user.onboarding_data!.current_step = body.current_step;
      user.last_modified = new Date().toISOString();
      if (body.docs_uploaded?.length > 0 && user.onboarding_stage === "registered") {
        user.onboarding_stage = "docs_submitted";
      }
      persist();
      return json({ ok: true, application: user.onboarding_data, stage: user.onboarding_stage });
    }
    return json({ error: "user not found" });
  }
  // --- Upload document (mock) ---
  if (route.match(/^\/api\/v1\/users\/[^/]+\/documents\/upload$/) && opts?.method === "POST") {
    const uid = route.split("/")[4];
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const state = getProvisioningState();
    const user = state.users.find((u) => u.firebase_uid === uid || u.id === uid);
    if (user?.onboarding_data) {
      const docs = user.onboarding_data.docs_uploaded || [];
      if (!docs.includes(body.doc_type)) docs.push(body.doc_type);
      user.onboarding_data.docs_uploaded = docs;
      if (user.onboarding_stage === "registered") user.onboarding_stage = "docs_submitted";
      user.last_modified = new Date().toISOString();
      persist();
    }
    return json({ ok: true, doc_type: body.doc_type });
  }

  // --- Organizations ---
  if (route === "/api/auth/provisioning/organizations" && (!opts?.method || opts.method === "GET")) {
    const state = getProvisioningState();
    return json({
      organizations: state.organizations,
      total: state.organizations.length,
    });
  }
  if (route === "/api/auth/provisioning/organizations" && opts?.method === "POST") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const org: MockOrganization = {
      id: `org-${Date.now()}`,
      name: body.name,
      slug: (body.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      type: "external",
      contact_email: body.contact_email ?? "",
      contact_name: body.contact_name ?? "",
      status: "onboarding",
      tier: body.tier ?? "Standard",
      api_keys: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addOrganization(org);
    return json({ organization: org });
  }
  if (route.match(/^\/api\/auth\/provisioning\/organizations\/[^/]+$/) && !route.includes("api-keys")) {
    const orgId = route.split("/").pop()!;
    if (opts?.method === "PUT") {
      const body = opts.body ? JSON.parse(opts.body as string) : {};
      const updated = updateOrganization(orgId, body);
      return updated ? json({ organization: updated }) : json({ error: "not found" });
    }
    const state = getProvisioningState();
    const org = state.organizations.find((o) => o.id === orgId);
    return org ? json({ organization: org }) : json({ error: "not found" });
  }
  if (route.match(/^\/api\/auth\/provisioning\/organizations\/[^/]+\/api-keys$/) && opts?.method === "POST") {
    const orgId = route.split("/").at(-2)!;
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const key: MockVenueApiKey = {
      id: `key-${Date.now()}`,
      venue: body.venue,
      label: body.label || `${body.venue} Key`,
      api_key_masked: `****...${(body.api_key ?? "").slice(-4) || "xxxx"}`,
      status: "active",
      added_at: new Date().toISOString(),
    };
    const org = addApiKey(orgId, key);
    return org ? json({ organization: org }) : json({ error: "org not found" });
  }
  if (route.match(/^\/api\/auth\/provisioning\/organizations\/[^/]+\/api-keys\/[^/]+$/) && opts?.method === "DELETE") {
    const parts = route.split("/");
    const keyId = parts.pop()!;
    parts.pop(); // skip "api-keys"
    const orgId = parts.pop()!;
    const org = removeApiKey(orgId, keyId);
    return org ? json({ organization: org }) : json({ error: "org not found" });
  }
  // --- My Org (for authenticated users) ---
  if (route === "/api/auth/provisioning/my-org") {
    const state = getProvisioningState();
    let currentUserEmail: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("portal_user");
        if (raw) currentUserEmail = (JSON.parse(raw) as { email?: string }).email ?? null;
      } catch {
        /* ignore */
      }
    }
    const user = currentUserEmail ? state.users.find((u) => u.email === currentUserEmail) : null;
    const org = user?.org_id ? state.organizations.find((o) => o.id === user.org_id) : null;
    return org ? json({ organization: org }) : json({ organization: null });
  }

  if (route === "/api/auth/provisioning/health-checks") {
    // Alias used by the /health page provisioning connector check
    return json({ status: "ok", service: "provisioning", latency_ms: 22 });
  }

  if (route === "/api/auth/provisioning/admin/health-checks") {
    return json({
      checks: [
        {
          service: "github",
          status: "healthy",
          latency_ms: 42,
          message: "GitHub API reachable",
        },
        {
          service: "slack",
          status: "healthy",
          latency_ms: 38,
          message: "Slack API reachable",
        },
        {
          service: "microsoft365",
          status: "healthy",
          latency_ms: 55,
          message: "M365 Graph API reachable",
        },
        {
          service: "gcp",
          status: "healthy",
          latency_ms: 31,
          message: "GCP IAM reachable",
        },
        {
          service: "aws",
          status: "healthy",
          latency_ms: 47,
          message: "AWS IAM reachable",
        },
        {
          service: "portal",
          status: "healthy",
          latency_ms: 12,
          message: "Portal DB reachable",
        },
      ],
    });
  }
  if (route === "/api/auth/provisioning/admin/health-checks/history") {
    return json({ history: [] });
  }

  // --- Client Onboarding Applications ---
  if (
    route.match(/^\/api\/auth\/provisioning\/onboarding-applications\/[^/]+\/documents$/) &&
    opts?.method === "POST"
  ) {
    const appId = route.split("/").at(-2)!;
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const newDoc: DocumentArtifact = {
      id: `doc-${Date.now()}`,
      application_id: appId,
      doc_type: body.doc_type ?? "other",
      file_name: body.file_name ?? "upload.pdf",
      uploaded_at: new Date().toISOString(),
      review_status: "pending",
      review_note: "",
    };
    addDocument(newDoc);
    return json({ document: newDoc });
  }
  if (route.match(/^\/api\/auth\/provisioning\/onboarding-applications\/[^/]+\/documents$/)) {
    const appId = route.split("/").at(-2)!;
    const { documents } = getOnboardingState();
    const appDocs = documents.filter((d) => d.application_id === appId);
    return json({ documents: appDocs, total: appDocs.length });
  }
  if (route.match(/^\/api\/auth\/provisioning\/onboarding-applications\/[^/]+\/review$/) && opts?.method === "PUT") {
    const appId = route.split("/").at(-2)!;
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const newStatus = body.action === "reject" ? "rejected" : "approved";
    const updated = updateApplication(appId, {
      status: newStatus as OnboardingApplication["status"],
      reviewer_id: body.reviewer_id ?? "admin",
      review_note: body.review_note ?? "",
    });
    return updated ? json({ application: updated }) : json({ error: "not found" });
  }
  if (route === "/api/auth/provisioning/onboarding-applications" && opts?.method === "POST") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const now = new Date().toISOString();
    const newApp: OnboardingApplication = {
      id: `onb-${Date.now()}`,
      applicant_user_id: body.applicant_user_id ?? `uid-${Date.now()}`,
      applicant_name: body.applicant_name ?? "New Applicant",
      applicant_email: body.applicant_email ?? "applicant@example.com",
      org_name: body.org_name ?? "New Organisation",
      desired_product_slugs: body.desired_product_slugs ?? [],
      subscription_tier: body.subscription_tier ?? "basic",
      engagement_type: null,
      regulated_activities: [],
      fund_structure_requested: null,
      pod_registration_status: null,
      status: "draft",
      submitted_at: null,
      reviewer_id: null,
      review_note: "",
      correlation_id: `corr-onb-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    addApplication(newApp);
    return json({ application: newApp });
  }
  if (route === "/api/auth/provisioning/onboarding-applications") {
    const { applications } = getOnboardingState();
    return json({ applications, total: applications.length });
  }

  // --- Options & Futures ---
  if (route === "/api/options/chain") {
    return json({
      asset: "BTC",
      spotPrice: 71583.0,
      ivIndex: 50.9,
      expiries: [
        {
          date: "2026-03-24",
          label: "24 MAR 26",
          daysToExpiry: 1,
          hasPositions: false,
        },
        {
          date: "2026-03-25",
          label: "25 MAR 26",
          daysToExpiry: 2,
          hasPositions: false,
        },
        {
          date: "2026-03-26",
          label: "26 MAR 26",
          daysToExpiry: 3,
          hasPositions: false,
        },
        {
          date: "2026-03-27",
          label: "27 MAR 26",
          daysToExpiry: 4,
          hasPositions: false,
        },
        {
          date: "2026-04-03",
          label: "03 APR 26",
          daysToExpiry: 11,
          hasPositions: false,
        },
        {
          date: "2026-04-10",
          label: "10 APR 26",
          daysToExpiry: 18,
          hasPositions: false,
        },
        {
          date: "2026-04-24",
          label: "24 APR 26",
          daysToExpiry: 32,
          hasPositions: false,
        },
        {
          date: "2026-05-29",
          label: "29 MAY 26",
          daysToExpiry: 67,
          hasPositions: false,
        },
        {
          date: "2026-06-26",
          label: "26 JUN 26",
          daysToExpiry: 95,
          hasPositions: true,
        },
        {
          date: "2026-09-25",
          label: "25 SEP 26",
          daysToExpiry: 186,
          hasPositions: false,
        },
        {
          date: "2026-12-25",
          label: "25 DEC 26",
          daysToExpiry: 277,
          hasPositions: false,
        },
      ],
      underlyingFuture: 71583.87,
      chain: [],
    });
  }
  if (route === "/api/options/positions") {
    return json({
      data: [
        {
          id: "opt-pos-1",
          instrument: "BTC-26JUN26-80000-C",
          side: "long",
          quantity: 5,
          entryPrice: 2450.0,
          markPrice: 2180.0,
          pnl: -1350.0,
          iv: 52.3,
          delta: 0.32,
          gamma: 0.00004,
          theta: -28.5,
          vega: 85.2,
          expiry: "2026-06-26",
        },
        {
          id: "opt-pos-2",
          instrument: "BTC-26JUN26-65000-P",
          side: "long",
          quantity: 10,
          entryPrice: 980.0,
          markPrice: 720.0,
          pnl: -2600.0,
          iv: 48.1,
          delta: -0.22,
          gamma: 0.00003,
          theta: -18.3,
          vega: 72.4,
          expiry: "2026-06-26",
        },
        {
          id: "opt-pos-3",
          instrument: "BTC-26JUN26-75000-C",
          side: "short",
          quantity: 8,
          entryPrice: 3800.0,
          markPrice: 3450.0,
          pnl: 2800.0,
          iv: 51.0,
          delta: -0.45,
          gamma: -0.00005,
          theta: 32.1,
          vega: -92.8,
          expiry: "2026-06-26",
        },
        {
          id: "opt-pos-4",
          instrument: "BTC-26JUN26-70000-C",
          side: "long",
          quantity: 3,
          entryPrice: 5200.0,
          markPrice: 5680.0,
          pnl: 1440.0,
          iv: 49.8,
          delta: 0.55,
          gamma: 0.00006,
          theta: -35.2,
          vega: 98.5,
          expiry: "2026-06-26",
        },
        {
          id: "opt-pos-5",
          instrument: "BTC-26JUN26-60000-P",
          side: "short",
          quantity: 6,
          entryPrice: 450.0,
          markPrice: 380.0,
          pnl: 420.0,
          iv: 46.5,
          delta: 0.12,
          gamma: -0.00002,
          theta: 12.8,
          vega: -45.6,
          expiry: "2026-06-26",
        },
      ],
    });
  }
  if (route === "/api/futures/contracts") {
    return json({
      data: [
        {
          contract: "BTC-PERPETUAL",
          asset: "BTC",
          settlement: "BTC",
          markPrice: 71583.0,
          change24h: 3.66,
          volume24h: 654372520,
          openInterest: 42850,
          fundingRate: 0.0042,
          basis: null,
          isFavorite: false,
        },
        {
          contract: "BTC-27MAR26",
          asset: "BTC",
          settlement: "BTC",
          markPrice: 71650.0,
          change24h: 3.72,
          volume24h: 123456000,
          openInterest: 18500,
          fundingRate: null,
          basis: 4.2,
          isFavorite: false,
        },
        {
          contract: "BTC-26JUN26",
          asset: "BTC",
          settlement: "BTC",
          markPrice: 72100.0,
          change24h: 3.81,
          volume24h: 89234000,
          openInterest: 12300,
          fundingRate: null,
          basis: 5.8,
          isFavorite: false,
        },
        {
          contract: "BTC-25SEP26",
          asset: "BTC",
          settlement: "BTC",
          markPrice: 72850.0,
          change24h: 3.95,
          volume24h: 34567000,
          openInterest: 8900,
          fundingRate: null,
          basis: 7.1,
          isFavorite: false,
        },
        {
          contract: "BTC-25DEC26",
          asset: "BTC",
          settlement: "BTC",
          markPrice: 73500.0,
          change24h: 4.02,
          volume24h: 12345000,
          openInterest: 5600,
          fundingRate: null,
          basis: 8.4,
          isFavorite: false,
        },
        {
          contract: "ETH-PERPETUAL",
          asset: "ETH",
          settlement: "ETH",
          markPrice: 3456.78,
          change24h: 2.15,
          volume24h: 345678000,
          openInterest: 85600,
          fundingRate: 0.0038,
          basis: null,
          isFavorite: false,
        },
        {
          contract: "ETH-26JUN26",
          asset: "ETH",
          settlement: "ETH",
          markPrice: 3520.0,
          change24h: 2.31,
          volume24h: 56789000,
          openInterest: 15200,
          fundingRate: null,
          basis: 6.2,
          isFavorite: false,
        },
        {
          contract: "ETH-25DEC26",
          asset: "ETH",
          settlement: "ETH",
          markPrice: 3650.0,
          change24h: 2.48,
          volume24h: 23456000,
          openInterest: 9800,
          fundingRate: null,
          basis: 9.1,
          isFavorite: false,
        },
        {
          contract: "SOL-PERPETUAL",
          asset: "SOL",
          settlement: "USDC",
          markPrice: 156.42,
          change24h: 5.12,
          volume24h: 123456000,
          openInterest: 34500,
          fundingRate: 0.0055,
          basis: null,
          isFavorite: false,
        },
        {
          contract: "SOL-26JUN26",
          asset: "SOL",
          settlement: "USDC",
          markPrice: 159.8,
          change24h: 5.28,
          volume24h: 34567000,
          openInterest: 8900,
          fundingRate: null,
          basis: 8.6,
          isFavorite: false,
        },
      ],
    });
  }

  // --- Auth Provisioning (access requests, users, templates) ---
  if (route === "/api/auth/provisioning/users") {
    const state = getProvisioningState();
    return json({ users: state.users, total: state.users.length });
  }
  if (
    route.match(/^\/api\/auth\/provisioning\/users\/[^/]+$/) &&
    !route.includes("/offboard") &&
    !route.includes("/reprovision") &&
    !route.includes("/workflows") &&
    !route.includes("/quota-check")
  ) {
    const uid = route.split("/").pop()!;
    const state = getProvisioningState();
    const user = state.users.find((u) => u.id === uid || u.firebase_uid === uid);
    return user ? json({ user }) : json({ error: "not found" });
  }
  if (route === "/api/auth/provisioning/users/onboard" && opts?.method === "POST") {
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      firebase_uid: `uid-${Date.now()}`,
      name: body.name || "New User",
      email: body.email || "new@example.com",
      role: body.role || "client",
      product_slugs: body.product_slugs || [],
      status: "active",
      provisioned_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      services: { portal: "provisioned" },
    };
    addUser(newUser);
    return json({
      user: newUser,
      provisioning_steps: [{ service: "portal", status: "success" }],
    });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+$/) && opts?.method === "PUT") {
    const uid = route.split("/").pop()!;
    const body = opts.body ? JSON.parse(opts.body as string) : {};
    const updated = updateUser(uid, body);
    return updated ? json({ user: updated }) : json({ error: "not found" });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+\/offboard$/)) {
    const uid = route.split("/")[5];
    const updated = updateUser(uid, { status: "offboarded" });
    return updated
      ? json({
        user: updated,
        revocation_steps: [{ service: "portal", status: "revoked" }],
      })
      : json({ error: "not found" });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+\/reprovision$/)) {
    return json({ workflow_execution: `wf-${Date.now()}` });
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+\/workflows$/)) {
    return json({ runs: [], total: 0 });
  }
  if (route === "/api/auth/provisioning/users/quota-check") {
    return json({
      quota: { allowed: true, currentUsers: 6, maxUsers: 50, reason: null },
    });
  }
  if (route === "/api/auth/provisioning/access-requests") {
    if (opts?.method === "POST") {
      const body = opts.body ? JSON.parse(opts.body as string) : {};
      const state = getProvisioningState();
      const newReq = {
        id: `req-${Date.now()}`,
        requester_email: body.requester_email || "user@example.com",
        requester_name: body.requester_name || "User",
        org_id: body.org_id || "unknown",
        requested_entitlements: body.requested_entitlements || [],
        requested_role: body.requested_role || null,
        reason: body.reason || "",
        status: "pending" as const,
        admin_note: "",
        reviewed_by: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addRequest(newReq);
      return json({ request: newReq });
    }
    const state = getProvisioningState();
    const statusFilter = path.split("?status=")[1];
    const filtered = statusFilter ? state.requests.filter((r) => r.status === statusFilter) : state.requests;
    return json({ requests: filtered, total: filtered.length });
  }
  if (route.match(/^\/api\/auth\/provisioning\/access-requests\/[^/]+\/review$/)) {
    const reqId = route.split("/")[5];
    const body = opts?.body ? JSON.parse(opts.body as string) : {};
    const action = body.action as "approve" | "deny";
    const updated = updateRequest(reqId, {
      status: action === "approve" ? "approved" : "denied",
      admin_note: body.admin_note || "",
      reviewed_by: "admin@odum.internal",
    });
    if (updated && action === "approve") {
      const state = getProvisioningState();
      const existing = state.users.find((u) => u.email === updated.requester_email);
      const entitlements = [...new Set([...updated.requested_entitlements, "reporting"])];
      const orgSlug = updated.org_id || updated.requester_email.split("@")[1]?.split(".")[0] || "unknown";
      let orgId = "";
      const existingOrg = state.organizations.find(
        (o) => o.slug === orgSlug || o.contact_email === updated.requester_email,
      );
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const orgName = orgSlug.charAt(0).toUpperCase() + orgSlug.slice(1);
        const newOrg: MockOrganization = {
          id: `org-${Date.now()}`,
          name: orgName,
          slug: orgSlug,
          type: "external",
          contact_email: updated.requester_email,
          contact_name: updated.requester_name,
          status: "onboarding",
          tier: "Standard",
          api_keys: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addOrganization(newOrg);
        orgId = newOrg.id;
      }
      if (existing) {
        const merged = [...new Set([...existing.product_slugs, ...entitlements])];
        updateUser(existing.id, { product_slugs: merged, org_id: orgId });
      } else {
        addUser({
          id: `user-${Date.now()}`,
          firebase_uid: `uid-${Date.now()}`,
          name: updated.requester_name,
          email: updated.requester_email,
          role: updated.requested_role || "client",
          org_id: orgId,
          product_slugs: entitlements,
          status: "active",
          provisioned_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          services: { portal: "provisioned" },
        });
      }
    }
    return updated ? json({ request: updated }) : json({ error: "not found" });
  }
  if (route === "/api/auth/provisioning/access-templates") {
    return json({
      templates: [
        {
          id: "tpl-default",
          name: "Default Access",
          description: "Standard entitlements",
          github_teams: [],
          slack_channels: [],
          aws_permission_sets: [],
        },
      ],
      total: 1,
    });
  }
  if (route.startsWith("/api/auth/provisioning/access-templates/")) {
    return json({ template: { id: "tpl-default", name: "Default Access" } });
  }
  if (route === "/api/auth/provisioning/admin/health-checks") {
    if (opts?.method === "POST")
      return json({
        result: {
          status: "healthy",
          checks: [],
          timestamp: new Date().toISOString(),
        },
      });
    return json({ result: { status: "healthy" } });
  }
  if (route === "/api/auth/provisioning/admin/health-checks/history") {
    return json({ history: [], total: 0 });
  }
  if (route === "/api/auth/catalogue") {
    return json(MOCK_PERMISSION_CATALOGUE);
  }
  if (route.startsWith("/api/auth/catalogue/search/")) {
    const query = decodeURIComponent(route.split("/api/auth/catalogue/search/")[1] || "").toLowerCase();
    const results: Array<{
      domain: string;
      domain_label: string;
      category: string;
      category_label: string;
      key: string;
      label: string;
      description: string;
      internal_only: string;
    }> = [];
    for (const domain of MOCK_PERMISSION_CATALOGUE.domains) {
      for (const cat of domain.categories) {
        for (const perm of cat.permissions) {
          if (
            perm.label.toLowerCase().includes(query) ||
            perm.description.toLowerCase().includes(query) ||
            perm.key.toLowerCase().includes(query)
          ) {
            results.push({
              domain: domain.key,
              domain_label: domain.label,
              category: cat.key,
              category_label: cat.label,
              key: perm.key,
              label: perm.label,
              description: perm.description,
              internal_only: String(perm.internal_only),
            });
          }
        }
      }
    }
    return json({ results, total: results.length });
  }

  // --- Health (service health endpoints) ---
  if (route === "/api/health") return json({ status: "healthy", mock: true });
  if (route === "/api/auth/health") return json({ status: "healthy", service: "auth-api", mock: true });
  if (route === "/api/reporting/health")
    return json({
      status: "healthy",
      service: "client-reporting-api",
      mock: true,
    });
  if (route === "/api/execution/health")
    return json({
      status: "healthy",
      service: "execution-service",
      mock: true,
    });
  if (route === "/api/deployment/health")
    return json({
      status: "healthy",
      service: "deployment-service",
      mock: true,
    });
  if (route === "/api/config/health") return json({ status: "healthy", service: "config-interface", mock: true });
  if (route === "/api/analytics/health")
    return json({
      status: "healthy",
      service: "trading-analytics-api",
      mock: true,
    });
  if (route === "/api/audit/health") return json({ status: "healthy", service: "batch-audit-api", mock: true });
  if (route === "/api/ml/health") return json({ status: "healthy", service: "ml-inference-api", mock: true });
  if (route === "/api/market-data/health")
    if (route.endsWith("/health")) return json({ status: "healthy", mock: true });

  // --- Catch-all for reporting/execution/analytics/deployment with data ---
  if (route.startsWith("/api/reporting/")) return json({ data: [], total: 0 });
  if (
    route.startsWith("/api/execution/") &&
    !route.includes("/algos") &&
    !route.includes("/venues") &&
    !route.includes("/tca") &&
    !route.includes("/benchmarks") &&
    !route.includes("/candidates") &&
    !route.includes("/handoff")
  )
    return json({ data: [], total: 0 });
  if (route.startsWith("/api/analytics/")) return json({ data: [], total: 0 });
  if (route.startsWith("/api/market-data/")) return json({ data: [], total: 0 });

  return null;
}

/**
 * Install the mock fetch handler.
 * Call once from the root layout/provider when NEXT_PUBLIC_MOCK_API=true.
 */
export function installMockHandler(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith("/api/")) {
      // Let real Next.js API routes pass through to the server
      if (url.startsWith("/api/onboarding/")) {
        return originalFetch(input, init);
      }
      const mockResponse = mockRoute(url, init);
      if (mockResponse) {
        return mockResponse;
      }
      // Unhandled /api/ route — return empty 200 to prevent 502 errors
      console.warn(`[mock] Unhandled API route: ${url}`);
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };

  console.info("[mock] Static visual preview mode active — all API calls intercepted");
}
