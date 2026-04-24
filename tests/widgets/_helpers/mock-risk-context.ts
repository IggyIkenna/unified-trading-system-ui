import { vi } from "vitest";
import type { RiskData, RiskLimit, ExposureRow } from "@/components/widgets/risk/risk-data-context";
import type { StrategyRiskProfile, PortfolioDeltaComposite } from "@/lib/types/defi";

// ---------------------------------------------------------------------------
// VenueCircuitBreakerStatus builder
// ---------------------------------------------------------------------------

export interface MockVenueCircuitBreaker {
  venue: string;
  strategy_id: string;
  status: "CLOSED" | "HALF_OPEN" | "OPEN";
  kill_switch_active: boolean;
}

export function buildMockVenueCircuitBreaker(
  overrides: Partial<MockVenueCircuitBreaker> = {},
): MockVenueCircuitBreaker {
  return {
    venue: "BINANCE",
    strategy_id: "DEFI_ETH_BASIS_HUF_1H",
    status: "CLOSED",
    kill_switch_active: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ExposureRow builder
// ---------------------------------------------------------------------------

export function buildMockExposureRow(overrides: Partial<ExposureRow> = {}): ExposureRow {
  return {
    component: "Delta",
    category: "first_order",
    pnl: 12000,
    exposure: 500000,
    limit: 1000000,
    utilization: 50,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// RiskLimit builder
// ---------------------------------------------------------------------------

export function buildMockRiskLimit(overrides: Partial<RiskLimit> = {}): RiskLimit {
  return {
    id: "limit-1",
    name: "Gross Delta Exposure",
    value: 500000,
    limit: 1000000,
    unit: "USD",
    category: "exposure",
    entity: "portfolio",
    entityType: "company",
    level: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DefiRiskProfile builder
// ---------------------------------------------------------------------------

export function buildMockStrategyRiskProfile(overrides: Partial<StrategyRiskProfile> = {}): StrategyRiskProfile {
  return {
    strategy_id: "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod" as StrategyRiskProfile["strategy_id"],
    protocol_risk: "low",
    coin_isolated_risk: "medium",
    basis_risk: "low",
    funding_rate_risk: "low",
    liquidity_risk_pct: 0.3,
    risk_notes: "Stable yield strategy, low risk.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PortfolioDeltaComposite builder
// ---------------------------------------------------------------------------

export function buildMockPortfolioDeltaComposite(
  overrides: Partial<PortfolioDeltaComposite> = {},
): PortfolioDeltaComposite {
  return {
    total_delta_usd: 12000,
    total_delta_eth: 3.5,
    total_delta_sol: 10.0,
    total_delta_btc: 0.2,
    per_strategy: [],
    total_liquidation_cost_pct: 0.4,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Full RiskData mock factory
// ---------------------------------------------------------------------------

export interface MockRiskDataOverrides {
  venueCircuitBreakers?: MockVenueCircuitBreaker[];
  isLoading?: boolean;
  hasError?: boolean;
  filteredExposureRows?: ExposureRow[];
  groupedExposure?: Record<string, ExposureRow[]>;
  exposureTimeSeries?: Array<Record<string, unknown>>;
  exposurePeriod?: "1W" | "1M" | "3M";
  riskFilterStrategy?: string;
  portfolioGreeks?: RiskData["portfolioGreeks"];
  positionGreeks?: Array<Record<string, unknown>>;
  greeksTimeSeries?: Array<Record<string, unknown>>;
  secondOrderRisks?: RiskData["secondOrderRisks"];
  portfolioGreeksData?: RiskData["portfolioGreeksData"];
  totalVar95?: number;
  totalVar99?: number;
  totalES95?: number;
  totalES99?: number;
  criticalCount?: number;
  warningCount?: number;
  killedStrategies?: Set<string>;
  regimeMultiplier?: number;
  varSummary?: RiskData["varSummary"];
  defiRiskProfiles?: StrategyRiskProfile[];
  defiDeltaComposite?: PortfolioDeltaComposite;
  hasDefiStrategies?: boolean;
  defiRiskTimeSeries?: Array<Record<string, number | string>>;
  handleTripCircuitBreaker?: ReturnType<typeof vi.fn>;
  handleResetCircuitBreaker?: ReturnType<typeof vi.fn>;
  handleKillSwitch?: ReturnType<typeof vi.fn>;
  handleScale?: ReturnType<typeof vi.fn>;
  trippedStrategies?: Set<string>;
  scaledStrategies?: Record<string, number>;
}

export function buildMockRiskData(overrides: MockRiskDataOverrides = {}): RiskData {
  const filteredExposureRows = overrides.filteredExposureRows ?? [buildMockExposureRow()];
  return {
    // Limits + sorting
    riskLimits: [buildMockRiskLimit()],
    sortedLimits: [buildMockRiskLimit()],

    // VaR
    componentVarData: [],
    adjustedVarData: [],
    stressScenarios: [],

    // Greeks
    portfolioGreeks: overrides.portfolioGreeks ?? {
      delta: 0.42,
      gamma: 0.012,
      vega: 3200,
      theta: -180,
      rho: 120,
    },
    positionGreeks: overrides.positionGreeks ?? [
      { instrument: "ETH-PERP", venue: "BINANCE", qty: 10, delta: 0.42, gamma: 0.012, vega: 3200, theta: -180 },
    ],
    greeksTimeSeries: overrides.greeksTimeSeries ?? [],
    secondOrderRisks: overrides.secondOrderRisks ?? { volga: 500, vanna: -300, slide: -100 },
    varSummary: overrides.varSummary ?? null,
    varSummaryLoading: false,
    regimeData: null,
    portfolioGreeksData: overrides.portfolioGreeksData ?? null,
    portfolioGreeksLoading: false,

    // Circuit breakers
    venueCircuitBreakers: overrides.venueCircuitBreakers ?? [
      buildMockVenueCircuitBreaker({ venue: "BINANCE", strategy_id: "s1", status: "CLOSED" }),
      buildMockVenueCircuitBreaker({ venue: "DYDX", strategy_id: "s2", status: "OPEN" }),
    ],
    strategyRiskHeatmap: [],

    // Exposure
    exposureRows: [buildMockExposureRow()],
    filteredExposureRows,
    groupedExposure: overrides.groupedExposure ?? { first_order: filteredExposureRows },
    exposureTimeSeries: overrides.exposureTimeSeries ?? [],
    exposurePeriod: overrides.exposurePeriod ?? "1M",
    setExposurePeriod: vi.fn(),

    // Term structure / HF / liquidation
    termStructureData: [],
    hfTimeSeries: [],
    distanceToLiquidation: [],

    // Status flags
    isLoading: overrides.isLoading ?? false,
    hasError: overrides.hasError ?? false,

    // VaR/ES totals
    totalVar95: overrides.totalVar95 ?? 45000,
    totalVar99: overrides.totalVar99 ?? 68000,
    totalES95: overrides.totalES95 ?? 52000,
    totalES99: overrides.totalES99 ?? 80000,
    criticalCount: overrides.criticalCount ?? 1,
    warningCount: overrides.warningCount ?? 2,

    // Method / multiplier / filter
    varMethod: "historical",
    setVarMethod: vi.fn(),
    regimeMultiplier: overrides.regimeMultiplier ?? 1,
    setRegimeMultiplier: vi.fn(),
    riskFilterStrategy: overrides.riskFilterStrategy ?? "all",
    setRiskFilterStrategy: vi.fn(),

    // Node / stress
    selectedNode: null,
    setSelectedNode: vi.fn(),
    selectedStressScenario: null,
    setSelectedStressScenario: vi.fn(),
    stressTestResult: null,
    stressTestLoading: false,

    // What-if
    btcPriceChangePct: 0,
    setBtcPriceChangePct: vi.fn(),
    estimatedPnl: 0,

    // Circuit breaker actions
    handleTripCircuitBreaker: overrides.handleTripCircuitBreaker ?? vi.fn(),
    handleResetCircuitBreaker: overrides.handleResetCircuitBreaker ?? vi.fn(),
    handleKillSwitch: overrides.handleKillSwitch ?? vi.fn(),
    handleScale: overrides.handleScale ?? vi.fn(),
    trippedStrategies: overrides.trippedStrategies ?? new Set(),
    killedStrategies: overrides.killedStrategies ?? new Set(),
    scaledStrategies: overrides.scaledStrategies ?? {},

    // Batch / kill
    anyKillSwitchActive: false,
    isBatchMode: false,
    circuitBreakerPending: false,

    // DeFi risk
    defiRiskProfiles: overrides.defiRiskProfiles ?? [buildMockStrategyRiskProfile()],
    defiDeltaComposite: overrides.defiDeltaComposite ?? buildMockPortfolioDeltaComposite(),
    hasDefiStrategies: overrides.hasDefiStrategies ?? true,
    defiRiskTimeSeries: overrides.defiRiskTimeSeries ?? [],
  };
}
