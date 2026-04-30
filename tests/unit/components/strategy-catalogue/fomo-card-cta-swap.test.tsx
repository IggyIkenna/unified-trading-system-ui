/**
 * Plan D — FomoTearsheetCard CTA-swap regression tests.
 *
 * The CTA swaps to <SubscribeButton> when (a) productRouting includes DART,
 * (b) caller has DART Full entitlement (`strategy-full` / `ml-full` / `*`),
 * (c) caller's clientId is provided, and (d) maturity allows allocation.
 * Otherwise the legacy "Request allocation" CTA renders.
 *
 * Lock badge rendering verified separately against the
 * `existingExclusiveHolder` field.
 */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FomoTearsheetCard, type FomoInstanceSummary } from "@/components/strategy-catalogue/FomoTearsheetCard";
import type { PerformanceSeriesResponse } from "@/lib/api/performance-overlay";

const STATIC_SERIES: PerformanceSeriesResponse = {
  instance_id: "test-instance",
  series: {
    backtest: { aggregate: [], per_venue: null },
    paper: { aggregate: [], per_venue: null },
    live: { aggregate: [], per_venue: null },
  },
  transition_markers: { paper_started_at: null, live_started_at: null },
  phase_annotations: [],
};

function baseSummary(overrides: Partial<FomoInstanceSummary> = {}): FomoInstanceSummary {
  return {
    instanceId: "test-instance",
    family: "CARRY_AND_YIELD",
    archetype: "CARRY_BASIS_PERP",
    venueSetLabel: "Plan D Test Venue Set",
    shareClass: "USDT",
    maturityPhase: "paper_stable",
    productRouting: "dart_only",
    sharpe: 1.4,
    maxDrawdownPct: -8.2,
    cagrPct: 17.1,
    ...overrides,
  };
}

describe("<FomoTearsheetCard> Plan D CTA swap", () => {
  it("swaps to SubscribeButton when DART-routed + DART Full entitled + clientId provided", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ productRouting: "dart_only" })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const card = screen.getByTestId("fomo-tearsheet-card");
    expect(card.dataset.ctaMode).toBe("subscribe");
    expect(screen.getByTestId("subscribe-button")).toBeInTheDocument();
    expect(screen.queryByTestId("fomo-request-allocation-cta")).not.toBeInTheDocument();
  });

  it("falls back to Request-allocation CTA when productRouting is IM-only", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ productRouting: "im_only" })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const card = screen.getByTestId("fomo-tearsheet-card");
    expect(card.dataset.ctaMode).toBe("request-allocation");
    expect(screen.getByTestId("fomo-request-allocation-cta")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-button")).not.toBeInTheDocument();
  });

  it("falls back to Request-allocation CTA when caller lacks DART Full entitlement", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ productRouting: "both" })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-lite"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const card = screen.getByTestId("fomo-tearsheet-card");
    expect(card.dataset.ctaMode).toBe("request-allocation");
    expect(screen.queryByTestId("subscribe-button")).not.toBeInTheDocument();
  });

  it("gates the SubscribeButton swap on maturity (does not swap below paper_stable)", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ maturityPhase: "backtest_1yr" })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const card = screen.getByTestId("fomo-tearsheet-card");
    expect(card.dataset.ctaMode).toBe("request-allocation");
    expect(screen.queryByTestId("subscribe-button")).not.toBeInTheDocument();
  });

  it("renders the ExclusiveLockBadge when existingExclusiveHolder is held by another client", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({
          productRouting: "dart_only",
          existingExclusiveHolder: "org-other",
        })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("exclusive-lock-badge")).toBeInTheDocument();
  });

  it("does not render the ExclusiveLockBadge when caller IS the holder (subscribed)", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({
          productRouting: "dart_only",
          existingExclusiveHolder: "org-acme",
        })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        isSubscribed={true}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.queryByTestId("exclusive-lock-badge")).not.toBeInTheDocument();
  });

  it("renders the VersionLineageBadge in the header when versionIndex is provided", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ versionIndex: 2, parentVersionIndex: 1 })}
        onRequestAllocation={() => {}}
        callerClientId="org-acme"
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("version-lineage-badge")).toBeInTheDocument();
  });

  it("falls back to Request-allocation CTA when callerClientId is not provided", () => {
    render(
      <FomoTearsheetCard
        instance={baseSummary({ productRouting: "dart_only" })}
        onRequestAllocation={() => {}}
        callerEntitlements={["strategy-full"]}
        performanceOverride={STATIC_SERIES}
      />,
    );
    const card = screen.getByTestId("fomo-tearsheet-card");
    expect(card.dataset.ctaMode).toBe("request-allocation");
    expect(screen.queryByTestId("subscribe-button")).not.toBeInTheDocument();
  });
});
