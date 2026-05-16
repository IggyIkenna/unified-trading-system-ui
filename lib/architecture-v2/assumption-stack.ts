/**
 * AssumptionStack — the Odum backtest-to-live USP.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §4.9 (the assumption-stack
 * layer). The Odum claim:
 *
 *   "Most platforms backtest signals. DART simulates the operating system
 *    around the strategy. Execution, gas, treasury, liquidation, client
 *    flows, routing, portfolio rebalancing, and reporting assumptions are
 *    versioned into the strategy lifecycle, then carried from research
 *    into paper and live trading."
 *
 * Rules:
 *   - The AssumptionStack is content-hashed. Any change that affects strategy
 *     behaviour creates a new version. Promotion bundles a frozen stack
 *     into the StrategyReleaseBundle.
 *   - Operational config (API keys, wallet ids, signer perms) lives in
 *     AccountConnectivityConfig + TreasuryOperationalConfig and does NOT
 *     bump the assumption-stack version.
 *   - Every research / simulation / promotion / live cockpit surface
 *     exposes the active stack so the user can answer "what assumptions
 *     drove this number?"
 *
 * This file is the typed schema for the stack + each layer config. UI lands
 * in the cockpit alongside the ReleaseBundlePanel.
 */

import type { ShareClass } from "./enums";

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Execution assumptions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Slippage model used to size pre-trade impact and fill simulation. The
 * cockpit visualises the curve so the buyer sees the assumption.
 */
export type SlippageModel = "fixed_bps" | "linear_size" | "square_root_size" | "venue_book_replay";

