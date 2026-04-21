"use client";

// =============================================================================
// TRADING DATA SYSTEM - Granular data at strategy/client/org level
// =============================================================================
// This module provides:
// 1. Deterministic data generation (same seed = same data)
// 2. Data at the lowest dimension (strategy_id, client_id, org_id)
// 3. Aggregation functions for filtered views
// 4. Live vs Batch data with realistic differences
// 5. Time series with actual movement (not flat)
//
// NOTE: Strategy definitions are sourced from lib/mocks/fixtures/strategy-instances (UAC-derived).
// This module derives TradingStrategy from the canonical StrategyInstance type.

// Import canonical taxonomy for type consistency
import {
  type AssetClass,
  type StrategyExecutionMode,
  type StrategyStatus,
  type StrategyArchetype,
} from "@/lib/taxonomy";

// Import canonical strategy instances (v2 UAC-sourced) as the single source of truth
import { STRATEGIES as REGISTRY_STRATEGIES, type Strategy as RegistryStrategy } from "@/lib/mocks/fixtures/strategy-instances";

// Re-export taxonomy types for convenience
export type { AssetClass, StrategyExecutionMode, StrategyStatus, StrategyArchetype };

// Seeded random for deterministic data
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 17), 0xed5ad4bb);
    h = Math.imul(h ^ (h >>> 11), 0xac4c1b51);
    h = Math.imul(h ^ (h >>> 15), 0x31848bab);
    return (h >>> 0) / 4294967296;
  };
}

// =============================================================================
// ORGANIZATIONS, CLIENTS, STRATEGIES - Core hierarchy
// =============================================================================

// Canonical types live in lib/types/trading.ts — re-exported here for
// backward compatibility with existing mock-data consumers.
export type { TradingOrganization, TradingClient } from "@/lib/types/trading";
import type { TradingOrganization, TradingClient } from "@/lib/types/trading";

export interface TradingStrategy {
  id: string;
  name: string;
  clientId: string;
  archetype: StrategyArchetype | string; // Using taxonomy type with fallback
  assetClass: AssetClass; // Using taxonomy type
  executionMode: StrategyExecutionMode; // Using taxonomy type
  status: StrategyStatus; // Using taxonomy type
  configVersion: string;
  underlyings: string[];
  venues: string[];
  // Base metrics for data generation
  baseCapital: number;
  expectedSharpe: number;
  expectedVolatility: number;
}

// =============================================================================
// ACCOUNTS - Per-venue trading accounts
// =============================================================================

export interface TradingAccount {
  id: string;
  name: string;
  organizationId: string;
  clientId: string;
  venue: string;
  venueAccountId: string; // External venue account identifier
  marginType: "cross" | "isolated" | "portfolio" | "spot"; // Margin mode
  status: "active" | "suspended" | "pending";
  balanceUSD: number;
  marginUsed: number;
  marginAvailable: number;
}

