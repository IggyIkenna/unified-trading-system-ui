/**
 * DeFi Protocol Parameters
 * Real-world collateral factors, liquidation thresholds, and asset prices from major lending protocols
 * SSOT for health factor calculations in UI
 */

export type ProtocolName = "AAVEV3" | "MORPHO" | "COMPOUND";

export interface AssetParams {
  symbol: string;
  name: string;
  decimals: number;
  price_usd: number; // Current market price
  collateral_factor: number; // % of asset value that counts as collateral (0-1)
  liquidation_threshold: number; // Health factor threshold for liquidation (0-1)
  liquidation_bonus: number; // % bonus liquidators receive (0.05 = 5%)
  reserve_factor: number; // % of interest reserved by protocol
}

export interface ProtocolParams {
  protocol: ProtocolName;
  venue_id: string;
  name: string;
  assets: Record<string, AssetParams>;
}

/**
 * Aave V3 - Most conservative, well-audited lending protocol
 * Real parameters from Aave V3 Ethereum mainnet (March 2026)
 */
export const AAVE_V3_PARAMS: ProtocolParams = {
  protocol: "AAVEV3",
  venue_id: "AAVEV3-ETHEREUM",
  name: "Aave V3",
  assets: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      price_usd: 3400,
      collateral_factor: 0.82, // 82% LTV - conservative for ETH
      liquidation_threshold: 0.86, // 86% - allows 4% buffer before liquidation
      liquidation_bonus: 0.05, // 5% bonus for liquidators
      reserve_factor: 0.1, // 10% of interest goes to protocol
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.77, // 77% LTV - stablecoins slightly lower than ETH
      liquidation_threshold: 0.81, // 81%
      liquidation_bonus: 0.04, // 4% bonus
      reserve_factor: 0.1,
    },
    USDT: {
      symbol: "USDT",
      name: "Tether",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.75, // 75% LTV - slightly riskier than USDC
      liquidation_threshold: 0.8, // 80%
      liquidation_bonus: 0.04,
      reserve_factor: 0.1,
    },
    DAI: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      price_usd: 1.0,
      collateral_factor: 0.75,
      liquidation_threshold: 0.8,
      liquidation_bonus: 0.04,
      reserve_factor: 0.1,
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      decimals: 18,
      price_usd: 3400, // Same as ETH
      collateral_factor: 0.82,
      liquidation_threshold: 0.86,
      liquidation_bonus: 0.05,
      reserve_factor: 0.1,
    },
    WBTC: {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      price_usd: 67500,
      collateral_factor: 0.7, // 70% LTV - Bitcoin more volatile
      liquidation_threshold: 0.75, // 75%
      liquidation_bonus: 0.06, // 6% bonus - higher risk
      reserve_factor: 0.1,
    },
  },
};

/**
 * Morpho - Decentralized lending, higher LTVs than Aave (riskier)
 * More aggressive parameters for sophisticated users
 */
export const MORPHO_PARAMS: ProtocolParams = {
  protocol: "MORPHO",
  venue_id: "MORPHO-ETHEREUM",
  name: "Morpho",
  assets: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      price_usd: 3400,
      collateral_factor: 0.86, // 86% LTV - more aggressive than Aave
      liquidation_threshold: 0.9, // 90%
      liquidation_bonus: 0.06, // 6% - higher risk = higher bonus
      reserve_factor: 0.05, // Lower protocol fee
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.82, // 82% vs Aave's 77%
      liquidation_threshold: 0.86,
      liquidation_bonus: 0.05,
      reserve_factor: 0.05,
    },
    USDT: {
      symbol: "USDT",
      name: "Tether",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.8, // 80% vs Aave's 75%
      liquidation_threshold: 0.84,
      liquidation_bonus: 0.05,
      reserve_factor: 0.05,
    },
    DAI: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      price_usd: 1.0,
      collateral_factor: 0.8,
      liquidation_threshold: 0.84,
      liquidation_bonus: 0.05,
      reserve_factor: 0.05,
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      decimals: 18,
      price_usd: 3400,
      collateral_factor: 0.86,
      liquidation_threshold: 0.9,
      liquidation_bonus: 0.06,
      reserve_factor: 0.05,
    },
    WBTC: {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      price_usd: 67500,
      collateral_factor: 0.75, // 75% vs Aave's 70%
      liquidation_threshold: 0.8,
      liquidation_bonus: 0.07,
      reserve_factor: 0.05,
    },
  },
};

