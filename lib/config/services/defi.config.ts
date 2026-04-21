/**
 * DeFi reference data — fee tiers, instruction types, algos, venues.
 *
 * All values aligned with backend (UAC + execution-service).
 * Display names are frontend-only; IDs match backend exactly.
 */

export const DEFI_FEE_TIERS = [
  { value: "0.01", label: "0.01%", description: "Stable pairs" },
  { value: "0.05", label: "0.05%", description: "Standard" },
  { value: "0.3", label: "0.30%", description: "Most pairs" },
  { value: "1", label: "1.00%", description: "Exotic pairs" },
] as const;

/** All DeFi instruction types (matches backend OperationType enum). */
export const DEFI_INSTRUCTION_TYPES = [
  { value: "TRANSFER", label: "Transfer", description: "Move tokens between wallets" },
  { value: "SWAP", label: "Swap", description: "DEX token swap via SOR" },
  { value: "LEND", label: "Lend / Supply", description: "Supply to lending protocol" },
  { value: "BORROW", label: "Borrow", description: "Borrow against collateral" },
  { value: "WITHDRAW", label: "Withdraw", description: "Withdraw from lending protocol" },
  { value: "REPAY", label: "Repay", description: "Repay borrowed amount" },
  { value: "TRADE", label: "Trade (Perp)", description: "CeFi perpetual trade" },
  { value: "STAKE", label: "Stake", description: "Stake for yield (LST)" },
  { value: "UNSTAKE", label: "Unstake", description: "Unstake / redeem LST" },
  { value: "FLASH_BORROW", label: "Flash Borrow", description: "Flash loan borrow (atomic)" },
  { value: "FLASH_REPAY", label: "Flash Repay", description: "Flash loan repay (atomic)" },
  { value: "ADD_LIQUIDITY", label: "Add Liquidity", description: "Provide LP to pool" },
  { value: "REMOVE_LIQUIDITY", label: "Remove Liquidity", description: "Withdraw LP from pool" },
  { value: "REBALANCE_RANGE", label: "Rebalance Range", description: "Rebalance LP tick range" },
  { value: "COLLECT_FEES", label: "Collect Fees", description: "Collect LP fee income" },
] as const;

/** Algo types with descriptions (matches execution-service algo_library). */
export const DEFI_ALGO_TYPES = [
  { value: "SOR_DEX", label: "Smart Order Router (DEX)", description: "Routes across Uniswap/Curve/Balancer" },
  { value: "SOR_TWAP", label: "SOR TWAP", description: "Time-weighted SOR across DEXes" },
  { value: "SOR_CROSS_CHAIN", label: "Cross-Chain SOR", description: "Routes across chains with bridge" },
  { value: "BENCHMARK_FILL", label: "Benchmark Fill", description: "Fill at oracle benchmark price" },
  { value: "DIRECT_MARKET", label: "Direct Market", description: "Direct to venue, no routing" },
  { value: "DIRECT", label: "Direct", description: "Simple transfer, no algo" },
  { value: "FLASH_LOAN_MORPHO", label: "Flash Loan (Morpho)", description: "Morpho flash loan (0% fee)" },
  { value: "FLASH_LOAN_AAVE", label: "Flash Loan (AAVE)", description: "AAVE flash loan (0.05% fee)" },
  { value: "AMM_CONCENTRATED", label: "AMM Concentrated", description: "Uniswap V3/V4 concentrated LP" },
] as const;

/** Canonical DeFi venues with display names. */
export const DEFI_VENUE_DISPLAY: Record<string, string> = {
  // EVM Lending
  "AAVEV3-ETHEREUM": "Aave V3 (Ethereum)",
  "AAVEV3-ARBITRUM": "Aave V3 (Arbitrum)",
  "AAVEV3-BASE": "Aave V3 (Base)",
  "AAVEV3-OPTIMISM": "Aave V3 (Optimism)",
  "AAVEV3-POLYGON": "Aave V3 (Polygon)",
  "MORPHO-ETHEREUM": "Morpho (Ethereum)",
  "COMPOUNDV3-ETHEREUM": "Compound V3 (Ethereum)",
  // EVM DEX
  "UNISWAPV3-ETHEREUM": "Uniswap V3 (Ethereum)",
  "UNISWAPV3-ARBITRUM": "Uniswap V3 (Arbitrum)",
  "UNISWAPV3-BASE": "Uniswap V3 (Base)",
  "UNISWAPV4-ETHEREUM": "Uniswap V4 (Ethereum)",
  "CURVE-ETHEREUM": "Curve (Ethereum)",
  "BALANCER-ETHEREUM": "Balancer (Ethereum)",
  "BALANCER-ARBITRUM": "Balancer (Arbitrum)",
  // LST / Yield
  "ETHENA-ETHEREUM": "Ethena (Ethereum)",
  "ETHERFI-ETHEREUM": "EtherFi (Ethereum)",
  "LIDO-ETHEREUM": "Lido (Ethereum)",
  // CeFi Perps
  HYPERLIQUID: "Hyperliquid",
  "BINANCE-FUTURES": "Binance Futures",
  OKX: "OKX",
  BYBIT: "Bybit",
  ASTER: "Aster",
  // Solana
  "ORCA-SOLANA": "Orca (Solana)",
  "RAYDIUM-SOLANA": "Raydium (Solana)",
  "KAMINO-SOLANA": "Kamino (Solana)",
  "DRIFT-SOLANA": "Drift (Solana)",
  "MARINADE-SOLANA": "Marinade (Solana)",
};

