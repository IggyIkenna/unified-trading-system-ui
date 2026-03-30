import type {
  DeFiReconciliationRecord,
  DeltaExposure,
  PortfolioDeltaComposite,
  RebalancePreview,
  StrategyRiskProfile,
  TreasurySnapshot,
  TradeHistoryRow,
} from "@/lib/types/defi";

// ---------------------------------------------------------------------------
// Per-Strategy Risk Profiles
// ---------------------------------------------------------------------------

export const STRATEGY_RISK_PROFILES: StrategyRiskProfile[] = [
  {
    strategy_id: "AAVE_LENDING",
    protocol_risk: "low",
    coin_isolated_risk: "low",
    basis_risk: "low",
    funding_rate_risk: "low",
    liquidity_risk_pct: 0.05,
    risk_notes: "Pure lending. No leverage, no perp. Risk = AAVE smart contract + stablecoin depeg.",
  },
  {
    strategy_id: "BASIS_TRADE",
    protocol_risk: "low",
    coin_isolated_risk: "low",
    basis_risk: "medium",
    funding_rate_risk: "high",
    liquidity_risk_pct: 0.35,
    risk_notes: "Delta neutral. Risk = funding reversal across all 5 venues simultaneously.",
  },
  {
    strategy_id: "STAKED_BASIS",
    protocol_risk: "medium",
    coin_isolated_risk: "medium",
    basis_risk: "medium",
    funding_rate_risk: "medium",
    liquidity_risk_pct: 0.50,
    risk_notes: "weETH/ETH basis risk + funding rate. 20-35 bps slippage on weETH exit.",
  },
  {
    strategy_id: "RECURSIVE_STAKED_BASIS",
    protocol_risk: "medium",
    coin_isolated_risk: "medium",
    basis_risk: "high",
    funding_rate_risk: "medium",
    liquidity_risk_pct: 0.80,
    risk_notes: "2.5x leveraged. AAVE liquidation at HF<1.0. Flash loan atomic risk. weETH depeg amplified.",
  },
  {
    strategy_id: "UNHEDGED_RECURSIVE",
    protocol_risk: "medium",
    coin_isolated_risk: "high",
    basis_risk: "low",
    funding_rate_risk: "low",
    liquidity_risk_pct: 1.20,
    risk_notes: "Directional ETH exposure at 2.5x. No perp hedge. Full downside risk amplified by leverage.",
  },
  {
    strategy_id: "ETHENA_BENCHMARK",
    protocol_risk: "medium",
    coin_isolated_risk: "medium",
    basis_risk: "low",
    funding_rate_risk: "low",
    liquidity_risk_pct: 0.15,
    risk_notes: "USDe depeg risk (tail). Ethena protocol custody risk. Otherwise passive.",
  },
  {
    strategy_id: "AMM_LP",
    protocol_risk: "low",
    coin_isolated_risk: "medium",
    basis_risk: "low",
    funding_rate_risk: "low",
    liquidity_risk_pct: 0.60,
    risk_notes: "Concentrated IL amplified by range width. Out-of-range = no fees. Rebalance cost.",
  },
];

// ---------------------------------------------------------------------------
// Delta Neutrality
// ---------------------------------------------------------------------------

