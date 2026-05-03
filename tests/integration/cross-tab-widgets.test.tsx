/**
 * Integration tests for cross-tab widget rendering.
 *
 * Ensures widgets from one tab (e.g., Overview) can render on another tab
 * (e.g., Book) without crashing. This catches missing-provider errors
 * that only surface when widgets are placed on non-native tabs.
 *
 * 2026-04-29 update: AlertsPreviewWidget + HealthGridWidget were refactored
 * to consume dedicated contexts (AlertsDataProvider + a TanStack
 * QueryClient). They no longer fall back to a graceful "Navigate to
 * Overview tab" placeholder; their cross-tab-without-provider behavior is
 * now to throw at hook-call time. The tests below cover only the widgets
 * that retain the graceful useOverviewDataSafe fallback.
 */
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

// Overview widgets that retain useOverviewDataSafe fallback chrome.
import { RecentFillsWidget } from "@/components/widgets/overview/recent-fills-widget";
import { PnLAttributionWidget } from "@/components/widgets/overview/pnl-attribution-widget";

describe("Cross-tab widget rendering (no provider)", () => {
  it("RecentFillsWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<RecentFillsWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });

  it("PnLAttributionWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<PnLAttributionWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });
});