export interface ExecutionAssumptionConfig {
  readonly slippageModel: SlippageModel;
  /** Headline slippage in basis points the model targets at average size. */
  readonly slippageBps: number;
  /** Commission / taker fee in basis points. */
  readonly commissionBps: number;
  /** Round-trip latency in milliseconds (signal → venue ack). */
  readonly latencyMs: number;
  /** Maker rebate in basis points (negative = pay rebate). */
  readonly makerRebateBps?: number;
  /** When true, simulator queues at the back of the book; when false, top-of-book. */
  readonly queuePositionAware: boolean;
  /** Approved execution presets the strategy can route through. */
  readonly executionPresets: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2 — Gas / chain-cost assumptions (DeFi only; null for CeFi)
// ─────────────────────────────────────────────────────────────────────────────

export interface GasFeeAssumptionConfig {
  /** Chain ids the assumption covers. */
  readonly chainIds: readonly number[];
  /** Base-fee assumption in gwei (or chain-equivalent). */
  readonly baseFeeGwei: number;
  /** Priority fee (tip) in gwei. */
  readonly priorityFeeGwei: number;
  /** Gas-price stress envelope as `[low, high]` multipliers vs current. */
  readonly stressMultipliers: readonly [number, number];
  /** Average gas units per transaction by category. */
  readonly avgGasUnits: Readonly<
    Record<"swap" | "lending_supply" | "lending_borrow" | "approve" | "claim" | "transfer", number>
  >;
  /** Whether the simulator includes MEV / sandwich protection cost. */
  readonly mevProtectionEnabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3 — Treasury policy assumptions (separate from operational config)
// ─────────────────────────────────────────────────────────────────────────────

export interface TreasuryPolicyAssumptionConfig {
  readonly shareClass: ShareClass;
  /** Approved collateral assets. */
  readonly approvedCollateral: readonly string[];
  /** Allowed hedge-ratio range. 1 = fully hedged. */
  readonly hedgeRatioRange: readonly [number, number];
  /** Max gross / net leverage as multiple of NAV. */
  readonly maxGrossLeverage: number;
  readonly maxNetLeverage: number;
  /** Auto-rebalance enabled + drift threshold (decimal from target). */
  readonly autoRebalanceEnabled: boolean;
  readonly rebalanceThreshold?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 4 — Client deposit / withdrawal assumptions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Models the buyer's "what if 30% of AUM withdraws this week?" question. The
 * simulator stresses strategy P&L under the modelled flow shape.
 */
export interface ClientFlowAssumptionConfig {
  /** Average daily deposit pace as fraction of NAV. */
  readonly avgDailyDepositPct: number;
  /** Average daily withdrawal pace as fraction of NAV. */
  readonly avgDailyWithdrawalPct: number;
  /** Worst-case redemption window stress. e.g. {pct: 0.30, days: 5}. */
  readonly redemptionStress: { readonly pct: number; readonly days: number };
  /** Notice period (calendar days) before redemption settles. */
  readonly noticePeriodDays: number;
  /** Liquidity buffer kept idle to absorb redemptions. */
  readonly liquidityBufferPct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 5 — Liquidation / margin assumptions (CeFi perp + DeFi lending)
// ─────────────────────────────────────────────────────────────────────────────

export interface LiquidationAssumptionConfig {
  /** Initial margin requirement as decimal. */
  readonly initialMarginPct: number;
  /** Maintenance margin trigger as decimal. */
  readonly maintenanceMarginPct: number;
  /** Collateral haircut by asset symbol (decimal). */
  readonly collateralHaircuts: Readonly<Record<string, number>>;
  /** Max loan-to-value before forced rebalance (DeFi). */
  readonly maxLtv?: number;
  /** Forced-rebalance LTV — strategy de-risks above this band. */
  readonly forceRebalanceLtv?: number;
  /** Stress shock as % adverse price move applied for liquidation testing. */
  readonly priceShockPct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 6 — Portfolio / multi-strategy rebalance assumptions
// ─────────────────────────────────────────────────────────────────────────────

export interface PortfolioRebalanceAssumptionConfig {
  /** Allocation method across multiple strategies in the same mandate. */
  readonly method: "equal_weight" | "risk_parity" | "vol_target" | "manual";
  /** Vol-target the rebalance aims for (annualised). */
  readonly volTarget?: number;
  /** Rebalance cadence — how often to rebalance toward target. */
  readonly cadence: "daily" | "weekly" | "monthly" | "drift_threshold";
  /** When `cadence === "drift_threshold"`, the drift trigger as decimal. */
  readonly driftThreshold?: number;
  /** Max single-strategy weight cap. */
  readonly maxSingleWeight?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 7 — Venue / protocol routing assumptions
// ─────────────────────────────────────────────────────────────────────────────

export interface VenueRoutingAssumptionConfig {
  /** Routing mode declaration (matches enums.VenueRoutingMode). */
  readonly mode: "SOR_AT_EXECUTION" | "STRATEGY_PICKED" | "META_BROKER";
  /** Approved venue / protocol ids the strategy may touch. */
  readonly approvedVenues: readonly string[];
  /** Per-venue weight bias used by SOR when scoring options. */
  readonly venueBias?: Readonly<Record<string, number>>;
  /** Whether to prefer same-venue legs to minimise basis risk. */
  readonly preferSameVenueLeg: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 8 — Risk-limit assumptions (operate-time guardrails frozen at promote)
// ─────────────────────────────────────────────────────────────────────────────

export interface RiskAssumptionConfig {
  /** Max per-strategy P&L drawdown before kill-switch trips. */
  readonly maxDrawdownPct: number;
  /** Max single-position size as fraction of NAV. */
  readonly maxConcentrationPct: number;
  /** Max gross / net exposure as multiple of NAV (mirrors treasury but applied at risk-service layer). */
  readonly maxGrossExposure: number;
  readonly maxNetExposure: number;
  /** USD ceiling on absolute unrealised loss before tighten-only mode. */
  readonly maxUnrealisedLossUsd: number;
  /** Per-venue concentration cap. */
  readonly maxVenueConcentrationPct?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 9 — Reporting / accounting basis assumptions
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportingAssumptionConfig {
  /** P&L recognition basis. */
  readonly pnlBasis: "realised" | "mark_to_market" | "blended";
  /** Mark-source for MTM valuations. */
  readonly markSource: "primary_venue" | "weighted_average" | "oracle" | "internal_curve";
  /** NAV calculation cadence. */
  readonly navFrequency: "intraday" | "eod" | "weekly" | "monthly";
  /** Settlement assumption for venue-side T+N latency. */
  readonly settlementLagDays: number;
  /** True iff the reporting includes execution-quality attribution. */
  readonly executionAttributionIncluded: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// AssumptionStack — composite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The full assumption stack. Every layer except the optional ones MUST be
 * present at promotion time; missing layers block the bundle from advancing
 * past `candidate`.
 */
export interface AssumptionStack {
  readonly id: string;
  /** Semver — bumps on any behaviour-affecting change. */
  readonly version: string;
  /** SHA-256 of the canonical JSON serialisation. */
  readonly hash: string;

  readonly strategyId: string;
  readonly strategyVersion: string;

  /** Optional ML model versions referenced by the strategy. */
  readonly modelVersionIds?: readonly string[];
  /** Required feature-set versions. */
  readonly featureSetVersionIds: readonly string[];

  // Required layers (every promoted strategy needs these).
  readonly executionAssumptions: ExecutionAssumptionConfig;
  readonly treasuryPolicy: TreasuryPolicyAssumptionConfig;
  readonly venueRoutingAssumptions: VenueRoutingAssumptionConfig;
  readonly riskAssumptions: RiskAssumptionConfig;
  readonly reportingAssumptions: ReportingAssumptionConfig;

  // Optional layers — required only when relevant to the strategy.
  readonly gasFeeAssumptions?: GasFeeAssumptionConfig;
  readonly depositWithdrawalAssumptions?: ClientFlowAssumptionConfig;
  readonly liquidationAssumptions?: LiquidationAssumptionConfig;
  readonly portfolioRebalanceAssumptions?: PortfolioRebalanceAssumptionConfig;

  readonly createdBy: string;
  readonly createdAt: string;
  readonly notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation readiness
// ─────────────────────────────────────────────────────────────────────────────

export type AssumptionLayerKey =
  | "execution"
  | "gas_fees"
  | "treasury"
  | "client_flows"
  | "liquidation"
  | "portfolio_rebalance"
  | "venue_routing"
  | "risk"
  | "reporting";

/**
 * Layer-level readiness status. Consumed by `SimulationReadinessScore` to
 * answer "is this strategy promotion-ready?" without leaking the underlying
 * config shape.
 */
export type LayerReadiness = "complete" | "partial" | "missing" | "not_applicable";

export interface SimulationReadinessReport {
  readonly stackId: string;
  readonly perLayer: Readonly<Record<AssumptionLayerKey, LayerReadiness>>;
  /** 0..100 score weighted by required vs optional layers. */
  readonly score: number;
  /** Layers that block promotion when missing or partial. */
  readonly blockers: readonly AssumptionLayerKey[];
}

const REQUIRED_LAYERS: readonly AssumptionLayerKey[] = ["execution", "treasury", "venue_routing", "risk", "reporting"];

const OPTIONAL_LAYERS: readonly AssumptionLayerKey[] = [
  "gas_fees",
  "client_flows",
  "liquidation",
  "portfolio_rebalance",
];

/**
 * Compute a SimulationReadinessReport from a stack. The score gives required
 * layers weight 2 and optional layers weight 1 — so a stack that has every
 * required layer but none of the optional ones still scores 71%, while a
 * stack with all 9 layers scores 100%.
 */
export function evaluateSimulationReadiness(stack: AssumptionStack): SimulationReadinessReport {
  const perLayer: Record<AssumptionLayerKey, LayerReadiness> = {
    execution: stack.executionAssumptions ? "complete" : "missing",
    gas_fees: stack.gasFeeAssumptions ? "complete" : "not_applicable",
    treasury: stack.treasuryPolicy ? "complete" : "missing",
    client_flows: stack.depositWithdrawalAssumptions ? "complete" : "not_applicable",
    liquidation: stack.liquidationAssumptions ? "complete" : "not_applicable",
    portfolio_rebalance: stack.portfolioRebalanceAssumptions ? "complete" : "not_applicable",
    venue_routing: stack.venueRoutingAssumptions ? "complete" : "missing",
    risk: stack.riskAssumptions ? "complete" : "missing",
    reporting: stack.reportingAssumptions ? "complete" : "missing",
  };

  const blockers = REQUIRED_LAYERS.filter((k) => perLayer[k] !== "complete");

  const reqScore =
    REQUIRED_LAYERS.reduce((acc, k) => acc + (perLayer[k] === "complete" ? 2 : 0), 0) / (REQUIRED_LAYERS.length * 2);
  const optScore =
    OPTIONAL_LAYERS.reduce((acc, k) => acc + (perLayer[k] === "complete" ? 1 : 0), 0) / OPTIONAL_LAYERS.length;
  // Required layers weight 70% of the headline; optional layers 30%.
  const score = Math.round(reqScore * 70 + optScore * 30);

  return { stackId: stack.id, perLayer, score, blockers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live drift — simulated vs realised
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reports how far live realised behaviour drifts from the stack's assumptions.
 * Surfaced in Terminal/Explain alongside the bundle attribution.
 */
export interface AssumptionDriftReport {
  readonly stackId: string;
  /** Per-layer drift signed delta. Positive = worse than assumed. */
  readonly perLayerDrift: Readonly<Record<AssumptionLayerKey, number>>;
  /** Headline 0..100 score; 100 = perfect adherence to assumptions. */
  readonly adherenceScore: number;
  /** Layers where drift exceeds an alert threshold. */
  readonly alerts: readonly AssumptionLayerKey[];
}