export const ACCOUNTS: TradingAccount[] = [
  // Binance accounts - Odum
  {
    id: "acc-binance-odum-1",
    name: "Binance Main",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "BINANCE-SPOT",
    venueAccountId: "BN-ODUM-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 2500000,
    marginUsed: 850000,
    marginAvailable: 1650000,
  },
  {
    id: "acc-binance-odum-2",
    name: "Binance Isolated",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "BINANCE-SPOT",
    venueAccountId: "BN-ODUM-002",
    marginType: "isolated",
    status: "active",
    balanceUSD: 500000,
    marginUsed: 120000,
    marginAvailable: 380000,
  },
  {
    id: "acc-binance-qf-1",
    name: "Binance QF",
    organizationId: "odum",
    clientId: "quant-fund",
    venue: "BINANCE-SPOT",
    venueAccountId: "BN-QF-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 1800000,
    marginUsed: 600000,
    marginAvailable: 1200000,
  },

  // Hyperliquid accounts
  {
    id: "acc-hl-odum-1",
    name: "Hyperliquid Main",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "HYPERLIQUID",
    venueAccountId: "HL-ODUM-MAIN",
    marginType: "cross",
    status: "active",
    balanceUSD: 1200000,
    marginUsed: 400000,
    marginAvailable: 800000,
  },
  {
    id: "acc-hl-qf-1",
    name: "Hyperliquid QF",
    organizationId: "odum",
    clientId: "quant-fund",
    venue: "HYPERLIQUID",
    venueAccountId: "HL-QF-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 900000,
    marginUsed: 300000,
    marginAvailable: 600000,
  },

  // Deribit accounts
  {
    id: "acc-deribit-odum-1",
    name: "Deribit Options",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "DERIBIT",
    venueAccountId: "DB-ODUM-OPT",
    marginType: "portfolio",
    status: "active",
    balanceUSD: 800000,
    marginUsed: 350000,
    marginAvailable: 450000,
  },
  {
    id: "acc-deribit-qf-1",
    name: "Deribit QF",
    organizationId: "odum",
    clientId: "quant-fund",
    venue: "DERIBIT",
    venueAccountId: "DB-QF-001",
    marginType: "portfolio",
    status: "active",
    balanceUSD: 600000,
    marginUsed: 200000,
    marginAvailable: 400000,
  },

  // OKX accounts
  {
    id: "acc-okx-odum-1",
    name: "OKX Main",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "OKX-SPOT",
    venueAccountId: "OKX-ODUM-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 1500000,
    marginUsed: 500000,
    marginAvailable: 1000000,
  },

  // Bybit accounts
  {
    id: "acc-bybit-odum-1",
    name: "Bybit Main",
    organizationId: "odum",
    clientId: "delta-one",
    venue: "BYBIT",
    venueAccountId: "BB-ODUM-001",
    marginType: "isolated",
    status: "active",
    balanceUSD: 750000,
    marginUsed: 250000,
    marginAvailable: 500000,
  },

  // DeFi accounts (wallet-based) - no margin concept
  {
    id: "acc-uniswap-odum-1",
    name: "Uniswap Wallet",
    organizationId: "odum",
    clientId: "defi-desk",
    venue: "UNISWAPV3-ETHEREUM",
    venueAccountId: "0x742d...3a2f",
    marginType: "spot",
    status: "active",
    balanceUSD: 450000,
    marginUsed: 0,
    marginAvailable: 450000,
  },
  {
    id: "acc-aave-odum-1",
    name: "Aave Position",
    organizationId: "odum",
    clientId: "defi-desk",
    venue: "AAVEV3-ETHEREUM",
    venueAccountId: "0x742d...3a2f",
    marginType: "cross",
    status: "active",
    balanceUSD: 320000,
    marginUsed: 180000,
    marginAvailable: 140000,
  },

  // External client accounts
  {
    id: "acc-binance-ext-1",
    name: "Binance AlphaT",
    organizationId: "alpha-capital",
    clientId: "alpha-main",
    venue: "BINANCE-SPOT",
    venueAccountId: "BN-ALPHAT-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 3500000,
    marginUsed: 1200000,
    marginAvailable: 2300000,
  },
  {
    id: "acc-hl-ext-1",
    name: "HL AlphaT",
    organizationId: "alpha-capital",
    clientId: "alpha-main",
    venue: "HYPERLIQUID",
    venueAccountId: "HL-ALPHAT-001",
    marginType: "cross",
    status: "active",
    balanceUSD: 2100000,
    marginUsed: 700000,
    marginAvailable: 1400000,
  },
];

// Get accounts for a specific client
export function getAccountsForClient(clientId: string): TradingAccount[] {
  return ACCOUNTS.filter((a) => a.clientId === clientId);
}

// Get accounts for a specific venue
export function getAccountsForVenue(venue: string): TradingAccount[] {
  return ACCOUNTS.filter((a) => a.venue === venue);
}

// The actual hierarchy
export const ORGANIZATIONS: TradingOrganization[] = [
  { id: "odum", name: "Odum Internal", type: "internal" },
  { id: "alpha-capital", name: "Apex Capital", type: "external" },
  { id: "vertex-partners", name: "Zenith Partners", type: "external" },
  { id: "meridian-fund", name: "Meridian Fund", type: "external" },
  { id: "atlas-ventures", name: "Atlas Ventures", type: "external" },
  { id: "elysium", name: "Elysium", type: "external" },
];

