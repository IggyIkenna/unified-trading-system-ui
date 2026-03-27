import type { LendingProtocol } from "@/lib/types/defi";

export const LENDING_PROTOCOLS: LendingProtocol[] = [
  {
    name: "Aave V3",
    assets: ["ETH", "USDC", "USDT", "DAI", "WBTC", "LINK"],
    supplyApy: {
      ETH: 3.2,
      USDC: 5.8,
      USDT: 5.4,
      DAI: 5.1,
      WBTC: 0.8,
      LINK: 1.2,
    },
    borrowApy: {
      ETH: 4.1,
      USDC: 7.2,
      USDT: 6.9,
      DAI: 6.5,
      WBTC: 1.5,
      LINK: 2.8,
    },
  },
  {
    name: "Morpho",
    assets: ["ETH", "USDC", "DAI", "WBTC"],
    supplyApy: { ETH: 3.8, USDC: 6.2, DAI: 5.6, WBTC: 1.0 },
    borrowApy: { ETH: 4.5, USDC: 7.8, DAI: 7.0, WBTC: 1.9 },
  },
  {
    name: "Compound V3",
    assets: ["ETH", "USDC", "WBTC"],
    supplyApy: { ETH: 2.9, USDC: 5.5, WBTC: 0.6 },
    borrowApy: { ETH: 3.8, USDC: 6.8, WBTC: 1.3 },
  },
];
