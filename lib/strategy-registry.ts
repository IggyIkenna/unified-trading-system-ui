/**
 * Strategy Registry - Comprehensive strategy definitions from actual system configs
 * 
 * Based on the strategy documentation from:
 * - DeFi Basis Trade
 * - DeFi Recursive Staked Basis
 * - DeFi Market Making (AMM LP)
 * - CeFi Market Making
 * - TradFi ML Directional
 * - TradFi Options Market Making
 * - Sports Arbitrage
 * 
 * NOTE: Core enumerations (AssetClass, StrategyExecutionMode, TestingStage, etc.)
 * are defined in ./taxonomy.ts as the single source of truth.
 */

import {
  type AssetClass,
  type StrategyArchetype,
  type StrategyExecutionMode as StrategyExecMode,
  type TestingStage as TaxonomyTestingStage,
  type SystemMode,
  TESTING_STAGES,
  TESTING_STAGE_CONFIG,
  SYSTEM_MODE_CONFIG,
} from "./taxonomy"

// Re-export taxonomy types for consumers of this module
export type { AssetClass, StrategyArchetype, SystemMode }
export { TESTING_STAGES, TESTING_STAGE_CONFIG }

// =============================================================================
// EXECUTION MODES (System-level: Live vs Batch)
// =============================================================================

// Using taxonomy's SystemMode but keeping local alias for backwards compatibility
export type ExecutionMode = SystemMode

export interface ExecutionModeConfig {
  mode: ExecutionMode
  dataSource: "pubsub" | "gcs"
  latency: string
  description: string
}

export const EXECUTION_MODES: Record<ExecutionMode, ExecutionModeConfig> = {
  live: {
    mode: "live",
    dataSource: "pubsub",
    latency: "Real-time (sub-second to seconds)",
    description: "Live market data via Pub/Sub, real-time execution"
  },
  batch: {
    mode: "batch", 
    dataSource: "gcs",
    latency: "Historical reconstruction",
    description: "Historical data from GCS, backtesting mode"
  }
}

// =============================================================================
// INSTRUMENT DEFINITIONS
// =============================================================================

export interface Instrument {
  key: string
  venue: string
  type: "SPOT_ASSET" | "Perp" | "aToken" | "debtToken" | "LP NFT" | "Option" | "Future" | "Exchange Odds" | "Fixed Odds" | "LST" | "Supply"
  role: string
}

// =============================================================================
// RISK PROFILE
// =============================================================================

export interface RiskProfile {
  targetReturn: string
  targetSharpe: string
  maxDrawdown: string
  maxLeverage: string
  capitalScalability: string
}

// =============================================================================
// LATENCY PROFILE
// =============================================================================

export interface LatencyProfile {
  dataToSignal: string
  signalToInstruction: string
  instructionToFill: string
  endToEnd: string
  coLocationNeeded: boolean
}

// =============================================================================
// PNL ATTRIBUTION
// =============================================================================

export interface PnLComponent {
  id: string
  label: string
  settlementType: string
  description: string
  color: string
}

export interface PnLBreakdown {
  components: PnLComponent[]
  formula?: string
}

// =============================================================================
// FEATURES CONSUMED
// =============================================================================

export interface FeatureConsumed {
  name: string
  source: string
  sla: string
  usedFor: string
}

// =============================================================================
// RISK SUBSCRIPTIONS
// =============================================================================

export interface RiskSubscription {
  riskType: string
  subscribed: boolean
  threshold?: string
  action?: string
}

// =============================================================================
// TESTING STAGE
// =============================================================================

// Using taxonomy's TestingStage as the single source of truth
export type TestingStage = TaxonomyTestingStage

export interface TestingStageStatus {
  stage: TestingStage
  status: "done" | "pending" | "blocked" | "in_progress"
  notes?: string
}

// =============================================================================
// KELLY SIZING
// =============================================================================

export interface KellySizing {
  fraction: number
  maxStakePct: number
  edgeThreshold: number
  bankrollDrawdownLimit: number
}

// =============================================================================
// STRATEGY DEFINITION
// =============================================================================

export interface StrategyConfig {
  key: string
  value: string
  description: string
}

export interface Strategy {
  // Identity
  id: string
  name: string
  description: string
  strategyIdPattern: string
  
  // Organization / Client mapping (for trading-data integration)
  clientId: string
  
  // Classification
  assetClass: "DeFi" | "CeFi" | "TradFi" | "Sports" | "Prediction"
  strategyType: string
  archetype: "BASIS_TRADE" | "MARKET_MAKING" | "ARBITRAGE" | "YIELD" | "DIRECTIONAL" | "MOMENTUM" | "MEAN_REVERSION" | "STATISTICAL_ARB" | "OPTIONS" | "PREDICTION_ARB" | "ML_DIRECTIONAL" | "AMM_LP" | "RECURSIVE_STAKED_BASIS" | "SPORTS_ARB"
  executionMode: "SCE" | "HUF" | "EVT" // Strategy execution mode

  // Status
  status: "live" | "paused" | "warning" | "development" | "staging" | "paper"
  version: string
  deployedAt?: string
  
  // Instruments
  instruments: Instrument[]
  
  // Features
  featuresConsumed: FeatureConsumed[]
  
  // Data Architecture
  dataArchitecture: {
    rawDataSource: string
    processedData: string[]
    interval: string
    lowestGranularity: string
    executionMode: string
  }
  
  // SOR (Smart Order Routing)
  sorEnabled: boolean
  sorConfig?: {
    legs: { name: string; sorEnabled: boolean; allowedVenues?: string[] }[]
  }
  
  // PnL Attribution
  pnlAttribution: PnLBreakdown
  
  // Risk Profile
  riskProfile: RiskProfile
  
  // Latency
  latencyProfile: LatencyProfile
  
  // Risk Subscriptions
  riskSubscriptions: RiskSubscription[]
  
  // Testing Status
  testingStatus: TestingStageStatus[]
  
  // Config Parameters
  configParams: StrategyConfig[]
  
  // Cross-asset link (for multi-asset-class strategies)
  crossAssetLink?: {
    from: string
    to: string
    instruments: string[]
  }

  // Venues
  venues: string[]
  
  // Performance (mock data)
  performance: {
    pnlTotal: number
    pnlMTD: number
    sharpe: number
    maxDrawdown: number
    returnPct: number
    positions: number
    netExposure: number
  }
  
  // Sparkline data
  sparklineData: number[]
  
  // References
  references?: {
    implementation?: string
    configSchema?: string
    executionAdapter?: string
  }
  
  // Instruction Types - operations used by this strategy (critique 1.7)
  instructionTypes: string[]

  // Kelly Criterion Sizing (sports strategies)
  kellySizing?: KellySizing
}

// =============================================================================
// STRATEGY REGISTRY
// =============================================================================