export const MOCK_DELTA_EXPOSURES: DeltaExposure[] = [
  {
    strategy_id: "AAVE_LENDING",
    neutral_to: "USD",
    net_delta_usd: 0,
    net_delta_eth: 0,
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 0,
    max_deviation_pct: 100, // not delta neutral, lending only
  },
  {
    strategy_id: "BASIS_TRADE",
    neutral_to: "USD",
    net_delta_usd: 0,
    net_delta_eth: 0.3, // slight drift from rebalance timing
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 0.3,
    max_deviation_pct: 2.0,
  },
  {
    strategy_id: "STAKED_BASIS",
    neutral_to: "USD",
    net_delta_usd: 0,
    net_delta_eth: -0.5, // weETH/ETH basis drift
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 0.5,
    max_deviation_pct: 2.0,
  },
  {
    strategy_id: "RECURSIVE_STAKED_BASIS",
    neutral_to: "USD",
    net_delta_usd: 0,
    net_delta_eth: 1.2, // leveraged drift at 2.5x
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 1.2,
    max_deviation_pct: 5.0,
  },
  {
    strategy_id: "UNHEDGED_RECURSIVE",
    neutral_to: "ETH", // coin+yield share class
    net_delta_usd: 360000, // $360K directional ETH
    net_delta_eth: 120, // 120 ETH LONG (intentional)
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 0, // 0 = on target (it's supposed to be long)
    max_deviation_pct: 100,
  },
  {
    strategy_id: "ETHENA_BENCHMARK",
    neutral_to: "USD",
    net_delta_usd: 0,
    net_delta_eth: 0,
    net_delta_sol: 0,
    net_delta_btc: 0,
    delta_deviation_pct: 0,
    max_deviation_pct: 1.0,
  },
];

export const MOCK_PORTFOLIO_DELTA: PortfolioDeltaComposite = {
  total_delta_usd: 360000, // from unhedged recursive
  total_delta_eth: 121.0,
  total_delta_sol: 0,
  total_delta_btc: 0,
  per_strategy: MOCK_DELTA_EXPOSURES,
  total_liquidation_cost_pct: 0.45,
};

// ---------------------------------------------------------------------------
// Treasury Snapshot
// ---------------------------------------------------------------------------

export const MOCK_TREASURY: TreasurySnapshot = {
  timestamp: "2026-03-30T10:00:00Z",
  chain: "ETHEREUM",
  custodian: "copper",
  treasury_balance_usd: 350000,
  total_trading_balance_usd: 1650000,
  total_aum_usd: 2000000,
  treasury_pct: 17.5,
  status: "normal",
  per_strategy_balance: {
    AAVE_LENDING: 400000,
    BASIS_TRADE: 500000,
    STAKED_BASIS: 250000,
    RECURSIVE_STAKED_BASIS: 360000,
    UNHEDGED_RECURSIVE: 0,
    ETHENA_BENCHMARK: 100000,
    ETH_LENDING: 0,
    BTC_BASIS: 0,
    SOL_BASIS: 0,
    L2_BASIS: 0,
    MULTICHAIN_LENDING: 40000,
    CROSS_CHAIN_YIELD_ARB: 0,
    CROSS_CHAIN_SOR: 0,
    AMM_LP: 0,
  },
  per_token_balance: {
    USDC: 200000,
    USDT: 100000,
    ETH: 15, // ~$45K
    DAI: 5000,
  },
};

// ---------------------------------------------------------------------------
// Rebalance Preview
// ---------------------------------------------------------------------------

export const MOCK_REBALANCE_PREVIEW: RebalancePreview = {
  treasury_current_pct: 35,
  treasury_target_pct: 20,
  treasury_balance_usd: 700000,
  total_aum_usd: 2000000,
  action: "deploy",
  allocations: [
    {
      strategy_id: "AAVE_LENDING",
      current_balance_usd: 400000,
      proposed_change_usd: 120000,
      instructions: [],
    },
    {
      strategy_id: "BASIS_TRADE",
      current_balance_usd: 500000,
      proposed_change_usd: 100000,
      instructions: [],
    },
    {
      strategy_id: "RECURSIVE_STAKED_BASIS",
      current_balance_usd: 360000,
      proposed_change_usd: 80000,
      instructions: [],
    },
  ],
  total_instructions: 15,
  estimated_gas_usd: 85,
};

// ---------------------------------------------------------------------------
// DeFi Reconciliation
// ---------------------------------------------------------------------------