export const CLIENTS: TradingClient[] = [
  {
    id: "delta-one",
    name: "Trading Desk Alpha",
    orgId: "odum",
    status: "active",
    capitalAllocation: 5000000,
  },
  {
    id: "quant-fund",
    name: "Trading Desk Beta",
    orgId: "odum",
    status: "active",
    capitalAllocation: 8000000,
  },
  {
    id: "sports-desk",
    name: "Sports Desk",
    orgId: "odum",
    status: "active",
    capitalAllocation: 2000000,
  },
  {
    id: "defi-desk",
    name: "DeFi Ops",
    orgId: "odum",
    status: "active",
    capitalAllocation: 3000000,
  },
  {
    id: "alpha-main",
    name: "Global Macro Fund",
    orgId: "alpha-capital",
    status: "active",
    capitalAllocation: 10000000,
  },
  {
    id: "alpha-crypto",
    name: "Crypto Arbitrage",
    orgId: "alpha-capital",
    status: "active",
    capitalAllocation: 5000000,
  },
  {
    id: "vertex-core",
    name: "Core Strategy",
    orgId: "vertex-partners",
    status: "active",
    capitalAllocation: 15000000,
  },
  {
    id: "meridian-systematic",
    name: "Systematic Trading",
    orgId: "meridian-fund",
    status: "active",
    capitalAllocation: 12000000,
  },
  {
    id: "meridian-discretionary",
    name: "Discretionary Fund",
    orgId: "meridian-fund",
    status: "active",
    capitalAllocation: 8000000,
  },
  {
    id: "atlas-growth",
    name: "Growth Portfolio",
    orgId: "atlas-ventures",
    status: "active",
    capitalAllocation: 6000000,
  },
  {
    id: "atlas-defi",
    name: "DeFi Ventures",
    orgId: "atlas-ventures",
    status: "onboarding",
    capitalAllocation: 4000000,
  },
  {
    id: "elysium-defi",
    name: "Elysium DeFi",
    orgId: "elysium",
    status: "active",
    capitalAllocation: 5000000,
  },
];

// Helper to map v2 archetype → trading-data archetype label for downstream mock PnL buckets.
// The per-archetype attribution logic (basis/options/sports/lending) in generatePnLBreakdown below
// matches on substring of this lowercased label, so the mapping just preserves the semantic bucket.
function mapArchetype(archetype: RegistryStrategy["archetype"]): StrategyArchetype | string {
  const archetypeMap: Record<RegistryStrategy["archetype"], string> = {
    ML_DIRECTIONAL_CONTINUOUS: "ml-directional",
    ML_DIRECTIONAL_EVENT_SETTLED: "sports-ml",
    RULES_DIRECTIONAL_CONTINUOUS: "ml-directional",
    RULES_DIRECTIONAL_EVENT_SETTLED: "sports-ml",
    CARRY_BASIS_DATED: "basis-trade",
    CARRY_BASIS_PERP: "basis-trade",
    CARRY_STAKED_BASIS: "basis-trade",
    CARRY_RECURSIVE_STAKED: "recursive-staked-basis",
    YIELD_ROTATION_LENDING: "aave-lending",
    YIELD_STAKING_SIMPLE: "aave-lending",
    ARBITRAGE_PRICE_DISPERSION: "arbitrage",
    LIQUIDATION_CAPTURE: "arbitrage",
    MARKET_MAKING_CONTINUOUS: "market-making-lp",
    MARKET_MAKING_EVENT_SETTLED: "sports-market-making",
    EVENT_DRIVEN: "arbitrage",
    VOL_TRADING_OPTIONS: "options-vol",
    STAT_ARB_PAIRS_FIXED: "statistical-arb",
    STAT_ARB_CROSS_SECTIONAL: "statistical-arb",
  };
  return archetypeMap[archetype] ?? archetype.toLowerCase();
}

// Helper to extract underlyings from instruments
function extractUnderlyings(instruments: RegistryStrategy["instruments"]): string[] {
  const underlyings = new Set<string>();
  for (const inst of instruments) {
    // Extract underlying from instrument key (e.g., "BINANCE:SPOT:BTC-USDT" -> "BTC")
    const parts = inst.key.split(":");
    const lastPart = parts[parts.length - 1];
    const underlying = lastPart.split("-")[0].split("@")[0];
    if (underlying && !["USDT", "USDC", "USD"].includes(underlying)) {
      underlyings.add(underlying);
    }
  }
  return Array.from(underlyings);
}

