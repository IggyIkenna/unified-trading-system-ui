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
 * DeFi gas-fee model (EIP-1559 style).
 *
 * Real-world gas = gasUnits × (baseFeeGwei + priorityFeeGwei) × 1e-9, priced in
 * native token; USD = nativeFee × nativeUsd.
 *
 * - `gasUnits` is fixed per operation type (on-chain compute cost) and
 *   independent of the amount transferred.
 * - `baseFeeGwei` updates every block on-chain (~12s Ethereum, ~2s L2).
 * - `priorityFeeGwei` is the wallet-suggested tip.
 * - `nativeUsd` is the spot price of the chain's gas token.
 *
 * Mock: seed values below drive a jitter-based oracle in useGasEstimate until
 * the backend / gas oracle (Blocknative, eth_feeHistory, etc.) is wired in.
 */
export type DefiGasOperation = "NATIVE_TRANSFER" | "ERC20_TRANSFER" | "BRIDGE_LOCK";

export const DEFI_GAS_UNITS: Record<DefiGasOperation, number> = {
  NATIVE_TRANSFER: 21_000,
  ERC20_TRANSFER: 65_000,
  BRIDGE_LOCK: 120_000,
};

export type ChainGasBaseline = {
  baseFeeGwei: number;
  priorityFeeGwei: number;
  nativeSymbol: string;
  nativeUsd: number;
};

/**
 * Typical-condition baselines per supported chain. Tuned so a NATIVE_TRANSFER
 * (21k gas) produces a realistic USD fee on each chain.
 */
export const CHAIN_GAS_BASELINE: Record<string, ChainGasBaseline> = {
  ETHEREUM: { baseFeeGwei: 45, priorityFeeGwei: 12, nativeSymbol: "ETH", nativeUsd: 3400 },
  ARBITRUM: { baseFeeGwei: 1.9, priorityFeeGwei: 0.06, nativeSymbol: "ETH", nativeUsd: 3400 },
  OPTIMISM: { baseFeeGwei: 2.3, priorityFeeGwei: 0.08, nativeSymbol: "ETH", nativeUsd: 3400 },
  BASE: { baseFeeGwei: 1.3, priorityFeeGwei: 0.05, nativeSymbol: "ETH", nativeUsd: 3400 },
  POLYGON: { baseFeeGwei: 350, priorityFeeGwei: 30, nativeSymbol: "MATIC", nativeUsd: 0.85 },
  BSC: { baseFeeGwei: 3, priorityFeeGwei: 0, nativeSymbol: "BNB", nativeUsd: 600 },
  AVALANCHE: { baseFeeGwei: 25, priorityFeeGwei: 2, nativeSymbol: "AVAX", nativeUsd: 35 },
  LINEA: { baseFeeGwei: 1.9, priorityFeeGwei: 0.06, nativeSymbol: "ETH", nativeUsd: 3400 },
  // Solana doesn't use gwei; baseline normalised so 21k units × 12 ≈ 0.00025 SOL.
  SOLANA: { baseFeeGwei: 12, priorityFeeGwei: 0, nativeSymbol: "SOL", nativeUsd: 200 },
};

export const CHAIN_GAS_BASELINE_DEFAULT: ChainGasBaseline = CHAIN_GAS_BASELINE.ETHEREUM!;

/** Mock gas-oracle tick interval (ms). Production WS push replaces this. */
export const DEFI_GAS_TICK_MS = 5000;

/** Funding-rate matrix venues (column headers for defi-funding-matrix widget). */
export const FUNDING_RATE_VENUES = ["HYPERLIQUID", "OKX", "BYBIT", "BINANCE", "ASTER"] as const;

/** Funding rates below this threshold (%) are greyed out in the matrix. */
export const FUNDING_RATE_FLOOR = 2.5;
