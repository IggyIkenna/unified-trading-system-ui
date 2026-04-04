import type { LendingProtocol } from "@/lib/types/defi";

export const LENDING_PROTOCOLS: LendingProtocol[] = [
  {
    name: "AAVEV3-ETHEREUM",
    venue_id: "AAVEV3-ETHEREUM",
    chain: "ETHEREUM",
    assets: ["ETH", "USDC", "USDT", "DAI", "WBTC", "LINK", "WETH", "WEETH"],
    supplyApy: {
      ETH: 2.0,
      USDC: 4.8,
      USDT: 4.5,
      DAI: 4.2,
      WBTC: 0.8,
      LINK: 1.2,
      WETH: 2.0,
      WEETH: 0.0, // weETH earns staking yield, not supply APY
    },
    borrowApy: {
      ETH: 3.0,
      USDC: 6.2,
      USDT: 5.9,
      DAI: 5.5,
      WBTC: 1.5,
      LINK: 2.8,
      WETH: 3.0,
      WEETH: 0.0,
    },
  },
  {
    name: "MORPHO-ETHEREUM",
    venue_id: "MORPHO-ETHEREUM",
    chain: "ETHEREUM",
    assets: ["ETH", "USDC", "DAI", "WBTC", "WETH"],
    supplyApy: { ETH: 2.5, USDC: 5.2, DAI: 4.8, WBTC: 1.0, WETH: 2.5 },
    borrowApy: { ETH: 3.5, USDC: 6.8, DAI: 6.2, WBTC: 1.9, WETH: 3.5 },
  },
  {
    name: "COMPOUNDV3-ETHEREUM",
    venue_id: "COMPOUNDV3-ETHEREUM",
    chain: "ETHEREUM",
    assets: ["ETH", "USDC", "WBTC"],
    supplyApy: { ETH: 1.8, USDC: 4.5, WBTC: 0.6 },
    borrowApy: { ETH: 2.8, USDC: 5.8, WBTC: 1.3 },
  },
  {
    name: "AAVEV3-ARBITRUM",
    venue_id: "AAVEV3-ARBITRUM",
    chain: "ARBITRUM",
    assets: ["ETH", "USDC", "USDT", "WBTC"],
    supplyApy: { ETH: 2.2, USDC: 5.1, USDT: 4.8, WBTC: 0.9 },
    borrowApy: { ETH: 3.2, USDC: 6.5, USDT: 6.1, WBTC: 1.6 },
  },
  {
    name: "KAMINO-SOLANA",
    venue_id: "KAMINO-SOLANA",
    chain: "SOLANA",
    assets: ["SOL", "USDC", "USDT", "JITOSOL", "MSOL"],
    supplyApy: { SOL: 3.5, USDC: 6.0, USDT: 5.5, JITOSOL: 0.0, MSOL: 0.0 },
    borrowApy: { SOL: 4.5, USDC: 7.5, USDT: 7.0, JITOSOL: 0.0, MSOL: 0.0 },
  },
];
