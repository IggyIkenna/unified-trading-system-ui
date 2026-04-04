export interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  memberCount: number;
  subscriptionTier: string;
  createdAt: string;
  monthlyFee: number;
  apiKeys?: number;
  usageGb?: number;
}
export interface Subscription {
  orgId: string;
  tier: string;
  entitlements: string[];
  startDate: string;
  renewalDate: string;
  monthlyFee: number;
  managementFeePct?: number;
  performanceFeePct?: number;
  dataFeePct?: number;
  aumUsd?: number;
}

export const TIERS = ["starter", "professional", "institutional", "enterprise"] as const;