export const STRATEGIES: Strategy[] = [
  // ============================================
  // DeFi Basis Trade
  // ============================================
  {
    id: "DEFI_ETH_BASIS_SCE_1H",
    name: "ETH Basis Trade",
    description: "Long spot ETH + short ETH perpetual on Hyperliquid. Delta-neutral funding rate arbitrage.",
    strategyIdPattern: "DEFI_ETH_BASIS_SCE_1H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Basis Trade",
    archetype: "BASIS_TRADE",
    executionMode: "SCE",
    status: "live",
    version: "2.1.0",
    deployedAt: "2026-03-10 09:00:00",
    instruments: [
      { key: "WALLET:SPOT_ASSET:USDT", venue: "Wallet", type: "SPOT_ASSET", role: "Initial capital" },
      { key: "WALLET:SPOT_ASSET:ETH", venue: "Wallet", type: "SPOT_ASSET", role: "Long leg" },
      { key: "HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID", venue: "Hyperliquid", type: "Perp", role: "Short leg (hedge)" },
    ],
    featuresConsumed: [
      { name: "funding_rate", source: "features-delta-one", sla: "10s", usedFor: "Signal: entry when funding > threshold" },
      { name: "eth_price", source: "market-tick-data", sla: "1s", usedFor: "Position sizing, PnL" },
      { name: "basis_bps", source: "features-delta-one", sla: "10s", usedFor: "Spread monitoring" },
    ],
    dataArchitecture: {
      rawDataSource: "CloudDataProvider (live) / CSVDataProvider (backtest)",
      processedData: ["eth_price", "funding_rate"],
      interval: "Time-driven (candle-based)",
      lowestGranularity: "1H",
      executionMode: "same_candle_exit",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "USDT→ETH swap", sorEnabled: true, allowedVenues: ["UNISWAPV3-ETHEREUM", "CURVE-ETHEREUM", "BALANCER-ETH"] },
        { name: "Short perp", sorEnabled: false },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "funding_pnl", label: "Funding P&L", settlementType: "FUNDING_8H", description: "Positive when rate > 0", color: "#4ade80" },
        { id: "basis_spread_pnl", label: "Basis Spread", settlementType: "MARK_TO_MARKET", description: "Premium change", color: "#60a5fa" },
        { id: "trading_pnl", label: "Trading P&L", settlementType: "REALIZED", description: "Entry/exit fills", color: "#a78bfa" },
        { id: "transaction_costs", label: "Transaction Costs", settlementType: "PER_FILL", description: "Swap fee + gas + taker fee", color: "#ef4444" },
      ],
      formula: "total_pnl = equity_current - equity_initial",
    },
    riskProfile: {
      targetReturn: "8-15%",
      targetSharpe: "2.0+",
      maxDrawdown: "5%",
      maxLeverage: "1x",
      capitalScalability: "$5M",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "5ms p50 / 20ms p99",
      instructionToFill: "2s p50 / 15s p99",
      endToEnd: "~3s p50 / ~16s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "2% drift", action: "Adjust perp size" },
      { riskType: "funding", subscribed: true, threshold: "min_funding_rate", action: "Entry/exit decision" },
      { riskType: "basis", subscribed: true, threshold: "max_basis_deviation", action: "Entry/exit decision" },
      { riskType: "venue_protocol", subscribed: true, threshold: "Circuit breaker", action: "Pause trading" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending", notes: "Need MockDeFiDynamics" },
      { stage: "HISTORICAL", status: "pending", notes: "Need Hyperliquid funding history" },
      { stage: "LIVE_MOCK", status: "blocked", notes: "Blocked by feature computation" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "initial_capital", value: "1000000", description: "Starting capital in USDT" },
      { key: "min_funding_rate", value: "0.0001", description: "Minimum funding rate to enter" },
      { key: "max_basis_deviation", value: "0.005", description: "Max basis spread to enter" },
      { key: "hedge_ratio", value: "1.0", description: "Delta hedge ratio" },
      { key: "spot_allocation_pct", value: "0.90", description: "Percentage allocated to spot" },
      { key: "margin_allocation_pct", value: "0.10", description: "Percentage for perp margin" },
    ],
    venues: ["UNISWAPV3-ETHEREUM", "CURVE-ETHEREUM", "HYPERLIQUID"],
    performance: {
      pnlTotal: 892400,
      pnlMTD: 124500,
      sharpe: 2.34,
      maxDrawdown: 3.8,
      returnPct: 12.4,
      positions: 2,
      netExposure: 1850000,
    },
    sparklineData: [10, 12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 26],
    references: {
      implementation: "strategy-service/engine/strategies/defi_basis.py",
      configSchema: "strategy-service/docs/STRATEGY_MODES.md",
      executionAdapter: "unified-defi-execution-interface/protocols/uniswap.py",
    },
    instructionTypes: ["SWAP", "TRADE"],
  },

  // ============================================
  // DeFi Recursive Staked Basis
  // ============================================
  {
    id: "DEFI_ETH_REC_STAKE_EVT_1H",
    name: "ETH Recursive Staked Basis",
    description: "Flash loan leveraged weETH staking yield + short perp hedge. 2.5x leveraged LST yield.",
    strategyIdPattern: "DEFI_ETH_RECURSIVE_BASIS_SCE_1H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Leveraged Basis",
    archetype: "BASIS_TRADE",
    executionMode: "EVT",
    status: "live",
    version: "1.5.0",
    deployedAt: "2026-03-12 14:30:00",
    instruments: [
      { key: "WALLET:SPOT_ASSET:USDT", venue: "Wallet", type: "SPOT_ASSET", role: "Initial capital" },
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AWEETH@ETHEREUM", venue: "Aave V3", type: "aToken", role: "Collateral (leveraged)" },
      { key: "AAVEV3-ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM", venue: "Aave V3", type: "debtToken", role: "Debt (negative)" },
      { key: "HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID", venue: "Hyperliquid", type: "Perp", role: "Short leg (leveraged)" },
    ],
    featuresConsumed: [
      { name: "lst_staking_apy", source: "features-onchain", sla: "60s", usedFor: "Signal: staking yield component" },
      { name: "funding_rate", source: "features-delta-one", sla: "10s", usedFor: "Signal: funding yield component" },
      { name: "weeth_eth_rate", source: "features-onchain", sla: "60s", usedFor: "Position sizing, rebalancing" },
      { name: "aave_borrow_apy_eth", source: "features-onchain", sla: "60s", usedFor: "Cost: leverage cost" },
      { name: "health_factor", source: "features-onchain", sla: "60s", usedFor: "Risk: liquidation proximity" },
      { name: "morpho_flash_loan_liquidity", source: "features-onchain", sla: "60s", usedFor: "Pre-check: flash loan available" },
    ],
    dataArchitecture: {
      rawDataSource: "CloudDataProvider (live) / CSVDataProvider (backtest)",
      processedData: ["eth_price", "funding_rate", "weeth_eth_rate", "aave_borrow_apy_eth", "health_factor"],
      interval: "Time-driven (candle-based)",
      lowestGranularity: "1H",
      executionMode: "same_candle_exit",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "WETH→weETH swap", sorEnabled: true, allowedVenues: ["CURVE-ETHEREUM", "BALANCER-ETH", "UNISWAPV3-ETHEREUM"] },
        { name: "Flash borrow (Morpho)", sorEnabled: false },
        { name: "Aave deposit/borrow", sorEnabled: false },
        { name: "Short perp", sorEnabled: false },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "staking_yield_pnl", label: "Staking Yield (Leveraged)", settlementType: "LST_YIELD", description: "weETH rate appreciation x leverage", color: "#4ade80" },
        { id: "lending_yield_pnl", label: "Lending Yield", settlementType: "AAVE_INDEX", description: "aweETH liquidity index growth", color: "#22d3ee" },
        { id: "borrow_cost_pnl", label: "Borrow Cost", settlementType: "AAVE_INDEX", description: "debtWETH balance growth (negative)", color: "#ef4444" },
        { id: "funding_pnl", label: "Funding P&L (Leveraged)", settlementType: "FUNDING_8H", description: "Short perp funding x leverage", color: "#60a5fa" },
        { id: "rewards_pnl", label: "Rewards", settlementType: "SEASONAL_WEEKLY", description: "EtherFi/EIGEN weekly", color: "#fbbf24" },
        { id: "transaction_costs", label: "Transaction Costs", settlementType: "PER_FILL", description: "Flash loan fee + gas + slippage", color: "#dc2626" },
      ],
      formula: "equity = aweETH_value - debtWETH_value + perp_pnl + margin - initial",
    },
    riskProfile: {
      targetReturn: "25-35%",
      targetSharpe: "2.0+",
      maxDrawdown: "15%",
      maxLeverage: "3.0x",
      capitalScalability: "$5M",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "5ms p50 / 20ms p99",
      instructionToFill: "5s p50 / 60s p99",
      endToEnd: "~6s p50 / ~61s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "aave_liquidation", subscribed: true, threshold: "HF < 1.5 deleverage, HF < 1.2 exit", action: "Atomic deleverage bundle" },
      { riskType: "delta", subscribed: true, threshold: "2% drift", action: "Adjust perp size" },
      { riskType: "protocol_risk", subscribed: true, threshold: "weETH depeg > 2%", action: "Emergency exit" },
      { riskType: "liquidity", subscribed: true, threshold: "Flash loan < required", action: "Cannot rebalance atomically" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending" },
      { stage: "HISTORICAL", status: "pending" },
      { stage: "LIVE_MOCK", status: "blocked" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "initial_capital", value: "500000", description: "Starting capital in USDT" },
      { key: "target_leverage", value: "2.5", description: "Target leverage multiple" },
      { key: "min_health_factor", value: "1.2", description: "Emergency exit threshold" },
      { key: "target_health_factor", value: "1.5", description: "Target operating HF" },
      { key: "min_staking_apy", value: "0.03", description: "Minimum staking APY to enter" },
      { key: "flash_loan_provider", value: "MORPHO", description: "Morpho (0% fee)" },
    ],
    venues: ["AAVEV3-ETHEREUM", "MORPHO-ETHEREUM", "HYPERLIQUID", "CURVE-ETHEREUM"],
    performance: {
      pnlTotal: 1245000,
      pnlMTD: 198000,
      sharpe: 2.12,
      maxDrawdown: 8.2,
      returnPct: 28.4,
      positions: 3,
      netExposure: 2450000,
    },
    sparklineData: [8, 10, 14, 12, 18, 22, 20, 26, 24, 30, 28, 35],
    references: {
      implementation: "strategy-service/engine/strategies/defi_recursive_basis.py",
      configSchema: "strategy-service/docs/STRATEGY_MODES.md",
    },
    instructionTypes: ["FLASH_BORROW", "SWAP", "LEND", "BORROW", "TRADE", "FLASH_REPAY"],
  },

  // ============================================
  // DeFi Market Making (AMM LP)
  // ============================================
  {
    id: "DEFI_UNI_LP_EVT_1H",
    name: "Uniswap V3 LP (ETH-USDT)",
    description: "Concentrated liquidity provision on Uniswap V3. Earn swap fees with active range management.",
    strategyIdPattern: "DEFI_ETH_MM_LP_V3_EVT",
    clientId: "defi-desk",
    assetClass: "DeFi",
    strategyType: "LP Provision",
    archetype: "MARKET_MAKING",
    executionMode: "EVT",
    status: "live",
    version: "1.2.0",
    deployedAt: "2026-03-08 11:15:00",
    instruments: [
      { key: "UNISWAPV3-ETHEREUM:LP_POSITION:ETH-USDT@ETHEREUM", venue: "Uniswap V3", type: "LP NFT", role: "Active LP position" },
      { key: "WALLET:SPOT_ASSET:ETH", venue: "Wallet", type: "SPOT_ASSET", role: "Deposited asset" },
      { key: "WALLET:SPOT_ASSET:USDT", venue: "Wallet", type: "SPOT_ASSET", role: "Deposited asset" },
    ],
    featuresConsumed: [
      { name: "pool_price", source: "features-onchain", sla: "12s", usedFor: "Rebalance trigger" },
      { name: "current_tick", source: "features-onchain", sla: "12s", usedFor: "Range vs position check" },
      { name: "fee_apy_24h", source: "features-onchain", sla: "1h", usedFor: "Is LP profitable?" },
      { name: "il_pct", source: "features-onchain", sla: "12s", usedFor: "IL monitoring" },
      { name: "realized_vol", source: "features-volatility", sla: "5m", usedFor: "Range width decision" },
    ],
    dataArchitecture: {
      rawDataSource: "NEVER direct - via features-onchain-service",
      processedData: ["pool_price", "current_tick", "fee_apy_24h", "il_pct", "pool_tvl"],
      interval: "Event-driven on price move OR periodic",
      lowestGranularity: "Per-block (~12s on Ethereum)",
      executionMode: "event_driven",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "Pool selection", sorEnabled: true, allowedVenues: ["UNISWAPV3-ETHEREUM"] },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "fee_income_pnl", label: "Fee Income", settlementType: "LP_FEE_ACCRUAL", description: "Fees from swappers", color: "#4ade80" },
        { id: "il_pnl", label: "Impermanent Loss", settlementType: "MARK_TO_MARKET", description: "Price divergence loss", color: "#ef4444" },
        { id: "inventory_pnl", label: "Inventory P&L", settlementType: "MARK_TO_MARKET", description: "Underlying value change", color: "#60a5fa" },
        { id: "transaction_costs", label: "Gas Costs", settlementType: "PER_FILL", description: "Add/remove/rebalance gas", color: "#dc2626" },
      ],
      formula: "total_pnl = (current_position_value + collected_fees) - initial_deposit",
    },
    riskProfile: {
      targetReturn: "10-25%",
      targetSharpe: "1.5+",
      maxDrawdown: "15%",
      maxLeverage: "1x",
      capitalScalability: "$5M per pool",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "10ms p50 / 50ms p99",
      instructionToFill: "5s p50 / 60s p99",
      endToEnd: "~6s p50 / ~61s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "impermanent_loss", subscribed: true, threshold: "IL > X%", action: "Widen range or exit" },
      { riskType: "protocol_risk", subscribed: true, threshold: "Pool manipulation", action: "Emergency exit" },
      { riskType: "delta", subscribed: true, threshold: "Price exits range", action: "Rebalance to new range" },
      { riskType: "concentration", subscribed: true, threshold: "Pool TVL share > X%", action: "Reduce position" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending", notes: "Need MockAMMPool" },
      { stage: "HISTORICAL", status: "pending", notes: "Via The Graph" },
      { stage: "LIVE_MOCK", status: "blocked", notes: "Blocked by ADD_LIQUIDITY operation type" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "initial_capital", value: "250000", description: "Starting capital" },
      { key: "tick_range_lower", value: "-2000", description: "Lower tick offset from current" },
      { key: "tick_range_upper", value: "2000", description: "Upper tick offset from current" },
      { key: "rebalance_threshold_pct", value: "0.05", description: "Price exit % to trigger rebalance" },
      { key: "max_il_threshold", value: "0.08", description: "Max IL before exit" },
      { key: "fee_tier", value: "0.003", description: "0.3% fee tier" },
    ],
    venues: ["UNISWAPV3-ETHEREUM"],
    performance: {
      pnlTotal: 185000,
      pnlMTD: 42000,
      sharpe: 1.45,
      maxDrawdown: 6.8,
      returnPct: 14.2,
      positions: 1,
      netExposure: 520000,
    },
    sparklineData: [12, 14, 13, 16, 15, 18, 17, 19, 18, 21, 20, 23],
    instructionTypes: ["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"],
  },
  
  // ============================================
  // CeFi Market Making
  // ============================================
  {
    id: "CEFI_BTC_MM_EVT_TICK",
    name: "BTC Market Making (Binance)",
    description: "Two-sided quoting on Binance BTC/USDT. Sub-second latency market making.",
    strategyIdPattern: "CEFI_BTC_MM_BINANCE_EVT_SUB1S",
    clientId: "quant-fund",
    assetClass: "CeFi",
    strategyType: "Market Making",
    archetype: "MARKET_MAKING",
    executionMode: "EVT",
    status: "live",
    version: "3.1.0",
    deployedAt: "2026-03-05 16:00:00",
    instruments: [
      { key: "BINANCE:SPOT:BTC-USDT", venue: "Binance", type: "SPOT_ASSET", role: "Quoted pair" },
      { key: "BINANCE:SPOT:USDT", venue: "Binance", type: "SPOT_ASSET", role: "Quote currency" },
      { key: "BINANCE:SPOT:BTC", venue: "Binance", type: "SPOT_ASSET", role: "Base inventory" },
    ],
    featuresConsumed: [
      { name: "mid_price", source: "features-mm", sla: "5ms", usedFor: "Recalculate quotes" },
      { name: "bid_ask_spread", source: "features-delta-one", sla: "5ms", usedFor: "Spread decision" },
      { name: "realized_vol", source: "features-volatility", sla: "1m", usedFor: "Spread widening in high vol" },
      { name: "orderbook_imbalance", source: "features-mm", sla: "5ms", usedFor: "Skew adjustment" },
      { name: "inventory_skew", source: "ExposureMonitor", sla: "10ms", usedFor: "Inventory management" },
    ],
    dataArchitecture: {
      rawDataSource: "NEVER direct - via features service",
      processedData: ["mid_price", "bid_ask_spread", "realized_vol", "orderbook_imbalance"],
      interval: "Event-driven on underlying move > threshold",
      lowestGranularity: "Sub-second",
      executionMode: "event_driven",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "PER_FILL", description: "Ask fill - Bid fill prices", color: "#4ade80" },
        { id: "inventory_pnl", label: "Inventory P&L", settlementType: "MARK_TO_MARKET", description: "Inventory value change", color: "#60a5fa" },
        { id: "trading_pnl", label: "Trading P&L", settlementType: "REALIZED", description: "Inventory management trades", color: "#a78bfa" },
        { id: "transaction_costs", label: "Exchange Fees", settlementType: "PER_FILL", description: "Maker/taker fees", color: "#ef4444" },
      ],
      formula: "total_pnl = total_balance_value - initial_balance_value",
    },
    riskProfile: {
      targetReturn: "15-30%",
      targetSharpe: "3.0+",
      maxDrawdown: "5%",
      maxLeverage: "1x",
      capitalScalability: "$2M per pair",
    },
    latencyProfile: {
      dataToSignal: "5ms p50 / 20ms p99",
      signalToInstruction: "1ms p50 / 5ms p99",
      instructionToFill: "10ms p50 / 50ms p99",
      endToEnd: "~26ms p50 / ~125ms p99",
      coLocationNeeded: true,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "Inventory skew > max", action: "Skew quotes" },
      { riskType: "liquidity", subscribed: true, threshold: "Spread widens beyond max", action: "Widen or pause" },
      { riskType: "venue_protocol", subscribed: true, threshold: "Exchange circuit breaker", action: "Cancel all orders" },
      { riskType: "concentration", subscribed: true, threshold: "Too much inventory", action: "Reduce position" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending", notes: "Need MockMMDynamics" },
      { stage: "HISTORICAL", status: "pending", notes: "Tardis.dev L2 data" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending", notes: "testnet.binance.vision" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "spread_min_bps", value: "5", description: "Minimum spread to quote" },
      { key: "spread_max_bps", value: "20", description: "Maximum spread to quote" },
      { key: "position_limit_usd", value: "2000000", description: "Max position size" },
      { key: "inventory_target_pct", value: "0.5", description: "Target 50/50 BTC/USDT" },
      { key: "move_threshold_bps", value: "5", description: "Recalculate on 5bp move" },
      { key: "skew_factor", value: "0.3", description: "Inventory skew adjustment" },
    ],
    venues: ["BINANCE"],
    performance: {
      pnlTotal: 724000,
      pnlMTD: 156000,
      sharpe: 3.12,
      maxDrawdown: 2.8,
      returnPct: 24.2,
      positions: 2,
      netExposure: 1200000,
    },
    sparklineData: [15, 17, 16, 19, 18, 21, 20, 23, 22, 25, 24, 28],
    instructionTypes: ["TRADE"],
  },
  
  // ============================================
  // TradFi Options Market Making
  // ============================================
  {
id: "CEFI_ETH_OPT_MM_EVT_TICK",
  name: "ETH Options MM (Deribit)",
  description: "Multi-strike options quoting with delta hedging. Greeks management across expiries.",
  strategyIdPattern: "CEFI_ETH_MM_OPT_DERIBIT_EVT_SUB1S",
  clientId: "quant-fund",
  assetClass: "CeFi",
  strategyType: "Options MM",
  executionMode: "EVT",
    archetype: "OPTIONS",
    status: "live",
    version: "2.0.0",
    deployedAt: "2026-03-01 08:00:00",
    instruments: [
      { key: "DERIBIT:OPTION:ETH-*", venue: "Deribit", type: "Option", role: "Multi-strike quoting" },
      { key: "DERIBIT:PERPETUAL:ETH-USD", venue: "Deribit", type: "Perp", role: "Delta hedge" },
    ],
    featuresConsumed: [
      { name: "underlying_price", source: "features-delta-one", sla: "5ms", usedFor: "Reprice all options" },
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Option pricing model" },
      { name: "realized_vol", source: "features-volatility", sla: "5m", usedFor: "Vol edge calculation" },
      { name: "skew", source: "features-volatility", sla: "5ms", usedFor: "Strike-level adjustments" },
      { name: "portfolio_greeks", source: "ExposureMonitor", sla: "10ms", usedFor: "Delta hedge trigger" },
    ],
    dataArchitecture: {
      rawDataSource: "NEVER direct - via features service",
      processedData: ["underlying_price", "iv_surface", "realized_vol", "skew"],
      interval: "Event-driven on underlying move > threshold",
      lowestGranularity: "Sub-second",
      executionMode: "event_driven",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Options Spread", settlementType: "PER_FILL", description: "Bid/ask spread capture", color: "#4ade80" },
        { id: "theta_pnl", label: "Theta (Time Decay)", settlementType: "DAILY", description: "Time decay collection", color: "#60a5fa" },
        { id: "vega_pnl", label: "Vega P&L", settlementType: "MARK_TO_MARKET", description: "IV change impact", color: "#a78bfa" },
        { id: "gamma_pnl", label: "Gamma P&L", settlementType: "MARK_TO_MARKET", description: "Delta hedging P&L", color: "#fbbf24" },
        { id: "hedge_cost", label: "Hedge Cost", settlementType: "PER_FILL", description: "Delta hedge slippage", color: "#ef4444" },
      ],
      formula: "total_pnl = spread_captured + theta - hedge_costs - fees",
    },
    riskProfile: {
      targetReturn: "20-40%",
      targetSharpe: "2.0+",
      maxDrawdown: "10%",
      maxLeverage: "N/A (Greeks-managed)",
      capitalScalability: "$5M per underlying",
    },
    latencyProfile: {
      dataToSignal: "2ms p50 / 10ms p99",
      signalToInstruction: "1ms p50 / 5ms p99",
      instructionToFill: "5ms p50 / 20ms p99",
      endToEnd: "~18ms p50 / ~85ms p99",
      coLocationNeeded: true,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "Portfolio delta > hedge threshold", action: "Hedge underlying" },
      { riskType: "gamma", subscribed: true, threshold: "Gamma exposure > max", action: "Reduce near-ATM positions" },
      { riskType: "vega", subscribed: true, threshold: "Vega exposure > max", action: "Reduce vol exposure" },
      { riskType: "theta", subscribed: true, threshold: "Monitoring", action: "Expected daily P&L" },
      { riskType: "venue_protocol", subscribed: true, threshold: "Exchange issues", action: "Cancel all (mass pull)" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending", notes: "Need MockOptionsExchange" },
      { stage: "HISTORICAL", status: "pending", notes: "Deribit via Tardis.dev" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending", notes: "test.deribit.com" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "spread_bps_atm", value: "15", description: "ATM spread in bps" },
      { key: "spread_bps_otm", value: "25", description: "OTM spread in bps" },
      { key: "delta_hedge_threshold", value: "0.5", description: "Hedge when |delta| > 0.5" },
      { key: "max_gamma_exposure", value: "100000", description: "Max gamma in USD terms" },
      { key: "max_vega_exposure", value: "50000", description: "Max vega in USD terms" },
      { key: "strikes_per_expiry", value: "10", description: "Number of strikes to quote" },
    ],
    venues: ["DERIBIT"],
    performance: {
      pnlTotal: 892000,
      pnlMTD: 145000,
      sharpe: 2.45,
      maxDrawdown: 5.2,
      returnPct: 32.4,
      positions: 24,
      netExposure: 3200000,
    },
    sparklineData: [10, 13, 12, 16, 14, 19, 17, 22, 20, 25, 23, 28],
    instructionTypes: ["TRADE"],
  },
  
  // ============================================
  // TradFi ML Directional
  // ============================================
  {
id: "TRADFI_SPY_MOM_HUF_1D",
  name: "SPY ML Directional",
  description: "ML-driven directional strategy on SPY. LightGBM predictions with confidence-scaled sizing.",
  strategyIdPattern: "TRADFI_SPY_ML_DIRECTIONAL_V1",
  clientId: "alpha-main",
  assetClass: "TradFi",
  strategyType: "ML Directional",
  archetype: "DIRECTIONAL",
  executionMode: "HUF",
    status: "live",
    version: "1.4.0",
    deployedAt: "2026-02-28 09:30:00",
    instruments: [
      { key: "NASDAQ:EQUITY:SPY", venue: "IBKR", type: "SPOT_ASSET", role: "SPY directional" },
    ],
    featuresConsumed: [
      { name: "prediction_score", source: "ml-inference-api", sla: "30s", usedFor: "Direction: LONG/SHORT" },
      { name: "prediction_confidence", source: "ml-inference-api", sla: "30s", usedFor: "Position sizing" },
      { name: "momentum", source: "features-service", sla: "10s", usedFor: "ML model input" },
      { name: "rsi", source: "features-service", sla: "10s", usedFor: "ML model input" },
      { name: "macd", source: "features-service", sla: "10s", usedFor: "ML model input" },
      { name: "atr", source: "features-service", sla: "10s", usedFor: "ML model input" },
    ],
    dataArchitecture: {
      rawDataSource: "Databento / IBKR",
      processedData: ["prediction_score", "prediction_confidence", "technical_features"],
      interval: "ML prediction frequency",
      lowestGranularity: "1m bars",
      executionMode: "signal_driven",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price change in direction", color: "#4ade80" },
        { id: "transaction_cost", label: "Commissions", settlementType: "PER_TRADE", description: "IBKR commissions + spread", color: "#ef4444" },
        { id: "slippage", label: "Slippage", settlementType: "PER_TRADE", description: "Benchmark vs fill", color: "#dc2626" },
      ],
      formula: "total_pnl = equity_current - equity_initial",
    },
    riskProfile: {
      targetReturn: "12-18%",
      targetSharpe: "1.2-1.8",
      maxDrawdown: "8-10%",
      maxLeverage: "1.0x",
      capitalScalability: "$5M",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "5ms p50 / 20ms p99",
      instructionToFill: "100ms p50 / 500ms p99",
      endToEnd: "~155ms p50 / ~720ms p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "max_portfolio_exposure_pct", action: "Reduce position to cap" },
      { riskType: "drawdown", subscribed: true, threshold: "max_drawdown_pct", action: "EXIT signal" },
      { riskType: "liquidity", subscribed: true, threshold: "Low volume", action: "Widen max_slippage_bps" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done", notes: "Unit + integration tests" },
      { stage: "HISTORICAL", status: "pending", notes: "2+ years SPY data" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending", notes: "IBKR paper trading" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "max_position_usd", value: "500000", description: "Max position size" },
      { key: "max_portfolio_exposure_pct", value: "0.15", description: "Max 15% of portfolio" },
      { key: "prediction_threshold", value: "0.55", description: "Min confidence to trade" },
      { key: "stop_loss_pct", value: "0.02", description: "2% stop loss" },
      { key: "take_profit_pct", value: "0.04", description: "4% take profit" },
      { key: "rebalance_interval_bars", value: "12", description: "Rebalance every 12 bars" },
    ],
    venues: ["IBKR", "NASDAQ"],
    performance: {
      pnlTotal: 445000,
      pnlMTD: 68000,
      sharpe: 1.52,
      maxDrawdown: 6.4,
      returnPct: 14.8,
      positions: 1,
      netExposure: 480000,
    },
    sparklineData: [12, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24],
    instructionTypes: ["TRADE"],
  },
  
  // ============================================
  // Sports Arbitrage
  // ============================================
  {
id: "SPORTS_NFL_ARB_SCE_GAME",
  name: "Football Cross-Book Arb",
  description: "Cross-bookmaker arbitrage on football matches. Pinnacle vs Betfair vs Bet365.",
  strategyIdPattern: "SPORTS_FOOTBALL_ARB_EVT",
  clientId: "sports-desk",
  assetClass: "Sports",
  strategyType: "Arbitrage",
  archetype: "ARBITRAGE",
  executionMode: "SCE",
    status: "live",
    version: "2.2.0",
    deployedAt: "2026-03-14 10:00:00",
    instruments: [
      { key: "PINNACLE:FIXED_ODDS:FOOTBALL", venue: "Pinnacle", type: "Fixed Odds", role: "Sharp line reference" },
      { key: "BETFAIR:EXCHANGE_ODDS:FOOTBALL", venue: "Betfair", type: "Exchange Odds", role: "Exchange execution" },
      { key: "BET365:FIXED_ODDS:FOOTBALL", venue: "Bet365", type: "Fixed Odds", role: "Soft line execution" },
    ],
    featuresConsumed: [
      { name: "odds_snapshot", source: "features-sports", sla: "1s", usedFor: "Arbitrage detection" },
      { name: "line_movement", source: "features-sports", sla: "1s", usedFor: "Sharp vs soft divergence" },
      { name: "match_state", source: "features-sports", sla: "5s", usedFor: "In-play vs pre-match" },
      { name: "kelly_edge", source: "features-sports", sla: "1s", usedFor: "Position sizing" },
    ],
    dataArchitecture: {
      rawDataSource: "Odds API / Direct feeds",
      processedData: ["odds_snapshot", "arb_opportunities", "line_movement"],
      interval: "Event-driven on odds change",
      lowestGranularity: "Sub-second",
      executionMode: "event_driven",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "Back leg", sorEnabled: true, allowedVenues: ["PINNACLE", "BET365", "BETFAIR"] },
        { name: "Lay leg", sorEnabled: true, allowedVenues: ["BETFAIR", "SMARKETS"] },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arbitrage P&L", settlementType: "MATCH_SETTLEMENT", description: "Guaranteed profit from arb", color: "#4ade80" },
        { id: "execution_cost", label: "Execution Cost", settlementType: "PER_FILL", description: "Betfair commission, spreads", color: "#ef4444" },
        { id: "voided_bets", label: "Voided/Adjusted", settlementType: "SETTLEMENT", description: "Rule 4 deductions, voids", color: "#fbbf24" },
      ],
      formula: "total_pnl = sum(settled_bets) - stakes - commissions",
    },
    riskProfile: {
      targetReturn: "5-12%",
      targetSharpe: "4.0+",
      maxDrawdown: "2%",
      maxLeverage: "1x",
      capitalScalability: "$500K per market",
    },
    latencyProfile: {
      dataToSignal: "100ms p50 / 500ms p99",
      signalToInstruction: "10ms p50 / 50ms p99",
      instructionToFill: "500ms p50 / 2s p99",
      endToEnd: "~610ms p50 / ~2.5s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "edge_decay", subscribed: true, threshold: "Arb closes before execution", action: "Cancel unmatched" },
      { riskType: "venue_protocol", subscribed: true, threshold: "Account limited/banned", action: "Remove venue from rotation" },
      { riskType: "market_suspension", subscribed: true, threshold: "Match suspended", action: "Hedge or accept exposure" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done" },
      { stage: "HISTORICAL", status: "done" },
      { stage: "LIVE_MOCK", status: "done" },
      { stage: "LIVE_TESTNET", status: "done" },
      { stage: "STAGING", status: "done" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "min_arb_pct", value: "0.02", description: "Minimum 2% arb" },
      { key: "max_stake_per_bet", value: "5000", description: "Max stake per leg" },
      { key: "max_exposure_per_match", value: "10000", description: "Max total exposure" },
      { key: "venues_enabled", value: "PINNACLE,BETFAIR,BET365", description: "Active venues" },
      { key: "market_types", value: "h2h,over_under", description: "Supported markets" },
    ],
    venues: ["PINNACLE", "BETFAIR", "BET365", "SMARKETS"],
    performance: {
      pnlTotal: 156000,
      pnlMTD: 34000,
      sharpe: 4.82,
      maxDrawdown: 0.8,
      returnPct: 8.4,
      positions: 12,
      netExposure: 85000,
    },
    sparklineData: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    instructionTypes: ["TRADE"],
    kellySizing: {
      fraction: 0.5,
      maxStakePct: 5,
      edgeThreshold: 0.02,
      bankrollDrawdownLimit: 20,
    },
  },

  // ============================================
  // BTC Basis Trade (CeFi version)
  // ============================================
  {
id: "CEFI_BTC_BASIS_SCE_1H",
  name: "BTC Basis (Binance-HL)",
  description: "Binance spot BTC + Hyperliquid perp short. CeFi basis trade capturing funding rate.",
  strategyIdPattern: "CEFI_BTC_BASIS_BINANCE_HL",
  clientId: "alpha-crypto",
  assetClass: "CeFi",
  strategyType: "Basis Trade",
  archetype: "BASIS_TRADE",
  executionMode: "SCE",
    status: "live",
    version: "3.3.0",
    deployedAt: "2026-03-15 09:00:00",
    instruments: [
      { key: "BINANCE:SPOT:BTC", venue: "Binance", type: "SPOT_ASSET", role: "Long leg" },
      { key: "HYPERLIQUID:PERPETUAL:BTC-USDC", venue: "Hyperliquid", type: "Perp", role: "Short leg (hedge)" },
    ],
    featuresConsumed: [
      { name: "funding_rate", source: "features-delta-one", sla: "10s", usedFor: "Signal: entry when funding > threshold" },
      { name: "btc_price", source: "market-tick-data", sla: "1s", usedFor: "Position sizing, PnL" },
      { name: "basis_bps", source: "features-delta-one", sla: "10s", usedFor: "Spread monitoring" },
    ],
    dataArchitecture: {
      rawDataSource: "Binance API / Hyperliquid API",
      processedData: ["btc_price", "funding_rate", "basis_bps"],
      interval: "Time-driven (candle-based)",
      lowestGranularity: "1H",
      executionMode: "same_candle_exit",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "funding_pnl", label: "Funding P&L", settlementType: "FUNDING_8H", description: "8H funding payments", color: "#4ade80" },
        { id: "basis_spread_pnl", label: "Basis Spread", settlementType: "MARK_TO_MARKET", description: "Premium change", color: "#60a5fa" },
        { id: "trading_pnl", label: "Trading P&L", settlementType: "REALIZED", description: "Entry/exit fills", color: "#a78bfa" },
        { id: "transaction_costs", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: {
      targetReturn: "8-15%",
      targetSharpe: "2.0+",
      maxDrawdown: "5%",
      maxLeverage: "1x",
      capitalScalability: "$10M",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "5ms p50 / 20ms p99",
      instructionToFill: "100ms p50 / 500ms p99",
      endToEnd: "~155ms p50 / ~720ms p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "2% drift", action: "Adjust perp size" },
      { riskType: "funding", subscribed: true, threshold: "min_funding_rate", action: "Entry/exit decision" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done" },
      { stage: "HISTORICAL", status: "done" },
      { stage: "LIVE_MOCK", status: "done" },
      { stage: "LIVE_TESTNET", status: "done" },
      { stage: "STAGING", status: "done" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "initial_capital", value: "5000000", description: "Starting capital" },
      { key: "min_funding_rate", value: "0.0001", description: "Minimum funding rate" },
      { key: "hedge_ratio", value: "1.0", description: "Delta hedge ratio" },
      { key: "spot_allocation_pct", value: "0.90", description: "Spot allocation" },
    ],
    venues: ["BINANCE", "HYPERLIQUID"],
    performance: {
      pnlTotal: 1800000,
      pnlMTD: 245000,
      sharpe: 2.1,
      maxDrawdown: 4.1,
      returnPct: 18.4,
      positions: 4,
      netExposure: 4200000,
    },
    sparklineData: [10, 15, 12, 18, 22, 20, 25, 28, 30, 32, 35, 38],
    instructionTypes: ["SWAP", "TRADE"],
  },
  
  // ============================================
  // Prediction Market Arbitrage
  // ============================================
  {
id: "PRED_POLY_ARB_SCE_1M",
  name: "Prediction Market Arb",
  description: "Cross-platform arbitrage between Polymarket and Kalshi on overlapping events.",
  strategyIdPattern: "PRED_POLYMARKET_KALSHI_ARB",
  clientId: "alpha-crypto",
  assetClass: "Prediction",
  strategyType: "Arbitrage",
  archetype: "ARBITRAGE",
  executionMode: "SCE",
    status: "live",
    version: "1.1.0",
    deployedAt: "2026-03-12 12:00:00",
    instruments: [
      { key: "POLYMARKET:PREDICTION_MARKET:*", venue: "Polymarket", type: "SPOT_ASSET", role: "DeFi prediction market" },
      { key: "KALSHI:PREDICTION_MARKET:*", venue: "Kalshi", type: "SPOT_ASSET", role: "Regulated prediction market" },
    ],
    featuresConsumed: [
      { name: "poly_odds", source: "features-prediction", sla: "5s", usedFor: "Polymarket prices" },
      { name: "kalshi_odds", source: "features-prediction", sla: "5s", usedFor: "Kalshi prices" },
      { name: "arb_spread", source: "features-prediction", sla: "5s", usedFor: "Arb detection" },
    ],
    dataArchitecture: {
      rawDataSource: "Polymarket API / Kalshi API",
      processedData: ["poly_odds", "kalshi_odds", "arb_spread"],
      interval: "Event-driven on odds change",
      lowestGranularity: "5s polling",
      executionMode: "event_driven",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "Yes leg", sorEnabled: true, allowedVenues: ["POLYMARKET", "KALSHI"] },
        { name: "No leg", sorEnabled: true, allowedVenues: ["POLYMARKET", "KALSHI"] },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arbitrage P&L", settlementType: "EVENT_SETTLEMENT", description: "Lock-in arb profit", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost (Poly)", settlementType: "PER_FILL", description: "Polygon gas", color: "#ef4444" },
        { id: "exchange_fees", label: "Exchange Fees", settlementType: "PER_FILL", description: "Kalshi fees", color: "#dc2626" },
      ],
    },
    riskProfile: {
      targetReturn: "8-15%",
      targetSharpe: "3.0+",
      maxDrawdown: "3%",
      maxLeverage: "1x",
      capitalScalability: "$1M",
    },
    latencyProfile: {
      dataToSignal: "200ms p50 / 1s p99",
      signalToInstruction: "10ms p50 / 50ms p99",
      instructionToFill: "2s p50 / 10s p99",
      endToEnd: "~2.2s p50 / ~11s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "edge_decay", subscribed: true, threshold: "Arb closes", action: "Cancel unmatched" },
      { riskType: "liquidity", subscribed: true, threshold: "Thin markets", action: "Reduce size" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done" },
      { stage: "HISTORICAL", status: "done" },
      { stage: "LIVE_MOCK", status: "done" },
      { stage: "LIVE_TESTNET", status: "done" },
      { stage: "STAGING", status: "done" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "min_arb_pct", value: "0.03", description: "Minimum 3% arb" },
      { key: "max_position_per_event", value: "10000", description: "Max per event" },
      { key: "events_enabled", value: "POLITICS,SPORTS,CRYPTO", description: "Event categories" },
    ],
    venues: ["POLYMARKET", "KALSHI"],
    performance: {
      pnlTotal: 124000,
      pnlMTD: 28000,
      sharpe: 3.24,
      maxDrawdown: 1.4,
      returnPct: 12.8,
      positions: 8,
      netExposure: 92000,
    },
    sparklineData: [5, 7, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23],
    instructionTypes: ["TRADE"],
  },
  
  // ============================================
  // BTC Prediction vs CeFi Derivatives Arb
  // ============================================
  {
    id: "PRED_BTC_CEFI_ARB_SCE_5M",
    name: "BTC Prediction-CeFi Arb",
    description: "Arbitrage BTC up/down prediction markets (Polymarket) against CeFi perpetuals and options on Binance/OKX/Deribit.",
    strategyIdPattern: "PRED_BTC_CEFI_ARB",
    clientId: "alpha-crypto",
    assetClass: "Prediction",
    strategyType: "Arbitrage",
    archetype: "PREDICTION_ARB",
    executionMode: "SCE",
    status: "staging",
    version: "0.9.0",
    deployedAt: "2026-03-15 09:00:00",
    instruments: [
      { key: "POLYMARKET:PREDICTION_MARKET:BTC_ABOVE_100K", venue: "Polymarket", type: "SPOT_ASSET", role: "Binary up/down prediction" },
      { key: "BINANCE-FUTURES:PERPETUAL:BTCUSDT", venue: "Binance", type: "Perp", role: "Delta hedge / directional" },
      { key: "DERIBIT:OPTION:BTC-*", venue: "Deribit", type: "Option", role: "Synthetic binary via options" },
    ],
    featuresConsumed: [
      { name: "poly_btc_up_odds", source: "features-prediction", sla: "10s", usedFor: "Polymarket implied probability" },
      { name: "btc_perp_price", source: "features-cefi", sla: "100ms", usedFor: "CeFi perp mid price" },
      { name: "btc_options_iv", source: "features-cefi", sla: "5s", usedFor: "Options implied vol for binary pricing" },
      { name: "cross_asset_arb_signal", source: "features-prediction", sla: "10s", usedFor: "Arb detection signal" },
    ],
    dataArchitecture: {
      rawDataSource: "Polymarket API / Binance WS / Deribit WS",
      processedData: ["poly_btc_up_odds", "btc_perp_price", "btc_options_iv", "cross_asset_arb_signal"],
      interval: "Event-driven / 5m rebalance",
      lowestGranularity: "100ms (perp), 10s (prediction)",
      executionMode: "event_driven",
    },
    sorEnabled: true,
    sorConfig: {
      legs: [
        { name: "Prediction leg", sorEnabled: true, allowedVenues: ["POLYMARKET"] },
        { name: "CeFi hedge leg", sorEnabled: true, allowedVenues: ["BINANCE", "OKX", "DERIBIT"] },
      ],
    },
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Cross-Asset Arb P&L", settlementType: "EVENT_SETTLEMENT", description: "Prediction vs derivatives arb profit", color: "#4ade80" },
        { id: "hedge_delta", label: "Delta Hedge P&L", settlementType: "PER_FILL", description: "Perp/options hedge adjustment", color: "#60a5fa" },
        { id: "gas_cost", label: "Gas Cost (Polygon)", settlementType: "PER_FILL", description: "Polymarket tx gas", color: "#ef4444" },
        { id: "funding", label: "Funding Rate", settlementType: "PER_INTERVAL", description: "Perp funding payments", color: "#fbbf24" },
      ],
    },
    riskProfile: {
      targetReturn: "15-25%",
      targetSharpe: "2.5+",
      maxDrawdown: "5%",
      maxLeverage: "2x",
      capitalScalability: "$500K",
    },
    latencyProfile: {
      dataToSignal: "500ms p50 / 2s p99",
      signalToInstruction: "50ms p50 / 200ms p99",
      instructionToFill: "1s p50 (CeFi) / 5s p50 (Poly)",
      endToEnd: "~2s p50 / ~8s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "cross_asset_basis", subscribed: true, threshold: ">5% divergence", action: "Scale in" },
      { riskType: "prediction_liquidity", subscribed: true, threshold: "<$50K depth", action: "Reduce size" },
      { riskType: "funding_spike", subscribed: true, threshold: ">0.1%/8h", action: "Hedge via options" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done" },
      { stage: "HISTORICAL", status: "done" },
      { stage: "LIVE_MOCK", status: "done" },
      { stage: "LIVE_TESTNET", status: "done" },
      { stage: "STAGING", status: "in_progress" },
      { stage: "LIVE_REAL", status: "pending" },
    ],
    configParams: [
      { key: "min_arb_edge_pct", value: "0.02", description: "Minimum 2% cross-asset edge" },
      { key: "max_prediction_position", value: "50000", description: "Max USDC in prediction leg" },
      { key: "hedge_ratio", value: "0.8", description: "Delta hedge ratio (0.8 = 80% hedged)" },
      { key: "rebalance_threshold_pct", value: "0.05", description: "Rebalance when delta drifts 5%" },
    ],
    venues: ["POLYMARKET", "BINANCE", "OKX", "DERIBIT"],
    crossAssetLink: {
      from: "Prediction",
      to: "CeFi",
      instruments: ["BTC"],
    },
    performance: {
      pnlTotal: 0,
      pnlMTD: 0,
      sharpe: 0,
      maxDrawdown: 0,
      returnPct: 0,
      positions: 0,
      netExposure: 0,
    },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE", "SWAP"],
  },
  
  // ============================================
  // AAVE Lending Strategy
  // ============================================
  {
id: "DEFI_AAVE_LEND_EVT_1D",
  name: "AAVE Lending (USDT)",
  description: "Supply USDT to Aave V3. Zero-alpha yield capture with liquidity index growth.",
  strategyIdPattern: "DEFI_AAVE_LENDING_ETH",
  clientId: "delta-one",
  assetClass: "DeFi",
  strategyType: "Lending",
  archetype: "YIELD",
  executionMode: "EVT",
    status: "live",
    version: "1.0.0",
    deployedAt: "2026-02-20 10:00:00",
    instruments: [
      { key: "WALLET:SPOT_ASSET:USDT", venue: "Wallet", type: "SPOT_ASSET", role: "Initial capital" },
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AUSDT@ETHEREUM", venue: "Aave V3", type: "aToken", role: "Yield-bearing position" },
    ],
    featuresConsumed: [
      { name: "supply_apy", source: "features-onchain", sla: "60s", usedFor: "Yield monitoring" },
      { name: "liquidity_index", source: "features-onchain", sla: "60s", usedFor: "Balance accrual" },
      { name: "utilization_rate", source: "features-onchain", sla: "60s", usedFor: "APY prediction" },
    ],
    dataArchitecture: {
      rawDataSource: "Aave subgraph / RPC",
      processedData: ["supply_apy", "liquidity_index", "utilization_rate"],
      interval: "Periodic (1H)",
      lowestGranularity: "1H",
      executionMode: "periodic",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "lending_yield", label: "Lending Yield", settlementType: "AAVE_INDEX", description: "Liquidity index growth", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Deposit/withdraw gas", color: "#ef4444" },
      ],
    },
    riskProfile: {
      targetReturn: "4-8%",
      targetSharpe: "4.0+",
      maxDrawdown: "1%",
      maxLeverage: "1x",
      capitalScalability: "$50M",
    },
    latencyProfile: {
      dataToSignal: "500ms p50 / 2s p99",
      signalToInstruction: "10ms p50 / 50ms p99",
      instructionToFill: "5s p50 / 30s p99",
      endToEnd: "~6s p50 / ~32s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "protocol_risk", subscribed: true, threshold: "Aave exploit", action: "Emergency withdraw" },
      { riskType: "liquidity", subscribed: true, threshold: "Utilization 100%", action: "Cannot withdraw" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "done" },
      { stage: "HISTORICAL", status: "done" },
      { stage: "LIVE_MOCK", status: "done" },
      { stage: "LIVE_TESTNET", status: "done" },
      { stage: "STAGING", status: "done" },
      { stage: "LIVE_REAL", status: "done" },
    ],
    configParams: [
      { key: "initial_capital", value: "2000000", description: "Starting capital" },
      { key: "min_supply_apy", value: "0.03", description: "Min 3% APY to stay" },
      { key: "auto_compound", value: "true", description: "Auto-compound rewards" },
    ],
    venues: ["AAVEV3-ETHEREUM"],
    performance: {
      pnlTotal: 156000,
      pnlMTD: 18000,
      sharpe: 4.12,
      maxDrawdown: 0.2,
      returnPct: 5.8,
      positions: 1,
      netExposure: 2156000,
    },
    sparklineData: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    instructionTypes: ["LEND"],
  },

  // ============================================
  // Additional Strategies (from trading-data consolidation)
  // ============================================
  
  // ML Directional BTC
  {
    id: "CEFI_BTC_ML_DIR_HUF_4H",
    name: "ML Directional BTC",
    description: "ML-driven directional trading on BTC using gradient boosting models.",
    strategyIdPattern: "CEFI_BTC_ML_DIR_HUF_4H",
    clientId: "quant-fund",
    assetClass: "CeFi",
    strategyType: "ML Directional",
    archetype: "DIRECTIONAL",
    executionMode: "HUF",
    status: "live",
    version: "4.2.1",
    deployedAt: "2026-03-01 10:00:00",
    instruments: [
      { key: "BINANCE:SPOT:BTC-USDT", venue: "Binance", type: "SPOT_ASSET", role: "Primary trading instrument" },
      { key: "OKX:PERPETUAL:BTC-USDT", venue: "OKX", type: "Perp", role: "Hedge/leverage" },
    ],
    featuresConsumed: [
      { name: "ml_signal", source: "ml-inference-service", sla: "5s", usedFor: "Direction prediction" },
      { name: "btc_price", source: "market-tick-data", sla: "100ms", usedFor: "Entry/exit timing" },
    ],
    dataArchitecture: {
      rawDataSource: "CloudDataProvider",
      processedData: ["btc_price", "ml_features"],
      interval: "4H",
      lowestGranularity: "4H",
      executionMode: "hold_until_flip",
    },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "BTC trade", sorEnabled: true, allowedVenues: ["BINANCE", "OKX", "BYBIT"] }] },
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price direction capture", color: "#4ade80" },
        { id: "transaction_costs", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "20-40%", targetSharpe: "1.5+", maxDrawdown: "15%", maxLeverage: "3x", capitalScalability: "$10M" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "5%", action: "Reduce position" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_position_size", value: "5000000", description: "Max position in USDT" }],
    venues: ["BINANCE", "OKX", "BYBIT"],
    performance: { pnlTotal: 780000, pnlMTD: 95000, sharpe: 1.9, maxDrawdown: 12.5, returnPct: 24.8, positions: 1, netExposure: 2500000 },
    sparklineData: [5, 8, 6, 12, 10, 15, 14, 18, 16, 22, 20, 25],
    instructionTypes: ["TRADE"],
  },

  // NBA Halftime ML
  {
    id: "SPORTS_NBA_ML_HUF_GAME",
    name: "NBA Halftime ML",
    description: "ML model predicting NBA game outcomes at halftime. Kelly-criterion position sizing.",
    strategyIdPattern: "SPORTS_NBA_ML_HUF_GAME",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Sports ML",
    archetype: "DIRECTIONAL",
    executionMode: "HUF",
    status: "live",
    version: "2.1.0",
    deployedAt: "2026-02-15 09:00:00",
    instruments: [
      { key: "BETFAIR:EXCHANGE_ODDS:NBA", venue: "Betfair", type: "Exchange Odds", role: "Primary betting exchange" },
      { key: "PINNACLE:FIXED_ODDS:NBA", venue: "Pinnacle", type: "Fixed Odds", role: "Sharp book reference" },
    ],
    featuresConsumed: [
      { name: "halftime_score", source: "sports-data-feed", sla: "1s", usedFor: "Model input" },
      { name: "ml_prediction", source: "sports-ml-service", sla: "5s", usedFor: "Win probability" },
    ],
    dataArchitecture: {
      rawDataSource: "Sports API",
      processedData: ["game_state", "ml_features"],
      interval: "Game-driven",
      lowestGranularity: "Per-game",
      executionMode: "hold_until_flip",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "betting_pnl", label: "Betting P&L", settlementType: "MATCH_SETTLEMENT", description: "Win/loss on bets", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "2.0+", maxDrawdown: "10%", maxLeverage: "1x", capitalScalability: "$2M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "50ms", instructionToFill: "1s", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "concentration", subscribed: true, threshold: "10% per game", action: "Cap exposure" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "kelly_fraction", value: "0.25", description: "Fractional Kelly" }],
    venues: ["BETFAIR", "PINNACLE", "DRAFTKINGS"],
    performance: { pnlTotal: 245000, pnlMTD: 32000, sharpe: 2.4, maxDrawdown: 8.2, returnPct: 18.4, positions: 0, netExposure: 800000 },
    sparklineData: [10, 12, 11, 15, 14, 18, 17, 20, 19, 23, 22, 25],
    instructionTypes: ["TRADE"],
    kellySizing: {
      fraction: 0.5,
      maxStakePct: 5,
      edgeThreshold: 0.02,
      bankrollDrawdownLimit: 20,
    },
  },

  // Morpho Lending
  {
    id: "DEFI_MORPHO_LEND_EVT_1D",
    name: "Morpho Lending",
    description: "Supply USDC to Morpho protocol for enhanced yield with peer-to-peer matching.",
    strategyIdPattern: "DEFI_MORPHO_LEND_EVT_1D",
    clientId: "defi-desk",
    assetClass: "DeFi",
    strategyType: "Lending",
    archetype: "YIELD",
    executionMode: "EVT",
    status: "live",
    version: "1.0.2",
    deployedAt: "2026-03-05 14:00:00",
    instruments: [
      { key: "MORPHO:SUPPLY:USDC@ETHEREUM", venue: "Morpho", type: "aToken", role: "Supplied asset" },
    ],
    featuresConsumed: [
      { name: "morpho_supply_apy", source: "features-onchain", sla: "60s", usedFor: "Yield monitoring" },
      { name: "utilization_rate", source: "features-onchain", sla: "60s", usedFor: "P2P matching rate" },
    ],
    dataArchitecture: {
      rawDataSource: "On-chain",
      processedData: ["supply_apy", "utilization"],
      interval: "1D",
      lowestGranularity: "1D",
      executionMode: "event_driven",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "lending_yield", label: "Lending Yield", settlementType: "MORPHO_INDEX", description: "Supply interest", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Transaction gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "6-10%", targetSharpe: "3.5+", maxDrawdown: "2%", maxLeverage: "1x", capitalScalability: "$20M" },
    latencyProfile: { dataToSignal: "1s", signalToInstruction: "100ms", instructionToFill: "15s", endToEnd: "~16s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "protocol_risk", subscribed: true, threshold: "Smart contract risk", action: "Monitor audits" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "min_apy", value: "0.05", description: "Min 5% APY to stay" }],
    venues: ["MORPHO-ETHEREUM"],
    performance: { pnlTotal: 98000, pnlMTD: 12000, sharpe: 3.8, maxDrawdown: 0.5, returnPct: 7.2, positions: 1, netExposure: 1500000 },
    sparklineData: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    instructionTypes: ["LEND"],
  },

  // TradFi Bond Mean Reversion
  {
    id: "TRADFI_BOND_MEAN_REV_HUF_1D",
    name: "Bond Mean Reversion",
    description: "Mean reversion strategy on treasury ETFs (TLT, IEF). Statistical arbitrage on yield curve.",
    strategyIdPattern: "TRADFI_BOND_MEAN_REV_HUF_1D",
    clientId: "alpha-main",
    assetClass: "TradFi",
    strategyType: "Mean Reversion",
    archetype: "MEAN_REVERSION",
    executionMode: "HUF",
    status: "live",
    version: "1.2.0",
    deployedAt: "2026-02-01 09:30:00",
    instruments: [
      { key: "IBKR:ETF:TLT", venue: "IBKR", type: "SPOT_ASSET", role: "Long duration bond ETF" },
      { key: "IBKR:ETF:IEF", venue: "IBKR", type: "SPOT_ASSET", role: "Intermediate duration ETF" },
    ],
    featuresConsumed: [
      { name: "yield_spread", source: "tradfi-data-service", sla: "1m", usedFor: "Mean reversion signal" },
      { name: "z_score", source: "features-volatility", sla: "1m", usedFor: "Entry/exit threshold" },
    ],
    dataArchitecture: {
      rawDataSource: "IBKR API",
      processedData: ["yield_curve", "spread_zscore"],
      interval: "1D",
      lowestGranularity: "1D",
      executionMode: "hold_until_flip",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "MARK_TO_MARKET", description: "Yield spread capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "IBKR commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-12%", targetSharpe: "1.5+", maxDrawdown: "8%", maxLeverage: "2x", capitalScalability: "$50M" },
    latencyProfile: { dataToSignal: "1s", signalToInstruction: "100ms", instructionToFill: "1s", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "duration", subscribed: true, threshold: "Max 10yr duration", action: "Rebalance" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "entry_zscore", value: "2.0", description: "Z-score threshold for entry" }],
    venues: ["IBKR"],
    performance: { pnlTotal: 420000, pnlMTD: 38000, sharpe: 1.8, maxDrawdown: 6.5, returnPct: 9.2, positions: 2, netExposure: 5000000 },
    sparklineData: [8, 9, 10, 9, 11, 12, 11, 13, 14, 13, 15, 16],
    instructionTypes: ["TRADE"],
  },

  // ETH Momentum
  {
    id: "CEFI_ETH_MOM_HUF_4H",
    name: "ETH Momentum",
    description: "Momentum-based directional trading on ETH. Trend-following with volatility scaling.",
    strategyIdPattern: "CEFI_ETH_MOM_HUF_4H",
    clientId: "vertex-core",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "HUF",
    status: "live",
    version: "3.0.0",
    deployedAt: "2026-02-20 08:00:00",
    instruments: [
      { key: "BINANCE:PERPETUAL:ETH-USDT", venue: "Binance", type: "Perp", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
      { name: "volatility", source: "features-volatility", sla: "1m", usedFor: "Position sizing" },
    ],
    dataArchitecture: {
      rawDataSource: "Exchange WebSocket",
      processedData: ["momentum", "volatility"],
      interval: "4H",
      lowestGranularity: "4H",
      executionMode: "hold_until_flip",
    },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "ETH trade", sorEnabled: true, allowedVenues: ["BINANCE", "OKX", "COINBASE"] }] },
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "funding", label: "Funding", settlementType: "FUNDING_8H", description: "Perp funding", color: "#60a5fa" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "25-40%", targetSharpe: "1.5+", maxDrawdown: "18%", maxLeverage: "3x", capitalScalability: "$15M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "lookback_period", value: "20", description: "Momentum lookback in bars" }],
    venues: ["BINANCE", "OKX", "COINBASE"],
    performance: { pnlTotal: 1250000, pnlMTD: 185000, sharpe: 1.7, maxDrawdown: 14.2, returnPct: 32.5, positions: 1, netExposure: 5000000 },
    sparklineData: [10, 15, 12, 20, 18, 28, 25, 35, 30, 42, 38, 48],
    instructionTypes: ["TRADE"],
  },

  // SOL Momentum
  {
    id: "CEFI_SOL_MOM_HUF_4H",
    name: "SOL Momentum",
    description: "Momentum-based directional trading on SOL. Higher volatility variant of ETH momentum.",
    strategyIdPattern: "CEFI_SOL_MOM_HUF_4H",
    clientId: "vertex-core",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "HUF",
    status: "live",
    version: "2.5.0",
    deployedAt: "2026-02-25 08:00:00",
    instruments: [
      { key: "BINANCE:PERPETUAL:SOL-USDT", venue: "Binance", type: "Perp", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
      { name: "volatility", source: "features-volatility", sla: "1m", usedFor: "Position sizing" },
    ],
    dataArchitecture: {
      rawDataSource: "Exchange WebSocket",
      processedData: ["momentum", "volatility"],
      interval: "4H",
      lowestGranularity: "4H",
      executionMode: "hold_until_flip",
    },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "SOL trade", sorEnabled: true, allowedVenues: ["BINANCE", "OKX"] }] },
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "funding", label: "Funding", settlementType: "FUNDING_8H", description: "Perp funding", color: "#60a5fa" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "30-50%", targetSharpe: "1.4+", maxDrawdown: "22%", maxLeverage: "3x", capitalScalability: "$10M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "lookback_period", value: "15", description: "Momentum lookback in bars" }],
    venues: ["BINANCE", "OKX"],
    performance: { pnlTotal: 980000, pnlMTD: 145000, sharpe: 1.6, maxDrawdown: 18.5, returnPct: 38.2, positions: 1, netExposure: 5000000 },
    sparklineData: [8, 14, 10, 22, 16, 32, 24, 42, 35, 52, 45, 58],
    instructionTypes: ["TRADE"],
  },

  // Multi-Venue Arbitrage
  {
    id: "CEFI_MULTI_ARB_SCE_TICK",
    name: "Multi-Venue Arbitrage",
    description: "Cross-exchange arbitrage on BTC/ETH/SOL. Sub-second latency triangular arb.",
    strategyIdPattern: "CEFI_MULTI_ARB_SCE_TICK",
    clientId: "vertex-core",
    assetClass: "CeFi",
    strategyType: "Arbitrage",
    archetype: "ARBITRAGE",
    executionMode: "SCE",
    status: "live",
    version: "2.0.1",
    deployedAt: "2026-03-01 00:00:00",
    instruments: [
      { key: "BINANCE:SPOT:BTC-USDT", venue: "Binance", type: "SPOT_ASSET", role: "Arb leg" },
      { key: "OKX:SPOT:BTC-USDT", venue: "OKX", type: "SPOT_ASSET", role: "Arb leg" },
      { key: "BYBIT:SPOT:BTC-USDT", venue: "Bybit", type: "SPOT_ASSET", role: "Arb leg" },
      { key: "COINBASE:SPOT:BTC-USD", venue: "Coinbase", type: "SPOT_ASSET", role: "Arb leg" },
    ],
    featuresConsumed: [
      { name: "orderbook_snapshot", source: "market-tick-data", sla: "10ms", usedFor: "Price comparison" },
      { name: "arb_signal", source: "arb-detection-service", sla: "5ms", usedFor: "Opportunity detection" },
    ],
    dataArchitecture: {
      rawDataSource: "WebSocket feeds",
      processedData: ["orderbooks", "arb_opportunities"],
      interval: "Tick",
      lowestGranularity: "Tick",
      executionMode: "same_candle_exit",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arbitrage P&L", settlementType: "PER_FILL", description: "Price difference capture", color: "#4ade80" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
        { id: "slippage", label: "Slippage", settlementType: "PER_FILL", description: "Execution slippage", color: "#dc2626" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "4.0+", maxDrawdown: "3%", maxLeverage: "1x", capitalScalability: "$20M" },
    latencyProfile: { dataToSignal: "5ms", signalToInstruction: "1ms", instructionToFill: "50ms", endToEnd: "~60ms", coLocationNeeded: true },
    riskSubscriptions: [{ riskType: "venue_protocol", subscribed: true, threshold: "API issues", action: "Pause venue" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "min_spread_bps", value: "5", description: "Min spread to execute" }],
    venues: ["BINANCE", "OKX", "BYBIT", "COINBASE"],
    performance: { pnlTotal: 520000, pnlMTD: 65000, sharpe: 4.2, maxDrawdown: 1.8, returnPct: 12.4, positions: 0, netExposure: 5000000 },
    sparklineData: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-019: CEFI_AVAX_MOMENTUM_HUF_1H
  // ============================================
  {
    id: "CEFI_AVAX_MOMENTUM_HUF_1H",
    name: "AVAX Momentum",
    description: "Momentum-based directional trading on AVAX. Trend-following with volatility scaling.",
    strategyIdPattern: "CEFI_AVAX_MOMENTUM_HUF_1H",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "HUF",
    status: "live",
    version: "1.3.0",
    deployedAt: "2025-04-12 08:00:00",
    instruments: [
      { key: "BINANCE:PERPETUAL:AVAX-USDT", venue: "Binance", type: "Perp", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
      { name: "volatility", source: "features-volatility", sla: "1m", usedFor: "Position sizing" },
    ],
    dataArchitecture: { rawDataSource: "Exchange WebSocket", processedData: ["momentum", "volatility"], interval: "1H", lowestGranularity: "1H", executionMode: "hold_until_flip" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "funding", label: "Funding", settlementType: "FUNDING_8H", description: "Perp funding", color: "#60a5fa" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "20-35%", targetSharpe: "1.4+", maxDrawdown: "16%", maxLeverage: "2x", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "lookback_period", value: "20", description: "Momentum lookback in bars" }],
    venues: ["BINANCE"],
    performance: { pnlTotal: 340000, pnlMTD: 52000, sharpe: 1.5, maxDrawdown: 13.8, returnPct: 22.1, positions: 1, netExposure: 1800000 },
    sparklineData: [8, 12, 10, 16, 14, 20, 18, 24, 22, 28, 26, 30],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-020: CEFI_ETH_MEAN_REV_SCE_4H
  // ============================================
  {
    id: "CEFI_ETH_MEAN_REV_SCE_4H",
    name: "ETH Mean Reversion",
    description: "Mean reversion strategy on ETH/USDT and ETH/USDC. Statistical arbitrage on spread deviations.",
    strategyIdPattern: "CEFI_ETH_MEAN_REV_SCE_4H",
    clientId: "quant-fund",
    assetClass: "CeFi",
    strategyType: "Mean Reversion",
    archetype: "MEAN_REVERSION",
    executionMode: "SCE",
    status: "live",
    version: "2.0.0",
    deployedAt: "2025-01-20 09:00:00",
    instruments: [
      { key: "OKX:SPOT:ETH-USDT", venue: "OKX", type: "SPOT_ASSET", role: "Primary pair" },
      { key: "OKX:SPOT:ETH-USDC", venue: "OKX", type: "SPOT_ASSET", role: "Secondary pair" },
    ],
    featuresConsumed: [
      { name: "z_score", source: "features-volatility", sla: "1m", usedFor: "Entry/exit threshold" },
      { name: "spread", source: "features-delta-one", sla: "10s", usedFor: "Spread monitoring" },
    ],
    dataArchitecture: { rawDataSource: "OKX API", processedData: ["spread", "z_score"], interval: "4H", lowestGranularity: "4H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "MARK_TO_MARKET", description: "Spread convergence capture", color: "#4ade80" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-18%", targetSharpe: "1.8+", maxDrawdown: "8%", maxLeverage: "2x", capitalScalability: "$8M" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "200ms", endToEnd: "~500ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Spread divergence", action: "Widen stop" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "entry_zscore", value: "2.0", description: "Z-score threshold for entry" }],
    venues: ["OKX"],
    performance: { pnlTotal: 480000, pnlMTD: 62000, sharpe: 1.9, maxDrawdown: 6.8, returnPct: 14.2, positions: 2, netExposure: 3200000 },
    sparklineData: [10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 19, 22],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-021: CEFI_DOGE_MM_HUF_30S
  // ============================================
  {
    id: "CEFI_DOGE_MM_HUF_30S",
    name: "DOGE Market Making",
    description: "Two-sided quoting on Binance DOGE/USDT. Sub-second latency market making on meme coins.",
    strategyIdPattern: "CEFI_DOGE_MM_HUF_30S",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Market Making",
    archetype: "MARKET_MAKING",
    executionMode: "HUF",
    status: "live",
    version: "1.0.1",
    deployedAt: "2025-06-15 10:00:00",
    instruments: [
      { key: "BINANCE:SPOT:DOGE-USDT", venue: "Binance", type: "SPOT_ASSET", role: "Quoted pair" },
    ],
    featuresConsumed: [
      { name: "mid_price", source: "features-mm", sla: "5ms", usedFor: "Recalculate quotes" },
      { name: "orderbook_imbalance", source: "features-mm", sla: "5ms", usedFor: "Skew adjustment" },
    ],
    dataArchitecture: { rawDataSource: "Exchange WebSocket", processedData: ["mid_price", "orderbook_imbalance"], interval: "30S", lowestGranularity: "30S", executionMode: "hold_until_flip" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "PER_FILL", description: "Bid/ask capture", color: "#4ade80" },
        { id: "inventory_pnl", label: "Inventory P&L", settlementType: "MARK_TO_MARKET", description: "Inventory value change", color: "#60a5fa" },
        { id: "fees", label: "Exchange Fees", settlementType: "PER_FILL", description: "Maker/taker fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "2.5+", maxDrawdown: "6%", maxLeverage: "1x", capitalScalability: "$2M" },
    latencyProfile: { dataToSignal: "5ms", signalToInstruction: "1ms", instructionToFill: "10ms", endToEnd: "~20ms", coLocationNeeded: true },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Inventory skew > max", action: "Skew quotes" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "spread_min_bps", value: "8", description: "Minimum spread in bps" }],
    venues: ["BINANCE"],
    performance: { pnlTotal: 210000, pnlMTD: 38000, sharpe: 2.6, maxDrawdown: 4.2, returnPct: 18.5, positions: 2, netExposure: 800000 },
    sparklineData: [12, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-022: CEFI_LINK_MOMENTUM_SCE_2H
  // ============================================
  {
    id: "CEFI_LINK_MOMENTUM_SCE_2H",
    name: "LINK Momentum",
    description: "Momentum-based directional trading on LINK perpetual. Staging for Hyperliquid deployment.",
    strategyIdPattern: "CEFI_LINK_MOMENTUM_SCE_2H",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "SCE",
    status: "staging",
    version: "0.6.0",
    instruments: [
      { key: "HYPERLIQUID:PERPETUAL:LINK-PERP", venue: "Hyperliquid", type: "Perp", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
    ],
    dataArchitecture: { rawDataSource: "Hyperliquid WS", processedData: ["momentum"], interval: "2H", lowestGranularity: "2H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "18-30%", targetSharpe: "1.3+", maxDrawdown: "15%", maxLeverage: "2x", capitalScalability: "$3M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "STAGING", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "lookback_period", value: "18", description: "Momentum lookback in bars" }],
    venues: ["HYPERLIQUID"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-023: CEFI_ARB_MEAN_REV_HUF_15M
  // ============================================
  {
    id: "CEFI_ARB_MEAN_REV_HUF_15M",
    name: "ARB Mean Reversion",
    description: "Mean reversion on ARB/USDT. Development phase strategy for beta fund.",
    strategyIdPattern: "CEFI_ARB_MEAN_REV_HUF_15M",
    clientId: "quant-fund",
    assetClass: "CeFi",
    strategyType: "Mean Reversion",
    archetype: "MEAN_REVERSION",
    executionMode: "HUF",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "OKX:SPOT:ARB-USDT", venue: "OKX", type: "SPOT_ASSET", role: "Primary pair" },
    ],
    featuresConsumed: [
      { name: "z_score", source: "features-volatility", sla: "1m", usedFor: "Mean reversion signal" },
    ],
    dataArchitecture: { rawDataSource: "OKX API", processedData: ["z_score"], interval: "15M", lowestGranularity: "15M", executionMode: "hold_until_flip" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "MARK_TO_MARKET", description: "Mean reversion capture", color: "#4ade80" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-15%", targetSharpe: "1.2+", maxDrawdown: "10%", maxLeverage: "1x", capitalScalability: "$2M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Spread divergence", action: "Widen stop" }],
    testingStatus: [{ stage: "MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "entry_zscore", value: "2.5", description: "Z-score entry threshold" }],
    venues: ["OKX"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-024: CEFI_XRP_MM_HUF_1M
  // ============================================
  {
    id: "CEFI_XRP_MM_HUF_1M",
    name: "XRP Market Making",
    description: "Two-sided quoting on Binance XRP/USDT. Fast-cycle market making.",
    strategyIdPattern: "CEFI_XRP_MM_HUF_1M",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Market Making",
    archetype: "MARKET_MAKING",
    executionMode: "HUF",
    status: "live",
    version: "1.7.0",
    deployedAt: "2025-05-22 08:00:00",
    instruments: [
      { key: "BINANCE:SPOT:XRP-USDT", venue: "Binance", type: "SPOT_ASSET", role: "Quoted pair" },
    ],
    featuresConsumed: [
      { name: "mid_price", source: "features-mm", sla: "5ms", usedFor: "Recalculate quotes" },
      { name: "orderbook_imbalance", source: "features-mm", sla: "5ms", usedFor: "Skew adjustment" },
    ],
    dataArchitecture: { rawDataSource: "Exchange WebSocket", processedData: ["mid_price", "orderbook_imbalance"], interval: "1M", lowestGranularity: "1M", executionMode: "hold_until_flip" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "PER_FILL", description: "Bid/ask capture", color: "#4ade80" },
        { id: "inventory_pnl", label: "Inventory P&L", settlementType: "MARK_TO_MARKET", description: "Inventory value change", color: "#60a5fa" },
        { id: "fees", label: "Exchange Fees", settlementType: "PER_FILL", description: "Maker/taker fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "12-20%", targetSharpe: "2.8+", maxDrawdown: "4%", maxLeverage: "1x", capitalScalability: "$3M" },
    latencyProfile: { dataToSignal: "5ms", signalToInstruction: "1ms", instructionToFill: "10ms", endToEnd: "~20ms", coLocationNeeded: true },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Inventory skew > max", action: "Skew quotes" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "spread_min_bps", value: "6", description: "Minimum spread in bps" }],
    venues: ["BINANCE"],
    performance: { pnlTotal: 280000, pnlMTD: 42000, sharpe: 2.9, maxDrawdown: 3.1, returnPct: 16.4, positions: 2, netExposure: 1200000 },
    sparklineData: [10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 19, 22],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-025: TRADFI_ES_ML_DIR_SCE_30M
  // ============================================
  {
    id: "TRADFI_ES_ML_DIR_SCE_30M",
    name: "ES ML Directional",
    description: "ML-driven directional strategy on E-mini S&P 500 futures. Gradient boosting predictions.",
    strategyIdPattern: "TRADFI_ES_ML_DIR_SCE_30M",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "ML Directional",
    archetype: "ML_DIRECTIONAL",
    executionMode: "SCE",
    status: "live",
    version: "2.2.0",
    deployedAt: "2025-01-05 09:30:00",
    instruments: [
      { key: "CME:FUTURE:ES", venue: "CME", type: "Future", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "ml_signal", source: "ml-inference-service", sla: "5s", usedFor: "Direction prediction" },
      { name: "es_price", source: "market-tick-data", sla: "100ms", usedFor: "Entry/exit timing" },
    ],
    dataArchitecture: { rawDataSource: "CME / Databento", processedData: ["es_price", "ml_features"], interval: "30M", lowestGranularity: "30M", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price direction capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "1.6+", maxDrawdown: "10%", maxLeverage: "2x", capitalScalability: "$20M" },
    latencyProfile: { dataToSignal: "50ms", signalToInstruction: "5ms", instructionToFill: "100ms", endToEnd: "~200ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Reduce position" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_contracts", value: "50", description: "Max ES contracts" }],
    venues: ["CME"],
    performance: { pnlTotal: 620000, pnlMTD: 85000, sharpe: 1.7, maxDrawdown: 8.4, returnPct: 18.6, positions: 1, netExposure: 4500000 },
    sparklineData: [12, 15, 14, 18, 16, 22, 20, 25, 23, 28, 26, 30],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-026: TRADFI_SPY_OPTIONS_ML_EVT_1D
  // ============================================
  {
    id: "TRADFI_SPY_OPTIONS_ML_EVT_1D",
    name: "SPY Options ML",
    description: "ML-driven options strategy on SPY. Volatility surface modeling with delta hedging.",
    strategyIdPattern: "TRADFI_SPY_OPTIONS_ML_EVT_1D",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "Options ML",
    archetype: "OPTIONS",
    executionMode: "EVT",
    status: "live",
    version: "1.4.0",
    deployedAt: "2024-10-15 09:30:00",
    instruments: [
      { key: "CBOE:EQUITY:SPY", venue: "CBOE", type: "SPOT_ASSET", role: "Underlying" },
      { key: "CBOE:OPTION:SPY-C-500-20260320", venue: "CBOE", type: "Option", role: "Call option" },
    ],
    featuresConsumed: [
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Options pricing" },
      { name: "ml_vol_prediction", source: "ml-inference-service", sla: "30s", usedFor: "Vol direction" },
    ],
    dataArchitecture: { rawDataSource: "CBOE / OPRA", processedData: ["iv_surface", "greeks"], interval: "1D", lowestGranularity: "1D", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "vega_pnl", label: "Vega P&L", settlementType: "MARK_TO_MARKET", description: "Vol change capture", color: "#a78bfa" },
        { id: "theta_pnl", label: "Theta P&L", settlementType: "DAILY", description: "Time decay", color: "#60a5fa" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CBOE commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "18-30%", targetSharpe: "1.8+", maxDrawdown: "12%", maxLeverage: "3x", capitalScalability: "$10M" },
    latencyProfile: { dataToSignal: "1s", signalToInstruction: "100ms", instructionToFill: "500ms", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "vega", subscribed: true, threshold: "Max vega exposure", action: "Reduce vol exposure" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_vega_usd", value: "100000", description: "Max vega exposure" }],
    venues: ["CBOE"],
    performance: { pnlTotal: 560000, pnlMTD: 72000, sharpe: 1.9, maxDrawdown: 9.5, returnPct: 22.4, positions: 6, netExposure: 2800000 },
    sparklineData: [10, 13, 11, 16, 14, 19, 17, 22, 20, 25, 23, 28],
    instructionTypes: ["TRADE", "HEDGE"],
  },

  // ============================================
  // strat-027: TRADFI_CL_ML_DIR_SCE_1H
  // ============================================
  {
    id: "TRADFI_CL_ML_DIR_SCE_1H",
    name: "Crude Oil ML Directional",
    description: "ML-driven directional strategy on CL and BZ crude oil futures.",
    strategyIdPattern: "TRADFI_CL_ML_DIR_SCE_1H",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "ML Directional",
    archetype: "ML_DIRECTIONAL",
    executionMode: "SCE",
    status: "live",
    version: "1.9.0",
    deployedAt: "2025-02-01 09:00:00",
    instruments: [
      { key: "CME:FUTURE:CL", venue: "CME", type: "Future", role: "WTI Crude" },
      { key: "CME:FUTURE:BZ", venue: "CME", type: "Future", role: "Brent Crude" },
    ],
    featuresConsumed: [
      { name: "ml_signal", source: "ml-inference-service", sla: "5s", usedFor: "Direction prediction" },
      { name: "inventory_data", source: "tradfi-data-service", sla: "1h", usedFor: "Supply/demand" },
    ],
    dataArchitecture: { rawDataSource: "CME / EIA", processedData: ["cl_price", "bz_price", "ml_features"], interval: "1H", lowestGranularity: "1H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price direction capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "12-22%", targetSharpe: "1.4+", maxDrawdown: "12%", maxLeverage: "2x", capitalScalability: "$15M" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "200ms", endToEnd: "~500ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Reduce position" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_contracts", value: "30", description: "Max CL contracts" }],
    venues: ["CME"],
    performance: { pnlTotal: 410000, pnlMTD: 55000, sharpe: 1.5, maxDrawdown: 10.2, returnPct: 16.8, positions: 2, netExposure: 3500000 },
    sparklineData: [8, 10, 12, 11, 14, 16, 15, 18, 17, 20, 19, 22],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-028: TRADFI_GC_MM_OPTIONS_EVT_TICK
  // ============================================
  {
    id: "TRADFI_GC_MM_OPTIONS_EVT_TICK",
    name: "Gold Options MM",
    description: "Market making in gold options with delta hedging. Multi-strike quoting across expiries.",
    strategyIdPattern: "TRADFI_GC_MM_OPTIONS_EVT_TICK",
    clientId: "delta-one",
    assetClass: "TradFi",
    strategyType: "Options MM",
    archetype: "OPTIONS",
    executionMode: "EVT",
    status: "live",
    version: "3.0.1",
    deployedAt: "2024-12-01 08:00:00",
    instruments: [
      { key: "CME:FUTURE:GC", venue: "CME", type: "Future", role: "Gold futures underlying" },
      { key: "CME:OPTION:GC-C-2500-20260617", venue: "CME", type: "Option", role: "Gold call option" },
    ],
    featuresConsumed: [
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Option pricing" },
      { name: "gold_price", source: "market-tick-data", sla: "100ms", usedFor: "Delta hedging" },
    ],
    dataArchitecture: { rawDataSource: "CME", processedData: ["gold_price", "iv_surface", "greeks"], interval: "Tick", lowestGranularity: "Tick", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Options Spread", settlementType: "PER_FILL", description: "Bid/ask spread capture", color: "#4ade80" },
        { id: "theta_pnl", label: "Theta P&L", settlementType: "DAILY", description: "Time decay", color: "#60a5fa" },
        { id: "hedge_cost", label: "Hedge Cost", settlementType: "PER_FILL", description: "Delta hedge slippage", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "20-35%", targetSharpe: "2.2+", maxDrawdown: "8%", maxLeverage: "N/A (Greeks-managed)", capitalScalability: "$10M" },
    latencyProfile: { dataToSignal: "5ms", signalToInstruction: "2ms", instructionToFill: "10ms", endToEnd: "~20ms", coLocationNeeded: true },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Portfolio delta > hedge threshold", action: "Hedge underlying" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "spread_bps_atm", value: "12", description: "ATM spread in bps" }],
    venues: ["CME"],
    performance: { pnlTotal: 780000, pnlMTD: 105000, sharpe: 2.3, maxDrawdown: 6.2, returnPct: 26.8, positions: 12, netExposure: 4200000 },
    sparklineData: [10, 14, 12, 18, 16, 22, 20, 26, 24, 30, 28, 34],
    instructionTypes: ["TRADE", "HEDGE"],
  },

  // ============================================
  // strat-029: TRADFI_ZN_OPTIONS_ML_SCE_4H
  // ============================================
  {
    id: "TRADFI_ZN_OPTIONS_ML_SCE_4H",
    name: "Treasury Options ML",
    description: "ML-driven options strategy on 10-Year Treasury Note futures. Volatility surface modeling.",
    strategyIdPattern: "TRADFI_ZN_OPTIONS_ML_SCE_4H",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "Options ML",
    archetype: "OPTIONS",
    executionMode: "SCE",
    status: "staging",
    version: "0.8.1",
    instruments: [
      { key: "CME:FUTURE:ZN", venue: "CME", type: "Future", role: "10Y Treasury futures" },
      { key: "CME:OPTION:ZN-P-110-20260918", venue: "CME", type: "Option", role: "Put option" },
    ],
    featuresConsumed: [
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Options pricing" },
      { name: "yield_curve", source: "tradfi-data-service", sla: "5m", usedFor: "Rate structure" },
    ],
    dataArchitecture: { rawDataSource: "CME", processedData: ["zn_price", "iv_surface"], interval: "4H", lowestGranularity: "4H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "vega_pnl", label: "Vega P&L", settlementType: "MARK_TO_MARKET", description: "Vol change capture", color: "#a78bfa" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-18%", targetSharpe: "1.5+", maxDrawdown: "10%", maxLeverage: "2x", capitalScalability: "$15M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "vega", subscribed: true, threshold: "Max vega exposure", action: "Reduce vol exposure" }],
    testingStatus: [{ stage: "STAGING", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "max_vega_usd", value: "80000", description: "Max vega exposure" }],
    venues: ["CME"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE", "HEDGE"],
  },

  // ============================================
  // strat-030: TRADFI_SI_ML_DIR_SCE_2H
  // ============================================
  {
    id: "TRADFI_SI_ML_DIR_SCE_2H",
    name: "Silver ML Directional",
    description: "ML-driven directional strategy on silver futures. Vertex Partners allocation.",
    strategyIdPattern: "TRADFI_SI_ML_DIR_SCE_2H",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "ML Directional",
    archetype: "ML_DIRECTIONAL",
    executionMode: "SCE",
    status: "live",
    version: "1.1.0",
    deployedAt: "2025-04-20 09:00:00",
    instruments: [
      { key: "CME:FUTURE:SI", venue: "CME", type: "Future", role: "Silver futures" },
    ],
    featuresConsumed: [
      { name: "ml_signal", source: "ml-inference-service", sla: "5s", usedFor: "Direction prediction" },
      { name: "si_price", source: "market-tick-data", sla: "100ms", usedFor: "Entry/exit timing" },
    ],
    dataArchitecture: { rawDataSource: "CME", processedData: ["si_price", "ml_features"], interval: "2H", lowestGranularity: "2H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price direction capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "12-20%", targetSharpe: "1.3+", maxDrawdown: "12%", maxLeverage: "2x", capitalScalability: "$8M" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "200ms", endToEnd: "~500ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Reduce position" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_contracts", value: "20", description: "Max SI contracts" }],
    venues: ["CME"],
    performance: { pnlTotal: 290000, pnlMTD: 38000, sharpe: 1.4, maxDrawdown: 10.8, returnPct: 14.2, positions: 1, netExposure: 2200000 },
    sparklineData: [6, 8, 10, 9, 12, 14, 13, 16, 15, 18, 17, 20],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-031: TRADFI_QQQ_MM_OPTIONS_EVT_5M
  // ============================================
  {
    id: "TRADFI_QQQ_MM_OPTIONS_EVT_5M",
    name: "QQQ Options MM",
    description: "Market making in QQQ options. Paper trading phase for beta fund.",
    strategyIdPattern: "TRADFI_QQQ_MM_OPTIONS_EVT_5M",
    clientId: "delta-one",
    assetClass: "TradFi",
    strategyType: "Options MM",
    archetype: "OPTIONS",
    executionMode: "EVT",
    status: "paper",
    version: "0.3.0",
    instruments: [
      { key: "CBOE:ETF:QQQ", venue: "CBOE", type: "SPOT_ASSET", role: "Underlying" },
      { key: "CBOE:OPTION:QQQ-C-480-20260320", venue: "CBOE", type: "Option", role: "Call option" },
    ],
    featuresConsumed: [
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Option pricing" },
      { name: "qqq_price", source: "market-tick-data", sla: "100ms", usedFor: "Delta hedging" },
    ],
    dataArchitecture: { rawDataSource: "CBOE / OPRA", processedData: ["qqq_price", "iv_surface"], interval: "5M", lowestGranularity: "5M", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Options Spread", settlementType: "PER_FILL", description: "Bid/ask capture", color: "#4ade80" },
        { id: "theta_pnl", label: "Theta P&L", settlementType: "DAILY", description: "Time decay", color: "#60a5fa" },
        { id: "hedge_cost", label: "Hedge Cost", settlementType: "PER_FILL", description: "Delta hedge slippage", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-28%", targetSharpe: "1.8+", maxDrawdown: "10%", maxLeverage: "N/A (Greeks-managed)", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "5ms", signalToInstruction: "2ms", instructionToFill: "10ms", endToEnd: "~20ms", coLocationNeeded: true },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Portfolio delta > hedge threshold", action: "Hedge underlying" }],
    testingStatus: [{ stage: "LIVE_MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "spread_bps_atm", value: "15", description: "ATM spread in bps" }],
    venues: ["CBOE"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE", "HEDGE"],
  },

  // ============================================
  // strat-032: TRADFI_EURUSD_ML_DIR_SCE_1H
  // ============================================
  {
    id: "TRADFI_EURUSD_ML_DIR_SCE_1H",
    name: "EUR/USD ML Directional",
    description: "ML-driven directional strategy on 6E (EUR/USD) currency futures.",
    strategyIdPattern: "TRADFI_EURUSD_ML_DIR_SCE_1H",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "ML Directional",
    archetype: "ML_DIRECTIONAL",
    executionMode: "SCE",
    status: "live",
    version: "2.5.0",
    deployedAt: "2024-06-01 09:00:00",
    instruments: [
      { key: "CME:FUTURE:6E", venue: "CME", type: "Future", role: "EUR/USD futures" },
    ],
    featuresConsumed: [
      { name: "ml_signal", source: "ml-inference-service", sla: "5s", usedFor: "Direction prediction" },
      { name: "macro_features", source: "tradfi-data-service", sla: "1h", usedFor: "Macro inputs" },
    ],
    dataArchitecture: { rawDataSource: "CME", processedData: ["eurusd_price", "ml_features"], interval: "1H", lowestGranularity: "1H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "MARK_TO_MARKET", description: "Price direction capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-18%", targetSharpe: "1.5+", maxDrawdown: "8%", maxLeverage: "2x", capitalScalability: "$25M" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "200ms", endToEnd: "~500ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Reduce position" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_contracts", value: "40", description: "Max 6E contracts" }],
    venues: ["CME"],
    performance: { pnlTotal: 520000, pnlMTD: 68000, sharpe: 1.6, maxDrawdown: 7.5, returnPct: 15.8, positions: 1, netExposure: 3800000 },
    sparklineData: [8, 10, 12, 11, 14, 16, 15, 18, 17, 20, 19, 22],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-033: TRADFI_HG_OPTIONS_ML_SCE_1D
  // ============================================
  {
    id: "TRADFI_HG_OPTIONS_ML_SCE_1D",
    name: "Copper Options ML",
    description: "ML-driven options strategy on HG copper futures. Development phase.",
    strategyIdPattern: "TRADFI_HG_OPTIONS_ML_SCE_1D",
    clientId: "quant-fund",
    assetClass: "TradFi",
    strategyType: "Options ML",
    archetype: "OPTIONS",
    executionMode: "SCE",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "CME:FUTURE:HG", venue: "CME", type: "Future", role: "Copper futures" },
    ],
    featuresConsumed: [
      { name: "iv_surface", source: "features-volatility", sla: "1m", usedFor: "Options pricing" },
    ],
    dataArchitecture: { rawDataSource: "CME", processedData: ["hg_price", "iv_surface"], interval: "1D", lowestGranularity: "1D", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "vega_pnl", label: "Vega P&L", settlementType: "MARK_TO_MARKET", description: "Vol change capture", color: "#a78bfa" },
        { id: "commission", label: "Commission", settlementType: "PER_TRADE", description: "CME commissions", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-18%", targetSharpe: "1.4+", maxDrawdown: "10%", maxLeverage: "2x", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "1s", signalToInstruction: "100ms", instructionToFill: "500ms", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "vega", subscribed: true, threshold: "Max vega exposure", action: "Reduce vol exposure" }],
    testingStatus: [{ stage: "MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "max_vega_usd", value: "50000", description: "Max vega exposure" }],
    venues: ["CME"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-034: DEFI_WBTC_BASIS_SCE_4H
  // ============================================
  {
    id: "DEFI_WBTC_BASIS_SCE_4H",
    name: "WBTC Basis Trade",
    description: "Long WBTC on Uniswap V3 + short BTC perp. DeFi basis trade on wrapped BTC.",
    strategyIdPattern: "DEFI_WBTC_BASIS_SCE_4H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Basis Trade",
    archetype: "BASIS_TRADE",
    executionMode: "SCE",
    status: "live",
    version: "1.5.0",
    deployedAt: "2025-03-15 08:00:00",
    instruments: [
      { key: "UNISWAPV3:SPOT:WBTC-USDC", venue: "Uniswap V3", type: "SPOT_ASSET", role: "Long leg" },
      { key: "UNISWAPV3:SPOT:WBTC-ETH", venue: "Uniswap V3", type: "SPOT_ASSET", role: "Cross pair" },
    ],
    featuresConsumed: [
      { name: "funding_rate", source: "features-delta-one", sla: "10s", usedFor: "Signal" },
      { name: "basis_bps", source: "features-delta-one", sla: "10s", usedFor: "Spread monitoring" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Uniswap", processedData: ["wbtc_price", "basis_bps"], interval: "4H", lowestGranularity: "4H", executionMode: "same_candle_exit" },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "WBTC swap", sorEnabled: true, allowedVenues: ["UNISWAPV3-ETHEREUM"] }] },
    pnlAttribution: {
      components: [
        { id: "funding_pnl", label: "Funding P&L", settlementType: "FUNDING_8H", description: "Funding rate capture", color: "#4ade80" },
        { id: "basis_spread_pnl", label: "Basis Spread", settlementType: "MARK_TO_MARKET", description: "Premium change", color: "#60a5fa" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "On-chain gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-14%", targetSharpe: "1.8+", maxDrawdown: "6%", maxLeverage: "1x", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "50ms", signalToInstruction: "5ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "2% drift", action: "Adjust perp size" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "initial_capital", value: "1000000", description: "Starting capital" }],
    venues: ["UNISWAPV3-ETHEREUM"],
    performance: { pnlTotal: 320000, pnlMTD: 45000, sharpe: 1.9, maxDrawdown: 4.8, returnPct: 10.2, positions: 2, netExposure: 2800000 },
    sparklineData: [8, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17, 20],
    instructionTypes: ["SWAP", "TRADE"],
  },

  // ============================================
  // strat-035: DEFI_STETH_STAKED_BASIS_EVT_1D
  // ============================================
  {
    id: "DEFI_STETH_STAKED_BASIS_EVT_1D",
    name: "stETH Staked Basis",
    description: "Long stETH/wstETH staking yield + short ETH perp hedge. LST basis trade via Lido.",
    strategyIdPattern: "DEFI_STETH_STAKED_BASIS_EVT_1D",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Staked Basis",
    archetype: "BASIS_TRADE",
    executionMode: "EVT",
    status: "live",
    version: "2.0.0",
    deployedAt: "2025-02-10 10:00:00",
    instruments: [
      { key: "LIDO:STAKED:STETH@ETHEREUM", venue: "Lido", type: "SPOT_ASSET", role: "Staking position" },
      { key: "WALLET:SPOT_ASSET:WSTETH", venue: "Wallet", type: "SPOT_ASSET", role: "Wrapped staked ETH" },
      { key: "WALLET:SPOT_ASSET:ETH", venue: "Wallet", type: "SPOT_ASSET", role: "Base asset" },
    ],
    featuresConsumed: [
      { name: "lst_staking_apy", source: "features-onchain", sla: "60s", usedFor: "Staking yield" },
      { name: "steth_discount", source: "features-onchain", sla: "60s", usedFor: "Peg monitoring" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Lido", processedData: ["staking_apy", "steth_discount"], interval: "1D", lowestGranularity: "1D", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "staking_yield", label: "Staking Yield", settlementType: "LST_YIELD", description: "stETH appreciation", color: "#4ade80" },
        { id: "funding_pnl", label: "Funding P&L", settlementType: "FUNDING_8H", description: "Short perp funding", color: "#60a5fa" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Transaction gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-15%", targetSharpe: "2.0+", maxDrawdown: "5%", maxLeverage: "1x", capitalScalability: "$10M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "10ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "protocol_risk", subscribed: true, threshold: "stETH depeg > 2%", action: "Emergency exit" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "initial_capital", value: "2000000", description: "Starting capital" }],
    venues: ["LIDO-ETHEREUM", "HYPERLIQUID"],
    performance: { pnlTotal: 480000, pnlMTD: 58000, sharpe: 2.1, maxDrawdown: 3.5, returnPct: 11.8, positions: 3, netExposure: 4000000 },
    sparklineData: [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
    instructionTypes: ["SWAP", "TRADE"],
  },

  // ============================================
  // strat-036: DEFI_ETH_RECURSIVE_STAKED_EVT_BLOCK
  // ============================================
  {
    id: "DEFI_ETH_RECURSIVE_STAKED_EVT_BLOCK",
    name: "ETH Recursive Staked (Acme)",
    description: "Recursive staked basis via Aave V3. Flash loan leveraged wstETH/WETH looping.",
    strategyIdPattern: "DEFI_ETH_RECURSIVE_STAKED_EVT_BLOCK",
    clientId: "quant-fund",
    assetClass: "DeFi",
    strategyType: "Recursive Staked Basis",
    archetype: "RECURSIVE_STAKED_BASIS",
    executionMode: "EVT",
    status: "live",
    version: "1.0.0",
    deployedAt: "2025-05-01 10:00:00",
    instruments: [
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AWSTETH@ETHEREUM", venue: "Aave V3", type: "aToken", role: "Collateral" },
      { key: "AAVEV3-ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM", venue: "Aave V3", type: "debtToken", role: "Debt" },
    ],
    featuresConsumed: [
      { name: "health_factor", source: "features-onchain", sla: "60s", usedFor: "Liquidation risk" },
      { name: "lst_staking_apy", source: "features-onchain", sla: "60s", usedFor: "Yield monitoring" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Aave", processedData: ["health_factor", "staking_apy", "borrow_apy"], interval: "Per-block", lowestGranularity: "Per-block", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "staking_yield", label: "Staking Yield (Leveraged)", settlementType: "LST_YIELD", description: "wstETH rate x leverage", color: "#4ade80" },
        { id: "borrow_cost", label: "Borrow Cost", settlementType: "AAVE_INDEX", description: "WETH borrow rate", color: "#ef4444" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Flash loan + gas", color: "#dc2626" },
      ],
    },
    riskProfile: { targetReturn: "20-30%", targetSharpe: "1.8+", maxDrawdown: "15%", maxLeverage: "3x", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "50ms", signalToInstruction: "5ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "aave_liquidation", subscribed: true, threshold: "HF < 1.2", action: "Emergency deleverage" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "target_leverage", value: "2.5", description: "Target leverage" }],
    venues: ["AAVEV3-ETHEREUM"],
    performance: { pnlTotal: 380000, pnlMTD: 52000, sharpe: 1.9, maxDrawdown: 12.4, returnPct: 24.2, positions: 2, netExposure: 1800000 },
    sparklineData: [5, 8, 12, 10, 16, 20, 18, 24, 22, 28, 26, 32],
    instructionTypes: ["FLASH_BORROW", "SWAP", "LEND", "BORROW", "FLASH_REPAY"],
  },

  // ============================================
  // strat-037: DEFI_USDC_AAVE_LEND_EVT_1H
  // ============================================
  {
    id: "DEFI_USDC_AAVE_LEND_EVT_1H",
    name: "USDC Aave Lending",
    description: "Multi-stablecoin lending on Aave V3. Supply USDC/USDT/DAI for yield optimization.",
    strategyIdPattern: "DEFI_USDC_AAVE_LEND_EVT_1H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Lending",
    archetype: "YIELD",
    executionMode: "EVT",
    status: "live",
    version: "1.8.0",
    deployedAt: "2025-01-15 10:00:00",
    instruments: [
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM", venue: "Aave V3", type: "aToken", role: "USDC supply" },
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AUSDT@ETHEREUM", venue: "Aave V3", type: "aToken", role: "USDT supply" },
      { key: "AAVEV3-ETHEREUM:A_TOKEN:ADAI@ETHEREUM", venue: "Aave V3", type: "aToken", role: "DAI supply" },
    ],
    featuresConsumed: [
      { name: "supply_apy", source: "features-onchain", sla: "60s", usedFor: "Yield comparison" },
      { name: "utilization_rate", source: "features-onchain", sla: "60s", usedFor: "APY prediction" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Aave", processedData: ["supply_apy", "utilization"], interval: "1H", lowestGranularity: "1H", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "lending_yield", label: "Lending Yield", settlementType: "AAVE_INDEX", description: "Supply interest", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Rebalance gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "4-8%", targetSharpe: "4.0+", maxDrawdown: "1%", maxLeverage: "1x", capitalScalability: "$50M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "10ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "protocol_risk", subscribed: true, threshold: "Aave exploit", action: "Emergency withdraw" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "min_supply_apy", value: "0.03", description: "Min 3% APY" }],
    venues: ["AAVEV3-ETHEREUM"],
    performance: { pnlTotal: 220000, pnlMTD: 24000, sharpe: 4.5, maxDrawdown: 0.3, returnPct: 5.4, positions: 3, netExposure: 4200000 },
    sparklineData: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    instructionTypes: ["LEND", "WITHDRAW", "REBALANCE"],
  },

  // ============================================
  // strat-038: DEFI_ARB_AMM_LP_SCE_4H
  // ============================================
  {
    id: "DEFI_ARB_AMM_LP_SCE_4H",
    name: "ARB AMM LP",
    description: "Concentrated liquidity provision on Uniswap V3 for ARB/USDC and ARB/ETH pairs.",
    strategyIdPattern: "DEFI_ARB_AMM_LP_SCE_4H",
    clientId: "defi-desk",
    assetClass: "DeFi",
    strategyType: "AMM LP",
    archetype: "AMM_LP",
    executionMode: "SCE",
    status: "staging",
    version: "0.5.0",
    instruments: [
      { key: "UNISWAPV3:LP:ARB-USDC", venue: "Uniswap V3", type: "LP NFT", role: "ARB/USDC LP" },
      { key: "UNISWAPV3:LP:ARB-ETH", venue: "Uniswap V3", type: "LP NFT", role: "ARB/ETH LP" },
    ],
    featuresConsumed: [
      { name: "pool_price", source: "features-onchain", sla: "12s", usedFor: "Rebalance trigger" },
      { name: "fee_apy_24h", source: "features-onchain", sla: "1h", usedFor: "Profitability check" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Uniswap", processedData: ["pool_price", "fee_apy"], interval: "4H", lowestGranularity: "4H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "fee_income", label: "Fee Income", settlementType: "LP_FEE_ACCRUAL", description: "Swap fees", color: "#4ade80" },
        { id: "il_pnl", label: "Impermanent Loss", settlementType: "MARK_TO_MARKET", description: "IL from price divergence", color: "#ef4444" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Rebalance gas", color: "#dc2626" },
      ],
    },
    riskProfile: { targetReturn: "10-20%", targetSharpe: "1.3+", maxDrawdown: "15%", maxLeverage: "1x", capitalScalability: "$3M" },
    latencyProfile: { dataToSignal: "50ms", signalToInstruction: "10ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "impermanent_loss", subscribed: true, threshold: "IL > 5%", action: "Widen range or exit" }],
    testingStatus: [{ stage: "STAGING", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "tick_range", value: "2000", description: "Tick range offset" }],
    venues: ["UNISWAPV3-ETHEREUM"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"],
  },

  // ============================================
  // strat-039: DEFI_MATIC_AMM_LP_SCE_2H
  // ============================================
  {
    id: "DEFI_MATIC_AMM_LP_SCE_2H",
    name: "MATIC AMM LP",
    description: "Concentrated liquidity provision for MATIC/USDC on Uniswap V3. Development phase.",
    strategyIdPattern: "DEFI_MATIC_AMM_LP_SCE_2H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "AMM LP",
    archetype: "AMM_LP",
    executionMode: "SCE",
    status: "development",
    version: "0.2.0",
    instruments: [
      { key: "UNISWAPV3:LP:MATIC-USDC", venue: "Uniswap V3", type: "LP NFT", role: "MATIC/USDC LP" },
    ],
    featuresConsumed: [
      { name: "pool_price", source: "features-onchain", sla: "12s", usedFor: "Rebalance trigger" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Uniswap", processedData: ["pool_price"], interval: "2H", lowestGranularity: "2H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "fee_income", label: "Fee Income", settlementType: "LP_FEE_ACCRUAL", description: "Swap fees", color: "#4ade80" },
        { id: "il_pnl", label: "Impermanent Loss", settlementType: "MARK_TO_MARKET", description: "IL from price divergence", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-15%", targetSharpe: "1.2+", maxDrawdown: "18%", maxLeverage: "1x", capitalScalability: "$2M" },
    latencyProfile: { dataToSignal: "50ms", signalToInstruction: "10ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "impermanent_loss", subscribed: true, threshold: "IL > 8%", action: "Exit" }],
    testingStatus: [{ stage: "MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "tick_range", value: "1500", description: "Tick range offset" }],
    venues: ["UNISWAPV3-ETHEREUM"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"],
  },

  // ============================================
  // strat-040: DEFI_DAI_AAVE_LEND_EVT_8H
  // ============================================
  {
    id: "DEFI_DAI_AAVE_LEND_EVT_8H",
    name: "DAI Aave Lending",
    description: "Supply DAI/USDC to Aave V3 for yield. Conservative stablecoin lending.",
    strategyIdPattern: "DEFI_DAI_AAVE_LEND_EVT_8H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Lending",
    archetype: "YIELD",
    executionMode: "EVT",
    status: "live",
    version: "1.3.0",
    deployedAt: "2025-04-20 10:00:00",
    instruments: [
      { key: "AAVEV3-ETHEREUM:A_TOKEN:ADAI@ETHEREUM", venue: "Aave V3", type: "aToken", role: "DAI supply" },
      { key: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM", venue: "Aave V3", type: "aToken", role: "USDC supply" },
    ],
    featuresConsumed: [
      { name: "supply_apy", source: "features-onchain", sla: "60s", usedFor: "Yield monitoring" },
      { name: "utilization_rate", source: "features-onchain", sla: "60s", usedFor: "APY prediction" },
    ],
    dataArchitecture: { rawDataSource: "On-chain / Aave", processedData: ["supply_apy", "utilization"], interval: "8H", lowestGranularity: "8H", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "lending_yield", label: "Lending Yield", settlementType: "AAVE_INDEX", description: "Supply interest", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Transaction gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "3-7%", targetSharpe: "3.5+", maxDrawdown: "1%", maxLeverage: "1x", capitalScalability: "$30M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "10ms", instructionToFill: "5s", endToEnd: "~6s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "protocol_risk", subscribed: true, threshold: "Smart contract risk", action: "Monitor" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "min_supply_apy", value: "0.025", description: "Min 2.5% APY" }],
    venues: ["AAVEV3-ETHEREUM"],
    performance: { pnlTotal: 145000, pnlMTD: 16000, sharpe: 3.8, maxDrawdown: 0.4, returnPct: 4.8, positions: 2, netExposure: 3200000 },
    sparklineData: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    instructionTypes: ["LEND", "WITHDRAW"],
  },

  // ============================================
  // strat-041: SPORTS_EPL_ARB_EVT_MATCH
  // ============================================
  {
    id: "SPORTS_EPL_ARB_EVT_MATCH",
    name: "EPL Cross-Book Arb",
    description: "Cross-bookmaker arbitrage on EPL matches. Back/lay across Betfair and bookmakers.",
    strategyIdPattern: "SPORTS_EPL_ARB_EVT_MATCH",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Arbitrage",
    archetype: "SPORTS_ARB",
    executionMode: "EVT",
    status: "live",
    version: "2.4.0",
    deployedAt: "2024-09-15 10:00:00",
    instruments: [
      { key: "BETFAIR:EXCHANGE_ODDS:EPL_MATCH_ODDS", venue: "Betfair", type: "Exchange Odds", role: "Exchange execution" },
      { key: "BETFAIR:EXCHANGE_ODDS:EPL_ASIAN_HANDICAP", venue: "Betfair", type: "Exchange Odds", role: "Asian handicap" },
    ],
    featuresConsumed: [
      { name: "odds_snapshot", source: "features-sports", sla: "1s", usedFor: "Arb detection" },
      { name: "line_movement", source: "features-sports", sla: "1s", usedFor: "Sharp vs soft divergence" },
    ],
    dataArchitecture: { rawDataSource: "Odds API", processedData: ["odds_snapshot", "arb_opportunities"], interval: "Event-driven", lowestGranularity: "Sub-second", executionMode: "event_driven" },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "Back leg", sorEnabled: true, allowedVenues: ["BETFAIR", "PINNACLE"] }, { name: "Lay leg", sorEnabled: true, allowedVenues: ["BETFAIR"] }] },
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arbitrage P&L", settlementType: "MATCH_SETTLEMENT", description: "Arb profit", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "6-14%", targetSharpe: "4.0+", maxDrawdown: "2%", maxLeverage: "1x", capitalScalability: "$500K" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "500ms", endToEnd: "~700ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "edge_decay", subscribed: true, threshold: "Arb closes", action: "Cancel unmatched" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "min_arb_pct", value: "0.02", description: "Min 2% arb" }],
    venues: ["BETFAIR", "PINNACLE"],
    performance: { pnlTotal: 185000, pnlMTD: 28000, sharpe: 4.5, maxDrawdown: 1.2, returnPct: 9.8, positions: 8, netExposure: 120000 },
    sparklineData: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-042: SPORTS_NFL_VALUE_BET_EVT_GAME
  // ============================================
  {
    id: "SPORTS_NFL_VALUE_BET_EVT_GAME",
    name: "NFL Value Betting",
    description: "Value betting on NFL moneyline and totals. Kelly-criterion sizing against sharp lines.",
    strategyIdPattern: "SPORTS_NFL_VALUE_BET_EVT_GAME",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Value Betting",
    archetype: "SPORTS_ARB",
    executionMode: "EVT",
    status: "live",
    version: "1.6.0",
    deployedAt: "2025-01-01 08:00:00",
    instruments: [
      { key: "BETFAIR:EXCHANGE_ODDS:NFL_MONEYLINE", venue: "Betfair", type: "Exchange Odds", role: "Moneyline" },
      { key: "BETFAIR:EXCHANGE_ODDS:NFL_TOTAL", venue: "Betfair", type: "Exchange Odds", role: "Totals" },
    ],
    featuresConsumed: [
      { name: "sharp_odds", source: "features-sports", sla: "1s", usedFor: "True probability estimate" },
      { name: "kelly_edge", source: "features-sports", sla: "1s", usedFor: "Position sizing" },
    ],
    dataArchitecture: { rawDataSource: "Odds API", processedData: ["sharp_odds", "soft_odds", "kelly_edge"], interval: "Game-driven", lowestGranularity: "Per-game", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "betting_pnl", label: "Betting P&L", settlementType: "MATCH_SETTLEMENT", description: "Win/loss on value bets", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-20%", targetSharpe: "2.0+", maxDrawdown: "8%", maxLeverage: "1x", capitalScalability: "$1M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "50ms", instructionToFill: "1s", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "concentration", subscribed: true, threshold: "10% per game", action: "Cap exposure" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "kelly_fraction", value: "0.25", description: "Fractional Kelly" }],
    venues: ["BETFAIR"],
    performance: { pnlTotal: 165000, pnlMTD: 22000, sharpe: 2.2, maxDrawdown: 6.5, returnPct: 14.2, positions: 0, netExposure: 600000 },
    sparklineData: [8, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17, 20],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-043: SPORTS_LALIGA_ML_EVT_MATCH
  // ============================================
  {
    id: "SPORTS_LALIGA_ML_EVT_MATCH",
    name: "La Liga ML Sports",
    description: "ML-driven match prediction for La Liga. Gradient boosting on historical match data.",
    strategyIdPattern: "SPORTS_LALIGA_ML_EVT_MATCH",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Sports ML",
    archetype: "SPORTS_ARB",
    executionMode: "EVT",
    status: "live",
    version: "1.2.0",
    deployedAt: "2025-03-10 10:00:00",
    instruments: [
      { key: "SMARKETS:EXCHANGE_ODDS:LALIGA_MATCH_ODDS", venue: "Smarkets", type: "Exchange Odds", role: "Match odds" },
    ],
    featuresConsumed: [
      { name: "ml_prediction", source: "sports-ml-service", sla: "5s", usedFor: "Win probability" },
      { name: "team_form", source: "features-sports", sla: "1h", usedFor: "Model input" },
    ],
    dataArchitecture: { rawDataSource: "Sports API", processedData: ["ml_features", "ml_prediction"], interval: "Match-driven", lowestGranularity: "Per-match", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "betting_pnl", label: "Betting P&L", settlementType: "MATCH_SETTLEMENT", description: "ML-driven bets", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "12-22%", targetSharpe: "1.8+", maxDrawdown: "10%", maxLeverage: "1x", capitalScalability: "$1M" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "50ms", instructionToFill: "1s", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "concentration", subscribed: true, threshold: "Max per match", action: "Cap exposure" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "kelly_fraction", value: "0.20", description: "Fractional Kelly" }],
    venues: ["SMARKETS"],
    performance: { pnlTotal: 142000, pnlMTD: 18000, sharpe: 1.9, maxDrawdown: 8.5, returnPct: 16.8, positions: 0, netExposure: 500000 },
    sparklineData: [6, 8, 10, 9, 12, 14, 13, 16, 15, 18, 17, 20],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-044: SPORTS_NBA_MM_EVT_QUARTER
  // ============================================
  {
    id: "SPORTS_NBA_MM_EVT_QUARTER",
    name: "NBA Market Making",
    description: "In-play market making on NBA moneyline and spread. Quarter-level rebalancing.",
    strategyIdPattern: "SPORTS_NBA_MM_EVT_QUARTER",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Sports MM",
    archetype: "MARKET_MAKING",
    executionMode: "EVT",
    status: "staging",
    version: "0.7.0",
    instruments: [
      { key: "BETFAIR:EXCHANGE_ODDS:NBA_MONEYLINE", venue: "Betfair", type: "Exchange Odds", role: "Moneyline" },
      { key: "BETFAIR:EXCHANGE_ODDS:NBA_SPREAD", venue: "Betfair", type: "Exchange Odds", role: "Point spread" },
    ],
    featuresConsumed: [
      { name: "live_score", source: "sports-data-feed", sla: "1s", usedFor: "Market adjustment" },
      { name: "implied_probability", source: "features-sports", sla: "1s", usedFor: "Fair value" },
    ],
    dataArchitecture: { rawDataSource: "Sports API", processedData: ["live_score", "implied_probability"], interval: "Quarter-driven", lowestGranularity: "Per-quarter", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "MATCH_SETTLEMENT", description: "Bid/ask capture", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "2.5+", maxDrawdown: "8%", maxLeverage: "1x", capitalScalability: "$500K" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "market_suspension", subscribed: true, threshold: "Game suspended", action: "Cancel all" }],
    testingStatus: [{ stage: "STAGING", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "spread_bps", value: "50", description: "Spread in bps" }],
    venues: ["BETFAIR"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-045: SPORTS_MLB_VALUE_BET_EVT_GAME
  // ============================================
  {
    id: "SPORTS_MLB_VALUE_BET_EVT_GAME",
    name: "MLB Value Betting",
    description: "Value betting on MLB moneyline and run line. Paper trading phase.",
    strategyIdPattern: "SPORTS_MLB_VALUE_BET_EVT_GAME",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Value Betting",
    archetype: "SPORTS_ARB",
    executionMode: "EVT",
    status: "paper",
    version: "0.4.0",
    instruments: [
      { key: "SMARKETS:EXCHANGE_ODDS:MLB_MONEYLINE", venue: "Smarkets", type: "Exchange Odds", role: "Moneyline" },
      { key: "SMARKETS:EXCHANGE_ODDS:MLB_RUN_LINE", venue: "Smarkets", type: "Exchange Odds", role: "Run line" },
    ],
    featuresConsumed: [
      { name: "sharp_odds", source: "features-sports", sla: "1s", usedFor: "True probability" },
      { name: "pitcher_stats", source: "features-sports", sla: "1h", usedFor: "Model input" },
    ],
    dataArchitecture: { rawDataSource: "Sports API", processedData: ["sharp_odds", "pitcher_data"], interval: "Game-driven", lowestGranularity: "Per-game", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "betting_pnl", label: "Betting P&L", settlementType: "MATCH_SETTLEMENT", description: "Value bet wins/losses", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "8-16%", targetSharpe: "1.5+", maxDrawdown: "12%", maxLeverage: "1x", capitalScalability: "$500K" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "50ms", instructionToFill: "1s", endToEnd: "~2s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "concentration", subscribed: true, threshold: "Max per game", action: "Cap exposure" }],
    testingStatus: [{ stage: "LIVE_MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "kelly_fraction", value: "0.20", description: "Fractional Kelly" }],
    venues: ["SMARKETS"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-046: SPORTS_SERIE_A_ARB_EVT_MATCH
  // ============================================
  {
    id: "SPORTS_SERIE_A_ARB_EVT_MATCH",
    name: "Serie A Arbitrage",
    description: "Cross-bookmaker arbitrage on Serie A matches. Development phase for beta fund.",
    strategyIdPattern: "SPORTS_SERIE_A_ARB_EVT_MATCH",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Arbitrage",
    archetype: "SPORTS_ARB",
    executionMode: "EVT",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "BETFAIR:EXCHANGE_ODDS:SERIE_A_MATCH_ODDS", venue: "Betfair", type: "Exchange Odds", role: "Match odds" },
    ],
    featuresConsumed: [
      { name: "odds_snapshot", source: "features-sports", sla: "1s", usedFor: "Arb detection" },
    ],
    dataArchitecture: { rawDataSource: "Odds API", processedData: ["odds_snapshot"], interval: "Event-driven", lowestGranularity: "Sub-second", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arbitrage P&L", settlementType: "MATCH_SETTLEMENT", description: "Arb profit", color: "#4ade80" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Exchange commission", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "5-10%", targetSharpe: "3.0+", maxDrawdown: "3%", maxLeverage: "1x", capitalScalability: "$200K" },
    latencyProfile: { dataToSignal: "100ms", signalToInstruction: "10ms", instructionToFill: "500ms", endToEnd: "~700ms", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "edge_decay", subscribed: true, threshold: "Arb closes", action: "Cancel unmatched" }],
    testingStatus: [{ stage: "MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "min_arb_pct", value: "0.025", description: "Min 2.5% arb" }],
    venues: ["BETFAIR"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-047: PREDICTION_POLY_ML_DIR_EVT_4H
  // ============================================
  {
    id: "PREDICTION_POLY_ML_DIR_EVT_4H",
    name: "Prediction ML Directional",
    description: "ML-driven directional trading on Polymarket CPI and NFP prediction events.",
    strategyIdPattern: "PREDICTION_POLY_ML_DIR_EVT_4H",
    clientId: "quant-fund",
    assetClass: "Prediction",
    strategyType: "ML Directional",
    archetype: "PREDICTION_ARB",
    executionMode: "EVT",
    status: "live",
    version: "1.1.0",
    deployedAt: "2025-07-20 10:00:00",
    instruments: [
      { key: "POLYMARKET:PREDICTION_MARKET:POLY_CPI_PRINT", venue: "Polymarket", type: "SPOT_ASSET", role: "CPI prediction" },
      { key: "POLYMARKET:PREDICTION_MARKET:POLY_NFP_ABOVE", venue: "Polymarket", type: "SPOT_ASSET", role: "NFP prediction" },
    ],
    featuresConsumed: [
      { name: "ml_prediction", source: "ml-inference-service", sla: "30s", usedFor: "Event probability" },
      { name: "macro_data", source: "tradfi-data-service", sla: "1h", usedFor: "Model input" },
    ],
    dataArchitecture: { rawDataSource: "Polymarket API / FRED", processedData: ["ml_features", "event_probabilities"], interval: "4H", lowestGranularity: "4H", executionMode: "event_driven" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Directional P&L", settlementType: "EVENT_SETTLEMENT", description: "Event outcome prediction", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Polygon gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-25%", targetSharpe: "2.0+", maxDrawdown: "10%", maxLeverage: "1x", capitalScalability: "$500K" },
    latencyProfile: { dataToSignal: "500ms", signalToInstruction: "50ms", instructionToFill: "2s", endToEnd: "~3s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "concentration", subscribed: true, threshold: "Max per event", action: "Cap exposure" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "max_position_per_event", value: "20000", description: "Max per event" }],
    venues: ["POLYMARKET"],
    performance: { pnlTotal: 180000, pnlMTD: 25000, sharpe: 2.1, maxDrawdown: 7.8, returnPct: 18.5, positions: 4, netExposure: 150000 },
    sparklineData: [6, 8, 10, 12, 14, 16, 15, 18, 17, 20, 19, 22],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-048: PREDICTION_POLY_ARB_EVT_1H
  // ============================================
  {
    id: "PREDICTION_POLY_ARB_EVT_1H",
    name: "Prediction Cross-Platform Arb",
    description: "Arbitrage between Polymarket crypto prediction events. ETH and BTC price threshold markets.",
    strategyIdPattern: "PREDICTION_POLY_ARB_EVT_1H",
    clientId: "quant-fund",
    assetClass: "Prediction",
    strategyType: "Arbitrage",
    archetype: "PREDICTION_ARB",
    executionMode: "EVT",
    status: "staging",
    version: "0.6.0",
    instruments: [
      { key: "POLYMARKET:PREDICTION_MARKET:POLY_ETH_ABOVE_5K", venue: "Polymarket", type: "SPOT_ASSET", role: "ETH prediction" },
      { key: "POLYMARKET:PREDICTION_MARKET:POLY_BTC_ABOVE_100K", venue: "Polymarket", type: "SPOT_ASSET", role: "BTC prediction" },
    ],
    featuresConsumed: [
      { name: "poly_odds", source: "features-prediction", sla: "5s", usedFor: "Market prices" },
      { name: "cross_platform_spread", source: "features-prediction", sla: "5s", usedFor: "Arb detection" },
    ],
    dataArchitecture: { rawDataSource: "Polymarket API", processedData: ["poly_odds", "arb_spread"], interval: "1H", lowestGranularity: "1H", executionMode: "event_driven" },
    sorEnabled: true,
    sorConfig: { legs: [{ name: "Prediction leg", sorEnabled: true, allowedVenues: ["POLYMARKET"] }] },
    pnlAttribution: {
      components: [
        { id: "arb_pnl", label: "Arb P&L", settlementType: "EVENT_SETTLEMENT", description: "Cross-platform arb", color: "#4ade80" },
        { id: "gas_cost", label: "Gas Cost", settlementType: "PER_FILL", description: "Polygon gas", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "10-18%", targetSharpe: "2.5+", maxDrawdown: "5%", maxLeverage: "1x", capitalScalability: "$500K" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "10ms", instructionToFill: "2s", endToEnd: "~3s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "edge_decay", subscribed: true, threshold: "Arb closes", action: "Cancel unmatched" }],
    testingStatus: [{ stage: "STAGING", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "min_arb_pct", value: "0.03", description: "Min 3% arb" }],
    venues: ["POLYMARKET"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-049: CEFI_MATIC_MOMENTUM_SCE_2H
  // ============================================
  {
    id: "CEFI_MATIC_MOMENTUM_SCE_2H",
    name: "MATIC Momentum",
    description: "Momentum-based directional trading on MATIC/USDT. Development phase.",
    strategyIdPattern: "CEFI_MATIC_MOMENTUM_SCE_2H",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "SCE",
    status: "development",
    version: "0.2.0",
    instruments: [
      { key: "OKX:SPOT:MATIC-USDT", venue: "OKX", type: "SPOT_ASSET", role: "Primary pair" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
    ],
    dataArchitecture: { rawDataSource: "OKX API", processedData: ["momentum"], interval: "2H", lowestGranularity: "2H", executionMode: "same_candle_exit" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "15-28%", targetSharpe: "1.2+", maxDrawdown: "18%", maxLeverage: "2x", capitalScalability: "$2M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "MOCK", status: "in_progress" }, { stage: "LIVE_REAL", status: "pending" }],
    configParams: [{ key: "lookback_period", value: "16", description: "Momentum lookback" }],
    venues: ["OKX"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // strat-050: CEFI_SUI_MOMENTUM_HUF_1H
  // ============================================
  {
    id: "CEFI_SUI_MOMENTUM_HUF_1H",
    name: "SUI Momentum",
    description: "Momentum-based directional trading on SUI/USDT. Trend-following with volatility scaling.",
    strategyIdPattern: "CEFI_SUI_MOMENTUM_HUF_1H",
    clientId: "delta-one",
    assetClass: "CeFi",
    strategyType: "Momentum",
    archetype: "MOMENTUM",
    executionMode: "HUF",
    status: "live",
    version: "1.0.0",
    deployedAt: "2025-12-10 08:00:00",
    instruments: [
      { key: "BINANCE:PERPETUAL:SUI-USDT", venue: "Binance", type: "Perp", role: "Primary instrument" },
    ],
    featuresConsumed: [
      { name: "momentum_signal", source: "features-momentum", sla: "1m", usedFor: "Trend direction" },
      { name: "volatility", source: "features-volatility", sla: "1m", usedFor: "Position sizing" },
    ],
    dataArchitecture: { rawDataSource: "Exchange WebSocket", processedData: ["momentum", "volatility"], interval: "1H", lowestGranularity: "1H", executionMode: "hold_until_flip" },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "directional_pnl", label: "Momentum P&L", settlementType: "MARK_TO_MARKET", description: "Trend capture", color: "#4ade80" },
        { id: "funding", label: "Funding", settlementType: "FUNDING_8H", description: "Perp funding", color: "#60a5fa" },
        { id: "fees", label: "Fees", settlementType: "PER_FILL", description: "Exchange fees", color: "#ef4444" },
      ],
    },
    riskProfile: { targetReturn: "20-35%", targetSharpe: "1.4+", maxDrawdown: "16%", maxLeverage: "2x", capitalScalability: "$5M" },
    latencyProfile: { dataToSignal: "200ms", signalToInstruction: "20ms", instructionToFill: "500ms", endToEnd: "~1s", coLocationNeeded: false },
    riskSubscriptions: [{ riskType: "delta", subscribed: true, threshold: "Max exposure", action: "Scale down" }],
    testingStatus: [{ stage: "LIVE_REAL", status: "done" }],
    configParams: [{ key: "lookback_period", value: "20", description: "Momentum lookback in bars" }],
    venues: ["BINANCE"],
    performance: { pnlTotal: 195000, pnlMTD: 32000, sharpe: 1.5, maxDrawdown: 14.2, returnPct: 20.8, positions: 1, netExposure: 1200000 },
    sparklineData: [6, 10, 8, 14, 12, 18, 16, 22, 20, 26, 24, 28],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // Sports Market Making (Betfair EPL)
  // ============================================
  {
    id: "SPORTS_BETFAIR_MM_EVT_TICK",
    name: "Betfair EPL Market Making",
    description: "Back/lay quoting on Betfair exchange for EPL matches. Sub-second feature-to-strategy with tick-level rebalancing.",
    strategyIdPattern: "SPORTS_BETFAIR_MM_EVT_TICK",
    clientId: "sports-desk",
    assetClass: "Sports",
    strategyType: "Sports MM",
    archetype: "MARKET_MAKING",
    executionMode: "EVT",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "BETFAIR:EXCHANGE:EPL_MATCH", venue: "Betfair", type: "Exchange Odds", role: "Back/lay quoting" },
    ],
    featuresConsumed: [
      { name: "best_back", source: "features-sports", sla: "100ms", usedFor: "Best available back price" },
      { name: "best_lay", source: "features-sports", sla: "100ms", usedFor: "Best available lay price" },
      { name: "suspension_flag", source: "features-sports", sla: "100ms", usedFor: "Market suspension detection (goal/VAR)" },
      { name: "sharp_calibration", source: "features-sports", sla: "1s", usedFor: "Fair value calibration from sharp books" },
    ],
    dataArchitecture: {
      rawDataSource: "Betfair Streaming API",
      processedData: ["best_back", "best_lay", "suspension_flag", "sharp_calibration"],
      interval: "Tick-driven",
      lowestGranularity: "Sub-second",
      executionMode: "event_driven",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "spread_pnl", label: "Spread P&L", settlementType: "PER_FILL", description: "Captured back-lay spread", color: "#4ade80" },
        { id: "greening_pnl", label: "Greening P&L", settlementType: "REALIZED", description: "Profit locked by greening across outcomes", color: "#22d3ee" },
        { id: "inventory_pnl", label: "Inventory P&L", settlementType: "MARK_TO_MARKET", description: "MTM on unhedged inventory", color: "#60a5fa" },
        { id: "commission", label: "Commission", settlementType: "PER_FILL", description: "Betfair commission on net winnings", color: "#ef4444" },
      ],
      formula: "total_pnl = spread_pnl + greening_pnl + inventory_pnl - commission",
    },
    riskProfile: {
      targetReturn: "20-35%",
      targetSharpe: "3.0+",
      maxDrawdown: "5%",
      maxLeverage: "1x",
      capitalScalability: "$1M per market",
    },
    latencyProfile: {
      dataToSignal: "50ms p50 / 200ms p99",
      signalToInstruction: "10ms p50 / 50ms p99",
      instructionToFill: "100ms p50 / 500ms p99",
      endToEnd: "~160ms p50 / ~750ms p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "suspension", subscribed: true, threshold: "CRITICAL", action: "Pause all quoting on goal/VAR/red card" },
      { riskType: "adverse_selection", subscribed: true, threshold: "Fill rate vs sharp move", action: "Widen spread or pull quotes" },
      { riskType: "inventory", subscribed: true, threshold: "Max exposure across outcomes", action: "Skew quotes to flatten" },
      { riskType: "venue_protocol", subscribed: true, threshold: "API disconnect / rate limit", action: "Cancel all open orders" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "in_progress", notes: "MockBetfairFeed under development" },
      { stage: "HISTORICAL", status: "pending" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "pending" },
    ],
    configParams: [
      { key: "spread_ticks", value: "2", description: "Minimum spread in ticks" },
      { key: "max_exposure_per_outcome", value: "5000", description: "Max GBP per outcome" },
      { key: "greening_threshold_pct", value: "0.8", description: "Green at 80% of target profit" },
      { key: "suspension_cooldown_ms", value: "5000", description: "Wait 5s after suspension lifts" },
    ],
    venues: ["BETFAIR"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["TRADE"],
  },

  // ============================================
  // DeFi Staked Basis (LST + short perp)
  // ============================================
  {
    id: "DEFI_ETH_STAKED_BASIS_SCE_1H",
    name: "ETH Staked Basis (weETH + Short Perp)",
    description: "Long weETH (liquid staking token) for staking yield, short ETH perpetual on Hyperliquid for delta hedge. Captures LST yield + funding rate spread.",
    strategyIdPattern: "DEFI_ETH_STAKED_BASIS_SCE_1H",
    clientId: "delta-one",
    assetClass: "DeFi",
    strategyType: "Staked Basis",
    archetype: "BASIS_TRADE",
    executionMode: "SCE",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "WALLET:LST:WEETH", venue: "Wallet", type: "LST", role: "Staking yield (long leg)" },
      { key: "HYPERLIQUID:PERPETUAL:ETH-USD", venue: "Hyperliquid", type: "Perp", role: "Delta hedge (short leg)" },
    ],
    featuresConsumed: [
      { name: "lst_eth_exchange_rate", source: "features-onchain", sla: "60s", usedFor: "LST appreciation rate, rebalance trigger" },
      { name: "funding_rate", source: "features-delta-one", sla: "10s", usedFor: "Funding yield component" },
      { name: "eth_spot_price", source: "market-tick-data", sla: "1s", usedFor: "Delta calculation, position sizing" },
    ],
    dataArchitecture: {
      rawDataSource: "On-chain + Hyperliquid API",
      processedData: ["lst_eth_exchange_rate", "funding_rate", "eth_spot_price"],
      interval: "Time-driven (candle-based)",
      lowestGranularity: "1H",
      executionMode: "same_candle_exit",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "staking_yield_pnl", label: "Staking Yield", settlementType: "LST_YIELD", description: "weETH exchange rate appreciation", color: "#4ade80" },
        { id: "funding_pnl", label: "Funding P&L", settlementType: "FUNDING_8H", description: "Short perp funding payments received", color: "#60a5fa" },
        { id: "lst_depeg_pnl", label: "LST Depeg P&L", settlementType: "MARK_TO_MARKET", description: "MTM from weETH/ETH peg deviation", color: "#fbbf24" },
        { id: "trading_pnl", label: "Trading P&L", settlementType: "REALIZED", description: "Entry/exit execution P&L", color: "#a78bfa" },
        { id: "fees_gas", label: "Fees & Gas", settlementType: "PER_FILL", description: "DEX swap fees + on-chain gas", color: "#ef4444" },
      ],
      formula: "total_pnl = staking_yield + funding_pnl + lst_depeg_pnl + trading_pnl - fees_gas",
    },
    riskProfile: {
      targetReturn: "10-18%",
      targetSharpe: "2.0+",
      maxDrawdown: "8%",
      maxLeverage: "1x",
      capitalScalability: "$10M",
    },
    latencyProfile: {
      dataToSignal: "1s p50 / 5s p99",
      signalToInstruction: "50ms p50 / 200ms p99",
      instructionToFill: "2s p50 / 15s p99",
      endToEnd: "~3s p50 / ~20s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "delta", subscribed: true, threshold: "2% drift", action: "Adjust perp size to re-hedge" },
      { riskType: "funding", subscribed: true, threshold: "Negative funding sustained >24h", action: "Evaluate exit" },
      { riskType: "protocol_risk", subscribed: true, threshold: "weETH depeg > 2%", action: "Emergency exit LST position" },
      { riskType: "liquidity", subscribed: true, threshold: "weETH DEX liquidity < $1M", action: "Reduce position size" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending" },
      { stage: "HISTORICAL", status: "pending" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "pending" },
    ],
    configParams: [
      { key: "initial_capital", value: "500000", description: "Starting capital in USDT" },
      { key: "min_staking_apy", value: "0.03", description: "Min staking APY to enter" },
      { key: "min_funding_rate", value: "0.0001", description: "Min funding rate threshold" },
      { key: "max_depeg_pct", value: "0.02", description: "Max acceptable depeg before exit" },
      { key: "hedge_ratio", value: "1.0", description: "Delta hedge ratio" },
    ],
    venues: ["WALLET", "HYPERLIQUID"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["SWAP", "TRADE"],
  },

  // ============================================
  // DeFi Aave V3 Pure Supply (USDC)
  // ============================================
  {
    id: "DEFI_AAVE_SUPPLY_USDC_SCE_1H",
    name: "Aave V3 USDC Supply",
    description: "Pure supply of USDC to Aave V3 for lending yield. No perp leg, no leverage. Monitor utilization and APY for optimal capital deployment.",
    strategyIdPattern: "DEFI_AAVE_SUPPLY_USDC_SCE_1H",
    clientId: "defi-desk",
    assetClass: "DeFi",
    strategyType: "Lending",
    archetype: "YIELD",
    executionMode: "SCE",
    status: "development",
    version: "0.1.0",
    instruments: [
      { key: "AAVE_V3:SUPPLY:USDC", venue: "Aave V3", type: "Supply", role: "Supplied USDC earning interest" },
    ],
    featuresConsumed: [
      { name: "aave_supply_apy", source: "features-onchain", sla: "60s", usedFor: "Yield monitoring, entry/exit decision" },
      { name: "aave_utilization", source: "features-onchain", sla: "60s", usedFor: "Pool utilization rate" },
      { name: "liquidity_index", source: "features-onchain", sla: "60s", usedFor: "Interest accrual tracking" },
    ],
    dataArchitecture: {
      rawDataSource: "On-chain (Aave V3 pool)",
      processedData: ["aave_supply_apy", "aave_utilization", "liquidity_index"],
      interval: "Time-driven",
      lowestGranularity: "1H",
      executionMode: "same_candle_exit",
    },
    sorEnabled: false,
    pnlAttribution: {
      components: [
        { id: "interest_accrual", label: "Interest Accrual", settlementType: "AAVE_INDEX", description: "USDC supply interest via liquidity index", color: "#4ade80" },
        { id: "gas", label: "Gas Cost", settlementType: "PER_FILL", description: "Supply/withdraw transaction gas", color: "#ef4444" },
      ],
      formula: "total_pnl = aUSDC_balance * liquidity_index_delta - gas_costs",
    },
    riskProfile: {
      targetReturn: "4-8%",
      targetSharpe: "4.0+",
      maxDrawdown: "1%",
      maxLeverage: "1x",
      capitalScalability: "$50M",
    },
    latencyProfile: {
      dataToSignal: "1s p50 / 5s p99",
      signalToInstruction: "100ms p50 / 500ms p99",
      instructionToFill: "15s p50 / 60s p99",
      endToEnd: "~16s p50 / ~65s p99",
      coLocationNeeded: false,
    },
    riskSubscriptions: [
      { riskType: "protocol_risk", subscribed: true, threshold: "Aave governance / exploit", action: "Withdraw all" },
      { riskType: "liquidity", subscribed: true, threshold: "Utilization > 95% (withdraw queue)", action: "Monitor, reduce if sustained" },
      { riskType: "depeg", subscribed: true, threshold: "USDC depeg > 0.5%", action: "Evaluate exit to diversify stables" },
    ],
    testingStatus: [
      { stage: "MOCK", status: "pending" },
      { stage: "HISTORICAL", status: "pending" },
      { stage: "LIVE_MOCK", status: "pending" },
      { stage: "LIVE_TESTNET", status: "pending" },
      { stage: "STAGING", status: "pending" },
      { stage: "LIVE_REAL", status: "pending" },
    ],
    configParams: [
      { key: "initial_capital", value: "1000000", description: "Starting capital in USDC" },
      { key: "min_supply_apy", value: "0.03", description: "Min 3% APY to stay supplied" },
      { key: "max_utilization", value: "0.95", description: "Withdraw if utilization exceeds 95%" },
      { key: "rebalance_interval_hours", value: "24", description: "Check rebalance every 24h" },
    ],
    venues: ["AAVEV3-ETHEREUM"],
    performance: { pnlTotal: 0, pnlMTD: 0, sharpe: 0, maxDrawdown: 0, returnPct: 0, positions: 0, netExposure: 0 },
    sparklineData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    instructionTypes: ["LEND"],
  },
]
  
  // =============================================================================
  // HELPER FUNCTIONS
// =============================================================================

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find(s => s.id === id)
}

export function getStrategiesByAssetClass(assetClass: Strategy["assetClass"]): Strategy[] {
  return STRATEGIES.filter(s => s.assetClass === assetClass)
}

export function getStrategiesByArchetype(archetype: Strategy["archetype"]): Strategy[] {
  return STRATEGIES.filter(s => s.archetype === archetype)
}

export function getStrategiesByStatus(status: Strategy["status"]): Strategy[] {
  return STRATEGIES.filter(s => s.status === status)
}

export function getStrategiesByVenue(venue: string): Strategy[] {
  return STRATEGIES.filter(s => s.venues.includes(venue))
}

export function getStrategiesByClientId(clientId: string): Strategy[] {
  return STRATEGIES.filter(s => s.clientId === clientId)
}

export function getStrategiesByExecutionMode(mode: Strategy["executionMode"]): Strategy[] {
  return STRATEGIES.filter(s => s.executionMode === mode)
}

export function getTotalAUM(): number {
  return STRATEGIES.reduce((sum, s) => sum + Math.abs(s.performance.netExposure), 0)
}

export function getTotalPnL(): number {
  return STRATEGIES.reduce((sum, s) => sum + s.performance.pnlTotal, 0)
}

export function getTotalMTDPnL(): number {
  return STRATEGIES.reduce((sum, s) => sum + s.performance.pnlMTD, 0)
}

// =============================================================================
// MOCK POSITIONS DATA - Per-strategy positions
// =============================================================================

export interface Position {
  id: string
  strategyId: string
  strategyName: string
  client: string
  underlying: string
  venue: string
  instrument: string
  side: "LONG" | "SHORT"
  size: number
  entryPrice: number
  currentPrice: number
  notional: number
  unrealizedPnL: number
  unrealizedPnLPct: number
  margin: number
  leverage: number
  liquidationPrice?: number
  healthFactor?: number
  ltv?: number
  lastUpdated: string
}

export function generatePositionsForStrategy(strategy: Strategy): Position[] {
  // Generate realistic positions based on strategy instruments
  const positions: Position[] = []
  
  strategy.instruments.forEach((inst, idx) => {
    const isShort = inst.role.toLowerCase().includes("short") || inst.role.toLowerCase().includes("hedge") || inst.role.toLowerCase().includes("debt")
    const baseSize = strategy.performance.netExposure / (strategy.instruments.length * (isShort ? -1 : 1))
    
    // Skip initial capital instruments
    if (inst.role.toLowerCase().includes("initial capital")) return
    
    const entryPrice = inst.type === "Perp" || inst.type === "SPOT_ASSET" ? (inst.key.includes("BTC") ? 67245 : inst.key.includes("ETH") ? 3245 : 1) : 1
    const priceChange = Math.random() * 0.04 - 0.02 // -2% to +2%
    const currentPrice = entryPrice * (1 + priceChange)
    const size = Math.abs(baseSize / entryPrice)
    const notional = size * currentPrice
    const unrealizedPnL = isShort ? (entryPrice - currentPrice) * size : (currentPrice - entryPrice) * size
    
    positions.push({
      id: `pos-${strategy.id}-${idx}`,
      strategyId: strategy.id,
      strategyName: strategy.name,
      client: "Internal",
      underlying: inst.key.includes("BTC") ? "BTC" : inst.key.includes("ETH") ? "ETH" : inst.key.split(":")[2]?.split("-")[0] || "USDT",
      venue: inst.venue,
      instrument: inst.key,
      side: isShort ? "SHORT" : "LONG",
      size: Math.round(size * 1000) / 1000,
      entryPrice,
      currentPrice: Math.round(currentPrice * 100) / 100,
      notional: Math.abs(notional),
      unrealizedPnL: Math.round(unrealizedPnL),
      unrealizedPnLPct: Math.round((unrealizedPnL / Math.abs(baseSize)) * 10000) / 100,
      margin: Math.abs(notional) * (inst.type === "Perp" ? 0.1 : 1),
      leverage: inst.type === "Perp" ? 10 : 1,
      liquidationPrice: isShort ? Math.round(entryPrice * 1.15) : Math.round(entryPrice * 0.85),
      healthFactor: inst.type === "aToken" ? 1.45 : undefined,
      ltv: inst.type === "aToken" ? 0.72 : undefined,
      lastUpdated: `${Math.floor(Math.random() * 10) + 1}s ago`,
    })
  })
  
  return positions
}

export function getAllPositions(): Position[] {
  return STRATEGIES.flatMap(s => generatePositionsForStrategy(s))
}

// =============================================================================
// MOCK P&L BREAKDOWN DATA - Per-strategy granular P&L
// =============================================================================

export interface PnLBreakdownData {
  strategyId: string
  components: {
    componentId: string
    label: string
    value: number
    pct: number
    color: string
    /** Settlement category: REALIZED, UNREALIZED, or RESIDUAL */
    settlementCategory: "REALIZED" | "UNREALIZED" | "RESIDUAL"
  }[]
  total: number
  /** Realized P&L - booked/settled profit/loss */
  realized: number
  /** Unrealized P&L - mark-to-market gains/losses */
  unrealized: number
  /** Residual - unexplained variance between components and total */
  residual: number
}

// Map settlement types to categories
function getSettlementCategory(settlementType: string): "REALIZED" | "UNREALIZED" | "RESIDUAL" {
  const realizedTypes = ["PER_FILL", "PER_TRADE", "FUNDING_8H", "MATCH_SETTLEMENT", "AAVE_INDEX", "MORPHO_INDEX"]
  const unrealizedTypes = ["MARK_TO_MARKET"]
  if (realizedTypes.some(t => settlementType.includes(t))) return "REALIZED"
  if (unrealizedTypes.some(t => settlementType.includes(t))) return "UNREALIZED"
  return "RESIDUAL"
}

export function generatePnLBreakdown(strategy: Strategy): PnLBreakdownData {
  const total = strategy.performance.pnlMTD
  const components = strategy.pnlAttribution.components.map(comp => {
    // Generate realistic breakdown based on strategy type
    let pct: number
    if (comp.id.includes("cost") || comp.id.includes("fee") || comp.id.includes("slippage")) {
      pct = -Math.random() * 15 - 5 // -5% to -20% of total
    } else if (comp.id.includes("funding") || comp.id.includes("spread")) {
      pct = Math.random() * 60 + 30 // 30% to 90% of total
    } else {
      pct = Math.random() * 40 + 10 // 10% to 50%
    }
    
    return {
      componentId: comp.id,
      label: comp.label,
      value: Math.round(total * (pct / 100)),
      pct: Math.round(pct * 10) / 10,
      color: comp.color,
      settlementCategory: getSettlementCategory(comp.settlementType),
    }
  })
  
  // Calculate realized, unrealized, and residual
  const realized = components
    .filter(c => c.settlementCategory === "REALIZED")
    .reduce((sum, c) => sum + c.value, 0)
  const unrealized = components
    .filter(c => c.settlementCategory === "UNREALIZED")
    .reduce((sum, c) => sum + c.value, 0)
  
  // Residual is the unexplained variance
  const componentSum = components.reduce((sum, c) => sum + c.value, 0)
  const residual = total - componentSum
  
  // Add residual as a component if significant (>1% of total)
  if (Math.abs(residual) > Math.abs(total * 0.01)) {
    components.push({
      componentId: "residual",
      label: "Residual / Unexplained",
      value: residual,
      pct: Math.round((residual / total) * 1000) / 10,
      color: "#6b7280", // gray
      settlementCategory: "RESIDUAL",
    })
  }
  
  return {
    strategyId: strategy.id,
    components,
    total,
    realized,
    unrealized,
    residual,
  }
}
