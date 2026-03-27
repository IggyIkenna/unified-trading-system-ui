import type { StakingProtocol } from "@/lib/types/defi";

export const STAKING_PROTOCOLS: StakingProtocol[] = [
  {
    name: "Lido",
    asset: "ETH",
    apy: 3.4,
    tvl: 32_400_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "EtherFi",
    asset: "ETH",
    apy: 3.6,
    tvl: 6_200_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "RocketPool",
    asset: "ETH",
    apy: 3.1,
    tvl: 4_800_000_000,
    minStake: 0.01,
    unbondingDays: 0,
  },
];
