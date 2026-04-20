import { describe, expect, it } from "vitest";

// allocator.ts is a types-only module (no runtime values exported). We
// compile-check the public interface by shaping literal values against the
// exported type aliases. The tests exist so `tsc --noEmit` in CI exercises
// this module, and any future runtime additions (guardrail helpers etc.)
// have a ready home.
import type {
  AllocationDirective,
  AllocatorCadence,
  AllocatorGuardRails,
  AllocatorInstance,
  AllocatorInstanceStatus,
  AllocatorMode,
  ManualApprovalQueueItem,
  ShadowCompareRow,
  StrategyEquityDirectivePayload,
} from "@/lib/architecture-v2/allocator";

describe("architecture-v2/allocator types (compile-shape)", () => {
  it("accepts a valid AllocatorGuardRails literal", () => {
    const g: AllocatorGuardRails = {
      max_weight: 0.1,
      min_weight: 0.0,
      max_turnover_pct: 0.5,
      correlation_cap: 0.9,
      family_diversification: true,
      category_diversification: false,
    };
    expect(g.max_weight).toBe(0.1);
  });

  it("accepts a full AllocatorInstance literal with valid enum strings", () => {
    const cadence: AllocatorCadence = "DAILY";
    const mode: AllocatorMode = "PRIMARY";
    const status: AllocatorInstanceStatus = "ACTIVE";
    const instance: AllocatorInstance = {
      allocator_instance_id: "a1",
      client_id: "c1",
      client_name: "Client 1",
      archetype: "RISK_PARITY",
      mode,
      cadence,
      share_class: "USD",
      status,
      managed_strategy_instance_ids: ["s1", "s2"],
      guard_rails: {
        max_weight: 1,
        min_weight: 0,
        max_turnover_pct: 1,
        correlation_cap: 1,
        family_diversification: false,
        category_diversification: false,
      },
      last_directive_at: null,
      total_managed_nav_usd: 1_000_000,
      partner_primary_id: "p1",
    };
    expect(instance.cadence).toBe("DAILY");
    expect(instance.mode).toBe("PRIMARY");
    expect(instance.status).toBe("ACTIVE");
  });

  it("accepts StrategyEquityDirectivePayload + AllocationDirective shapes", () => {
    const eq: StrategyEquityDirectivePayload = {
      strategy_instance_id: "s1",
      target_equity_usd: 1000,
      weight: 0.5,
      previous_weight: 0.4,
    };
    const directive: AllocationDirective = {
      directive_id: "d1",
      allocator_instance_id: "a1",
      client_id: "c1",
      emitted_at: "2026-01-01T00:00:00Z",
      cadence_trigger: "HOURLY",
      archetype: "RISK_PARITY",
      mode: "SHADOW",
      share_class: "USD",
      equity_directives: [eq],
      total_nav_usd: 2000,
      approved: true,
      approved_by: "ops",
      notes: null,
    };
    expect(directive.equity_directives).toHaveLength(1);
    expect(directive.cadence_trigger).toBe("HOURLY");
  });

  it("accepts ShadowCompareRow shape", () => {
    const row: ShadowCompareRow = {
      strategy_instance_id: "s1",
      primary_weight: 0.4,
      shadow_weight: 0.5,
      abs_diff_bps: 1000,
    };
    expect(row.abs_diff_bps).toBe(1000);
  });

  it("accepts ManualApprovalQueueItem shape", () => {
    const item: ManualApprovalQueueItem = {
      directive_id: "d1",
      allocator_instance_id: "a1",
      client_id: "c1",
      client_name: "Client 1",
      archetype: "RISK_PARITY",
      emitted_at: "2026-01-01T00:00:00Z",
      proposed_total_nav_usd: 500_000,
      num_strategies: 5,
      age_minutes: 12,
    };
    expect(item.num_strategies).toBe(5);
  });
});