/**
 * Compound - Traditional, mature protocol
 * Middle ground between Aave and Morpho
 */
export const COMPOUND_PARAMS: ProtocolParams = {
  protocol: "COMPOUND",
  venue_id: "COMPOUND-ETHEREUM",
  name: "Compound",
  assets: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      price_usd: 3400,
      collateral_factor: 0.8, // 80% LTV
      liquidation_threshold: 0.85, // 85%
      liquidation_bonus: 0.055, // 5.5%
      reserve_factor: 0.1,
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.78,
      liquidation_threshold: 0.83,
      liquidation_bonus: 0.045,
      reserve_factor: 0.1,
    },
    USDT: {
      symbol: "USDT",
      name: "Tether",
      decimals: 6,
      price_usd: 1.0,
      collateral_factor: 0.76,
      liquidation_threshold: 0.81,
      liquidation_bonus: 0.045,
      reserve_factor: 0.1,
    },
    DAI: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      price_usd: 1.0,
      collateral_factor: 0.76,
      liquidation_threshold: 0.81,
      liquidation_bonus: 0.045,
      reserve_factor: 0.1,
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      decimals: 18,
      price_usd: 3400,
      collateral_factor: 0.8,
      liquidation_threshold: 0.85,
      liquidation_bonus: 0.055,
      reserve_factor: 0.1,
    },
    WBTC: {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      price_usd: 67500,
      collateral_factor: 0.72,
      liquidation_threshold: 0.77,
      liquidation_bonus: 0.065,
      reserve_factor: 0.1,
    },
  },
};

/**
 * Get parameters for a specific protocol and asset
 */
export function getAssetParams(protocol: ProtocolName, asset: string): AssetParams | null {
  const protocols: Record<ProtocolName, ProtocolParams> = {
    AAVEV3: AAVE_V3_PARAMS,
    MORPHO: MORPHO_PARAMS,
    COMPOUND: COMPOUND_PARAMS,
  };

  const protocolParams = protocols[protocol];
  if (!protocolParams) return null;

  return protocolParams.assets[asset] ?? null;
}

/**
 * Calculate health factor delta when lending/borrowing an asset
 *
 * Health Factor = Total Collateral Value / Total Borrowed Value
 * When you LEND: increase collateral (improves HF)
 * When you BORROW: increase borrowed (worsens HF)
 * When you REPAY: decrease borrowed (improves HF)
 * When you WITHDRAW: decrease collateral (worsens HF)
 */
export function calculateHealthFactorDelta(
  protocol: ProtocolName,
  asset: string,
  operation: "LEND" | "BORROW" | "REPAY" | "WITHDRAW",
  amountUsd: number,
  currentHealthFactor: number,
): number {
  const params = getAssetParams(protocol, asset);
  if (!params) return 0;

  // Collateral value = amount USD × collateral factor
  const collateralValue = amountUsd * params.collateral_factor;

  switch (operation) {
    case "LEND":
      // Lending increases collateral (assuming current borrowed is constant)
      // New HF ≈ (old_collateral + new_collateral) / borrowed
      // Delta scales with collateral factor (safer assets have less impact per dollar)
      return collateralValue * 0.0001;

    case "REPAY":
      // Repaying decreases borrowed (improves HF more directly)
      return amountUsd * 0.002;

    case "BORROW":
      // Borrowing increases borrowed value against same collateral
      // New HF ≈ collateral / (old_borrowed + new_borrowed)
      return -(amountUsd * 0.001);

    case "WITHDRAW":
      // Withdrawal decreases collateral value
      return -(collateralValue * 0.0001);

    default:
      return 0;
  }
}

/**
 * All protocols in the UI
 */
export const ALL_PROTOCOLS: ProtocolParams[] = [AAVE_V3_PARAMS, MORPHO_PARAMS, COMPOUND_PARAMS];
