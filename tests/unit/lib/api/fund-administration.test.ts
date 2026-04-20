import { beforeEach, describe, expect, it, vi } from "vitest";

// Force the client into mock mode for every test in this file. `isMockDataMode`
// reads NEXT_PUBLIC_MOCK_API at module load — setting it here before imports
// ensures every method routes through the deterministic mock shim.
vi.stubEnv("NEXT_PUBLIC_MOCK_API", "true");

import {
  approveSubscription,
  createRedemption,
  createSubscription,
  getNavHistory,
  listAllocations,
  listRedemptions,
  listSubscriptions,
  rebalanceAllocations,
  rejectRedemption,
  settleSubscription,
} from "@/lib/api/fund-administration";
import {
  MOCK_DEFAULT_FUND_ID,
  MOCK_DEFAULT_SHARE_CLASS,
  resetMockStore,
} from "@/lib/mocks/fund-administration";

describe("fund-administration API client (mock mode)", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("createSubscription appends a PENDING record visible to listSubscriptions", async () => {
    const created = await createSubscription({
      subscription_id: "sub-test-1",
      fund_id: MOCK_DEFAULT_FUND_ID,
      allocator_id: "client-new",
      share_class: MOCK_DEFAULT_SHARE_CLASS,
      requested_amount_usd: "123456.00",
    });
    expect(created.status).toBe("PENDING");
    expect(created.subscription_id).toBe("sub-test-1");

    const rows = await listSubscriptions();
    expect(rows.find((r) => r.subscription_id === "sub-test-1")).toBeDefined();
  });

  it("approveSubscription flips PENDING → APPROVED deterministically", async () => {
    const approved = await approveSubscription("sub-001", { nav_per_unit: "1.02" });
    expect(approved.status).toBe("APPROVED");
    expect(approved.approval_timestamp).not.toBeNull();
    expect(approved.units_issued).not.toBeNull();
  });

  it("settleSubscription moves APPROVED → SETTLED", async () => {
    const settled = await settleSubscription("sub-002");
    expect(settled.status).toBe("SETTLED");
  });

  it("createRedemption + rejectRedemption + listRedemptions round-trip", async () => {
    const created = await createRedemption({
      redemption_id: "red-test-1",
      fund_id: MOCK_DEFAULT_FUND_ID,
      allocator_id: "client-new",
      share_class: MOCK_DEFAULT_SHARE_CLASS,
      units_to_redeem: "100.0",
      destination: "iban:TEST",
      grace_period_days: 7,
    });
    expect(created.status).toBe("PENDING");
    expect(created.grace_period_days).toBe(7);

    const rejected = await rejectRedemption("red-test-1", { reason: "mandate block" });
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejection_reason).toBe("mandate block");

    const rows = await listRedemptions();
    expect(rows.find((r) => r.redemption_id === "red-test-1")?.status).toBe("REJECTED");
  });

  it("listAllocations returns only rows for the requested fund", async () => {
    const rows = await listAllocations(MOCK_DEFAULT_FUND_ID);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.fund_id).toBe(MOCK_DEFAULT_FUND_ID);
    }
  });

  it("rebalanceAllocations replaces the allocation set and returns the new rows", async () => {
    const result = await rebalanceAllocations(MOCK_DEFAULT_FUND_ID, {
      share_class: MOCK_DEFAULT_SHARE_CLASS,
      targets: [
        {
          allocation_id: "alloc-rebalance-1",
          strategy_id: "new-strat",
          target_amount_usd: "500000.00",
          venue: "mock",
          from_wallet: "treasury",
          to_wallet: "strat",
          token: "USDC",
        },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.execution_status).toBe("COMPLETED");

    const rows = await listAllocations(MOCK_DEFAULT_FUND_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.allocation_id).toBe("alloc-rebalance-1");
  });

  it("getNavHistory returns the seeded snapshot for the default fund/share-class", async () => {
    const rows = await getNavHistory(MOCK_DEFAULT_FUND_ID, MOCK_DEFAULT_SHARE_CLASS);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.fund_id).toBe(MOCK_DEFAULT_FUND_ID);
  });

  it("getNavHistory returns an empty array for an unknown fund", async () => {
    const rows = await getNavHistory("does-not-exist", MOCK_DEFAULT_SHARE_CLASS);
    expect(rows).toEqual([]);
  });
});