/** Default slippage options (bps). */
export const SLIPPAGE_OPTIONS = [
  { value: 10, label: "0.1%" },
  { value: 30, label: "0.3%" },
  { value: 50, label: "0.5%" },
  { value: 100, label: "1.0%" },
  { value: 300, label: "3.0%" },
] as const;

/** Flash loan operation types (kept for backward compat with flash widget). */
export const FLASH_OPERATION_TYPES = [
  "SWAP",
  "LEND",
  "BORROW",
  "REPAY",
  "WITHDRAW",
  "ADD_LIQUIDITY",
  "REMOVE_LIQUIDITY",
  "TRADE",
  "TRANSFER",
] as const;

/** Flash loan venues (canonical IDs). */
export const FLASH_VENUES = [
  "UNISWAPV3-ETHEREUM",
  "CURVE-ETHEREUM",
  "AAVEV3-ETHEREUM",
  "BALANCER-ETHEREUM",
  "MORPHO-ETHEREUM",
] as const;

/** Canonical DeFi chain identifiers (matches backend chain enum). */
export const DEFI_CHAINS = [
  "ETHEREUM",
  "ARBITRUM",
  "OPTIMISM",
  "BASE",
  "POLYGON",
  "BSC",
  "AVALANCHE",
  "LINEA",
  "SOLANA",
] as const;

/** Standard DeFi token symbols for transfers and swaps. */
export const DEFI_TOKENS = ["ETH", "USDC", "USDT", "WETH", "WBTC", "DAI"] as const;

/** Gas token minimum thresholds — below = insufficient gas warning. */
export const GAS_TOKEN_MIN_THRESHOLDS: Record<string, number> = {
  ETH: 0.01,
  MATIC: 1.0,
  BNB: 0.005,
  AVAX: 0.1,
  SOL: 0.05,
};

/**
 * Mock per-chain native-transfer gas estimates (native-token qty + USD-equivalent).
 * Used by defi-transfer widget pre-execution. Replace with live gas oracle feed
 * when L3 wiring lands.
 */
export type TransferGasEstimate = {
  nativeQty: number;
  nativeSymbol: string;
  usd: number;
};

export const TRANSFER_GAS_ESTIMATES: Record<string, TransferGasEstimate> = {
  ETHEREUM: { nativeQty: 0.0012, nativeSymbol: "ETH", usd: 4.08 },
  ARBITRUM: { nativeQty: 0.00004, nativeSymbol: "ETH", usd: 0.14 },
  OPTIMISM: { nativeQty: 0.00005, nativeSymbol: "ETH", usd: 0.17 },
  BASE: { nativeQty: 0.00003, nativeSymbol: "ETH", usd: 0.1 },
  POLYGON: { nativeQty: 0.008, nativeSymbol: "MATIC", usd: 0.07 },
  BSC: { nativeQty: 0.0005, nativeSymbol: "BNB", usd: 0.17 },
  AVALANCHE: { nativeQty: 0.002, nativeSymbol: "AVAX", usd: 0.05 },
  LINEA: { nativeQty: 0.00004, nativeSymbol: "ETH", usd: 0.14 },
  SOLANA: { nativeQty: 0.00025, nativeSymbol: "SOL", usd: 0.05 },
};

export const TRANSFER_GAS_ESTIMATE_DEFAULT: TransferGasEstimate = {
  nativeQty: 0.0012,
  nativeSymbol: "ETH",
  usd: 4.08,
};

/** Funding-rate matrix venues (column headers for defi-funding-matrix widget). */
export const FUNDING_RATE_VENUES = ["HYPERLIQUID", "OKX", "BYBIT", "BINANCE", "ASTER"] as const;

/** Funding rates below this threshold (%) are greyed out in the matrix. */
export const FUNDING_RATE_FLOOR = 2.5;
