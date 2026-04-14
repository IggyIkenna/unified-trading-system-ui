import type { SwapRoute, VenueFill, AlgoType } from "@/lib/types/defi";

export const SWAP_TOKENS = [
  "ETH",
  "USDC",
  "USDT",
  "DAI",
  "weETH",
  "WBTC",
  "LINK",
  "UNI",
  "AAVE",
  "CRV",
  "LDO",
] as const;

export type SwapToken = (typeof SWAP_TOKENS)[number];

// ---------------------------------------------------------------------------
// Reference prices (mock mid-market) — used as baseline for all calculations
// ---------------------------------------------------------------------------

const MOCK_PRICES: Record<string, number> = {
  ETH: 3400,
  WBTC: 67500,
  USDC: 1.0,
  USDT: 1.0,
  DAI: 1.0,
  weETH: 3520, // ~1.035x ETH (staking premium)
  LINK: 18.5,
  UNI: 12.8,
  AAVE: 285,
  CRV: 0.92,
  LDO: 2.45,
  SOL: 185,
};

// ---------------------------------------------------------------------------
// DEX venue definitions with realistic liquidity and fee parameters
// ---------------------------------------------------------------------------

interface DexVenue {
  id: string;
  display: string;
  fee_bps: number;
  /** Liquidity depth — higher = less price impact for large orders */
  depth_usd: number;
  /** Gas cost per swap on this venue (ETH mainnet) */
  gas_eth: number;
  /** Supported pairs (simplified — all pairs via intermediate hops) */
  specialties: string[];
}

const DEX_VENUES: DexVenue[] = [
  {
    id: "UNISWAPV3-ETHEREUM",
    display: "Uniswap V3 (0.05%)",
    fee_bps: 5,
    depth_usd: 85_000_000,
    gas_eth: 0.0038,
    specialties: ["ETH", "USDC", "USDT", "WBTC", "LINK", "UNI"],
  },
  {
    id: "CURVE-ETHEREUM",
    display: "Curve (Stableswap)",
    fee_bps: 1,
    depth_usd: 120_000_000,
    gas_eth: 0.0052,
    specialties: ["USDC", "USDT", "DAI", "weETH", "CRV"],
  },
  {
    id: "BALANCER-ETHEREUM",
    display: "Balancer V2",
    fee_bps: 10,
    depth_usd: 25_000_000,
    gas_eth: 0.0045,
    specialties: ["ETH", "AAVE", "LDO", "weETH", "WBTC"],
  },
  {
    id: "SUSHISWAP-ETHEREUM",
    display: "SushiSwap",
    fee_bps: 30,
    depth_usd: 12_000_000,
    gas_eth: 0.0035,
    specialties: ["ETH", "USDC", "LINK", "UNI", "CRV"],
  },
];

// ---------------------------------------------------------------------------
// Deterministic seeded noise — keeps routes stable across re-renders
// ---------------------------------------------------------------------------

