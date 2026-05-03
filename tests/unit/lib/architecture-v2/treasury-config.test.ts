import { describe, expect, it } from "vitest";

import {
  isWalletWhitelisted,
  type TreasuryOperationalConfig,
  type TreasuryPolicyConfig,
} from "@/lib/architecture-v2/treasury-config";

describe("TreasuryPolicyConfig — type shape", () => {
  it("constructs a minimal compliant policy config", () => {
    const policy: TreasuryPolicyConfig = {
      policyConfigId: "tp-2026.04.20",
      version: "1.0.0",
      approvedCollateral: ["USDT", "USDC", "BTC", "ETH"],
      shareClass: "USD",
      hedgeRatioRange: [0.9, 1.0],
      autoRebalanceEnabled: true,
      rebalanceThreshold: 0.05,
      maxGrossLeverage: 3,
      maxNetLeverage: 1,
      whitelistedWalletIds: ["wallet-cefi-1", "wallet-defi-1", "wallet-defi-backup"],
      createdBy: "research-agent",
      createdAt: "2026-04-29T12:00:00Z",
    };
    expect(policy.approvedCollateral).toContain("USDT");
    expect(policy.hedgeRatioRange).toEqual([0.9, 1.0]);
  });
});

describe("isWalletWhitelisted — runtime guardrail check", () => {
  it("returns true for whitelisted wallets", () => {
    const policy: Pick<TreasuryPolicyConfig, "whitelistedWalletIds"> = {
      whitelistedWalletIds: ["wallet-a", "wallet-b", "wallet-c"],
    };
    expect(isWalletWhitelisted(policy, "wallet-a")).toBe(true);
    expect(isWalletWhitelisted(policy, "wallet-c")).toBe(true);
  });

  it("returns false for non-whitelisted wallets", () => {
    const policy: Pick<TreasuryPolicyConfig, "whitelistedWalletIds"> = {
      whitelistedWalletIds: ["wallet-a", "wallet-b"],
    };
    expect(isWalletWhitelisted(policy, "wallet-rogue")).toBe(false);
  });

  it("rejects everything when whitelist is empty", () => {
    const policy: Pick<TreasuryPolicyConfig, "whitelistedWalletIds"> = {
      whitelistedWalletIds: [],
    };
    expect(isWalletWhitelisted(policy, "wallet-a")).toBe(false);
  });
});

describe("TreasuryOperationalConfig — type shape", () => {
  it("constructs a minimal compliant operational config", () => {
    const op: TreasuryOperationalConfig = {
      operationalConfigId: "to-2026.04.29",
      inboundDefaultWalletId: "wallet-inbound-1",
      outboundDefaultWalletId: "wallet-outbound-1",
      feeBucketWalletId: "wallet-fees-1",
      lastUpdatedBy: "ops-admin",
      lastUpdatedAt: "2026-04-29T12:00:00Z",
      lastAuditEventId: "evt-001",
    };
    expect(op.feeBucketWalletId).toBe("wallet-fees-1");
  });
});

describe("Treasury split — versioning rule", () => {
  it("policy has version (versioned, bundled)", () => {
    // Type-level check: TreasuryPolicyConfig declares `version: string`.
    const policy: TreasuryPolicyConfig = {
      policyConfigId: "tp",
      version: "1.0.0",
      approvedCollateral: ["USDT"],
      shareClass: "USD",
      hedgeRatioRange: [0.9, 1.0],
      autoRebalanceEnabled: false,
      maxGrossLeverage: 2,
      maxNetLeverage: 1,
      whitelistedWalletIds: [],
      createdBy: "x",
      createdAt: "2026-04-29T12:00:00Z",
    };
    expect(policy).toHaveProperty("version");
  });

  it("operational config has audit but no version (mutable, audited)", () => {
    const op: TreasuryOperationalConfig = {
      operationalConfigId: "to",
      inboundDefaultWalletId: "w1",
      outboundDefaultWalletId: "w1",
      feeBucketWalletId: "w1",
      lastUpdatedBy: "x",
      lastUpdatedAt: "2026-04-29T12:00:00Z",
      lastAuditEventId: "e1",
    };
    expect(op).not.toHaveProperty("version");
    expect(op).toHaveProperty("lastAuditEventId");
  });
});