// Derive STRATEGIES from strategy-instances.ts (UAC STRATEGY_REGISTRY — single source of truth)
export const STRATEGIES: TradingStrategy[] = REGISTRY_STRATEGIES.map(
  (rs): TradingStrategy => ({
    id: rs.id,
    name: rs.name,
    clientId: rs.clientId,
    archetype: mapArchetype(rs.archetype),
    assetClass: rs.assetClass,
    executionMode: rs.executionMode,
    status: rs.status === "development" ? "paused" : (rs.status as StrategyStatus),
    configVersion: rs.version,
    underlyings: extractUnderlyings(rs.instruments),
    venues: rs.venues,
    baseCapital: rs.performance.netExposure,
    expectedSharpe: rs.performance.sharpe,
    expectedVolatility: rs.performance.maxDrawdown / 100,
  }),
);

// =============================================================================
// P&L ATTRIBUTION TYPES - Strategy-specific breakdowns
// =============================================================================

export interface PnLBreakdown {
  strategyId: string;
  clientId: string;
  orgId: string;
  date: string;
  mode: "live" | "batch";
  // Canonical factors (always present)
  delta: number;
  funding: number;
  basis: number;
  interest_rate: number;
  greeks: number;
  mark_to_market: number;
  // Extended factors
  carry: number;
  fx: number;
  fees: number;
  slippage: number;
  residual: number;
  // Strategy-specific (only populated when relevant)
  funding_pnl?: number;
  basis_spread_pnl?: number;
  trading_pnl?: number;
  transaction_costs?: number;
  lending_yield_pnl?: number;
  pre_game_pnl?: number;
  halftime_pnl?: number;
  commission?: number;
  closing_line_value?: number;
  delta_pnl?: number;
  gamma_pnl?: number;
  vega_pnl?: number;
  theta_pnl?: number;
  il_pnl?: number;
  swap_fees_pnl?: number;
  // Total
  total: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface StrategyTimeSeries {
  strategyId: string;
  clientId: string;
  orgId: string;
  date: string;
  mode: "live" | "batch";
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
}

// =============================================================================
// DATA GENERATION - Deterministic, granular, with movement
// =============================================================================

function generatePnLBreakdown(strategy: TradingStrategy, date: string, mode: "live" | "batch"): PnLBreakdown {
  const seed = `${strategy.id}-${date}-${mode}`;
  const rand = seededRandom(seed);

  const client = CLIENTS.find((c) => c.id === strategy.clientId)!;
  const org = ORGANIZATIONS.find((o) => o.id === client.orgId)!;

  // Generate base P&L components with variance
  const dailyVol = (strategy.baseCapital * strategy.expectedVolatility) / Math.sqrt(252);
  const drift = strategy.baseCapital * ((strategy.expectedSharpe * strategy.expectedVolatility) / 252);

  // Canonical factors with realistic distributions
  const delta = (rand() - 0.4) * dailyVol * 0.3;
  const funding = strategy.archetype.includes("basis")
    ? (rand() - 0.2) * dailyVol * 0.4
    : (rand() - 0.5) * dailyVol * 0.05;
  const basis = strategy.archetype.includes("basis") ? (rand() - 0.3) * dailyVol * 0.3 : 0;
  const interest_rate = (rand() - 0.5) * dailyVol * 0.05;
  const greeks = strategy.archetype.includes("options") ? (rand() - 0.5) * dailyVol * 0.2 : 0;
  const mark_to_market = (rand() - 0.5) * dailyVol * 0.2;

  // Extended factors
  const carry =
    strategy.archetype.includes("lending") || strategy.archetype.includes("staked")
      ? drift * 0.5 + (rand() - 0.3) * dailyVol * 0.1
      : 0;
  const fx = strategy.assetClass === "TradFi" ? (rand() - 0.5) * dailyVol * 0.05 : 0;
  const fees = -Math.abs(((rand() * 0.002 + 0.0005) * strategy.baseCapital) / 252);
  const slippage = -Math.abs(((rand() * 0.001 + 0.0002) * strategy.baseCapital) / 252);
  const residual = (rand() - 0.5) * dailyVol * 0.05;

  // Strategy-specific components
  let strategySpecific: Partial<PnLBreakdown> = {};

  if (strategy.archetype === "basis-trade" || strategy.archetype === "recursive-staked-basis") {
    strategySpecific = {
      funding_pnl: funding * 0.8,
      basis_spread_pnl: basis * 0.9,
      trading_pnl: delta * 0.5,
      transaction_costs: fees + slippage,
    };
  } else if (strategy.archetype.includes("lending")) {
    strategySpecific = {
      lending_yield_pnl: carry * 1.2,
      transaction_costs: fees + slippage,
    };
  } else if (strategy.archetype === "sports-ml" || strategy.assetClass === "Sports") {
    strategySpecific = {
      pre_game_pnl: delta * 0.6,
      halftime_pnl: delta * 0.4,
      commission: fees,
      closing_line_value: (rand() - 0.4) * dailyVol * 0.15,
    };
  } else if (strategy.archetype.includes("options")) {
    strategySpecific = {
      delta_pnl: delta,
      gamma_pnl: (rand() - 0.5) * dailyVol * 0.15,
      vega_pnl: (rand() - 0.5) * dailyVol * 0.2,
      theta_pnl: dailyVol * 0.05 * (rand() - 0.3),
    };
  } else if (strategy.archetype === "market-making-lp") {
    strategySpecific = {
      swap_fees_pnl: Math.abs(rand() * dailyVol * 0.3),
      il_pnl: -(rand() * dailyVol * 0.15),
    };
  }

  // Add batch variance (batch should be similar but not identical to live)
  const batchMultiplier = mode === "batch" ? 1 + (rand() - 0.5) * 0.1 : 1;

  const total =
    (delta + funding + basis + interest_rate + greeks + mark_to_market + carry + fx + fees + slippage + residual) *
    batchMultiplier;

  return {
    strategyId: strategy.id,
    clientId: strategy.clientId,
    orgId: org.id,
    date,
    mode,
    delta: delta * batchMultiplier,
    funding: funding * batchMultiplier,
    basis: basis * batchMultiplier,
    interest_rate: interest_rate * batchMultiplier,
    greeks: greeks * batchMultiplier,
    mark_to_market: mark_to_market * batchMultiplier,
    carry: carry * batchMultiplier,
    fx: fx * batchMultiplier,
    fees: fees * batchMultiplier,
    slippage: slippage * batchMultiplier,
    residual: residual * batchMultiplier,
    total,
    ...Object.fromEntries(Object.entries(strategySpecific).map(([k, v]) => [k, (v as number) * batchMultiplier])),
  } as PnLBreakdown;
}

function generateIntradayTimeSeries(
  strategy: TradingStrategy,
  date: string,
  mode: "live" | "batch",
  numPoints: number = 96, // 15-minute intervals
): StrategyTimeSeries {
  const seed = `${strategy.id}-${date}-${mode}-ts`;
  const rand = seededRandom(seed);

  const client = CLIENTS.find((c) => c.id === strategy.clientId)!;
  const org = ORGANIZATIONS.find((o) => o.id === client.orgId)!;

  // Generate cumulative P&L with actual movement
  const dailyVol = (strategy.baseCapital * strategy.expectedVolatility) / Math.sqrt(252);
  const drift = strategy.baseCapital * ((strategy.expectedSharpe * strategy.expectedVolatility) / 252);
  const pointVol = dailyVol / Math.sqrt(numPoints);
  const pointDrift = drift / numPoints;

  const pnl: TimeSeriesPoint[] = [];
  const nav: TimeSeriesPoint[] = [];
  const exposure: TimeSeriesPoint[] = [];

  let cumPnl = 0;
  let baseNav = strategy.baseCapital;
  let baseExposure = strategy.baseCapital * (0.5 + rand() * 0.4); // 50-90% utilized

  const dateObj = new Date(date);

  for (let i = 0; i < numPoints; i++) {
    // Generate realistic intraday movement
    const hourOfDay = ((i * 15) / 60) % 24;

    // Higher volatility during market hours (simplified)
    const volMultiplier = hourOfDay >= 9 && hourOfDay <= 16 ? 1.5 : 0.7;

    // P&L change with mean reversion tendency
    const meanReversionForce = -cumPnl * 0.001;
    const change = pointDrift + meanReversionForce + (rand() - 0.48) * pointVol * volMultiplier;
    cumPnl += change;

    // NAV and exposure changes (correlated with P&L)
    baseNav += change;
    const exposureChange = (rand() - 0.5) * baseExposure * 0.02;
    baseExposure = Math.max(0, baseExposure + exposureChange);

    const timestamp = new Date(dateObj.getTime() + i * 15 * 60 * 1000);
    const timeStr = timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    pnl.push({ timestamp: timeStr, value: cumPnl });
    nav.push({ timestamp: timeStr, value: baseNav });
    exposure.push({ timestamp: timeStr, value: baseExposure });
  }

  // Batch mode: similar but offset
  if (mode === "batch") {
    const offset = (rand() - 0.5) * dailyVol * 0.1;
    pnl.forEach((p) => (p.value += offset));
    nav.forEach((p) => (p.value += offset));
  }

  return {
    strategyId: strategy.id,
    clientId: strategy.clientId,
    orgId: org.id,
    date,
    mode,
    pnl,
    nav,
    exposure,
  };
}

// =============================================================================
// AGGREGATION FUNCTIONS - Filter and sum at any level
// =============================================================================

export interface FilterContext {
  organizationIds: string[];
  clientIds: string[];
  strategyIds: string[];
  mode: "live" | "batch";
  date: string;
}

export function getFilteredStrategies(filter: FilterContext): TradingStrategy[] {
  let result = [...STRATEGIES];

  // Filter by organization
  if (filter.organizationIds.length > 0) {
    const clientIds = CLIENTS.filter((c) => filter.organizationIds.includes(c.orgId)).map((c) => c.id);
    result = result.filter((s) => clientIds.includes(s.clientId));
  }

  // Filter by client
  if (filter.clientIds.length > 0) {
    result = result.filter((s) => filter.clientIds.includes(s.clientId));
  }

  // Filter by strategy
  if (filter.strategyIds.length > 0) {
    result = result.filter((s) => filter.strategyIds.includes(s.id));
  }

  return result;
}

export function getAggregatedPnL(filter: FilterContext): PnLBreakdown {
  const strategies = getFilteredStrategies(filter);

  // Generate individual breakdowns and sum
  const breakdowns = strategies.map((s) => generatePnLBreakdown(s, filter.date, filter.mode));

  // Aggregate all numeric fields
  const aggregated: PnLBreakdown = {
    strategyId: "AGGREGATE",
    clientId: filter.clientIds.length === 1 ? filter.clientIds[0] : "MULTIPLE",
    orgId: filter.organizationIds.length === 1 ? filter.organizationIds[0] : "MULTIPLE",
    date: filter.date,
    mode: filter.mode,
    delta: 0,
    funding: 0,
    basis: 0,
    interest_rate: 0,
    greeks: 0,
    mark_to_market: 0,
    carry: 0,
    fx: 0,
    fees: 0,
    slippage: 0,
    residual: 0,
    total: 0,
  };

  breakdowns.forEach((b) => {
    aggregated.delta += b.delta;
    aggregated.funding += b.funding;
    aggregated.basis += b.basis;
    aggregated.interest_rate += b.interest_rate;
    aggregated.greeks += b.greeks;
    aggregated.mark_to_market += b.mark_to_market;
    aggregated.carry += b.carry;
    aggregated.fx += b.fx;
    aggregated.fees += b.fees;
    aggregated.slippage += b.slippage;
    aggregated.residual += b.residual;
    aggregated.total += b.total;

    // Strategy-specific fields
    if (b.funding_pnl) aggregated.funding_pnl = (aggregated.funding_pnl || 0) + b.funding_pnl;
    if (b.basis_spread_pnl) aggregated.basis_spread_pnl = (aggregated.basis_spread_pnl || 0) + b.basis_spread_pnl;
    if (b.trading_pnl) aggregated.trading_pnl = (aggregated.trading_pnl || 0) + b.trading_pnl;
    if (b.lending_yield_pnl) aggregated.lending_yield_pnl = (aggregated.lending_yield_pnl || 0) + b.lending_yield_pnl;
    if (b.delta_pnl) aggregated.delta_pnl = (aggregated.delta_pnl || 0) + b.delta_pnl;
    if (b.gamma_pnl) aggregated.gamma_pnl = (aggregated.gamma_pnl || 0) + b.gamma_pnl;
    if (b.vega_pnl) aggregated.vega_pnl = (aggregated.vega_pnl || 0) + b.vega_pnl;
    if (b.theta_pnl) aggregated.theta_pnl = (aggregated.theta_pnl || 0) + b.theta_pnl;
  });

  return aggregated;
}

export function getAggregatedTimeSeries(filter: FilterContext): {
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
} {
  const strategies = getFilteredStrategies(filter);

  if (strategies.length === 0) {
    return { pnl: [], nav: [], exposure: [] };
  }

  // Generate individual time series and aggregate
  const allSeries = strategies.map((s) => generateIntradayTimeSeries(s, filter.date, filter.mode));

  // Aggregate by timestamp
  const numPoints = allSeries[0].pnl.length;
  const pnl: TimeSeriesPoint[] = [];
  const nav: TimeSeriesPoint[] = [];
  const exposure: TimeSeriesPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const timestamp = allSeries[0].pnl[i].timestamp;

    let pnlSum = 0;
    let navSum = 0;
    let exposureSum = 0;

    allSeries.forEach((s) => {
      pnlSum += s.pnl[i]?.value || 0;
      navSum += s.nav[i]?.value || 0;
      exposureSum += s.exposure[i]?.value || 0;
    });

    pnl.push({ timestamp, value: pnlSum });
    nav.push({ timestamp, value: navSum });
    exposure.push({ timestamp, value: exposureSum });
  }