function seededNoise(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Dynamic route generator
// ---------------------------------------------------------------------------

/**
 * Generate a realistic SOR swap route given input parameters.
 * - Splits across 2-4 venues based on amount and liquidity
 * - Price impact scales with amount / venue depth
 * - Gas costs per venue are realistic for Ethereum mainnet
 * - Reference price included for alpha P&L calculation
 */
export function generateSwapRoute(
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  algo: AlgoType = "SOR_DEX",
  chain: string = "ETHEREUM",
): SwapRoute {
  const priceIn = MOCK_PRICES[tokenIn] ?? 1;
  const priceOut = MOCK_PRICES[tokenOut] ?? 1;
  const referencePrice = priceIn / priceOut;
  const notionalUsd = amountIn * priceIn;

  // Determine which venues can handle this pair
  const eligibleVenues = DEX_VENUES.filter(
    (v) => v.specialties.includes(tokenIn) || v.specialties.includes(tokenOut),
  );
  if (eligibleVenues.length === 0) {
    // Fallback to Uniswap
    eligibleVenues.push(DEX_VENUES[0]);
  }

  // SOR allocation: distribute proportional to depth, with noise
  const totalDepth = eligibleVenues.reduce((s, v) => s + v.depth_usd, 0);
  const rawAllocations = eligibleVenues.map((v, i) => {
    const base = v.depth_usd / totalDepth;
    const noise = (seededNoise(amountIn, i) - 0.5) * 0.1;
    return Math.max(0.05, base + noise);
  });
  const allocSum = rawAllocations.reduce((s, a) => s + a, 0);
  const allocations = rawAllocations.map((a) => a / allocSum);

  // For TWAP algo, concentrate on top 2 venues
  const isTwap = algo === "SOR_TWAP";
  const activeCount = isTwap ? Math.min(2, eligibleVenues.length) : eligibleVenues.length;

  // Build per-venue fills
  const venueFills: VenueFill[] = [];
  let totalOutput = 0;
  let totalGasEth = 0;
  let totalGasUsd = 0;
  const ethPrice = MOCK_PRICES.ETH;

  for (let i = 0; i < activeCount; i++) {
    const venue = eligibleVenues[i];
    const alloc = i < activeCount - 1 ? allocations[i] : 1 - allocations.slice(0, activeCount - 1).reduce((s, a) => s + a, 0);
    const venueNotional = notionalUsd * alloc;
    const venueAmountIn = amountIn * alloc;

    // Price impact: sqrt of (notional / depth) — realistic AMM impact model
    const impactBps = Math.sqrt(venueNotional / venue.depth_usd) * 100;
    // Apply noise for realism
    const impactWithNoise = impactBps * (1 + (seededNoise(venueNotional, i + 7) - 0.5) * 0.3);
    const roundedImpact = Math.round(impactWithNoise * 100) / 100;

    // Fill price = reference price adjusted by impact + fee
    const totalCostBps = roundedImpact + venue.fee_bps;
    const fillPrice = referencePrice * (1 - totalCostBps / 10000);
    const fillQty = venueAmountIn * fillPrice;

    const gasUsd = venue.gas_eth * ethPrice;

    venueFills.push({
      venue: venue.id,
      venue_display: venue.display,
      allocation_pct: Math.round(alloc * 10000) / 100,
      input_amount: Math.round(venueAmountIn * 10000) / 10000,
      fill_price: Math.round(fillPrice * 1e8) / 1e8,
      fill_qty: Math.round(fillQty * 10000) / 10000,
      price_impact_bps: roundedImpact,
      gas_usd: Math.round(gasUsd * 100) / 100,
      fee_bps: venue.fee_bps,
    });

    totalOutput += fillQty;
    totalGasEth += venue.gas_eth;
    totalGasUsd += gasUsd;
  }

  // Aggregate price impact (weighted by allocation)
  const weightedImpact = venueFills.reduce(
    (s, f) => s + f.price_impact_bps * (f.allocation_pct / 100),
    0,
  );

  // Build path description
  const isStableSwap = ["USDC", "USDT", "DAI"].includes(tokenIn) && ["USDC", "USDT", "DAI"].includes(tokenOut);
  const path = isStableSwap ? [tokenIn, tokenOut] : [tokenIn, "WETH", tokenOut].filter((t, i, a) => a.indexOf(t) === i);
  const pools = venueFills.map(
    (f) => `${f.venue_display} ${f.allocation_pct.toFixed(1)}%`,
  );

  return {
    path,
    pools,
    priceImpactPct: Math.round(weightedImpact) / 100,
    expectedOutput: Math.round(totalOutput * 10000) / 10000,
    gasEstimateEth: Math.round(totalGasEth * 10000) / 10000,
    gasEstimateUsd: Math.round(totalGasUsd * 100) / 100,
    algo_type: algo,
    venue_fills: venueFills,
    reference_price: Math.round(referencePrice * 1e8) / 1e8,
  };
}

/** Legacy static route for backwards compatibility */
export const MOCK_SWAP_ROUTE: SwapRoute = generateSwapRoute("ETH", "USDC", 1);

/** Get mock mid-market price for a token */
export function getMockPrice(token: string): number {
  return MOCK_PRICES[token] ?? 1;
}
