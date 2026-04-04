import type { StakingProtocol } from "@/lib/types/defi";

export const STAKING_PROTOCOLS: StakingProtocol[] = [
  {
    name: "LIDO-ETHEREUM",
    venue_id: "LIDO-ETHEREUM",
    asset: "ETH",
    apy: 3.4,
    tvl: 32_400_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "ETHERFI-ETHEREUM",
    venue_id: "ETHERFI-ETHEREUM",
    asset: "ETH",
    apy: 3.6,
    tvl: 6_200_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "ETHENA-ETHEREUM",
    venue_id: "ETHENA-ETHEREUM",
    asset: "ETH",
    apy: 3.1,
    tvl: 4_800_000_000,
    minStake: 0.01,
    unbondingDays: 0,
  },
];