  return { pnl, nav, exposure };
}

// Get delta between live and batch
export function getLiveBatchDelta(filter: FilterContext): {
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
} {
  const liveData = getAggregatedTimeSeries({ ...filter, mode: "live" });
  const batchData = getAggregatedTimeSeries({ ...filter, mode: "batch" });

  const delta = {
    pnl: liveData.pnl.map((p, i) => ({
      timestamp: p.timestamp,
      value: p.value - (batchData.pnl[i]?.value || 0),
    })),
    nav: liveData.nav.map((p, i) => ({
      timestamp: p.timestamp,
      value: p.value - (batchData.nav[i]?.value || 0),
    })),
    exposure: liveData.exposure.map((p, i) => ({
      timestamp: p.timestamp,
      value: p.value - (batchData.exposure[i]?.value || 0),
    })),
  };

  return delta;
}

// Get strategy-level performance for table
export function getStrategyPerformance(filter: FilterContext): Array<{
  id: string;
  name: string;
  assetClass: string;
  archetype: string;
  clientName: string;
  orgName: string;
  status: string;
  executionMode: string;
  pnl: number;
  pnlChange: number;
  sharpe: number;
  maxDrawdown: number;
  nav: number;
  exposure: number;
}> {
  const strategies = getFilteredStrategies(filter);

  return strategies.map((s) => {
    const breakdown = generatePnLBreakdown(s, filter.date, filter.mode);
    const client = CLIENTS.find((c) => c.id === s.clientId)!;
    const org = ORGANIZATIONS.find((o) => o.id === client.orgId)!;

    // Generate some derived metrics
    const seed = `${s.id}-${filter.date}-metrics`;
    const rand = seededRandom(seed);

    return {
      id: s.id,
      name: s.name,
      assetClass: s.assetClass,
      archetype: s.archetype,
      clientName: client.name,
      orgName: org.name,
      status: s.status,
      executionMode: s.executionMode,
      pnl: breakdown.total,
      pnlChange: (rand() - 0.4) * 15, // Percent change
      sharpe: s.expectedSharpe * (0.8 + rand() * 0.4),
      maxDrawdown: s.expectedVolatility * 100 * (1 + rand() * 0.5),
      nav: s.baseCapital + breakdown.total,
      exposure: s.baseCapital * (0.5 + rand() * 0.4),
    };
  });
}

