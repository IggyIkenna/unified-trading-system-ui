/** DeFi atomic bundle configuration — operation types, tokens, and pre-built templates. */

export const DEFI_OPERATIONS = [
  { value: "SWAP", label: "Swap (Uniswap)", venue: "Uniswap" },
  { value: "FLASH_BORROW", label: "Flash Loan (Aave)", venue: "Aave" },
  { value: "FLASH_REPAY", label: "Flash Repay (Aave)", venue: "Aave" },
  { value: "LEND", label: "Approve Token", venue: "Uniswap" },
  { value: "STAKE", label: "Stake", venue: "Lido" },
  { value: "UNSTAKE", label: "Unstake", venue: "Lido" },
  { value: "TRANSFER", label: "Bridge (Cross-chain)", venue: "Hyperliquid" },
  { value: "ADD_LIQUIDITY", label: "Add Liquidity", venue: "Uniswap" },
  { value: "REMOVE_LIQUIDITY", label: "Remove Liquidity", venue: "Uniswap" },
] as const;

export const DEFI_TOKENS = ["ETH", "WETH", "USDC", "USDT", "DAI", "WBTC", "stETH", "LINK", "AAVE", "UNI"] as const;

export interface DefiOp {
  id: string;
  operationType: string;
  token: string;
  amount: string;
  estimatedGas: number;
}

export interface DefiTemplate {
  name: string;
  description: string;
  operations: DefiOp[];
  estimatedGas: number;
  estimatedProfit: number;
}

export const DEFI_TEMPLATES: DefiTemplate[] = [
  {
    name: "Flash Loan Arb",
    description: "Flash Loan -> Swap -> Swap -> Repay",
    operations: [
      { id: "t1-1", operationType: "FLASH_BORROW", token: "ETH", amount: "100", estimatedGas: 145_000 },
      { id: "t1-2", operationType: "SWAP", token: "ETH", amount: "100", estimatedGas: 185_000 },
      { id: "t1-3", operationType: "SWAP", token: "USDC", amount: "345,600", estimatedGas: 185_000 },
      { id: "t1-4", operationType: "FLASH_REPAY", token: "ETH", amount: "100.05", estimatedGas: 145_000 },
    ],
    estimatedGas: 660_000,
    estimatedProfit: 130,
  },
  {
    name: "Leverage Long",
    description: "Flash Loan -> Supply Collateral -> Borrow -> Swap -> Repay",
    operations: [
      { id: "t2-1", operationType: "FLASH_BORROW", token: "USDC", amount: "50,000", estimatedGas: 145_000 },
      { id: "t2-2", operationType: "LEND", token: "USDC", amount: "50,000", estimatedGas: 120_000 },
      { id: "t2-3", operationType: "SWAP", token: "USDC", amount: "50,000", estimatedGas: 185_000 },
      { id: "t2-4", operationType: "SWAP", token: "ETH", amount: "14.5", estimatedGas: 185_000 },
      { id: "t2-5", operationType: "FLASH_REPAY", token: "USDC", amount: "50,045", estimatedGas: 145_000 },
    ],
    estimatedGas: 780_000,
    estimatedProfit: -22,
  },
  {
    name: "Yield Harvest",
    description: "Claim Rewards -> Swap to USDC -> Bridge to L1",
    operations: [
      { id: "t3-1", operationType: "REMOVE_LIQUIDITY", token: "UNI", amount: "450", estimatedGas: 95_000 },
      { id: "t3-2", operationType: "SWAP", token: "UNI", amount: "450", estimatedGas: 185_000 },
      { id: "t3-3", operationType: "TRANSFER", token: "USDC", amount: "4,200", estimatedGas: 210_000 },
    ],
    estimatedGas: 490_000,
    estimatedProfit: 4_180,
  },
];

export const GAS_PRICE_GWEI = 24;

export const GAS_ESTIMATES: Record<string, number> = {
  SWAP: 185_000,
  FLASH_BORROW: 145_000,
  FLASH_REPAY: 145_000,
  LEND: 120_000,
  STAKE: 130_000,
  UNSTAKE: 130_000,
  TRANSFER: 210_000,
  ADD_LIQUIDITY: 250_000,
  REMOVE_LIQUIDITY: 95_000,
};

export function gasToUsd(gasUnits: number): number {
  const ethPrice = 3_200;
  return gasUnits * GAS_PRICE_GWEI * 1e-9 * ethPrice;
}
