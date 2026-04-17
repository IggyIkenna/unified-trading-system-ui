/**
 * Mock data for Recovery Controls page (Observe > Recovery).
 * Provides circuit breaker states, active transfers, health factors,
 * and reconciliation status for the manual override dashboard.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type CircuitBreakerState = "CLOSED" | "DEGRADED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerVenue {
  venueId: string;
  venueName: string;
  state: CircuitBreakerState;
  failureRatePct: number;
  cooldownRemainingMs: number;
  backoffCycle: number;
  lastStateChangeAt: string;
  domain: "CeFi" | "DeFi" | "TradFi";
}

export type TransferStatus = "initiated" | "pending" | "confirmed" | "failed";
export type TransferType = "INTERNAL" | "CROSS_VENUE" | "WITHDRAWAL" | "DEPOSIT";

export interface ActiveTransfer {
  id: string;
  status: TransferStatus;
  type: TransferType;
  fromVenue: string;
  toVenue: string;
  token: string;
  amount: number;
  initiatedAt: string;
  updatedAt: string;
  txHash: string | null;
}

export interface HealthFactorEntry {
  strategyId: string;
  strategyName: string;
  venue: string;
  domain: "CeFi" | "DeFi" | "TradFi";
  healthFactor: number;
  collateralUsd: number;
  debtUsd: number;
  liquidationThreshold: number;
}

export type ReconHealth = "HEALTHY" | "STALE" | "FAILED";
export type ExecConnectivity = "CONNECTED" | "DEGRADED" | "DISCONNECTED";

export interface VenueReconStatus {
  venueId: string;
  venueName: string;
  reconHealth: ReconHealth;
  execConnectivity: ExecConnectivity;
  lastReconAt: string;
  lastExecPingAt: string;
  driftPct: number;
  isDualFailure: boolean;
}

export interface KillSwitchStatus {
  isActive: boolean;
  scope: string | null;
  activeSince: string | null;
  activatedBy: string | null;
  autoDeactivateMinutes: number | null;
}

export interface TreasuryReserve {
  currentPct: number;
  targetPct: number;
  rebalanceAmountUsd: number;
}

// ── Circuit Breaker Data ───────────────────────────────────────────────────

export const MOCK_CIRCUIT_BREAKERS: CircuitBreakerVenue[] = [
  {
    venueId: "BINANCE-SPOT",
    venueName: "Binance Spot",
    state: "CLOSED",
    failureRatePct: 0.2,
    cooldownRemainingMs: 0,
    backoffCycle: 0,
    lastStateChangeAt: "2026-04-16T08:00:00Z",
    domain: "CeFi",
  },
  {
    venueId: "OKX-SPOT",
    venueName: "OKX Spot",
    state: "DEGRADED",
    failureRatePct: 12.5,
    cooldownRemainingMs: 0,
    backoffCycle: 1,
    lastStateChangeAt: "2026-04-16T09:15:00Z",
    domain: "CeFi",
  },
  {
    venueId: "DERIBIT",
    venueName: "Deribit",
    state: "OPEN",
    failureRatePct: 87.3,
    cooldownRemainingMs: 45000,
    backoffCycle: 3,
    lastStateChangeAt: "2026-04-16T09:42:00Z",
    domain: "CeFi",
  },
  {
    venueId: "HYPERLIQUID",
    venueName: "Hyperliquid",
    state: "HALF_OPEN",
    failureRatePct: 22.1,
    cooldownRemainingMs: 12000,
    backoffCycle: 2,
    lastStateChangeAt: "2026-04-16T09:38:00Z",
    domain: "DeFi",
  },
  {
    venueId: "AAVE_V3-ETHEREUM",
    venueName: "Aave V3 (Ethereum)",
    state: "CLOSED",
    failureRatePct: 0.0,
    cooldownRemainingMs: 0,
    backoffCycle: 0,
    lastStateChangeAt: "2026-04-16T07:30:00Z",
    domain: "DeFi",
  },
  {
    venueId: "CME",
    venueName: "CME",
    state: "CLOSED",
    failureRatePct: 0.1,
    cooldownRemainingMs: 0,
    backoffCycle: 0,
    lastStateChangeAt: "2026-04-16T06:00:00Z",
    domain: "TradFi",
  },
];

// ── Active Transfers ───────────────────────────────────────────────────────

export const MOCK_ACTIVE_TRANSFERS: ActiveTransfer[] = [
  {
    id: "txf-001",
    status: "pending",
    type: "CROSS_VENUE",
    fromVenue: "BINANCE-SPOT",
    toVenue: "OKX-SPOT",
    token: "USDT",
    amount: 250000,
    initiatedAt: "2026-04-16T09:30:00Z",
    updatedAt: "2026-04-16T09:32:00Z",
    txHash: "0xabc123def456...",
  },
  {
    id: "txf-002",
    status: "confirmed",
    type: "INTERNAL",
    fromVenue: "AAVE_V3-ETHEREUM",
    toVenue: "HYPERLIQUID",
    token: "WETH",
    amount: 15.5,
    initiatedAt: "2026-04-16T09:00:00Z",
    updatedAt: "2026-04-16T09:12:00Z",
    txHash: "0x789abc012def...",
  },
  {
    id: "txf-003",
    status: "failed",
    type: "CROSS_VENUE",
    fromVenue: "DERIBIT",
    toVenue: "BINANCE-SPOT",
    token: "BTC",
    amount: 2.3,
    initiatedAt: "2026-04-16T08:45:00Z",
    updatedAt: "2026-04-16T08:50:00Z",
    txHash: null,
  },
];

// ── Health Factors ─────────────────────────────────────────────────────────

export const MOCK_HEALTH_FACTORS: HealthFactorEntry[] = [
  {
    strategyId: "DEFI_ETH_BASIS_HUF_1H",
    strategyName: "ETH Basis Trade",
    venue: "AAVE_V3-ETHEREUM",
    domain: "DeFi",
    healthFactor: 2.45,
    collateralUsd: 500000,
    debtUsd: 204082,
    liquidationThreshold: 0.825,
  },
  {
    strategyId: "DEFI_ETH_YIELD_ARB_HUF_4H",
    strategyName: "ETH Yield Arb",
    venue: "AAVE_V3-ETHEREUM",
    domain: "DeFi",
    healthFactor: 1.62,
    collateralUsd: 300000,
    debtUsd: 185185,
    liquidationThreshold: 0.825,
  },
  {
    strategyId: "DEFI_RECURSIVE_STAKED_BASIS",
    strategyName: "Recursive Staked Basis",
    venue: "AAVE_V3-ETHEREUM",
    domain: "DeFi",
    healthFactor: 1.18,
    collateralUsd: 200000,
    debtUsd: 169492,
    liquidationThreshold: 0.825,
  },
  {
    strategyId: "CEFI_BTC_MM_EVT_TICK",
    strategyName: "BTC Market Making",
    venue: "BINANCE-SPOT",
    domain: "CeFi",
    healthFactor: 5.2,
    collateralUsd: 400000,
    debtUsd: 76923,
    liquidationThreshold: 0.9,
  },
  {
    strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
    strategyName: "ETH Options MM",
    venue: "DERIBIT",
    domain: "CeFi",
    healthFactor: 1.05,
    collateralUsd: 150000,
    debtUsd: 142857,
    liquidationThreshold: 0.85,
  },
];

// ── Reconciliation Status ──────────────────────────────────────────────────

export const MOCK_RECON_STATUS: VenueReconStatus[] = [
  {
    venueId: "BINANCE-SPOT",
    venueName: "Binance Spot",
    reconHealth: "HEALTHY",
    execConnectivity: "CONNECTED",
    lastReconAt: "2026-04-16T09:44:00Z",
    lastExecPingAt: "2026-04-16T09:44:55Z",
    driftPct: 0.1,
    isDualFailure: false,
  },
  {
    venueId: "OKX-SPOT",
    venueName: "OKX Spot",
    reconHealth: "HEALTHY",
    execConnectivity: "DEGRADED",
    lastReconAt: "2026-04-16T09:43:00Z",
    lastExecPingAt: "2026-04-16T09:40:00Z",
    driftPct: 0.8,
    isDualFailure: false,
  },
  {
    venueId: "DERIBIT",
    venueName: "Deribit",
    reconHealth: "STALE",
    execConnectivity: "DEGRADED",
    lastReconAt: "2026-04-16T09:20:00Z",
    lastExecPingAt: "2026-04-16T09:35:00Z",
    driftPct: 3.2,
    isDualFailure: true,
  },
  {
    venueId: "HYPERLIQUID",
    venueName: "Hyperliquid",
    reconHealth: "HEALTHY",
    execConnectivity: "CONNECTED",
    lastReconAt: "2026-04-16T09:44:00Z",
    lastExecPingAt: "2026-04-16T09:44:50Z",
    driftPct: 0.3,
    isDualFailure: false,
  },
  {
    venueId: "AAVE_V3-ETHEREUM",
    venueName: "Aave V3 (Ethereum)",
    reconHealth: "HEALTHY",
    execConnectivity: "CONNECTED",
    lastReconAt: "2026-04-16T09:44:00Z",
    lastExecPingAt: "2026-04-16T09:44:48Z",
    driftPct: 0.0,
    isDualFailure: false,
  },
  {
    venueId: "CME",
    venueName: "CME",
    reconHealth: "FAILED",
    execConnectivity: "DISCONNECTED",
    lastReconAt: "2026-04-16T08:00:00Z",
    lastExecPingAt: "2026-04-16T08:00:00Z",
    driftPct: 0.0,
    isDualFailure: true,
  },
];

// ── Kill Switch Status ─────────────────────────────────────────────────────

export const MOCK_KILL_SWITCH_STATUS: KillSwitchStatus = {
  isActive: false,
  scope: null,
  activeSince: null,
  activatedBy: null,
  autoDeactivateMinutes: null,
};

// ── Treasury Reserve ───────────────────────────────────────────────────────

export const MOCK_TREASURY_RESERVE: TreasuryReserve = {
  currentPct: 18.5,
  targetPct: 20.0,
  rebalanceAmountUsd: 37500,
};

// ── Recovery Event Types (for alerts filter) ───────────────────────────────

export const RECOVERY_EVENT_PREFIXES = [
  "KILL_SWITCH_",
  "CIRCUIT_BREAKER_",
  "POSITION_DRIFT_",
  "DUAL_FAILURE_",
  "TRANSFER_",
  "AUTO_DELEVERAGE_",
] as const;
