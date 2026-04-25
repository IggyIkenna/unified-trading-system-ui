/**
 * Integration tests for cross-tab widget rendering.
 *
 * Ensures widgets from one tab (e.g., Overview) can render on another tab
 * (e.g., Book) without crashing. This catches missing-provider errors
 * that only surface when widgets are placed on non-native tabs.
 */
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

// Overview widgets that use useOverviewDataSafe
import { RecentFillsWidget } from "@/components/widgets/overview/recent-fills-widget";
import { PnLAttributionWidget } from "@/components/widgets/overview/pnl-attribution-widget";
import { AlertsPreviewWidget } from "@/components/widgets/overview/alerts-preview-widget";
import { HealthGridWidget } from "@/components/widgets/overview/health-grid-widget";

describe("Cross-tab widget rendering (no provider)", () => {
  it("RecentFillsWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<RecentFillsWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });

  it("PnLAttributionWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<PnLAttributionWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });

  it("AlertsPreviewWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<AlertsPreviewWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });

  it("HealthGridWidget shows placeholder when outside OverviewDataProvider", () => {
    render(<HealthGridWidget instanceId="test" config={{}} />);
    expect(screen.getByText("Navigate to Overview tab")).toBeInTheDocument();
  });
});