// Export helper to get today's date
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Export helper to get yesterday's date
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// =============================================================================
// SERVICE-TO-STRATEGY MAPPING - For filtering health/alerts by strategy
// =============================================================================

// Map of services to the asset classes/archetypes they support
export const SERVICE_ASSET_CLASS_MAP: Record<string, string[]> = {
  "Execution Service": ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"],
  "Market Data": ["CeFi", "DeFi", "TradFi"],
  "Risk Engine": ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"],
  "P&L Attribution": ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"],
  "ML Inference": ["CeFi", "TradFi"], // Only used by ML strategies
  Alerting: ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"],
  "DeFi Gateway": ["DeFi"],
  "Sports Odds Feed": ["Sports"],
  "Prediction Market Feed": ["Prediction"],
  "Binance Connector": ["CeFi"],
  "OKX Connector": ["CeFi"],
  "Deribit Connector": ["CeFi"],
  "Hyperliquid Connector": ["DeFi", "CeFi"],
  "Aave Connector": ["DeFi"],
  "Uniswap Connector": ["DeFi"],
  "IBKR Connector": ["TradFi"],
  "Sports API Gateway": ["Sports"],
};

// Map of services to the specific venues they connect to
export const SERVICE_VENUE_MAP: Record<string, string[]> = {
  "Binance Connector": ["binance"],
  "OKX Connector": ["okx"],
  "Deribit Connector": ["deribit"],
  "Hyperliquid Connector": ["hyperliquid"],
  "Aave Connector": ["aave"],
  "Uniswap Connector": ["uniswap"],
  "Morpho Connector": ["morpho"],
  "IBKR Connector": ["ibkr"],
  "CME Connector": ["cme"],
  "Betfair Connector": ["betfair"],
  "Pinnacle Connector": ["pinnacle"],
  "DraftKings Connector": ["draftkings"],
  "FanDuel Connector": ["fanduel"],
  "Polymarket Connector": ["polymarket"],
  "Kalshi Connector": ["kalshi"],
};

