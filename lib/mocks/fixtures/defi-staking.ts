import type { StakingProtocol } from "@/lib/types/defi";

export const STAKING_PROTOCOLS: StakingProtocol[] = [
  {
    name: "Lido",
    venue_id: "LIDO-ETHEREUM",
    asset: "ETH",
    apy: 3.4,
    tvl: 32_400_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "EtherFi",
    venue_id: "ETHERFI-ETHEREUM",
    asset: "ETH",
    apy: 3.6,
    tvl: 6_200_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "RocketPool",
    venue_id: "LIDO-ETHEREUM",
    asset: "ETH",
    apy: 3.1,
    tvl: 4_800_000_000,
    minStake: 0.01,
    unbondingDays: 0,
  },
];
