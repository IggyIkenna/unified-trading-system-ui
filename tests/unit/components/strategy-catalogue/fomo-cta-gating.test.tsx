import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FomoTearsheetCard,
  type FomoInstanceSummary,
} from "@/components/strategy-catalogue/FomoTearsheetCard";
import {
  allowsAllocationCta,
  STRATEGY_MATURITY_PHASES,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

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
  const enabled: StrategyMaturityPhase[] = ["paper_stable", "live_early", "live_stable"];
  const disabled: StrategyMaturityPhase[] = [
    "smoke",
    "backtest_minimal",
    "backtest_1yr",
    "backtest_multi_year",
    "paper_1d",
    "paper_14d",
    "retired",
  ];

  it("enables allocation only for paper_stable / live_early / live_stable", () => {
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
      />,
    );
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeEnabled();
  });

  it("disables CTA when no handler is attached even if phase qualifies", () => {
    render(<FomoTearsheetCard instance={baseSummary()} />);
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeDisabled();
  });

  it("disables CTA on retired instances regardless of prior maturity", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ maturityPhase: "retired" })}
        onRequestAllocation={() => {}}
      />,
    );
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeDisabled();
  });
});
