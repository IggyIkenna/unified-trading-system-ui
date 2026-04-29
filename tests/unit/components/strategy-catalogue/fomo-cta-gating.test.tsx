import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FomoTearsheetCard,
  type FomoInstanceSummary,
} from "@/components/strategy-catalogue/FomoTearsheetCard";
import type { PerformanceSeriesResponse } from "@/lib/api/performance-overlay";
import {
  allowsAllocationCta,
  STRATEGY_MATURITY_PHASES,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

/** Minimal override shuts the React Query layer entirely so this unit
 * test stays free of Provider scaffolding. */
const STATIC_SERIES: PerformanceSeriesResponse = {
  instance_id: "test-instance",
  series: {
    backtest: {
      aggregate: [
        { t: "2025-01-01T00:00:00Z", pnl: 0, equity: 1_000_000 },
        { t: "2025-06-01T00:00:00Z", pnl: 25_000, equity: 1_025_000 },
      ],
      per_venue: null,
    },
    paper: {
      aggregate: [
        { t: "2025-06-02T00:00:00Z", pnl: 25_000, equity: 1_025_000 },
        { t: "2025-10-01T00:00:00Z", pnl: 55_000, equity: 1_055_000 },
      ],
      per_venue: null,
    },
    live: {
      aggregate: [
        { t: "2025-10-02T00:00:00Z", pnl: 55_000, equity: 1_055_000 },
        { t: "2026-04-01T00:00:00Z", pnl: 72_500, equity: 1_072_500 },
      ],
      per_venue: null,
    },
  },
  transition_markers: {
    paper_started_at: "2025-06-01T00:00:00Z",
    live_started_at: "2025-10-01T00:00:00Z",
  },
  phase_annotations: [
    { phase: "paper_1d", at: "2025-06-01T00:00:00Z" },
    { phase: "live_early", at: "2025-10-01T00:00:00Z" },
  ],
};

function baseSummary(
  overrides: Partial<FomoInstanceSummary> = {},
): FomoInstanceSummary {
  return {
    instanceId: "test-instance",
    family: "CARRY_AND_YIELD",
    archetype: "CARRY_BASIS_PERP",
    venueSetLabel: "Elysium — Base (3 CEX)",
    shareClass: "USDT",
    maturityPhase: "paper_stable",
    productRouting: "both",
    sharpe: 1.4,
    maxDrawdownPct: -8.2,
    cagrPct: 17.1,
    ...overrides,
  };
}

describe("allowsAllocationCta (Plan B p5-fomo-cta-gating-test)", () => {
  // 2026-04-29 (Phase 1B per dart_ux_cockpit_refactor §4.8.7): pilot + monitor
  // joined the allocatable set — pilot is capped real-money execution,
  // monitor is live with capacity decay measurement; both serve real
  // positions, so both permit incoming allocations.
  const enabled: StrategyMaturityPhase[] = ["paper_stable", "pilot", "live_early", "live_stable", "monitor"];
  const disabled: StrategyMaturityPhase[] = [
    "smoke",
    "backtest_minimal",
    "backtest_1yr",
    "backtest_multi_year",
    "paper_1d",
    "paper_14d",
    "retired",
  ];

  it("enables allocation for paper_stable / pilot / live_early / live_stable / monitor", () => {
    for (const phase of enabled) expect(allowsAllocationCta(phase)).toBe(true);
    for (const phase of disabled) expect(allowsAllocationCta(phase)).toBe(false);
  });

  it("gating exhaustively covers every maturity phase enum member", () => {
    const covered = new Set<StrategyMaturityPhase>([...enabled, ...disabled]);
    for (const phase of STRATEGY_MATURITY_PHASES) expect(covered.has(phase)).toBe(true);
    expect(STRATEGY_MATURITY_PHASES.length).toBe(covered.size);
  });
});

describe("<FomoTearsheetCard> CTA gating", () => {
  it("disables CTA when maturity is below paper_stable", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ maturityPhase: "backtest_1yr" })}
        onRequestAllocation={() => {}}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const cta = screen.getByTestId("fomo-request-allocation-cta");
    expect(cta).toBeDisabled();
    expect(
      screen.getByText("Allocation opens at paper-stable maturity or later."),
    ).toBeInTheDocument();
  });

  it("enables CTA at paper_stable + later when a handler is attached", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ maturityPhase: "live_early" })}
        onRequestAllocation={() => {}}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeEnabled();
  });

  it("disables CTA when no handler is attached even if phase qualifies", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary()}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeDisabled();
  });

  it("disables CTA on retired instances regardless of prior maturity", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ maturityPhase: "retired" })}
        onRequestAllocation={() => {}}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeDisabled();
  });
});