// Get services relevant to a strategy
export function getStrategyServices(strategyId: string): string[] {
  const strategy = STRATEGIES.find((s) => s.id === strategyId);
  if (!strategy) return [];

  const services: string[] = [];

  // Add core services based on asset class
  Object.entries(SERVICE_ASSET_CLASS_MAP).forEach(([service, assetClasses]) => {
    if (assetClasses.includes(strategy.assetClass)) {
      services.push(service);
    }
  });

  // Add venue-specific connectors
  strategy.venues.forEach((venue) => {
    Object.entries(SERVICE_VENUE_MAP).forEach(([service, venues]) => {
      if (venues.includes(venue.toLowerCase()) && !services.includes(service)) {
        services.push(service);
      }
    });
  });

  return services;
}

// Get services relevant to a filtered set of strategies
export function getFilteredServices(filter: FilterContext): string[] {
  const strategies = getFilteredStrategies(filter);
  const servicesSet = new Set<string>();

  strategies.forEach((s) => {
    getStrategyServices(s.id).forEach((service) => servicesSet.add(service));
  });

  return Array.from(servicesSet);
}

// Filter alerts by strategy context
export interface Alert {
  id: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  source: string;
  strategyId?: string;
  clientId?: string;
  orgId?: string;
  assetClass?: string;
}

export function getFilteredAlerts(alerts: Alert[], filter: FilterContext): Alert[] {
  const strategies = getFilteredStrategies(filter);
  const strategyIds = new Set(strategies.map((s) => s.id));
  const clientIds = new Set(strategies.map((s) => s.clientId));
  const orgIds = new Set(CLIENTS.filter((c) => clientIds.has(c.id)).map((c) => c.orgId));
  const assetClasses = new Set(strategies.map((s) => s.assetClass));

  return alerts.filter((alert) => {
    // If alert has a strategy ID, check if it matches
    if (alert.strategyId && !strategyIds.has(alert.strategyId)) return false;
    // If alert has a client ID, check if it matches
    if (alert.clientId && !clientIds.has(alert.clientId)) return false;
    // If alert has an org ID, check if it matches
    if (alert.orgId && !orgIds.has(alert.orgId)) return false;
    // If alert has an asset class, check if it matches
    if (alert.assetClass && !assetClasses.has(alert.assetClass as TradingStrategy["assetClass"])) return false;
    return true;
  });
}