export const DEFI_RECONCILIATION_RECORDS: DeFiReconciliationRecord[] = [
  {
    id: "DREC-001",
    date: "2026-03-30",
    venue: "AAVEV3-ETHEREUM",
    instrument_id: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM",
    break_type: "position",
    on_chain_value: 100013.25,
    system_value: 100000.00,
    delta: 13.25,
    delta_pct: 0.013,
    status: "pending",
    resolution: undefined,
  },
  {
    id: "DREC-002",
    date: "2026-03-30",
    venue: "HYPERLIQUID",
    instrument_id: "HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID",
    break_type: "position",
    on_chain_value: -30.05,
    system_value: -30.00,
    delta: -0.05,
    delta_pct: 0.167,
    status: "resolved",
    resolution: "chain_correct",
  },
  {
    id: "DREC-003",
    date: "2026-03-29",
    venue: "UNISWAPV3-ETHEREUM",
    instrument_id: "UNISWAPV3-ETHEREUM:POOL:ETH-USDC",
    break_type: "fee",
    on_chain_value: 45.82,
    system_value: 44.50,
    delta: 1.32,
    delta_pct: 2.97,
    status: "investigating",
    resolution: undefined,
  },
  {
    id: "DREC-004",
    date: "2026-03-29",
    venue: "AAVEV3-ETHEREUM",
    instrument_id: "AAVEV3-ETHEREUM:DEBT_TOKEN:DEBTWETH@ETHEREUM",
    break_type: "balance",
    on_chain_value: 96.002,
    system_value: 96.000,
    delta: 0.002,
    delta_pct: 0.002,
    status: "resolved",
    resolution: "system_correct",
  },
  {
    id: "DREC-005",
    date: "2026-03-28",
    venue: "ETHENA-ETHEREUM",
    instrument_id: "ETHENA-ETHEREUM:YIELD_BEARING:SUSDE@ETHEREUM",
    break_type: "pnl",
    on_chain_value: 268.50,
    system_value: 265.00,
    delta: 3.50,
    delta_pct: 1.32,
    status: "resolved",
    resolution: "chain_correct",
  },
];

// ---------------------------------------------------------------------------
// Trade History (running totals for AAVE Lending example)
// ---------------------------------------------------------------------------

export const MOCK_TRADE_HISTORY: TradeHistoryRow[] = [
  {
    seq: 1,
    timestamp: "2026-03-30T10:01:00Z",
    instruction_type: "TRANSFER",
    algo_type: "DIRECT",
    instrument_id: "WALLET:SPOT_ASSET:USDC",
    venue: "WALLET",
    amount: 100000,
    price: 1.0,
    expected_output: 100000,
    actual_output: 100000,
    instant_pnl: {
      gross_pnl: 0,
      price_slippage_usd: 0,
      gas_cost_usd: 2.0,
      trading_fee_usd: 0,
      bridge_fee_usd: 0,
      net_pnl: -2.0,
      slippage_exceeded: false,
    },
    running_pnl: -2.0,
    status: "filled",
    tx_hash: "0xabc123...def",
  },
  {
    seq: 2,
    timestamp: "2026-03-30T10:02:00Z",
    instruction_type: "LEND",
    algo_type: "BENCHMARK_FILL",
    instrument_id: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM",
    venue: "AAVEV3-ETHEREUM",
    amount: 100000,
    price: 1.0,
    expected_output: 100000,
    actual_output: 100000,
    instant_pnl: {
      gross_pnl: 0,
      price_slippage_usd: 0,
      gas_cost_usd: 12.0,
      trading_fee_usd: 0,
      bridge_fee_usd: 0,
      net_pnl: -12.0,
      slippage_exceeded: false,
    },
    running_pnl: -14.0,
    status: "filled",
    tx_hash: "0xdef456...abc",
  },
  {
    seq: 3,
    timestamp: "2026-03-30T23:59:59Z",
    instruction_type: "LEND",
    algo_type: "BENCHMARK_FILL",
    instrument_id: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM",
    venue: "AAVEV3-ETHEREUM",
    amount: 0,
    price: 1.0,
    expected_output: 13.15,
    actual_output: 13.15,
    instant_pnl: {
      gross_pnl: 13.15,
      price_slippage_usd: 0,
      gas_cost_usd: 0,
      trading_fee_usd: 0,
      bridge_fee_usd: 0,
      net_pnl: 13.15,
      slippage_exceeded: false,
    },
    running_pnl: -0.85,
    status: "filled",
  },
];
