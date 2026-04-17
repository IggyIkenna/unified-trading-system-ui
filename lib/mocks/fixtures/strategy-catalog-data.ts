// =============================================================================
// Strategy Catalog — Comprehensive mock data for all 53 strategies
// Realistic performance metrics, risk parameters, money ops, and readiness
// =============================================================================

// ---------------------------------------------------------------------------
// Shared colour maps (re-exported for UI convenience)
// ---------------------------------------------------------------------------

export type StrategyCategory = "DEFI" | "CEFI" | "TRADFI" | "SPORTS" | "PREDICTION";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type ReadinessStatus = "RESEARCH" | "BACKTEST" | "PAPER" | "STAGING" | "LIVE" | "SUSPENDED";

export const CATEGORY_COLORS: Record<StrategyCategory, string> = {
  DEFI: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  CEFI: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  TRADFI: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SPORTS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  PREDICTION: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  VERY_HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const STATUS_COLORS: Record<ReadinessStatus, string> = {
  LIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  STAGING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  PAPER: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACKTEST: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  RESEARCH: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  SUSPENDED: "bg-red-500/15 text-red-400 border-red-500/30",
};

// ---------------------------------------------------------------------------
// Full interface
// ---------------------------------------------------------------------------

export interface StrategyCatalogEntry {
  // Identity
  strategy_id: string;
  name: string;
  category: StrategyCategory;
  family: string;
  subcategory: string;
  description: string;
  how_it_works: string;

  // Performance (backtest estimates)
  performance: {
    target_apy_range: [number, number];
    expected_sharpe: number;
    max_drawdown_pct: number;
    calmar_ratio: number;
    win_rate_pct: number;
    avg_trade_duration: string;
    backtest_period: string;
    monthly_returns: number[];
    benchmark: string;
  };

  // Risk Management
  risk: {
    risk_level: RiskLevel;
    max_position_usd: number;
    max_leverage: number;
    stop_loss_pct: number | null;
    circuit_breakers: string[];
    liquidation_protection: string | null;
    correlation_to_btc: number;
    tail_risk: string;
  };

  // Money Operations
  money_ops: {
    min_deposit_usd: number;
    recommended_deposit_usd: number;
    deposit_currency: string[];
    treasury_wallet: string;
    trading_wallet: string;
    auto_rebalance: boolean;
    rebalance_frequency: string;
    rebalance_buffer_pct: number;
    withdrawal_notice: string;
    fee_structure: string;
    gas_budget_pct: number;
  };

  // Configuration & Deployment
  config: {
    timeframe: string;
    venues: string[];
    chains: string[];
    instruments: string[];
    execution_mode: "BATCH" | "LIVE" | "BOTH";
    deployment_type: string;
    scaling: string;
    config_hot_reload: boolean;
    schema_version: string;
  };

  // Readiness
  readiness: {
    code: "C0" | "C1" | "C2" | "C3" | "C4" | "C5";
    deployment: "D0" | "D1" | "D2" | "D3" | "D4" | "D5" | "none";
    business: "B0" | "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "none";
    status: ReadinessStatus;
    estimated_launch: string | null;
    blockers: string[];
  };

  // Security & Disaster Recovery
  security: {
    custody: string;
    key_management: string;
    audit_trail: boolean;
    disaster_recovery: string;
    insurance: string | null;
  };

  // Venue Coverage
  venue_coverage: {
    primary_venues: string[];
    backup_venues: string[];
    data_sources: string[];
  };
}

// =============================================================================
// DeFi Strategies (19)
// =============================================================================

const DEFI_STRATEGIES: StrategyCatalogEntry[] = [
  {
    strategy_id: "DEFI_BASIS_ETH_1H",
    name: "ETH Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "ETH",
    description:
      "Captures the spread between ETH spot price and perpetual futures funding rate on DeFi venues. Delta-neutral by construction, earning yield from funding payments while maintaining hedged exposure.",
    how_it_works:
      "The strategy simultaneously buys ETH on a spot/lending protocol and shorts an equivalent amount via perpetual futures on Hyperliquid. When funding rates are positive (longs pay shorts), the strategy collects funding payments every hour. When rates turn negative, the strategy can unwind or reverse. The 1H timeframe checks and rebalances positions hourly to maintain delta neutrality.",
    performance: {
      target_apy_range: [8, 15],
      expected_sharpe: 2.1,
      max_drawdown_pct: 3.5,
      calmar_ratio: 3.1,
      win_rate_pct: 68,
      avg_trade_duration: "4-8 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [1.2, 0.9, 1.4, -0.3, 1.1, 0.8, 1.5, 1.0, -0.5, 1.3, 0.7, 1.1],
      benchmark: "Risk-free rate (SOFR)",
    },
    risk: {
      risk_level: "LOW",
      max_position_usd: 2000000,
      max_leverage: 2.0,
      stop_loss_pct: 3.0,
      circuit_breakers: [
        "Funding rate inversion > 4 consecutive periods",
        "Max drawdown 5%",
        "Basis spread compression below 2bps",
      ],
      liquidation_protection: "Defensive exit at margin ratio 150%, emergency at 120%",
      correlation_to_btc: 0.05,
      tail_risk: "Smart contract exploit on lending protocol or venue insolvency. Basis can temporarily invert during market stress, causing mark-to-market drawdown.",
    },
    money_ops: {
      min_deposit_usd: 50000,
      recommended_deposit_usd: 250000,
      deposit_currency: ["USDT", "USDC", "ETH"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Hot wallet (venue-managed)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H",
      rebalance_buffer_pct: 5,
      withdrawal_notice: "T+0 for stablecoins, T+1 for locked positions",
      fee_structure: "2/20 (2% mgmt, 20% perf above HWM)",
      gas_budget_pct: 0.5,
    },
    config: {
      timeframe: "1H",
      venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-PERP", "ETH-SPOT", "ETH-AAVE"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance per venue pair",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C5",
      deployment: "D5",
      business: "B5",
      status: "LIVE",
      estimated_launch: null,
      blockers: [],
    },
    security: {
      custody: "Copper MPC",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Position state in GCS, auto-resume on restart",
      insurance: "Copper custody insurance up to $50M aggregate",
    },
    venue_coverage: {
      primary_venues: ["HYPERLIQUID"],
      backup_venues: ["BINANCE", "OKX"],
      data_sources: ["MTDS WebSocket", "Hyperliquid REST"],
    },
  },
  {
    strategy_id: "DEFI_STAKED_BASIS_ETH_1H",
    name: "ETH Staked Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "ETH",
    description:
      "Enhanced basis trade that uses staked ETH (stETH/wstETH) as collateral, earning staking yield on top of the funding rate spread. Triple yield: staking APR + funding + basis convergence.",
    how_it_works:
      "Instead of holding plain ETH as the spot leg, this strategy deposits ETH into Lido to receive stETH, then uses wstETH as collateral on Aave. The strategy borrows against this position and shorts ETH-PERP on Hyperliquid. This earns staking rewards (~3-4% APR) on top of the funding rate spread. The 1H rebalance keeps the health factor above safety thresholds.",
    performance: {
      target_apy_range: [11, 19],
      expected_sharpe: 2.3,
      max_drawdown_pct: 4.2,
      calmar_ratio: 3.5,
      win_rate_pct: 71,
      avg_trade_duration: "8-24 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [1.5, 1.2, 1.8, -0.2, 1.4, 1.0, 1.9, 1.3, -0.4, 1.6, 1.1, 1.4],
      benchmark: "ETH staking yield",
    },
    risk: {
      risk_level: "LOW",
      max_position_usd: 1500000,
      max_leverage: 2.5,
      stop_loss_pct: 4.0,
      circuit_breakers: ["Health factor < 1.3", "stETH depeg > 1%", "Max drawdown 6%", "Funding rate inversion > 6 periods"],
      liquidation_protection: "Defensive exit at HF 1.3, emergency at HF 1.1",
      correlation_to_btc: 0.08,
      tail_risk: "stETH depeg event could trigger cascading liquidations. Smart contract risk across Lido + Aave + venue.",
    },
    money_ops: {
      min_deposit_usd: 75000,
      recommended_deposit_usd: 300000,
      deposit_currency: ["ETH", "USDC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Self-custody (multisig)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H",
      rebalance_buffer_pct: 8,
      withdrawal_notice: "T+0 for stablecoins, T+1 for staked positions (unstaking queue)",
      fee_structure: "2/20 (2% mgmt, 20% perf above HWM)",
      gas_budget_pct: 0.8,
    },
    config: {
      timeframe: "1H",
      venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM", "LIDO"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-PERP", "wstETH", "stETH", "ETH-AAVE"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C5",
      deployment: "D4",
      business: "B4",
      status: "STAGING",
      estimated_launch: "Q2 2026",
      blockers: ["stETH depeg monitoring integration pending"],
    },
    security: {
      custody: "Copper MPC + Self-custody multisig",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Position state in GCS, health factor monitoring with auto-deleverage",
      insurance: "Copper custody insurance",
    },
    venue_coverage: {
      primary_venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"],
      backup_venues: ["BINANCE"],
      data_sources: ["MTDS WebSocket", "Lido API", "Aave on-chain"],
    },
  },
  {
    strategy_id: "DEFI_RECURSIVE_BASIS_ETH_1H",
    name: "ETH Recursive Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "ETH",
    description:
      "Leveraged basis trade using recursive borrowing on Aave. Deposits ETH, borrows stablecoins, re-deposits, and shorts perps. Amplifies basis yield through capital-efficient looping.",
    how_it_works:
      "The strategy deposits ETH collateral on Aave, borrows USDC, converts back to ETH, and re-deposits in a loop (typically 2-3 iterations). This creates leveraged long ETH exposure which is fully hedged by shorting ETH-PERP. The result is amplified funding rate capture at the cost of higher gas fees and tighter health factor management. Flash loans optimize the loop entry/exit to a single transaction.",
    performance: {
      target_apy_range: [15, 28],
      expected_sharpe: 1.8,
      max_drawdown_pct: 6.5,
      calmar_ratio: 2.8,
      win_rate_pct: 65,
      avg_trade_duration: "12-48 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [2.2, 1.5, 2.8, -1.1, 2.0, 1.3, 2.5, 1.8, -1.5, 2.3, 1.2, 1.9],
      benchmark: "ETH basis trade (non-recursive)",
    },
    risk: {
      risk_level: "MEDIUM",
      max_position_usd: 1000000,
      max_leverage: 4.0,
      stop_loss_pct: 5.0,
      circuit_breakers: [
        "Health factor < 1.25",
        "Max drawdown 8%",
        "Gas cost > 2% of position per rebalance",
        "Funding rate inversion > 3 periods",
      ],
      liquidation_protection: "Flash loan emergency unwind at HF 1.15",
      correlation_to_btc: 0.1,
      tail_risk: "Cascading liquidation in high-gas environment where flash loan unwind becomes prohibitively expensive. Smart contract risk compounded across multiple protocol interactions.",
    },
    money_ops: {
      min_deposit_usd: 100000,
      recommended_deposit_usd: 500000,
      deposit_currency: ["ETH", "USDC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Self-custody (flash loan receiver contract)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H",
      rebalance_buffer_pct: 10,
      withdrawal_notice: "T+0 via flash loan unwind",
      fee_structure: "2/20 (2% mgmt, 20% perf above HWM)",
      gas_budget_pct: 2.0,
    },
    config: {
      timeframe: "1H",
      venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-PERP", "ETH-AAVE", "USDC-AAVE", "FLASH_LOAN"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C4",
      deployment: "D3",
      business: "B3",
      status: "PAPER",
      estimated_launch: "Q2 2026",
      blockers: ["Flash loan receiver contract audit pending", "Gas optimization pass needed"],
    },
    security: {
      custody: "Copper MPC + Flash loan receiver contract",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Emergency flash loan unwind, position state in GCS",
      insurance: null,
    },
    venue_coverage: {
      primary_venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"],
      backup_venues: [],
      data_sources: ["MTDS WebSocket", "Aave on-chain", "Gas oracle"],
    },
  },
  {
    strategy_id: "DEFI_ENHANCED_BASIS_ETH_1H",
    name: "ETH Enhanced Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "ETH",
    description:
      "ML-enhanced basis trade that uses predictive models to time entry/exit around funding rate cycles. Combines the base basis trade with signals from funding rate forecasting and volatility regime detection.",
    how_it_works:
      "Builds on the standard ETH basis trade but adds an ML layer that predicts funding rate direction over the next 1-4 hours. When the model predicts high positive funding, the strategy increases position size. When negative funding is predicted, it reduces exposure or steps aside. A volatility regime classifier also adjusts position sizing based on market conditions. The ML models are retrained weekly on rolling 90-day windows.",
    performance: {
      target_apy_range: [12, 22],
      expected_sharpe: 2.4,
      max_drawdown_pct: 4.8,
      calmar_ratio: 3.3,
      win_rate_pct: 72,
      avg_trade_duration: "2-12 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [1.8, 1.3, 2.1, -0.5, 1.6, 1.1, 2.2, 1.5, -0.8, 1.9, 1.0, 1.7],
      benchmark: "ETH basis trade (non-ML)",
    },
    risk: {
      risk_level: "LOW",
      max_position_usd: 1500000,
      max_leverage: 2.5,
      stop_loss_pct: 4.0,
      circuit_breakers: ["ML model confidence < 60%", "Max drawdown 6%", "Funding rate prediction RMSE > 2x baseline"],
      liquidation_protection: "Defensive exit at margin ratio 150%",
      correlation_to_btc: 0.07,
      tail_risk: "Model degradation during unprecedented market regimes. Same smart contract and venue risks as base basis trade.",
    },
    money_ops: {
      min_deposit_usd: 75000,
      recommended_deposit_usd: 350000,
      deposit_currency: ["USDT", "USDC", "ETH"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Hot wallet (venue-managed)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H (ML-triggered adjustments between)",
      rebalance_buffer_pct: 5,
      withdrawal_notice: "T+0 for stablecoins",
      fee_structure: "2/20 (2% mgmt, 20% perf above HWM)",
      gas_budget_pct: 0.5,
    },
    config: {
      timeframe: "1H",
      venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-PERP", "ETH-SPOT", "ETH-AAVE"],
      execution_mode: "BOTH",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance + ML inference sidecar",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C4",
      deployment: "D3",
      business: "B3",
      status: "PAPER",
      estimated_launch: "Q3 2026",
      blockers: ["ML model validation on live data pending", "Backtest-to-live drift analysis needed"],
    },
    security: {
      custody: "Copper MPC",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Position state in GCS, model artifacts versioned in GCS",
      insurance: "Copper custody insurance",
    },
    venue_coverage: {
      primary_venues: ["HYPERLIQUID"],
      backup_venues: ["BINANCE", "OKX"],
      data_sources: ["MTDS WebSocket", "Hyperliquid REST", "ML inference service"],
    },
  },
  {
    strategy_id: "DEFI_LENDING_AAVE_1H",
    name: "Aave Lending Optimizer",
    category: "DEFI",
    family: "Lending",
    subcategory: "ETH",
    description:
      "Dynamically optimizes lending positions across Aave V3 markets, rotating between assets based on utilization rates and supply/borrow APY differentials. Supply-only, no borrowing, minimal risk.",
    how_it_works:
      "The strategy monitors utilization rates across all Aave V3 markets on Ethereum. When a market's supply APY exceeds the threshold (currently >3%), it allocates capital. It continuously rebalances between USDC, ETH, and WBTC supply positions based on predicted yield curves. The strategy never borrows, making it extremely low risk. Rebalancing occurs hourly with gas-cost-aware thresholds.",
    performance: {
      target_apy_range: [3, 8],
      expected_sharpe: 3.2,
      max_drawdown_pct: 1.2,
      calmar_ratio: 5.0,
      win_rate_pct: 89,
      avg_trade_duration: "1-7 days",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [0.4, 0.5, 0.6, 0.3, 0.5, 0.7, 0.8, 0.4, 0.3, 0.6, 0.5, 0.4],
      benchmark: "Aave USDC supply rate",
    },
    risk: {
      risk_level: "LOW",
      max_position_usd: 5000000,
      max_leverage: 1.0,
      stop_loss_pct: null,
      circuit_breakers: ["Protocol TVL drop > 20% in 24H", "Supply APY < 1% across all markets", "Gas cost > yield for rebalance"],
      liquidation_protection: null,
      correlation_to_btc: 0.02,
      tail_risk: "Smart contract exploit on Aave V3. Governance attack changing protocol parameters. Oracle manipulation affecting interest rate models.",
    },
    money_ops: {
      min_deposit_usd: 25000,
      recommended_deposit_usd: 500000,
      deposit_currency: ["USDC", "USDT", "ETH", "WBTC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Self-custody (multisig)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H (gas-cost aware)",
      rebalance_buffer_pct: 3,
      withdrawal_notice: "T+0 (subject to Aave liquidity)",
      fee_structure: "1/10 (1% mgmt, 10% perf above risk-free)",
      gas_budget_pct: 0.3,
    },
    config: {
      timeframe: "1H",
      venues: ["AAVEV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["USDC-AAVE", "ETH-AAVE", "WBTC-AAVE"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C5",
      deployment: "D5",
      business: "B5",
      status: "LIVE",
      estimated_launch: null,
      blockers: [],
    },
    security: {
      custody: "Copper MPC + Self-custody multisig",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Position state in GCS, emergency withdrawal via multisig",
      insurance: "Copper custody insurance + Aave Safety Module coverage",
    },
    venue_coverage: {
      primary_venues: ["AAVEV3-ETHEREUM"],
      backup_venues: [],
      data_sources: ["Aave on-chain events", "MTDS"],
    },
  },
  {
    strategy_id: "DEFI_ETHENA_BENCHMARK_1H",
    name: "Ethena Benchmark Yield",
    category: "DEFI",
    family: "Yield",
    subcategory: "ETH",
    description:
      "Benchmarks against Ethena's sUSDe yield by replicating the delta-neutral stablecoin strategy with optimized venue selection and timing. Aims to match or exceed Ethena's APY with better transparency.",
    how_it_works:
      "Ethena earns yield by holding staked ETH and shorting ETH perpetuals, pocketing both the staking yield and the funding rate. This strategy replicates that approach but with dynamic venue selection across Hyperliquid, Binance, and OKX to capture the best funding rates. It also times entries and exits around funding rate cycles rather than maintaining constant exposure.",
    performance: {
      target_apy_range: [10, 25],
      expected_sharpe: 2.0,
      max_drawdown_pct: 5.0,
      calmar_ratio: 3.0,
      win_rate_pct: 67,
      avg_trade_duration: "4-24 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [1.5, 1.0, 2.0, -0.8, 1.3, 0.9, 2.1, 1.4, -0.6, 1.7, 1.1, 1.5],
      benchmark: "Ethena sUSDe APY",
    },
    risk: {
      risk_level: "LOW",
      max_position_usd: 3000000,
      max_leverage: 2.0,
      stop_loss_pct: 3.5,
      circuit_breakers: ["Funding rate inversion > 8 hours", "Max drawdown 6%", "Venue funding divergence > 5%"],
      liquidation_protection: "Defensive exit at margin ratio 160%",
      correlation_to_btc: 0.04,
      tail_risk: "Extended negative funding period (bear market). Venue insolvency risk diversified across 3 venues.",
    },
    money_ops: {
      min_deposit_usd: 100000,
      recommended_deposit_usd: 500000,
      deposit_currency: ["USDT", "USDC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Hot wallet (multi-venue)",
      auto_rebalance: true,
      rebalance_frequency: "Every 1H",
      rebalance_buffer_pct: 5,
      withdrawal_notice: "T+0 for stablecoins",
      fee_structure: "2/20 (2% mgmt, 20% perf above HWM)",
      gas_budget_pct: 0.4,
    },
    config: {
      timeframe: "1H",
      venues: ["HYPERLIQUID", "BINANCE", "OKX"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-PERP", "stETH", "wstETH"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance (multi-venue SOR)",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C5",
      deployment: "D4",
      business: "B4",
      status: "STAGING",
      estimated_launch: "Q2 2026",
      blockers: ["Multi-venue SOR latency optimization"],
    },
    security: {
      custody: "Copper MPC",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "Position state in GCS, multi-venue emergency unwind",
      insurance: "Copper custody insurance",
    },
    venue_coverage: {
      primary_venues: ["HYPERLIQUID", "BINANCE"],
      backup_venues: ["OKX", "BYBIT"],
      data_sources: ["MTDS WebSocket (multi-venue)", "Lido API"],
    },
  },
  {
    strategy_id: "DEFI_AMM_LP_ETH_USDC",
    name: "ETH-USDC AMM LP",
    category: "DEFI",
    family: "AMM LP",
    subcategory: "ETH",
    description:
      "Provides liquidity to the Uniswap V3 ETH-USDC pool with passive range management. Earns trading fees while managing impermanent loss through wide range placement and periodic rebalancing.",
    how_it_works:
      "The strategy deposits ETH and USDC into a Uniswap V3 concentrated liquidity position with a range set around the current price (typically +/- 15%). As the price moves within this range, the position earns swap fees from traders. When the price approaches the range boundary, the strategy rebalances by withdrawing, adjusting the range, and re-depositing.",
    performance: {
      target_apy_range: [5, 20],
      expected_sharpe: 1.3,
      max_drawdown_pct: 12.0,
      calmar_ratio: 1.0,
      win_rate_pct: 55,
      avg_trade_duration: "3-14 days",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [2.0, -1.5, 3.2, -2.1, 1.8, 0.5, 2.8, -0.8, -1.2, 2.5, 1.0, 1.5],
      benchmark: "ETH buy & hold",
    },
    risk: {
      risk_level: "MEDIUM",
      max_position_usd: 1000000,
      max_leverage: 1.0,
      stop_loss_pct: null,
      circuit_breakers: ["Impermanent loss > 8%", "Price outside range for > 24H", "Pool TVL drop > 30%"],
      liquidation_protection: null,
      correlation_to_btc: 0.55,
      tail_risk: "Severe impermanent loss during sharp ETH price movements. Smart contract risk on Uniswap V3.",
    },
    money_ops: {
      min_deposit_usd: 50000,
      recommended_deposit_usd: 200000,
      deposit_currency: ["ETH", "USDC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Self-custody (LP NFT)",
      auto_rebalance: true,
      rebalance_frequency: "On range boundary breach",
      rebalance_buffer_pct: 5,
      withdrawal_notice: "T+0",
      fee_structure: "2/20 (2% mgmt, 20% perf above IL-adjusted benchmark)",
      gas_budget_pct: 1.5,
    },
    config: {
      timeframe: "4H",
      venues: ["UNISWAPV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-USDC-LP", "ETH-SPOT", "USDC"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C5",
      deployment: "D5",
      business: "B4",
      status: "LIVE",
      estimated_launch: null,
      blockers: [],
    },
    security: {
      custody: "Self-custody (LP NFT in multisig)",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "LP position tracked via NFT ID in GCS, emergency withdraw via multisig",
      insurance: null,
    },
    venue_coverage: {
      primary_venues: ["UNISWAPV3-ETHEREUM"],
      backup_venues: [],
      data_sources: ["Uniswap V3 on-chain events", "MTDS"],
    },
  },
  {
    strategy_id: "DEFI_ACTIVE_LP_ETH_USDC",
    name: "ETH-USDC Active LP",
    category: "DEFI",
    family: "AMM LP",
    subcategory: "ETH",
    description:
      "Actively managed concentrated liquidity on Uniswap V3 with tight ranges and frequent rebalancing. Uses volatility forecasting to adjust range width dynamically for maximum fee capture.",
    how_it_works:
      "Unlike the passive LP strategy, this actively manages the range width using a volatility model. In low-vol regimes, it uses tight ranges (+/- 3%) for maximum fee capture. In high-vol regimes, it widens to +/- 20% or exits entirely. An ML model predicts short-term volatility to pre-emptively adjust ranges before large moves.",
    performance: {
      target_apy_range: [15, 40],
      expected_sharpe: 1.6,
      max_drawdown_pct: 10.0,
      calmar_ratio: 2.2,
      win_rate_pct: 62,
      avg_trade_duration: "4-48 hours",
      backtest_period: "2024-01-01 to 2026-04-01",
      monthly_returns: [3.5, -1.0, 4.2, -2.5, 2.8, 1.5, 3.8, -0.5, -1.8, 3.2, 1.8, 2.5],
      benchmark: "Uniswap V3 ETH-USDC passive LP",
    },
    risk: {
      risk_level: "MEDIUM",
      max_position_usd: 750000,
      max_leverage: 1.0,
      stop_loss_pct: 8.0,
      circuit_breakers: ["Impermanent loss > 5%", "Gas cost > 3% of position per rebalance", "Volatility model confidence < 50%"],
      liquidation_protection: null,
      correlation_to_btc: 0.45,
      tail_risk: "High gas costs during congestion eroding returns. Model failure during flash crashes. MEV extraction on rebalance transactions.",
    },
    money_ops: {
      min_deposit_usd: 75000,
      recommended_deposit_usd: 300000,
      deposit_currency: ["ETH", "USDC"],
      treasury_wallet: "Copper MPC Custody",
      trading_wallet: "Self-custody (LP NFT)",
      auto_rebalance: true,
      rebalance_frequency: "Dynamic (volatility-triggered)",
      rebalance_buffer_pct: 3,
      withdrawal_notice: "T+0",
      fee_structure: "2/20 (2% mgmt, 20% perf above passive LP benchmark)",
      gas_budget_pct: 3.0,
    },
    config: {
      timeframe: "1H",
      venues: ["UNISWAPV3-ETHEREUM"],
      chains: ["ETHEREUM"],
      instruments: ["ETH-USDC-LP", "ETH-SPOT", "USDC"],
      execution_mode: "LIVE",
      deployment_type: "GCE VM (tarball)",
      scaling: "Single instance + ML inference sidecar",
      config_hot_reload: true,
      schema_version: "4.2.0",
    },
    readiness: {
      code: "C4",
      deployment: "D3",
      business: "B2",
      status: "BACKTEST",
      estimated_launch: "Q3 2026",
      blockers: ["Volatility model backtest validation", "MEV protection integration"],
    },
    security: {
      custody: "Self-custody (LP NFT in multisig)",
      key_management: "Secret Manager + runtime injection",
      audit_trail: true,
      disaster_recovery: "LP position tracked via NFT ID, emergency withdraw via multisig",
      insurance: null,
    },
    venue_coverage: {
      primary_venues: ["UNISWAPV3-ETHEREUM"],
      backup_venues: [],
      data_sources: ["Uniswap V3 on-chain events", "MTDS", "ML inference service"],
    },
  },
  {
    strategy_id: "DEFI_BTC_BASIS_1H",
    name: "BTC Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "BTC",
    description: "Bitcoin basis trade capturing funding rate spread between WBTC collateral on Aave and BTC-PERP shorts on Hyperliquid. BTC typically has lower but more stable funding rates than ETH.",
    how_it_works: "Deposits WBTC as collateral on Aave V3 (supply-only). Simultaneously shorts BTC-PERP on Hyperliquid to create a delta-neutral position. Collects positive funding rates from shorts while earning minimal supply APY on Aave.",
    performance: { target_apy_range: [6, 12], expected_sharpe: 2.0, max_drawdown_pct: 3.0, calmar_ratio: 2.8, win_rate_pct: 66, avg_trade_duration: "4-12 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [0.9, 0.7, 1.1, -0.2, 0.8, 0.6, 1.2, 0.8, -0.4, 1.0, 0.6, 0.9], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "LOW", max_position_usd: 3000000, max_leverage: 2.0, stop_loss_pct: 2.5, circuit_breakers: ["Funding rate inversion > 4 periods", "Max drawdown 4%", "WBTC depeg > 0.5%"], liquidation_protection: "Defensive exit at margin ratio 150%", correlation_to_btc: 0.03, tail_risk: "WBTC depeg or custodial failure. Extended negative BTC funding during bear markets." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["WBTC", "USDC", "USDT"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (venue-managed)", auto_rebalance: true, rebalance_frequency: "Every 1H", rebalance_buffer_pct: 5, withdrawal_notice: "T+0 for stablecoins, T+1 for WBTC", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.4 },
    config: { timeframe: "1H", venues: ["HYPERLIQUID", "AAVEV3-ETHEREUM"], chains: ["ETHEREUM"], instruments: ["BTC-PERP", "WBTC-AAVE"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, auto-resume on restart", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["HYPERLIQUID"], backup_venues: ["BINANCE", "OKX"], data_sources: ["MTDS WebSocket", "Hyperliquid REST"] },
  },
  {
    strategy_id: "DEFI_BTC_LENDING_1H",
    name: "BTC Lending Optimizer",
    category: "DEFI",
    family: "Lending",
    subcategory: "BTC",
    description: "Optimizes WBTC lending across Aave V3 and Morpho markets on Ethereum, dynamically shifting capital to the highest-yielding market. Supply-only, no borrowing.",
    how_it_works: "Monitors WBTC supply APY across Aave V3 and Morpho Blue vaults. When the yield differential exceeds the gas cost of rebalancing (typically >0.5% APY difference), it migrates capital to the higher-yielding protocol.",
    performance: { target_apy_range: [2, 6], expected_sharpe: 3.5, max_drawdown_pct: 0.8, calmar_ratio: 5.5, win_rate_pct: 92, avg_trade_duration: "2-14 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [0.3, 0.4, 0.5, 0.2, 0.3, 0.4, 0.6, 0.3, 0.2, 0.4, 0.3, 0.3], benchmark: "Aave WBTC supply rate" },
    risk: { risk_level: "LOW", max_position_usd: 5000000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Protocol TVL drop > 25% in 24H", "Supply APY < 0.5% across all markets"], liquidation_protection: null, correlation_to_btc: 0.01, tail_risk: "Smart contract exploit on Aave or Morpho. WBTC custodial failure." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 500000, deposit_currency: ["WBTC", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (multisig)", auto_rebalance: true, rebalance_frequency: "Every 4H (gas-cost aware)", rebalance_buffer_pct: 3, withdrawal_notice: "T+0 (subject to protocol liquidity)", fee_structure: "1/10 (1% mgmt, 10% perf above risk-free)", gas_budget_pct: 0.2 },
    config: { timeframe: "1H", venues: ["AAVEV3-ETHEREUM", "MORPHO-ETHEREUM"], chains: ["ETHEREUM"], instruments: ["WBTC-AAVE", "WBTC-MORPHO"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D4", business: "B4", status: "STAGING", estimated_launch: "Q2 2026", blockers: ["Morpho Blue vault integration testing"] },
    security: { custody: "Copper MPC + Self-custody multisig", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, emergency withdrawal via multisig", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["AAVEV3-ETHEREUM", "MORPHO-ETHEREUM"], backup_venues: [], data_sources: ["Aave on-chain events", "Morpho on-chain events"] },
  },
  {
    strategy_id: "DEFI_SOL_BASIS_1H",
    name: "SOL Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "SOL",
    description: "Captures funding rate spread on Solana perpetual futures. SOL funding rates tend to be more volatile than ETH/BTC, creating higher peak capture opportunities.",
    how_it_works: "Holds SOL spot (or mSOL/jitoSOL for extra staking yield) while shorting SOL-PERP on Hyperliquid. Uses dynamic position sizing based on funding rate magnitude.",
    performance: { target_apy_range: [10, 22], expected_sharpe: 1.9, max_drawdown_pct: 5.0, calmar_ratio: 2.8, win_rate_pct: 64, avg_trade_duration: "2-8 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.6, 1.0, 2.2, -0.8, 1.5, 0.7, 2.5, 1.2, -1.0, 1.8, 0.9, 1.5], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1000000, max_leverage: 2.5, stop_loss_pct: 4.0, circuit_breakers: ["Funding rate inversion > 3 periods", "Max drawdown 6%", "SOL price drop > 15% in 1H"], liquidation_protection: "Defensive exit at margin ratio 140%", correlation_to_btc: 0.12, tail_risk: "SOL ecosystem-specific events (validator outages, congestion)." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 200000, deposit_currency: ["SOL", "USDC", "USDT"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (venue-managed)", auto_rebalance: true, rebalance_frequency: "Every 1H", rebalance_buffer_pct: 6, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.1 },
    config: { timeframe: "1H", venues: ["HYPERLIQUID"], chains: ["SOLANA"], instruments: ["SOL-PERP", "SOL-SPOT"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, auto-resume on restart", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["HYPERLIQUID"], backup_venues: ["BINANCE"], data_sources: ["MTDS WebSocket", "Hyperliquid REST"] },
  },
  {
    strategy_id: "DEFI_STAKED_BASIS_SOL_1H",
    name: "SOL Staked Basis Trade",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "SOL",
    description: "Enhanced SOL basis trade using liquid staking tokens (jitoSOL/mSOL) as the spot leg. Earns staking yield (~7% APR) plus funding rate capture.",
    how_it_works: "Stakes SOL via Jito or Marinade to receive jitoSOL/mSOL, then holds these LSTs while shorting SOL-PERP on Hyperliquid. SOL staking yields are higher than ETH (~7% vs ~3.5%), making combined yield more attractive.",
    performance: { target_apy_range: [14, 30], expected_sharpe: 2.1, max_drawdown_pct: 5.5, calmar_ratio: 3.2, win_rate_pct: 66, avg_trade_duration: "8-24 hours", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [2.0, 1.5, 2.8, -0.5, 1.8, 1.2, 3.0, 1.6, -0.8, 2.2, 1.3, 2.0], benchmark: "SOL staking yield" },
    risk: { risk_level: "MEDIUM", max_position_usd: 750000, max_leverage: 2.5, stop_loss_pct: 5.0, circuit_breakers: ["LST depeg > 2%", "Max drawdown 7%", "Funding rate inversion > 4 periods", "SOL network outage"], liquidation_protection: "Defensive exit at margin ratio 140%", correlation_to_btc: 0.15, tail_risk: "jitoSOL/mSOL depeg during Solana network stress. Validator slashing." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 250000, deposit_currency: ["SOL", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (Solana multisig)", auto_rebalance: true, rebalance_frequency: "Every 1H", rebalance_buffer_pct: 7, withdrawal_notice: "T+0 for perp side, T+1 for unstaking", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.1 },
    config: { timeframe: "1H", venues: ["HYPERLIQUID", "JITO", "MARINADE"], chains: ["SOLANA"], instruments: ["SOL-PERP", "jitoSOL", "mSOL"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q2 2026", blockers: ["Solana LST integration testing", "jitoSOL price feed validation"] },
    security: { custody: "Copper MPC + Solana multisig", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, emergency unstaking via multisig", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["HYPERLIQUID", "JITO"], backup_venues: ["MARINADE"], data_sources: ["MTDS WebSocket", "Jito API", "Solana RPC"] },
  },
  {
    strategy_id: "DEFI_SOL_LENDING_KAMINO_1H",
    name: "SOL Lending (Kamino)",
    category: "DEFI",
    family: "Lending",
    subcategory: "SOL",
    description: "Optimizes SOL and stablecoin lending across Kamino Finance on Solana. Solana's low gas costs enable frequent rebalancing that would be prohibitive on Ethereum.",
    how_it_works: "Monitors lending rates across Kamino Finance vaults. Allocates capital to the highest-yielding supply positions while respecting concentration limits. Also captures KMNO reward tokens as additional yield.",
    performance: { target_apy_range: [4, 12], expected_sharpe: 2.8, max_drawdown_pct: 1.5, calmar_ratio: 5.0, win_rate_pct: 88, avg_trade_duration: "1-5 days", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [0.6, 0.8, 1.0, 0.4, 0.7, 0.9, 1.2, 0.5, 0.3, 0.8, 0.6, 0.7], benchmark: "Kamino USDC supply rate" },
    risk: { risk_level: "LOW", max_position_usd: 2000000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Protocol TVL drop > 30% in 24H", "Supply APY < 1% across all vaults"], liquidation_protection: null, correlation_to_btc: 0.03, tail_risk: "Kamino smart contract exploit. Solana network congestion preventing withdrawals." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 250000, deposit_currency: ["USDC", "SOL"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (Solana multisig)", auto_rebalance: true, rebalance_frequency: "Every 1H", rebalance_buffer_pct: 2, withdrawal_notice: "T+0", fee_structure: "1/10 (1% mgmt, 10% perf above risk-free)", gas_budget_pct: 0.05 },
    config: { timeframe: "1H", venues: ["KAMINO-SOLANA"], chains: ["SOLANA"], instruments: ["USDC-KAMINO", "SOL-KAMINO", "jitoSOL-KAMINO"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q3 2026", blockers: ["Kamino adapter development", "Solana RPC reliability testing"] },
    security: { custody: "Copper MPC + Solana multisig", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, emergency withdrawal via multisig", insurance: null },
    venue_coverage: { primary_venues: ["KAMINO-SOLANA"], backup_venues: [], data_sources: ["Kamino API", "Solana RPC"] },
  },
  {
    strategy_id: "DEFI_SOL_CONCENTRATED_LP_1H",
    name: "SOL Concentrated LP (Orca)",
    category: "DEFI",
    family: "AMM LP",
    subcategory: "SOL",
    description: "Provides concentrated liquidity on Orca Whirlpools. Solana's low gas costs enable aggressive range management that would be uneconomical on Ethereum.",
    how_it_works: "Deposits SOL and USDC into Orca Whirlpool concentrated liquidity positions. Solana's ~$0.001 transaction costs allow very tight ranges for maximum fee capture with frequent rebalancing.",
    performance: { target_apy_range: [20, 50], expected_sharpe: 1.4, max_drawdown_pct: 15.0, calmar_ratio: 1.8, win_rate_pct: 58, avg_trade_duration: "1-8 hours", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [4.0, -2.0, 5.5, -3.5, 3.2, 1.0, 5.0, -1.5, -2.2, 4.5, 2.0, 3.0], benchmark: "SOL buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 500000, max_leverage: 1.0, stop_loss_pct: 10.0, circuit_breakers: ["Impermanent loss > 8%", "SOL price move > 10% in 1H", "Orca pool TVL drop > 40%"], liquidation_protection: null, correlation_to_btc: 0.5, tail_risk: "Severe impermanent loss during SOL flash crashes. Solana network outage preventing rebalancing." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 150000, deposit_currency: ["SOL", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (Solana multisig)", auto_rebalance: true, rebalance_frequency: "Dynamic (price-triggered, ~every 15M)", rebalance_buffer_pct: 2, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above passive LP benchmark)", gas_budget_pct: 0.1 },
    config: { timeframe: "1H", venues: ["ORCA-SOLANA"], chains: ["SOLANA"], instruments: ["SOL-USDC-WHIRLPOOL"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C2", deployment: "D1", business: "B1", status: "RESEARCH", estimated_launch: "Q4 2026", blockers: ["Orca Whirlpool adapter", "Solana MEV protection research", "On-chain order flow model"] },
    security: { custody: "Copper MPC + Solana multisig", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["ORCA-SOLANA"], backup_venues: [], data_sources: ["Orca on-chain events", "Solana RPC"] },
  },
  {
    strategy_id: "DEFI_MULTICHAIN_LENDING_1H",
    name: "Multi-Chain Lending Optimizer",
    category: "DEFI",
    family: "Lending",
    subcategory: "Multi-Chain",
    description: "Cross-chain lending optimization across Ethereum (Aave, Morpho) and Solana (Kamino). Dynamically allocates stablecoin capital to the highest-yielding market across chains.",
    how_it_works: "Monitors supply rates across Aave V3, Morpho Blue, and Kamino. When yield differentials exceed bridging + gas costs (~0.3%), migrates capital via Circle CCTP. Maintains minimum balances on each chain.",
    performance: { target_apy_range: [5, 12], expected_sharpe: 2.5, max_drawdown_pct: 2.0, calmar_ratio: 4.0, win_rate_pct: 85, avg_trade_duration: "2-10 days", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [0.7, 0.9, 1.1, 0.5, 0.8, 1.0, 1.3, 0.6, 0.4, 0.9, 0.7, 0.8], benchmark: "Best single-chain lending rate" },
    risk: { risk_level: "MEDIUM", max_position_usd: 3000000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Bridge delay > 30 minutes", "Chain-specific TVL drop > 20%", "Bridge exploit detected"], liquidation_protection: null, correlation_to_btc: 0.02, tail_risk: "Bridge exploit. Cross-chain capital locked during bridge downtime. Multi-protocol smart contract risk." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 1000000, deposit_currency: ["USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (per-chain multisigs)", auto_rebalance: true, rebalance_frequency: "Every 1H (cross-chain threshold-based)", rebalance_buffer_pct: 5, withdrawal_notice: "T+0 on resident chain, T+1 for cross-chain", fee_structure: "1.5/15 (1.5% mgmt, 15% perf above best single-chain)", gas_budget_pct: 0.5 },
    config: { timeframe: "1H", venues: ["AAVEV3-ETHEREUM", "MORPHO-ETHEREUM", "KAMINO-SOLANA"], chains: ["ETHEREUM", "SOLANA"], instruments: ["USDC-AAVE", "USDC-MORPHO", "USDC-KAMINO"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance (multi-chain orchestrator)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B1", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["Cross-chain bridge integration", "Multi-chain position reconciliation", "Bridge risk model"] },
    security: { custody: "Copper MPC + per-chain multisigs", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Per-chain position state in GCS, emergency per-chain withdrawal", insurance: "Copper custody insurance (Ethereum side only)" },
    venue_coverage: { primary_venues: ["AAVEV3-ETHEREUM", "KAMINO-SOLANA"], backup_venues: ["MORPHO-ETHEREUM"], data_sources: ["Multi-chain on-chain events", "Bridge status APIs"] },
  },
  {
    strategy_id: "DEFI_CROSS_CHAIN_YIELD_ARB",
    name: "Cross-Chain Yield Arbitrage",
    category: "DEFI",
    family: "Yield",
    subcategory: "Multi-Chain",
    description: "Exploits yield differentials between identical assets across chains. Bridges capital via Circle CCTP when the spread exceeds costs + risk premium.",
    how_it_works: "Continuously monitors yield curves across Ethereum and Solana lending protocols. When the yield differential exceeds bridging costs + risk premium (typically >2% APY), executes a cross-chain migration via Circle CCTP (native USDC bridging).",
    performance: { target_apy_range: [6, 18], expected_sharpe: 1.7, max_drawdown_pct: 3.0, calmar_ratio: 3.5, win_rate_pct: 70, avg_trade_duration: "1-7 days", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [1.2, 0.8, 1.5, -0.3, 1.0, 0.6, 1.8, 1.0, -0.5, 1.3, 0.7, 1.1], benchmark: "Weighted average cross-chain USDC rate" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Bridge delay > 1 hour", "Yield differential compression to < 0.5%", "Bridge exploit alert"], liquidation_protection: null, correlation_to_btc: 0.03, tail_risk: "CCTP bridge delay or failure during yield convergence. Stablecoin depeg on one chain." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 750000, deposit_currency: ["USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (per-chain multisigs)", auto_rebalance: true, rebalance_frequency: "Every 4H (cross-chain threshold-based)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0 on resident chain, T+1 for cross-chain", fee_structure: "1.5/15 (1.5% mgmt, 15% perf above HWM)", gas_budget_pct: 0.3 },
    config: { timeframe: "4H", venues: ["AAVEV3-ETHEREUM", "KAMINO-SOLANA"], chains: ["ETHEREUM", "SOLANA"], instruments: ["USDC-AAVE", "USDC-KAMINO"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C2", deployment: "D1", business: "B1", status: "RESEARCH", estimated_launch: "Q4 2026", blockers: ["CCTP integration", "Cross-chain position reconciliation", "Yield mean-reversion model"] },
    security: { custody: "Copper MPC + per-chain multisigs", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Per-chain position state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["AAVEV3-ETHEREUM", "KAMINO-SOLANA"], backup_venues: [], data_sources: ["Multi-chain on-chain events", "CCTP status API"] },
  },
  {
    strategy_id: "DEFI_L2_BASIS_ARB_1H",
    name: "L2 Basis Arbitrage",
    category: "DEFI",
    family: "Basis Trade",
    subcategory: "Arbitrum",
    description: "Captures basis spread on Arbitrum-native perpetual DEXs while maintaining hedged positions on Ethereum L1. Exploits fee differentials between L1 and L2 venues.",
    how_it_works: "Holds spot positions on Ethereum L1 while shorting perpetuals on Arbitrum-native venues where funding rates tend to be higher due to less efficient markets. Lower gas costs on L2 allow more frequent rebalancing.",
    performance: { target_apy_range: [10, 20], expected_sharpe: 1.8, max_drawdown_pct: 4.5, calmar_ratio: 3.0, win_rate_pct: 65, avg_trade_duration: "4-12 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.4, 1.0, 1.8, -0.5, 1.2, 0.8, 2.0, 1.3, -0.7, 1.5, 0.9, 1.3], benchmark: "Ethereum-only basis trade" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1000000, max_leverage: 2.0, stop_loss_pct: 4.0, circuit_breakers: ["Arbitrum sequencer downtime > 10 minutes", "L1-L2 bridge delay > 30 minutes", "Max drawdown 6%"], liquidation_protection: "Defensive exit on L2 when sequencer health degrades", correlation_to_btc: 0.08, tail_risk: "Arbitrum sequencer failure during volatile market preventing position management on L2." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 300000, deposit_currency: ["ETH", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (venue-managed, L2)", auto_rebalance: true, rebalance_frequency: "Every 1H", rebalance_buffer_pct: 5, withdrawal_notice: "T+0 on L2, T+7 days for L2 to L1 withdrawal", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.3 },
    config: { timeframe: "1H", venues: ["HYPERLIQUID", "GMX-ARBITRUM"], chains: ["ETHEREUM", "ARBITRUM"], instruments: ["ETH-PERP", "ETH-SPOT"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q3 2026", blockers: ["GMX adapter development", "Arbitrum sequencer health monitoring"] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, sequencer-aware emergency unwind", insurance: null },
    venue_coverage: { primary_venues: ["HYPERLIQUID"], backup_venues: ["GMX-ARBITRUM"], data_sources: ["MTDS WebSocket", "Arbitrum RPC", "Sequencer status API"] },
  },
  {
    strategy_id: "DEFI_CROSS_CHAIN_SOR_1H",
    name: "Cross-Chain Smart Order Routing",
    category: "DEFI",
    family: "Yield",
    subcategory: "Multi-Chain",
    description: "Intelligent order routing across DeFi venues on multiple chains, optimizing execution for large orders by splitting across AMMs, aggregators, and lending protocols.",
    how_it_works: "Splits large DeFi orders across multiple venues and chains to minimize price impact. Considers liquidity depth on Uniswap (Ethereum), Orca (Solana), and various aggregators, routing proportionally.",
    performance: { target_apy_range: [3, 8], expected_sharpe: 2.2, max_drawdown_pct: 2.0, calmar_ratio: 2.5, win_rate_pct: 75, avg_trade_duration: "1-6 hours", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [0.5, 0.4, 0.7, 0.2, 0.6, 0.3, 0.8, 0.5, 0.1, 0.6, 0.4, 0.5], benchmark: "Single-venue execution" },
    risk: { risk_level: "LOW", max_position_usd: 5000000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Slippage > 1% on any leg", "Bridge delay > 15 minutes", "Price divergence > 2% across venues"], liquidation_protection: null, correlation_to_btc: 0.01, tail_risk: "Partial execution leaving unhedged cross-chain exposure. Bridge failure mid-execution." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 1000000, deposit_currency: ["USDC", "ETH", "SOL"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (per-chain)", auto_rebalance: true, rebalance_frequency: "On-demand (trade-triggered)", rebalance_buffer_pct: 3, withdrawal_notice: "T+0", fee_structure: "0.1% per routed trade", gas_budget_pct: 0.5 },
    config: { timeframe: "1H", venues: ["UNISWAPV3-ETHEREUM", "ORCA-SOLANA", "AAVEV3-ETHEREUM"], chains: ["ETHEREUM", "SOLANA", "ARBITRUM"], instruments: ["ETH-USDC", "SOL-USDC", "WBTC-USDC"], execution_mode: "LIVE", deployment_type: "Cloud Run", scaling: "Horizontal (per-chain workers)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C2", deployment: "D1", business: "B0", status: "RESEARCH", estimated_launch: "Q1 2027", blockers: ["Multi-chain routing engine", "Cross-chain atomic execution", "Aggregator integrations"] },
    security: { custody: "Copper MPC + per-chain multisigs", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Per-chain position state, partial execution recovery", insurance: null },
    venue_coverage: { primary_venues: ["UNISWAPV3-ETHEREUM", "ORCA-SOLANA"], backup_venues: ["1INCH-ETHEREUM", "JUPITER-SOLANA"], data_sources: ["Multi-chain on-chain events", "Aggregator APIs"] },
  },
  {
    strategy_id: "DEFI_LIQUIDATION_CAPTURE_ETH",
    name: "ETH Liquidation Capture",
    category: "DEFI",
    family: "Liquidation",
    subcategory: "ETH",
    description: "Monitors Aave V3 and Compound positions approaching liquidation and executes profitable liquidations via flash loans. Earns the liquidation bonus (5-10%) minus gas costs.",
    how_it_works: "Continuously monitors all borrowing positions on Aave V3 and Compound. When a position drops below the liquidation threshold (HF < 1.0), executes a flash loan to liquidate the position, receiving collateral at a discount. Zero upfront capital required.",
    performance: { target_apy_range: [15, 60], expected_sharpe: 1.2, max_drawdown_pct: 8.0, calmar_ratio: 3.5, win_rate_pct: 45, avg_trade_duration: "< 1 minute (atomic)", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [0.0, 0.0, 8.5, 0.0, 0.0, -0.5, 0.0, 12.0, 0.0, 0.0, -0.3, 5.2], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 500000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Gas cost > 50% of liquidation bonus", "Failed liquidation rate > 30%", "Flash loan revert rate > 10%"], liquidation_protection: null, correlation_to_btc: 0.3, tail_risk: "Competitor frontrunning via MEV. Gas price spikes making liquidations unprofitable." },
    money_ops: { min_deposit_usd: 10000, recommended_deposit_usd: 100000, deposit_currency: ["ETH"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (liquidation bot wallet)", auto_rebalance: false, rebalance_frequency: "N/A (event-driven)", rebalance_buffer_pct: 0, withdrawal_notice: "T+0", fee_structure: "0/50 (0% mgmt, 50% profit share)", gas_budget_pct: 5.0 },
    config: { timeframe: "Block-by-block", venues: ["AAVEV3-ETHEREUM", "COMPOUND-ETHEREUM"], chains: ["ETHEREUM"], instruments: ["ETH-AAVE", "WBTC-AAVE", "USDC-AAVE", "FLASH_LOAN"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball) + Flashbots relay", scaling: "Single instance (latency-sensitive)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B1", status: "BACKTEST", estimated_launch: "Q3 2026", blockers: ["Flashbots integration", "MEV protection strategy", "Gas optimization"] },
    security: { custody: "Self-custody (dedicated bot wallet)", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Atomic transactions (no partial state), gas monitoring dashboard", insurance: null },
    venue_coverage: { primary_venues: ["AAVEV3-ETHEREUM"], backup_venues: ["COMPOUND-ETHEREUM"], data_sources: ["Ethereum mempool", "Aave on-chain events", "Gas oracle"] },
  },
];

// =============================================================================
// CeFi Strategies (10)
// =============================================================================

const CEFI_STRATEGIES: StrategyCatalogEntry[] = [
  {
    strategy_id: "CEFI_MOMENTUM_BTC_5M",
    name: "BTC Momentum (5M)",
    category: "CEFI",
    family: "Momentum",
    subcategory: "BTC",
    description: "High-frequency momentum strategy on BTC perpetual futures. Uses 5-minute bars to capture short-term price trends driven by order flow and volume imbalances.",
    how_it_works: "Analyzes 5-minute price bars for trend continuation signals using EMA crossovers, RSI momentum, and volume-weighted price action. Position sizing scales with signal strength. Fully automated 24/7 with hard risk limits.",
    performance: { target_apy_range: [20, 45], expected_sharpe: 1.5, max_drawdown_pct: 12.0, calmar_ratio: 2.2, win_rate_pct: 52, avg_trade_duration: "15-45 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.5, -1.2, 5.0, -2.8, 4.2, 1.5, 6.0, -3.0, -1.5, 4.8, 2.0, 3.5], benchmark: "BTC buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 1000000, max_leverage: 5.0, stop_loss_pct: 2.0, circuit_breakers: ["Max drawdown 15%", "3 consecutive losing days", "Exchange API latency > 500ms"], liquidation_protection: "Hard stop-loss at 2% per trade, max leverage 5x", correlation_to_btc: 0.65, tail_risk: "Flash crash exceeding stop-loss (gap risk). Extended choppy market eroding edge." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Continuous (every 5M bar)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0 for margin, T+1 for full withdrawal", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["BINANCE", "OKX"], chains: [], instruments: ["BTC-PERP", "BTC-USDT-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance per venue", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, auto-resume on restart, max position limits", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX", "BYBIT"], data_sources: ["MTDS WebSocket (Binance)", "MTDS WebSocket (OKX)"] },
  },
  {
    strategy_id: "CEFI_MOMENTUM_ETH_5M",
    name: "ETH Momentum (5M)",
    category: "CEFI",
    family: "Momentum",
    subcategory: "ETH",
    description: "High-frequency ETH momentum strategy. ETH tends to show stronger momentum during DeFi-driven volatility events, with tighter stops for higher intraday volatility.",
    how_it_works: "Same core momentum engine as BTC but with ETH-specific calibrations: tighter stops, adjusted thresholds for ETH's correlation to BTC, and additional signals from gas prices and DeFi TVL changes.",
    performance: { target_apy_range: [18, 40], expected_sharpe: 1.4, max_drawdown_pct: 14.0, calmar_ratio: 1.9, win_rate_pct: 51, avg_trade_duration: "15-60 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.0, -1.8, 4.5, -3.2, 3.8, 1.0, 5.5, -2.5, -2.0, 4.2, 1.5, 3.0], benchmark: "ETH buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 800000, max_leverage: 5.0, stop_loss_pct: 2.5, circuit_breakers: ["Max drawdown 18%", "3 consecutive losing days", "ETH gas > 200 gwei"], liquidation_protection: "Hard stop-loss at 2.5% per trade", correlation_to_btc: 0.72, tail_risk: "ETH-specific flash crash (DeFi cascade). Higher intraday vol vs BTC." },
    money_ops: { min_deposit_usd: 75000, recommended_deposit_usd: 400000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Continuous (every 5M bar)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["BINANCE", "OKX"], chains: [], instruments: ["ETH-PERP", "ETH-USDT-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance per venue", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, auto-resume on restart", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX", "BYBIT"], data_sources: ["MTDS WebSocket"] },
  },
  {
    strategy_id: "CEFI_MOMENTUM_SOL_5M",
    name: "SOL Momentum (5M)",
    category: "CEFI",
    family: "Momentum",
    subcategory: "SOL",
    description: "SOL-focused momentum on CeFi perpetual futures. SOL exhibits stronger momentum than BTC/ETH due to smaller market cap and higher retail participation.",
    how_it_works: "Applies momentum framework to SOL-PERP with wider stops (SOL has 1.5-2x ETH volatility), faster signal generation, and reduced position sizing for higher tail risk.",
    performance: { target_apy_range: [25, 55], expected_sharpe: 1.3, max_drawdown_pct: 18.0, calmar_ratio: 1.8, win_rate_pct: 50, avg_trade_duration: "10-30 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [5.0, -3.0, 7.5, -4.5, 5.5, 2.0, 8.0, -3.5, -2.5, 6.0, 2.5, 4.5], benchmark: "SOL buy & hold" },
    risk: { risk_level: "VERY_HIGH", max_position_usd: 500000, max_leverage: 4.0, stop_loss_pct: 3.0, circuit_breakers: ["Max drawdown 22%", "SOL daily vol > 15%", "3 consecutive losing days"], liquidation_protection: "Hard stop-loss at 3% per trade, reduced leverage in high-vol", correlation_to_btc: 0.58, tail_risk: "SOL ecosystem blow-up. Significantly higher gap risk than BTC/ETH." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 250000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Continuous (every 5M bar)", rebalance_buffer_pct: 15, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["BINANCE", "OKX"], chains: [], instruments: ["SOL-PERP", "SOL-USDT-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance per venue", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D4", business: "B4", status: "STAGING", estimated_launch: "Q2 2026", blockers: ["Risk limit calibration for SOL-specific volatility"] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, auto-resume on restart", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS WebSocket"] },
  },
  {
    strategy_id: "CEFI_MEAN_REV_BTC_1D",
    name: "BTC Mean Reversion (1D)",
    category: "CEFI",
    family: "Mean Reversion",
    subcategory: "BTC",
    description: "Daily mean-reversion on BTC. Trades counter-trend when price deviates significantly from moving averages. Includes a trend filter to avoid mean-reverting into strong trends.",
    how_it_works: "Computes z-scores of BTC price relative to 20-day and 50-day MAs. Shorts at z > +2 (overbought), longs at z < -2 (oversold). Disables when 200-day MA slope exceeds threshold.",
    performance: { target_apy_range: [12, 25], expected_sharpe: 1.6, max_drawdown_pct: 8.0, calmar_ratio: 2.2, win_rate_pct: 62, avg_trade_duration: "1-5 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [2.0, 1.5, -0.5, 3.0, -1.0, 2.5, 1.0, -2.0, 3.5, 1.0, 2.0, -0.5], benchmark: "BTC buy & hold" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 3.0, stop_loss_pct: 5.0, circuit_breakers: ["Max drawdown 10%", "Position held > 10 days", "BTC daily vol > 8%"], liquidation_protection: "Hard stop-loss at 5% per trade", correlation_to_btc: -0.2, tail_risk: "BTC entering a strong directional regime where mean reversion fails." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Daily (end of day)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["BINANCE", "OKX"], chains: [], instruments: ["BTC-PERP", "BTC-USDT-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, daily reconciliation", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS (daily OHLCV)"] },
  },
  {
    strategy_id: "CEFI_MEAN_REV_ETH_1D",
    name: "ETH Mean Reversion (1D)",
    category: "CEFI",
    family: "Mean Reversion",
    subcategory: "ETH",
    description: "Daily mean-reversion on ETH perps. Calibrated for ETH-specific dynamics including higher beta and DeFi-driven mean reversion patterns.",
    how_it_works: "Same z-score approach as BTC mean reversion with ETH calibrations: higher entry thresholds (z > 2.2), DeFi TVL as supplementary signal, and ETH/BTC ratio overlay.",
    performance: { target_apy_range: [10, 22], expected_sharpe: 1.5, max_drawdown_pct: 9.0, calmar_ratio: 1.8, win_rate_pct: 60, avg_trade_duration: "1-5 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.8, 1.2, -0.8, 2.5, -1.5, 2.0, 0.8, -2.5, 3.0, 0.8, 1.8, -0.3], benchmark: "ETH buy & hold" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1500000, max_leverage: 3.0, stop_loss_pct: 5.5, circuit_breakers: ["Max drawdown 12%", "Position held > 10 days", "ETH daily vol > 10%"], liquidation_protection: "Hard stop-loss at 5.5% per trade", correlation_to_btc: -0.15, tail_risk: "Strong directional ETH move where mean reversion fails. DeFi cascade causing ETH underperformance." },
    money_ops: { min_deposit_usd: 75000, recommended_deposit_usd: 400000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Daily (end of day)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["BINANCE", "OKX"], chains: [], instruments: ["ETH-PERP", "ETH-USDT-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B4", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS (daily OHLCV)"] },
  },
  {
    strategy_id: "CEFI_MEAN_REV_SOL_1D",
    name: "SOL Mean Reversion (1D)",
    category: "CEFI",
    family: "Mean Reversion",
    subcategory: "SOL",
    description: "Daily SOL mean-reversion. SOL exhibits strong snap-back after ecosystem-specific events (memecoin manias, network congestion).",
    how_it_works: "Z-score framework applied to SOL with elevated entry thresholds (z > 2.5), Solana-specific signals (network congestion, DEX volume anomalies), and reduced position sizing.",
    performance: { target_apy_range: [15, 35], expected_sharpe: 1.3, max_drawdown_pct: 15.0, calmar_ratio: 1.7, win_rate_pct: 58, avg_trade_duration: "1-4 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.0, 1.0, -2.0, 4.5, -2.5, 3.0, 1.5, -3.5, 5.0, 1.5, 2.5, -1.0], benchmark: "SOL buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 500000, max_leverage: 3.0, stop_loss_pct: 6.0, circuit_breakers: ["Max drawdown 18%", "SOL daily vol > 15%", "Position held > 7 days"], liquidation_protection: "Hard stop-loss at 6% per trade", correlation_to_btc: -0.1, tail_risk: "SOL-specific structural break invalidating mean-reversion assumption." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 250000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Daily (end of day)", rebalance_buffer_pct: 15, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["BINANCE", "OKX"], chains: [], instruments: ["SOL-PERP", "SOL-USDT-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D4", business: "B4", status: "STAGING", estimated_launch: "Q2 2026", blockers: ["SOL-specific signal calibration"] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS (daily OHLCV)"] },
  },
  {
    strategy_id: "CEFI_MARKET_MAKING_BTC",
    name: "BTC Market Making",
    category: "CEFI",
    family: "Market Making",
    subcategory: "BTC",
    description: "Provides liquidity on BTC perpetual futures by quoting bid/ask spreads. Earns the spread while managing inventory risk through dynamic skewing and hedging.",
    how_it_works: "Continuously quotes both sides of the BTC-PERP order book with tight spreads. Inventory management skews quotes away from accumulated inventory. Volatility model adjusts spread width dynamically. Post-only orders guarantee maker fees.",
    performance: { target_apy_range: [30, 60], expected_sharpe: 2.5, max_drawdown_pct: 5.0, calmar_ratio: 7.0, win_rate_pct: 58, avg_trade_duration: "Seconds to minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.0, 2.5, 4.5, 1.0, 3.8, 2.0, 5.0, 3.5, 0.5, 4.0, 2.8, 3.2], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 3.0, stop_loss_pct: 1.5, circuit_breakers: ["Inventory > 5 BTC one-directional", "Max drawdown 6%", "Spread compression below cost basis", "Exchange API latency > 200ms"], liquidation_protection: "Emergency inventory flatten at max inventory threshold", correlation_to_btc: 0.1, tail_risk: "Adverse selection from informed flow. Exchange outage with open inventory." },
    money_ops: { min_deposit_usd: 250000, recommended_deposit_usd: 1000000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Continuous (sub-second)", rebalance_buffer_pct: 15, withdrawal_notice: "T+0 for margin, T+1 for full", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "Tick", venues: ["BINANCE"], chains: [], instruments: ["BTC-PERP", "BTC-USDT-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball) co-located", scaling: "Single instance per venue (latency-sensitive)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, emergency flatten on restart", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX", "BYBIT"], data_sources: ["MTDS WebSocket (L2 orderbook)", "Binance REST"] },
  },
  {
    strategy_id: "CEFI_ML_DIRECTIONAL_BTC",
    name: "BTC ML Directional",
    category: "CEFI",
    family: "ML Directional",
    subcategory: "BTC",
    description: "Machine learning directional strategy using gradient-boosted models trained on 200+ features to predict BTC 4H returns. Combines on-chain, order flow, sentiment, and cross-asset signals.",
    how_it_works: "A LightGBM model trained on 200+ features predicts the probability of BTC moving up/down over the next 4 hours. When confidence exceeds 65%, takes a directional position sized by Kelly criterion. Retrained weekly on rolling 180-day windows.",
    performance: { target_apy_range: [20, 40], expected_sharpe: 1.6, max_drawdown_pct: 10.0, calmar_ratio: 2.5, win_rate_pct: 57, avg_trade_duration: "4-16 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.5, 1.0, 4.0, -2.0, 3.0, 0.5, 4.5, -1.5, -1.0, 3.8, 1.5, 2.8], benchmark: "BTC buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 1500000, max_leverage: 4.0, stop_loss_pct: 3.0, circuit_breakers: ["Model confidence < 55% for 24H", "Max drawdown 12%", "Feature drift score > 2 std devs", "Backtest-to-live Sharpe divergence > 30%"], liquidation_protection: "Hard stop-loss at 3%", correlation_to_btc: 0.45, tail_risk: "Model overfitting. Feature distribution shift during black swan events." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 750000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Every 4H (model inference cycle)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "4H", venues: ["BINANCE", "OKX"], chains: [], instruments: ["BTC-PERP", "BTC-USDT-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance + GPU inference", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D4", business: "B3", status: "PAPER", estimated_launch: "Q2 2026", blockers: ["Live drift validation (3-month paper trade)", "SHAP stability assessment"] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state + model artifacts in GCS, model rollback capability", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS WebSocket", "Features service (200+ features)", "ML inference service"] },
  },
  {
    strategy_id: "QUANT_STAT_ARB_BTC_ETH",
    name: "BTC-ETH Statistical Arb",
    category: "CEFI",
    family: "Statistical Arbitrage",
    subcategory: "BTC-ETH",
    description: "Pairs trading between BTC and ETH perpetual futures. Exploits the mean-reverting spread between the two most liquid crypto assets.",
    how_it_works: "Computes the BTC/ETH ratio z-score relative to a rolling 168-hour window. Shorts BTC/longs ETH at z > 2.0, reverses at z < -2.0. Hedge ratio dynamically updated via Kalman filter.",
    performance: { target_apy_range: [12, 25], expected_sharpe: 1.8, max_drawdown_pct: 6.0, calmar_ratio: 2.8, win_rate_pct: 63, avg_trade_duration: "6-48 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.5, 2.0, 0.5, -1.0, 2.5, 1.0, 1.8, -0.5, 2.2, 0.8, 1.5, 1.0], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 3.0, stop_loss_pct: 4.0, circuit_breakers: ["Spread z-score > 4.0 (structural break)", "Max drawdown 8%", "Cointegration p-value > 0.05"], liquidation_protection: "Hard stop-loss at 4%", correlation_to_btc: 0.05, tail_risk: "BTC/ETH decoupling during asset-specific events. Cointegration breakdown." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: true, rebalance_frequency: "Every 4H (hedge ratio update)", rebalance_buffer_pct: 8, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1H", venues: ["BINANCE", "OKX"], chains: [], instruments: ["BTC-PERP", "ETH-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, hedge ratio state persisted", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX", "BYBIT"], data_sources: ["MTDS WebSocket"] },
  },
  {
    strategy_id: "QUANT_CROSS_EXCHANGE_BTC",
    name: "BTC Cross-Exchange Arb",
    category: "CEFI",
    family: "Arbitrage",
    subcategory: "BTC",
    description: "Captures price discrepancies in BTC across centralized exchanges. Simultaneously buys cheap and sells expensive when the spread exceeds costs.",
    how_it_works: "Monitors BTC-USDT orderbooks on Binance, OKX, Bybit, and Coinbase via WebSocket. Executes simultaneous orders when best ask on one exchange falls below best bid on another beyond cost threshold. Pre-funded accounts eliminate transfer delays.",
    performance: { target_apy_range: [8, 18], expected_sharpe: 2.2, max_drawdown_pct: 2.0, calmar_ratio: 5.5, win_rate_pct: 85, avg_trade_duration: "Seconds", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.0, 0.8, 1.5, 0.5, 1.2, 0.7, 1.8, 1.0, 0.4, 1.3, 0.9, 1.0], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "LOW", max_position_usd: 3000000, max_leverage: 1.5, stop_loss_pct: 0.5, circuit_breakers: ["API latency > 100ms on any exchange", "Spread < cost threshold for > 1H", "Exchange withdrawal suspension"], liquidation_protection: null, correlation_to_btc: 0.02, tail_risk: "Exchange outage during open arbitrage leg. Exchange insolvency." },
    money_ops: { min_deposit_usd: 500000, recommended_deposit_usd: 2000000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Pre-funded accounts on each exchange", auto_rebalance: true, rebalance_frequency: "Daily (inter-exchange rebalancing)", rebalance_buffer_pct: 20, withdrawal_notice: "T+0 per exchange", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "Tick", venues: ["BINANCE", "OKX", "BYBIT", "COINBASE"], chains: [], instruments: ["BTC-USDT", "BTC-USD"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball) co-located", scaling: "Single instance (multi-venue)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Per-exchange position reconciliation, auto-hedge on failure", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE", "OKX"], backup_venues: ["BYBIT", "COINBASE"], data_sources: ["MTDS WebSocket (L2 orderbook, all venues)"] },
  },
];

// =============================================================================
// TradFi Strategies (16)
// =============================================================================

const TRADFI_STRATEGIES: StrategyCatalogEntry[] = [
  {
    strategy_id: "TRADFI_MOMENTUM_SPY_5M", name: "SPY Momentum (5M)", category: "TRADFI", family: "Momentum", subcategory: "SPY",
    description: "Intraday momentum on S&P 500 E-mini futures using 5-minute bars. Captures trend continuation during US market hours with volume-weighted momentum signals.",
    how_it_works: "During US RTH (9:30-16:00 ET), analyzes 5-minute ES bars for VWAP deviation, tick-based momentum, and sector rotation indicators. All positions closed before market close (no overnight risk). VIX levels adjust position sizing.",
    performance: { target_apy_range: [12, 22], expected_sharpe: 1.4, max_drawdown_pct: 8.0, calmar_ratio: 2.0, win_rate_pct: 53, avg_trade_duration: "30-120 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.5, 2.0, -0.5, 1.0, -1.5, 2.5, 1.8, -1.0, 3.0, 0.5, 1.5, 1.0], benchmark: "S&P 500 total return" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 4.0, stop_loss_pct: 1.5, circuit_breakers: ["VIX > 35", "Max drawdown 10%", "3 consecutive losing sessions", "Circuit breaker halt triggered"], liquidation_protection: "Intraday-only (flat by close)", correlation_to_btc: 0.15, tail_risk: "Flash crash during market hours. Circuit breaker halts preventing stop-loss execution." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Continuous (every 5M bar during RTH)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["CME"], chains: [], instruments: ["ES-FUT", "SPY-ETF"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B4", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Interactive Brokers (SEC/FINRA regulated)", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, flat by close guarantee", insurance: "SIPC coverage ($500K per account)" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: [], data_sources: ["MTDS (CME E-mini)", "VIX index feed"] },
  },
  {
    strategy_id: "TRADFI_MEAN_REV_SPY_1D", name: "SPY Mean Reversion (1D)", category: "TRADFI", family: "Mean Reversion", subcategory: "SPY",
    description: "Daily mean-reversion on S&P 500 futures. Captures the well-documented overnight reversal effect after significant daily moves.",
    how_it_works: "When S&P 500 drops >1.5% in a session, buys at close expecting reversal. When it rises >1.5%, shorts. Positions held 1-3 days. VIX term structure as regime filter.",
    performance: { target_apy_range: [8, 18], expected_sharpe: 1.5, max_drawdown_pct: 7.0, calmar_ratio: 1.8, win_rate_pct: 60, avg_trade_duration: "1-3 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.0, 1.5, 0.5, 2.0, -0.5, 1.2, 0.8, -1.5, 2.5, 0.5, 1.0, 0.8], benchmark: "S&P 500 total return" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 3.0, stop_loss_pct: 3.0, circuit_breakers: ["VIX > 40", "Max drawdown 10%", "S&P 500 3-day cumulative move > 8%"], liquidation_protection: "Hard stop-loss at 3%", correlation_to_btc: 0.1, tail_risk: "Sustained crash where mean-reversion fails for multiple sessions." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Daily (at close)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["CME"], chains: [], instruments: ["ES-FUT"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B4", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, daily reconciliation", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: [], data_sources: ["MTDS (CME daily)", "VIX index"] },
  },
  {
    strategy_id: "TRADFI_MEAN_REV_FX_1D", name: "FX Mean Reversion (1D)", category: "TRADFI", family: "Mean Reversion", subcategory: "FX",
    description: "Daily mean-reversion on major FX pairs (EUR/USD, GBP/USD, USD/JPY). Exploits overreactions to macro data releases.",
    how_it_works: "Monitors 6 major FX pairs for extreme daily moves (z-score > 2 relative to 20-day realized vol). Takes counter-trend positions expecting partial reversion. Uses macro event calendar to avoid trading into scheduled high-impact events.",
    performance: { target_apy_range: [6, 14], expected_sharpe: 1.4, max_drawdown_pct: 5.0, calmar_ratio: 1.8, win_rate_pct: 58, avg_trade_duration: "1-4 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [0.8, 1.0, -0.3, 1.5, 0.5, -0.5, 1.2, 0.8, -0.8, 1.0, 0.5, 0.8], benchmark: "JPM FX Volatility Index" },
    risk: { risk_level: "MEDIUM", max_position_usd: 3000000, max_leverage: 5.0, stop_loss_pct: 2.0, circuit_breakers: ["Max drawdown 7%", "Central bank intervention detected", "3 consecutive losing trades"], liquidation_protection: "Hard stop-loss at 2%", correlation_to_btc: 0.05, tail_risk: "Central bank intervention causing sustained directional move." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Daily", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["IBKR-FX"], chains: [], instruments: ["EUR-USD", "GBP-USD", "USD-JPY", "AUD-USD", "USD-CAD", "USD-CHF"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D4", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["FX data feed integration", "Macro event calendar parsing"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["IBKR-FX"], backup_venues: [], data_sources: ["MTDS (IBKR FX)", "Macro event calendar"] },
  },
  {
    strategy_id: "TRADFI_MEAN_REV_OIL_1D", name: "Crude Oil Mean Reversion (1D)", category: "TRADFI", family: "Mean Reversion", subcategory: "Oil",
    description: "Daily mean-reversion on WTI crude oil futures. Oil exhibits strong mean-reversion after supply/demand shocks.",
    how_it_works: "Monitors CL futures for extreme daily moves relative to 20-day realized vol. Counter-trend positions after moves exceeding 2 std devs. Uses EIA inventory data and OPEC+ production quotas as regime filters.",
    performance: { target_apy_range: [10, 20], expected_sharpe: 1.3, max_drawdown_pct: 8.0, calmar_ratio: 1.7, win_rate_pct: 57, avg_trade_duration: "1-5 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.5, -0.5, 2.0, 1.0, -1.0, 2.5, 0.5, -2.0, 3.0, 0.5, 1.5, 0.8], benchmark: "WTI crude oil buy & hold" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1500000, max_leverage: 3.0, stop_loss_pct: 4.0, circuit_breakers: ["Oil daily move > 8%", "Max drawdown 10%", "OPEC emergency meeting announced"], liquidation_protection: "Hard stop-loss at 4%", correlation_to_btc: 0.08, tail_risk: "Geopolitical supply shock causing sustained directional move." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Daily", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["CME"], chains: [], instruments: ["CL-FUT"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D4", business: "B4", status: "STAGING", estimated_launch: "Q2 2026", blockers: ["EIA data integration"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: ["ICE"], data_sources: ["MTDS (CME CL)", "EIA weekly inventory"] },
  },
  {
    strategy_id: "TRADFI_ML_SPY_5M", name: "SPY ML Directional (5M)", category: "TRADFI", family: "ML Directional", subcategory: "SPY",
    description: "ML directional strategy on S&P 500 futures. Uses 120+ features including sector flows, macro indicators, and cross-asset signals to predict intraday returns.",
    how_it_works: "LightGBM model trained on sector ETF momentum, VIX term structure, bond yields, FX crosses, earnings calendar, and options skew. Predicts next 30-minute bar direction during RTH. High-confidence predictions (>70%) trigger positions. Retrained weekly.",
    performance: { target_apy_range: [15, 28], expected_sharpe: 1.6, max_drawdown_pct: 7.0, calmar_ratio: 2.5, win_rate_pct: 56, avg_trade_duration: "30-120 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [2.0, 1.5, -0.5, 2.5, -1.0, 2.0, 1.5, -1.5, 3.0, 0.5, 1.8, 1.0], benchmark: "S&P 500 total return" },
    risk: { risk_level: "HIGH", max_position_usd: 1500000, max_leverage: 4.0, stop_loss_pct: 1.5, circuit_breakers: ["Model confidence < 55%", "Max drawdown 10%", "Feature drift > 2 std devs", "VIX > 30"], liquidation_protection: "Flat by close", correlation_to_btc: 0.12, tail_risk: "Model failure during unprecedented market regime." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Every 5M (during RTH)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["CME"], chains: [], instruments: ["ES-FUT", "SPY-ETF"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance + GPU inference", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["Live paper trade validation (3 months)", "Feature engineering pipeline integration"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Model artifacts in GCS, position state persisted", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: [], data_sources: ["MTDS (CME)", "Features service", "ML inference service"] },
  },
  {
    strategy_id: "TRADFI_ML_FX_5M", name: "FX ML Directional (5M)", category: "TRADFI", family: "ML Directional", subcategory: "FX",
    description: "ML-driven FX directional strategy using 5-minute bars across major pairs. Leverages interest rate differentials, carry, and positioning data.",
    how_it_works: "Per-pair LightGBM models on 80+ features. Predicts 30-minute move direction during London/NY overlap hours. Targets EUR/USD, GBP/USD, USD/JPY.",
    performance: { target_apy_range: [10, 20], expected_sharpe: 1.3, max_drawdown_pct: 6.0, calmar_ratio: 2.2, win_rate_pct: 54, avg_trade_duration: "30-90 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.2, 0.8, -0.5, 1.5, 0.5, -0.8, 1.8, 0.5, -0.5, 1.2, 0.8, 0.8], benchmark: "JPM FX Volatility Index" },
    risk: { risk_level: "MEDIUM", max_position_usd: 2000000, max_leverage: 5.0, stop_loss_pct: 1.0, circuit_breakers: ["Model confidence < 55%", "Max drawdown 8%", "Central bank intervention"], liquidation_protection: "Hard stop-loss at 1%", correlation_to_btc: 0.03, tail_risk: "Central bank surprise intervention. Liquidity drought during Asian session." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Every 5M (London/NY hours)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["IBKR-FX"], chains: [], instruments: ["EUR-USD", "GBP-USD", "USD-JPY"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["FX feature engineering", "Live paper trade validation"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Model artifacts in GCS", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["IBKR-FX"], backup_venues: [], data_sources: ["MTDS (IBKR FX)", "Features service", "ML inference service"] },
  },
  {
    strategy_id: "TRADFI_ML_OIL_5M", name: "Oil ML Directional (5M)", category: "TRADFI", family: "ML Directional", subcategory: "Oil",
    description: "ML-driven crude oil directional strategy. Integrates fundamental supply/demand signals with technical features for short-term CL futures prediction.",
    how_it_works: "LightGBM model on 90+ features: EIA inventory surprise, OPEC estimates, shipping/tanker data, refinery utilization, crack spreads, and weather. Predicts 30-minute CL direction during NYMEX hours.",
    performance: { target_apy_range: [12, 25], expected_sharpe: 1.4, max_drawdown_pct: 9.0, calmar_ratio: 1.8, win_rate_pct: 54, avg_trade_duration: "30-90 minutes", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.5, 1.0, -1.0, 2.5, 0.5, -0.5, 2.0, 1.0, -1.5, 2.0, 0.8, 1.2], benchmark: "WTI crude oil buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 1000000, max_leverage: 3.0, stop_loss_pct: 2.0, circuit_breakers: ["Oil daily move > 5%", "Model confidence < 55%", "Max drawdown 12%"], liquidation_protection: "Hard stop-loss at 2%", correlation_to_btc: 0.08, tail_risk: "Geopolitical supply shock causing limit moves." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Every 5M (NYMEX hours)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["CME"], chains: [], instruments: ["CL-FUT"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["Oil-specific feature pipeline", "EIA data integration"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Model artifacts in GCS", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: [], data_sources: ["MTDS (CME CL)", "Features service", "ML inference service"] },
  },
  {
    strategy_id: "TRADFI_COMMODITY_REGIME_OIL", name: "Oil Commodity Regime", category: "TRADFI", family: "Regime", subcategory: "Oil",
    description: "Regime-switching strategy that identifies oil market regimes and deploys the appropriate sub-strategy for each. Uses a Hidden Markov Model to classify into 4 regimes.",
    how_it_works: "HMM classifies oil market into 4 regimes: (1) contango + low vol = roll yield, (2) backwardation + trending = momentum, (3) high vol + mean-reverting = counter-trend, (4) crisis = flat. Probability-weighted blending rather than hard switches.",
    performance: { target_apy_range: [8, 18], expected_sharpe: 1.5, max_drawdown_pct: 7.0, calmar_ratio: 1.8, win_rate_pct: 56, avg_trade_duration: "3-14 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.0, 1.5, 0.5, -0.5, 1.5, 1.0, -0.3, 2.0, 0.5, 1.2, 0.8, 1.0], benchmark: "WTI crude oil buy & hold" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1500000, max_leverage: 2.0, stop_loss_pct: 5.0, circuit_breakers: ["Regime uncertainty > 60%", "Max drawdown 10%", "Oil daily move > 8%"], liquidation_protection: "Hard stop-loss at 5%", correlation_to_btc: 0.05, tail_risk: "Regime misclassification during transitions. Unprecedented regime not in training data." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR margin account", auto_rebalance: true, rebalance_frequency: "Daily (regime check)", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["CME"], chains: [], instruments: ["CL-FUT", "CL-CALENDAR-SPREAD"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["HMM regime model calibration", "Calendar spread data integration"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Regime state in GCS, model artifacts versioned", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CME"], backup_venues: ["ICE"], data_sources: ["MTDS (CME CL)", "EIA data", "OPEC reports"] },
  },
  {
    strategy_id: "TRADFI_EVENT_MACRO_CRYPTO", name: "Macro Event Crypto", category: "TRADFI", family: "Event-Driven", subcategory: "Macro",
    description: "Trades BTC around scheduled macro events (FOMC, CPI, NFP). Uses pre-event positioning and post-event momentum capture.",
    how_it_works: "Before major US macro releases, builds a position based on consensus deviation forecasts. After the release, captures the 15-60 minute momentum reaction. Event-only trading means flat ~80% of the time.",
    performance: { target_apy_range: [10, 30], expected_sharpe: 1.2, max_drawdown_pct: 10.0, calmar_ratio: 1.8, win_rate_pct: 55, avg_trade_duration: "15 minutes to 4 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [0.0, 3.5, 0.0, -2.0, 4.0, 0.0, 0.0, -1.5, 5.0, 0.0, 2.5, 0.0], benchmark: "BTC buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 1000000, max_leverage: 5.0, stop_loss_pct: 3.0, circuit_breakers: ["3 consecutive event losses", "Max drawdown 12%", "BTC-macro correlation breakdown"], liquidation_protection: "Hard stop-loss at 3%", correlation_to_btc: 0.35, tail_risk: "Surprise macro release. BTC decoupling from macro narrative." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 300000, deposit_currency: ["USDT", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Hot wallet (Binance sub-account)", auto_rebalance: false, rebalance_frequency: "Event-driven (8-12 events/month)", rebalance_buffer_pct: 20, withdrawal_notice: "T+0 (flat most of the time)", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["BINANCE", "OKX"], chains: [], instruments: ["BTC-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["Macro forecast model calibration", "Event calendar automation"] },
    security: { custody: "Copper MPC", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, event schedule cached", insurance: "Copper custody insurance" },
    venue_coverage: { primary_venues: ["BINANCE"], backup_venues: ["OKX"], data_sources: ["MTDS WebSocket", "Macro event calendar", "Consensus estimates"] },
  },
  {
    strategy_id: "OPTIONS_DELTA_ML_BTC_DERIBIT", name: "BTC Options Delta ML", category: "TRADFI", family: "Options ML", subcategory: "BTC",
    description: "ML-driven delta trading on BTC options via Deribit. Constructs defined-risk option spreads optimized by IV surface analysis and directional ML predictions.",
    how_it_works: "ML model predicts BTC 4H direction, then constructs call/put spreads that optimize payout profile. Uses IV skew to select mispriced strikes. All defined-risk structures. Greeks continuously monitored and hedged.",
    performance: { target_apy_range: [15, 35], expected_sharpe: 1.4, max_drawdown_pct: 12.0, calmar_ratio: 1.8, win_rate_pct: 52, avg_trade_duration: "4-48 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [2.5, -1.0, 4.0, -2.5, 3.0, 0.5, 3.5, -1.5, -0.5, 3.0, 1.5, 2.0], benchmark: "BTC buy & hold" },
    risk: { risk_level: "HIGH", max_position_usd: 1000000, max_leverage: 3.0, stop_loss_pct: 5.0, circuit_breakers: ["Net gamma exposure > threshold", "IV crush > 30% in 1H", "Max drawdown 15%"], liquidation_protection: "Defined-risk structures cap max loss per trade", correlation_to_btc: 0.4, tail_risk: "IV crush reducing spread value. Liquidity drought in OTM options." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["BTC", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Every 4H (model cycle)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "4H", venues: ["DERIBIT"], chains: [], instruments: ["BTC-OPTIONS", "BTC-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["Options Greeks management engine", "IV surface model validation"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Greeks state in GCS, emergency flatten capability", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit options)", "ML inference service"] },
  },
  {
    strategy_id: "OPTIONS_STRIKE_ML_BTC_DERIBIT", name: "BTC Strike Selection ML", category: "TRADFI", family: "Options ML", subcategory: "BTC",
    description: "ML-optimized strike selection for BTC option spreads. Uses vol surface analysis to identify mispriced strikes and constructs mean-reversion trades on the volatility smile.",
    how_it_works: "Fits a smooth SSVI volatility surface, identifies strikes where market IV deviates from model. Sells overpriced, buys underpriced in spread structures. Held until IV converges or expiry approaches.",
    performance: { target_apy_range: [10, 25], expected_sharpe: 1.6, max_drawdown_pct: 8.0, calmar_ratio: 2.0, win_rate_pct: 60, avg_trade_duration: "1-7 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.5, 1.0, -0.5, 2.0, 0.5, 1.5, 1.0, -1.0, 2.5, 0.8, 1.2, 1.0], benchmark: "Deribit BTC DVOL index" },
    risk: { risk_level: "MEDIUM", max_position_usd: 800000, max_leverage: 2.0, stop_loss_pct: 5.0, circuit_breakers: ["Vol surface model residual > 3 std devs", "Max drawdown 10%", "Deribit liquidity drought"], liquidation_protection: "Defined-risk structures", correlation_to_btc: 0.15, tail_risk: "Vol surface structural break during extreme moves." },
    money_ops: { min_deposit_usd: 75000, recommended_deposit_usd: 400000, deposit_currency: ["BTC", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Daily (surface refit)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["DERIBIT"], chains: [], instruments: ["BTC-OPTIONS"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["SSVI surface fitting engine", "Options data pipeline"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Surface state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit options chain)"] },
  },
  {
    strategy_id: "OPTIONS_VOL_ML_ETH_DERIBIT", name: "ETH Vol Surface ML", category: "TRADFI", family: "Options ML", subcategory: "ETH",
    description: "ETH volatility surface trading on Deribit. Predicts surface shape evolution and constructs vega-neutral trades on skew, term structure, and smile curvature changes.",
    how_it_works: "Models ETH vol surface using SSVI, predicts 24H surface deformation. Constructs delta-neutral, vega-neutral positions exposed to skew steepening/flattening, term structure roll-down, and smile curvature changes.",
    performance: { target_apy_range: [8, 20], expected_sharpe: 1.5, max_drawdown_pct: 7.0, calmar_ratio: 1.8, win_rate_pct: 58, avg_trade_duration: "1-5 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.0, 0.8, 1.5, -0.5, 1.2, 0.5, 1.8, -0.8, 0.5, 1.5, 0.8, 1.0], benchmark: "ETH realized vol" },
    risk: { risk_level: "MEDIUM", max_position_usd: 600000, max_leverage: 2.0, stop_loss_pct: 5.0, circuit_breakers: ["Surface model error > 2 std devs", "Max drawdown 10%", "ETH daily move > 10%"], liquidation_protection: "Defined-risk structures", correlation_to_btc: 0.1, tail_risk: "ETH-specific vol event causing surface dislocation beyond model boundaries." },
    money_ops: { min_deposit_usd: 75000, recommended_deposit_usd: 350000, deposit_currency: ["ETH", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Every 4H", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "4H", venues: ["DERIBIT"], chains: [], instruments: ["ETH-OPTIONS", "ETH-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["ETH vol surface model", "Greeks hedging engine"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Surface state and Greeks in GCS", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit ETH options)"] },
  },
  {
    strategy_id: "OPTIONS_DELTA_ML_SPY_CBOE", name: "SPY Options Delta ML", category: "TRADFI", family: "Options ML", subcategory: "SPY",
    description: "ML-driven delta trading on SPY options via CBOE/IBKR. Targets 0-DTE to 5-DTE options for gamma-rich positions. All positions are spread-based.",
    how_it_works: "Uses same ML model as TRADFI_ML_SPY_5M but expresses views through SPY options. For bullish: call spreads/sell put spreads. For bearish: put spreads/sell call spreads. Strike selection optimizes expected value given model confidence.",
    performance: { target_apy_range: [12, 28], expected_sharpe: 1.3, max_drawdown_pct: 10.0, calmar_ratio: 1.8, win_rate_pct: 53, avg_trade_duration: "1-48 hours", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [2.0, -0.5, 3.5, -2.0, 2.5, 0.5, 3.0, -1.5, -0.5, 2.8, 1.0, 1.8], benchmark: "S&P 500 total return" },
    risk: { risk_level: "HIGH", max_position_usd: 1000000, max_leverage: 2.0, stop_loss_pct: null, circuit_breakers: ["VIX > 35", "Max drawdown 12%", "Model confidence < 55%"], liquidation_protection: "Defined-risk spreads (max loss = spread width)", correlation_to_btc: 0.1, tail_risk: "Pin risk near expiry. Liquidity drought in 0-DTE options." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["USD"], treasury_wallet: "Interactive Brokers", trading_wallet: "IBKR options account", auto_rebalance: true, rebalance_frequency: "Every 30M during RTH", rebalance_buffer_pct: 10, withdrawal_notice: "T+1", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "5M", venues: ["CBOE"], chains: [], instruments: ["SPY-OPTIONS", "ES-FUT"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B1", status: "BACKTEST", estimated_launch: "Q1 2027", blockers: ["CBOE options data pipeline", "SPY options execution adapter"] },
    security: { custody: "Interactive Brokers", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: "SIPC coverage" },
    venue_coverage: { primary_venues: ["CBOE"], backup_venues: [], data_sources: ["MTDS (CBOE options)", "ML inference service"] },
  },
  {
    strategy_id: "OPTIONS_MM_BTC_DERIBIT", name: "BTC Options Market Making", category: "TRADFI", family: "Options Market Making", subcategory: "BTC",
    description: "Delta-neutral options market making on Deribit BTC options. Quotes bid/ask on multiple strikes and expiries, earning the spread while managing Greeks.",
    how_it_works: "Continuously quotes on BTC options across 5-10 strikes and 3-5 expiries. Proprietary vol surface model calculates fair value, spread based on vega risk and inventory. Delta hedged via BTC-PERP every 5 minutes.",
    performance: { target_apy_range: [25, 50], expected_sharpe: 2.0, max_drawdown_pct: 8.0, calmar_ratio: 4.0, win_rate_pct: 55, avg_trade_duration: "Minutes (continuous quoting)", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [3.0, 2.5, 4.0, 0.5, 3.5, 2.0, 4.5, -1.0, 1.5, 3.5, 2.5, 3.0], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "HIGH", max_position_usd: 2000000, max_leverage: 3.0, stop_loss_pct: 3.0, circuit_breakers: ["Net vega > $50K/point", "Delta > 5 BTC net", "Vol surface error > 3 std devs", "Max drawdown 10%"], liquidation_protection: "Emergency Greeks flatten via perp hedge", correlation_to_btc: 0.1, tail_risk: "Gap move through hedged delta. Liquidity drought. Vol jump exceeding surface model." },
    money_ops: { min_deposit_usd: 250000, recommended_deposit_usd: 1000000, deposit_currency: ["BTC", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Continuous (sub-second quoting)", rebalance_buffer_pct: 15, withdrawal_notice: "T+0 for unencumbered margin", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "Tick", venues: ["DERIBIT"], chains: [], instruments: ["BTC-OPTIONS", "BTC-PERP"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball) co-located", scaling: "Single instance (latency-sensitive)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["Deribit MM agreement", "Vol surface model live validation"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Greeks state in GCS, emergency flatten on restart", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit L2 orderbook + options chain)"] },
  },
  {
    strategy_id: "QUANT_REL_VOL_BTC_ETH", name: "BTC-ETH Relative Vol", category: "TRADFI", family: "Volatility", subcategory: "BTC-ETH",
    description: "Trades relative implied volatility between BTC and ETH options. Constructs vega-neutral cross-asset vol trades when the ratio deviates from its mean.",
    how_it_works: "Monitors BTC IV / ETH IV ratio. When it deviates >1.5 std devs, buys straddles on the cheap-vol asset and sells on the expensive, delta-hedging both. Profits from IV convergence.",
    performance: { target_apy_range: [8, 18], expected_sharpe: 1.5, max_drawdown_pct: 6.0, calmar_ratio: 2.0, win_rate_pct: 60, avg_trade_duration: "3-14 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.0, 0.5, 1.5, -0.5, 1.2, 0.8, -0.3, 1.5, 0.5, 1.0, 0.8, 0.8], benchmark: "DERIBIT DVOL spread" },
    risk: { risk_level: "MEDIUM", max_position_usd: 800000, max_leverage: 2.0, stop_loss_pct: 5.0, circuit_breakers: ["Vol ratio divergence > 3 std devs", "Max drawdown 8%", "Cross-asset correlation breakdown"], liquidation_protection: "Defined-risk through options structures", correlation_to_btc: 0.05, tail_risk: "Structural change in BTC/ETH vol relationship. One-sided vol event." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["BTC", "ETH", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Daily (vol ratio check)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["DERIBIT"], chains: [], instruments: ["BTC-OPTIONS", "ETH-OPTIONS", "BTC-PERP", "ETH-PERP"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["Cross-asset vol surface engine", "Relative vol model"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Vol ratio state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit options)"] },
  },
  {
    strategy_id: "QUANT_VOL_SURFACE_BTC", name: "BTC Vol Surface Arb", category: "TRADFI", family: "Volatility", subcategory: "BTC",
    description: "Arbitrages mispricing within the BTC vol surface on Deribit. Identifies options whose market IV deviates from a smooth SSVI surface fit and trades the convergence.",
    how_it_works: "Fits SSVI model to the entire BTC options surface. Identifies individual options deviating >2 vol points from model. Sells overpriced, buys underpriced in defined-risk spreads. Profits as the surface smooths out.",
    performance: { target_apy_range: [10, 22], expected_sharpe: 1.7, max_drawdown_pct: 6.0, calmar_ratio: 2.5, win_rate_pct: 62, avg_trade_duration: "1-7 days", backtest_period: "2024-01-01 to 2026-04-01", monthly_returns: [1.2, 1.0, 1.8, -0.5, 1.5, 0.8, 2.0, -0.3, 0.5, 1.5, 1.0, 1.2], benchmark: "Deribit BTC DVOL index" },
    risk: { risk_level: "MEDIUM", max_position_usd: 1000000, max_leverage: 2.0, stop_loss_pct: 4.0, circuit_breakers: ["Surface model residual > 3 std devs", "Max drawdown 8%", "Deribit options liquidity < threshold"], liquidation_protection: "Defined-risk spread structures", correlation_to_btc: 0.08, tail_risk: "Vol surface structural break during extreme moves." },
    money_ops: { min_deposit_usd: 100000, recommended_deposit_usd: 500000, deposit_currency: ["BTC", "USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Deribit sub-account", auto_rebalance: true, rebalance_frequency: "Daily (surface refit)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0 },
    config: { timeframe: "1D", venues: ["DERIBIT"], chains: [], instruments: ["BTC-OPTIONS"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["SSVI fitting engine", "Options chain data pipeline"] },
    security: { custody: "Copper MPC + Deribit", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Surface state in GCS, position tracking", insurance: null },
    venue_coverage: { primary_venues: ["DERIBIT"], backup_venues: [], data_sources: ["MTDS (Deribit full options chain)"] },
  },
];

// =============================================================================
// Sports Strategies (6)
// =============================================================================

const SPORTS_STRATEGIES: StrategyCatalogEntry[] = [
  {
    strategy_id: "SPORTS_ARBITRAGE_CROSS_BOOK", name: "Cross-Book Sports Arb", category: "SPORTS", family: "Arbitrage", subcategory: "Football",
    description: "Exploits pricing discrepancies across sportsbooks for the same football match. When combined implied probability totals less than 100%, a guaranteed profit arbitrage exists.",
    how_it_works: "Scans odds from 23 bookmakers for all Tier 0-1 matches. When sum of best available odds implies total probability below 100%, places proportional bets on each outcome across books. Typical arb margin is 0.5-3%. Execution must be near-simultaneous.",
    performance: { target_apy_range: [5, 12], expected_sharpe: 3.0, max_drawdown_pct: 2.0, calmar_ratio: 4.0, win_rate_pct: 95, avg_trade_duration: "90 minutes (match duration)", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [0.8, 0.6, 1.0, 0.5, 0.7, 0.9, 1.2, 0.6, 0.4, 0.8, 0.7, 0.6], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "LOW", max_position_usd: 500000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Book account limited/suspended", "Odds movement > 5% between detection and execution", "Match postponed after bet placement"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "Bookmaker voiding bets retroactively. Account limitations reducing liquidity." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 200000, deposit_currency: ["USD", "EUR", "GBP"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Pre-funded bookmaker accounts", auto_rebalance: true, rebalance_frequency: "Weekly (inter-book fund transfers)", rebalance_buffer_pct: 20, withdrawal_notice: "T+1 to T+3 (bookmaker withdrawal processing)", fee_structure: "0/50 (0% mgmt, 50% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "Real-time", venues: ["BETFAIR", "PINNACLE", "BET365"], chains: [], instruments: ["FOOTBALL-MATCH-1X2", "FOOTBALL-MATCH-OU"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance (multi-book scanner)", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B5", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Self-managed (bookmaker accounts)", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Bet state in GCS, match result reconciliation", insurance: null },
    venue_coverage: { primary_venues: ["BETFAIR", "PINNACLE"], backup_venues: ["BET365", "SBOBET", "MARATHON"], data_sources: ["Odds API", "Betfair Stream API", "API Football"] },
  },
  {
    strategy_id: "SPORTS_VALUE_BETTING", name: "Sports Value Betting", category: "SPORTS", family: "Value Betting", subcategory: "Football",
    description: "Identifies +EV bets by comparing bookmaker odds to a proprietary fair probability model. Bets only when odds significantly exceed fair value.",
    how_it_works: "A statistical model (Elo ratings, recent form, team strength, head-to-head) produces fair probability estimates. When bookmaker odds imply probability 5%+ below model fair value, places a bet. Kelly criterion sizing optimizes bankroll growth.",
    performance: { target_apy_range: [8, 20], expected_sharpe: 1.2, max_drawdown_pct: 15.0, calmar_ratio: 1.0, win_rate_pct: 52, avg_trade_duration: "90 minutes", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [2.0, -1.5, 3.0, -2.0, 1.5, 2.5, -0.5, 3.5, -1.0, 2.0, 1.0, 1.5], benchmark: "Closing line value" },
    risk: { risk_level: "MEDIUM", max_position_usd: 200000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Bankroll drawdown > 20%", "Model calibration error > 3%", "10 consecutive losses"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "Model miscalibration leading to sustained negative EV. Extended variance. Account limitations." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 100000, deposit_currency: ["USD", "EUR"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Pre-funded bookmaker accounts", auto_rebalance: false, rebalance_frequency: "Weekly", rebalance_buffer_pct: 30, withdrawal_notice: "T+1 to T+3", fee_structure: "0/30 (0% mgmt, 30% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "Pre-match", venues: ["PINNACLE", "BETFAIR", "BET365"], chains: [], instruments: ["FOOTBALL-MATCH-1X2", "FOOTBALL-MATCH-AH"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D5", business: "B4", status: "LIVE", estimated_launch: null, blockers: [] },
    security: { custody: "Self-managed", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Bet log in GCS, P&L reconciliation", insurance: null },
    venue_coverage: { primary_venues: ["PINNACLE", "BETFAIR"], backup_venues: ["BET365", "SBOBET"], data_sources: ["Odds API", "API Football", "FootyStats"] },
  },
  {
    strategy_id: "SPORTS_KELLY_CRITERION", name: "Kelly Criterion Optimizer", category: "SPORTS", family: "Kelly Sizing", subcategory: "Football",
    description: "Applies fractional Kelly criterion bankroll management to sports betting, optimizing stake sizes based on edge between model probability and bookmaker odds.",
    how_it_works: "Uses same fair value model as value betting but applies 0.25x Kelly fraction for stake calculation. Dynamically adjusts Kelly fraction based on bankroll relative to high water mark.",
    performance: { target_apy_range: [12, 30], expected_sharpe: 1.0, max_drawdown_pct: 20.0, calmar_ratio: 1.0, win_rate_pct: 53, avg_trade_duration: "90 minutes", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [3.0, -2.5, 4.5, -3.0, 2.0, 3.5, -1.0, 5.0, -2.0, 3.0, 1.5, 2.5], benchmark: "Flat-stake value betting" },
    risk: { risk_level: "HIGH", max_position_usd: 300000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Bankroll drawdown > 25%", "Kelly fraction exceeds 5% of bankroll", "Model calibration drift"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "Over-betting due to model overconfidence. Extended drawdown depleting bankroll." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 200000, deposit_currency: ["USD", "EUR"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Pre-funded bookmaker accounts", auto_rebalance: false, rebalance_frequency: "Weekly", rebalance_buffer_pct: 30, withdrawal_notice: "T+1 to T+3", fee_structure: "0/30 (0% mgmt, 30% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "Pre-match", venues: ["PINNACLE", "BETFAIR"], chains: [], instruments: ["FOOTBALL-MATCH-1X2", "FOOTBALL-MATCH-AH", "FOOTBALL-MATCH-OU"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C5", deployment: "D4", business: "B4", status: "STAGING", estimated_launch: "Q2 2026", blockers: ["Kelly fraction calibration on live data"] },
    security: { custody: "Self-managed", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Bankroll state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["PINNACLE", "BETFAIR"], backup_venues: ["BET365"], data_sources: ["Odds API", "API Football", "FootyStats"] },
  },
  {
    strategy_id: "SPORTS_ML_PREDICTION", name: "Sports ML Match Prediction", category: "SPORTS", family: "ML Prediction", subcategory: "Football",
    description: "ML-driven football match outcome prediction using 150+ features. Generates probability estimates for betting decisions across Tier 0-1 leagues.",
    how_it_works: "LightGBM ensemble trained on 150+ features (Elo, form, head-to-head, injuries, weather, referee, bookmaker odds). Retrained weekly. Betting signals generated when model probability exceeds bookmaker probability by configurable threshold.",
    performance: { target_apy_range: [10, 25], expected_sharpe: 1.3, max_drawdown_pct: 12.0, calmar_ratio: 1.4, win_rate_pct: 55, avg_trade_duration: "90 minutes", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [2.5, -1.0, 3.0, -1.5, 2.0, 1.5, -0.5, 3.5, -1.0, 2.5, 1.0, 2.0], benchmark: "Closing line value" },
    risk: { risk_level: "MEDIUM", max_position_usd: 200000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Model Brier score degradation > 10%", "Bankroll drawdown > 15%", "Closing line value negative over 100 bets"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "Model overfitting. Feature data quality degradation. Extended variance." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 150000, deposit_currency: ["USD", "EUR"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Pre-funded bookmaker accounts", auto_rebalance: false, rebalance_frequency: "Weekly", rebalance_buffer_pct: 25, withdrawal_notice: "T+1 to T+3", fee_structure: "0/30 (0% mgmt, 30% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "Pre-match (T-24H to T-1H)", venues: ["PINNACLE", "BETFAIR", "BET365"], chains: [], instruments: ["FOOTBALL-MATCH-1X2"], execution_mode: "BOTH", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D4", business: "B3", status: "PAPER", estimated_launch: "Q2 2026", blockers: ["Feature pipeline integration", "6-month paper trade validation"] },
    security: { custody: "Self-managed", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Model artifacts + bet log in GCS", insurance: null },
    venue_coverage: { primary_venues: ["PINNACLE", "BETFAIR"], backup_venues: ["BET365", "SBOBET"], data_sources: ["API Football", "FootyStats", "Odds API", "Transfermarkt"] },
  },
  {
    strategy_id: "SPORTS_HALFTIME_ML_FOOTBALL", name: "Halftime ML Football", category: "SPORTS", family: "In-Play ML", subcategory: "Football",
    description: "In-play betting that predicts second-half outcomes based on first-half data. Identifies halftime mispricing in live betting markets.",
    how_it_works: "At halftime, ingests first-half data (score, shots, xG, possession, cards, corners, momentum). ML model identifies where in-play odds overweight score and underweight statistical dominance. Places bets in the halftime window.",
    performance: { target_apy_range: [15, 35], expected_sharpe: 1.2, max_drawdown_pct: 18.0, calmar_ratio: 1.3, win_rate_pct: 54, avg_trade_duration: "45 minutes (second half)", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [3.5, -2.0, 4.0, -3.0, 2.5, 3.0, -1.5, 5.0, -2.5, 3.5, 1.5, 3.0], benchmark: "Pre-match model returns" },
    risk: { risk_level: "HIGH", max_position_usd: 150000, max_leverage: 1.0, stop_loss_pct: null, circuit_breakers: ["Bankroll drawdown > 20%", "Halftime data feed delay > 2 minutes", "Model confidence < 55%"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "First-half data not representative (red cards, injuries). Halftime odds window closure before bet placement." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 100000, deposit_currency: ["USD", "EUR"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Pre-funded bookmaker accounts", auto_rebalance: false, rebalance_frequency: "Weekly", rebalance_buffer_pct: 30, withdrawal_notice: "T+1 to T+3", fee_structure: "0/30 (0% mgmt, 30% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "In-play (halftime window)", venues: ["BETFAIR", "PINNACLE"], chains: [], instruments: ["FOOTBALL-MATCH-1X2-LIVE", "FOOTBALL-MATCH-OU-LIVE"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball) + ML inference sidecar", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q3 2026", blockers: ["Halftime data pipeline (API Football live stats)", "In-play odds feed integration", "Halftime window execution timing"] },
    security: { custody: "Self-managed", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Bet state in GCS, match state tracked", insurance: null },
    venue_coverage: { primary_venues: ["BETFAIR"], backup_venues: ["PINNACLE"], data_sources: ["API Football (live)", "Betfair Stream API", "Odds API"] },
  },
  {
    strategy_id: "SPORTS_MARKET_MAKING", name: "Sports Market Making", category: "SPORTS", family: "Market Making", subcategory: "Football",
    description: "Provides liquidity on Betfair Exchange by quoting back/lay prices on football match outcomes. Earns the bid-ask spread while managing exposure.",
    how_it_works: "Quotes back (buy) and lay (sell) on Betfair Exchange for 1X2 markets. Fair value model sets mid-price, spread based on market uncertainty and liability. Manages exposure by adjusting quotes when one side accumulates too much.",
    performance: { target_apy_range: [15, 30], expected_sharpe: 1.8, max_drawdown_pct: 8.0, calmar_ratio: 2.5, win_rate_pct: 56, avg_trade_duration: "Minutes to hours", backtest_period: "2024-07-01 to 2026-04-01", monthly_returns: [2.0, 1.5, 2.5, 0.5, 2.0, 1.0, 3.0, -0.5, 1.0, 2.5, 1.5, 2.0], benchmark: "Betfair Exchange commission yield" },
    risk: { risk_level: "MEDIUM", max_position_usd: 300000, max_leverage: 1.0, stop_loss_pct: 5.0, circuit_breakers: ["Net exposure > 50% of bankroll on single match", "Max drawdown 10%", "Betfair API latency > 500ms"], liquidation_protection: null, correlation_to_btc: 0.0, tail_risk: "Adverse selection from informed bettors. Match manipulation. Betfair platform outage." },
    money_ops: { min_deposit_usd: 50000, recommended_deposit_usd: 200000, deposit_currency: ["GBP", "EUR"], treasury_wallet: "Dedicated sports bankroll", trading_wallet: "Betfair Exchange account", auto_rebalance: true, rebalance_frequency: "Continuous", rebalance_buffer_pct: 20, withdrawal_notice: "T+1", fee_structure: "0/40 (0% mgmt, 40% profit share)", gas_budget_pct: 0 },
    config: { timeframe: "Real-time", venues: ["BETFAIR"], chains: [], instruments: ["FOOTBALL-MATCH-1X2-EXCHANGE"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q3 2026", blockers: ["Betfair Exchange API integration", "Fair value model for football markets", "Liability management engine"] },
    security: { custody: "Self-managed (Betfair account)", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Exposure state in GCS, emergency cancel-all", insurance: null },
    venue_coverage: { primary_venues: ["BETFAIR"], backup_venues: [], data_sources: ["Betfair Stream API", "API Football", "Odds API"] },
  },
];

// =============================================================================
// Prediction Market Strategies (2)
// =============================================================================

const PREDICTION_STRATEGIES: StrategyCatalogEntry[] = [
  {
    strategy_id: "QUANT_PREDICTION_ARB_BTC", name: "Prediction Market Arb (BTC)", category: "PREDICTION", family: "Prediction Arbitrage", subcategory: "BTC",
    description: "Arbitrages pricing between prediction markets (Polymarket) and traditional crypto derivatives. When binary options misprice relative to options-implied probabilities, captures the spread.",
    how_it_works: "Monitors BTC binary contracts on Polymarket and compares to Deribit options-implied probability. When deviation >5%, takes offsetting positions. E.g., if Polymarket prices 'BTC > $80K' at $0.60 but options imply 70%, buys YES tokens and hedges with a put spread.",
    performance: { target_apy_range: [8, 20], expected_sharpe: 1.5, max_drawdown_pct: 8.0, calmar_ratio: 1.8, win_rate_pct: 62, avg_trade_duration: "1-30 days", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [1.5, 0.5, 2.0, -0.5, 1.0, 1.5, -0.3, 2.5, 0.5, 1.5, 0.8, 1.2], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 500000, max_leverage: 1.5, stop_loss_pct: 5.0, circuit_breakers: ["Prediction market liquidity < $50K", "Max drawdown 10%", "Basis between prediction and derivatives > 15%"], liquidation_protection: null, correlation_to_btc: 0.2, tail_risk: "Prediction market resolution disputes. Low liquidity on exit. CLOB market depth insufficient." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 200000, deposit_currency: ["USDC"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Self-custody (Polymarket wallet) + Deribit", auto_rebalance: true, rebalance_frequency: "Daily (basis check)", rebalance_buffer_pct: 10, withdrawal_notice: "T+0 for Polymarket, T+0 for Deribit", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.5 },
    config: { timeframe: "4H", venues: ["POLYMARKET", "DERIBIT"], chains: ["POLYGON"], instruments: ["BTC-BINARY-YES", "BTC-BINARY-NO", "BTC-OPTIONS"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C4", deployment: "D3", business: "B3", status: "PAPER", estimated_launch: "Q3 2026", blockers: ["Polymarket CLOB adapter", "Cross-venue probability model"] },
    security: { custody: "Copper MPC + self-custody", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS, cross-venue reconciliation", insurance: null },
    venue_coverage: { primary_venues: ["POLYMARKET", "DERIBIT"], backup_venues: ["KALSHI"], data_sources: ["Polymarket CLOB API", "MTDS (Deribit options)"] },
  },
  {
    strategy_id: "TRADFI_EVENT_MACRO_PREDICTION", name: "Macro Event Prediction Arb", category: "PREDICTION", family: "Event Arbitrage", subcategory: "Macro",
    description: "Arbitrages macro event prediction markets (Kalshi, Polymarket) against traditional derivatives pricing. Focuses on FOMC rate decisions, CPI prints, and unemployment data.",
    how_it_works: "Compares prediction market contracts (e.g., 'Fed cuts rates in June') with Fed Funds futures implied probabilities. When divergence >3%, takes offsetting positions. Also trades between Polymarket and Kalshi when the same event is priced differently.",
    performance: { target_apy_range: [6, 15], expected_sharpe: 1.4, max_drawdown_pct: 5.0, calmar_ratio: 2.0, win_rate_pct: 65, avg_trade_duration: "1-14 days", backtest_period: "2024-06-01 to 2026-04-01", monthly_returns: [1.0, 0.5, -0.3, 1.5, 0.8, 0.5, 1.2, 0.3, 0.8, -0.2, 1.0, 0.5], benchmark: "Risk-free rate (SOFR)" },
    risk: { risk_level: "MEDIUM", max_position_usd: 300000, max_leverage: 1.0, stop_loss_pct: 3.0, circuit_breakers: ["Prediction market liquidity < $25K", "Max drawdown 7%", "Regulatory uncertainty on prediction markets"], liquidation_protection: null, correlation_to_btc: 0.05, tail_risk: "Prediction market regulatory shutdown. Resolution ambiguity. Low liquidity." },
    money_ops: { min_deposit_usd: 25000, recommended_deposit_usd: 150000, deposit_currency: ["USDC", "USD"], treasury_wallet: "Copper MPC Custody", trading_wallet: "Kalshi account + Polymarket wallet", auto_rebalance: true, rebalance_frequency: "Event-driven", rebalance_buffer_pct: 15, withdrawal_notice: "T+0 to T+3 (varies by platform)", fee_structure: "2/20 (2% mgmt, 20% perf above HWM)", gas_budget_pct: 0.3 },
    config: { timeframe: "1D", venues: ["KALSHI", "POLYMARKET"], chains: ["POLYGON"], instruments: ["FOMC-BINARY", "CPI-BINARY", "NFP-BINARY"], execution_mode: "LIVE", deployment_type: "GCE VM (tarball)", scaling: "Single instance", config_hot_reload: true, schema_version: "4.2.0" },
    readiness: { code: "C3", deployment: "D2", business: "B2", status: "BACKTEST", estimated_launch: "Q4 2026", blockers: ["Kalshi API adapter", "Macro event probability model", "Cross-platform reconciliation"] },
    security: { custody: "Platform-managed + self-custody", key_management: "Secret Manager + runtime injection", audit_trail: true, disaster_recovery: "Position state in GCS", insurance: null },
    venue_coverage: { primary_venues: ["KALSHI", "POLYMARKET"], backup_venues: [], data_sources: ["Kalshi API", "Polymarket CLOB API", "Fed Funds futures", "Macro event calendar"] },
  },
];

// =============================================================================
// Backwards-compatible type alias (consumers reference CatalogStrategy)
// =============================================================================

export type CatalogStrategy = StrategyCatalogEntry;

// =============================================================================
// Combined Catalog Export
// =============================================================================

export const STRATEGY_CATALOG: StrategyCatalogEntry[] = [
  ...DEFI_STRATEGIES,
  ...CEFI_STRATEGIES,
  ...TRADFI_STRATEGIES,
  ...SPORTS_STRATEGIES,
  ...PREDICTION_STRATEGIES,
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getStrategiesByCategory(category: StrategyCatalogEntry["category"]): StrategyCatalogEntry[] {
  return STRATEGY_CATALOG.filter((s) => s.category === category);
}

export function getStrategiesByFamily(family: string): StrategyCatalogEntry[] {
  return STRATEGY_CATALOG.filter((s) => s.family === family);
}

export function getStrategiesByStatus(status: ReadinessStatus): StrategyCatalogEntry[] {
  return STRATEGY_CATALOG.filter((s) => s.readiness.status === status);
}

export function getStrategiesByRiskLevel(riskLevel: RiskLevel): StrategyCatalogEntry[] {
  return STRATEGY_CATALOG.filter((s) => s.risk.risk_level === riskLevel);
}

export function getStrategyById(strategyId: string): StrategyCatalogEntry | undefined {
  return STRATEGY_CATALOG.find((s) => s.strategy_id === strategyId);
}

export function getCatalogSummary(): {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byRiskLevel: Record<string, number>;
  liveCount: number;
  totalTargetCapital: number;
} {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  let liveCount = 0;
  let totalTargetCapital = 0;

  for (const s of STRATEGY_CATALOG) {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    byStatus[s.readiness.status] = (byStatus[s.readiness.status] || 0) + 1;
    byRiskLevel[s.risk.risk_level] = (byRiskLevel[s.risk.risk_level] || 0) + 1;
    if (s.readiness.status === "LIVE") liveCount++;
    totalTargetCapital += s.money_ops.recommended_deposit_usd;
  }

  return {
    total: STRATEGY_CATALOG.length,
    byCategory,
    byStatus,
    byRiskLevel,
    liveCount,
    totalTargetCapital,
  };
}
