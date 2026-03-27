/** DeFi widget domain types (mock-backed until API exists). */

export interface LendingProtocol {
  name: string;
  assets: string[];
  supplyApy: Record<string, number>;
  borrowApy: Record<string, number>;
}

export interface SwapRoute {
  path: string[];
  pools: string[];
  priceImpactPct: number;
  expectedOutput: number;
  gasEstimateEth: number;
  gasEstimateUsd: number;
}

export interface LiquidityPool {
  name: string;
  token0: string;
  token1: string;
  feeTier: number;
  tvl: number;
  apr24h: number;
}

export interface StakingProtocol {
  name: string;
  asset: string;
  apy: number;
  tvl: number;
  minStake: number;
  unbondingDays: number;
}

export interface FlashLoanStep {
  id: string;
  operationType: string;
  asset: string;
  amount: string;
  venue: string;
}

export interface DeFiFlashPnl {
  grossProfit: number;
  flashFee: number;
  gasEstimate: number;
  netPnl: number;
}

/** Params passed to mock execution (maps to `placeMockOrder`). */
export interface DeFiOrderParams {
  client_id: string;
  instrument_id: string;
  venue: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  quantity: number;
  price: number;
  asset_class: "DeFi";
  lane: "defi";
}

export interface DeFiRatesRow {
  id: string;
  protocol: string;
  category: "Lending supply" | "Lending borrow" | "Staking" | "LP";
  detail: string;
  apyPct: number;
  tvlUsd: number;
}
