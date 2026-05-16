/**
 * Plan D — RealityPositionCard regression tests.
 *
 * Covers:
 *   - Unsubscribe overflow action opens the destructive confirm
 *   - Confirmed Unsubscribe calls the API + fires onUnsubscribed
 *   - Fork primary action opens the ForkDialog modal
 *   - Fork is disabled for IM_ALLOCATION + signals_in subscriptions
 *   - VersionLineageBadge renders when versionIndex is provided
 */

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RealityPositionCard, type RealityInstanceSummary } from "@/components/strategy-catalogue/RealityPositionCard";
import * as subsApi from "@/lib/api/strategy-subscriptions";
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

function baseSummary(overrides: Partial<RealityInstanceSummary> = {}): RealityInstanceSummary {
  return {
    instanceId: "test-instance",
    family: "CARRY_AND_YIELD",
    archetype: "CARRY_BASIS_PERP",
    venueSetLabel: "Plan D Test Venue Set",
    shareClass: "USDT",
    maturityPhase: "live_stable",
    liveAllocation: 1_000_000,
    livePnl: 12_500,
    venuesActive: ["BINANCE", "DERIBIT"],
    terminalHref: "/services/trading/terminal?instance=test-instance",
    reportsHref: "/services/reports?instance=test-instance",
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(subsApi, "unsubscribeFromInstance").mockResolvedValue({
    released_at: "2026-04-30T12:00:00+00:00",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<RealityPositionCard> Plan D Phase 4", () => {
  it("renders the overflow trigger and Unsubscribe action", async () => {
    const user = userEvent.setup();
    render(
      <RealityPositionCard instance={baseSummary()} callerClientId="org-acme" performanceOverride={STATIC_SERIES} />,
    );
    await user.click(screen.getByTestId("reality-overflow-trigger"));
    expect(screen.getByTestId("reality-unsubscribe-action")).toBeInTheDocument();
  });

  it("opens the destructive confirm dialog on Unsubscribe click", async () => {
    const user = userEvent.setup();
    render(
      <RealityPositionCard instance={baseSummary()} callerClientId="org-acme" performanceOverride={STATIC_SERIES} />,
    );
    await user.click(screen.getByTestId("reality-overflow-trigger"));
    await user.click(screen.getByTestId("reality-unsubscribe-action"));
    expect(screen.getByTestId("reality-unsubscribe-confirm")).toBeInTheDocument();
    expect(screen.getByText("Unsubscribe from this strategy?")).toBeInTheDocument();
  });

  it("calls unsubscribeFromInstance and fires onUnsubscribed on confirm", async () => {
    const onUnsubscribed = vi.fn();
    const user = userEvent.setup();
    render(
      <RealityPositionCard
        instance={baseSummary({ instanceId: "inst_42" })}
        callerClientId="org-acme"
        onUnsubscribed={onUnsubscribed}
        performanceOverride={STATIC_SERIES}
      />,
    );
    await user.click(screen.getByTestId("reality-overflow-trigger"));
    await user.click(screen.getByTestId("reality-unsubscribe-action"));
    await user.click(screen.getByTestId("reality-unsubscribe-confirm-action"));
    await waitFor(() => {
      expect(subsApi.unsubscribeFromInstance).toHaveBeenCalledWith({
        instanceId: "inst_42",
        clientId: "org-acme",
      });
    });
    await waitFor(() => {
      expect(onUnsubscribed).toHaveBeenCalledWith("inst_42");
    });
  });

  it("opens the ForkDialog modal when Fork action is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RealityPositionCard
        instance={baseSummary({ subscriptionType: "dart_exclusive" })}
        callerClientId="org-acme"
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("reality-fork-action")).toBeEnabled();
    await user.click(screen.getByTestId("reality-fork-action"));
    expect(screen.getByTestId("fork-dialog")).toBeInTheDocument();
  });

  it("disables Fork for IM_ALLOCATION subscriptions", () => {
    render(
      <RealityPositionCard
        instance={baseSummary({ subscriptionType: "im_allocation" })}
        callerClientId="org-acme"
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("reality-fork-action")).toBeDisabled();
  });

  it("disables Fork for signals_in subscriptions", () => {
    render(
      <RealityPositionCard
        instance={baseSummary({ subscriptionType: "signals_in" })}
        callerClientId="org-acme"
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("reality-fork-action")).toBeDisabled();
  });

  it("disables Fork + Unsubscribe when callerClientId is missing", async () => {
    const user = userEvent.setup();
    render(<RealityPositionCard instance={baseSummary()} performanceOverride={STATIC_SERIES} />);
    expect(screen.getByTestId("reality-fork-action")).toBeDisabled();
    await user.click(screen.getByTestId("reality-overflow-trigger"));
    expect(screen.getByTestId("reality-unsubscribe-action")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders the VersionLineageBadge when versionIndex is provided", () => {
    render(
      <RealityPositionCard
        instance={baseSummary({ versionIndex: 3, parentVersionIndex: 2 })}
        callerClientId="org-acme"
        performanceOverride={STATIC_SERIES}
      />,
    );
    expect(screen.getByTestId("version-lineage-badge")).toBeInTheDocument();
  });
});
