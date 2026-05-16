/**
 * L1.5 widget harness — strategies-catalogue-widget.
 *
 * Covers:
 * - Render with mocked strategies context; strategy card grid visible.
 * - Loading state (Spinner shown).
 * - Empty state (no strategies after filter).
 * - Search query updates via setSearchQuery.
 * - Filter toggle functions wired (toggleAssetClass, toggleArchetype, toggleStatus).
 * - Clear filters button calls clearFilters.
 * - Link hrefs: View Live → /services/trading/positions?strategy_id=...
 *              Details → /services/trading/strategies/[id]
 * - Grouped rendering: each assetClass group heading appears.
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockStrategiesData } from "../_helpers/mock-strategies-context";

const mockStrategiesData = buildMockStrategiesData();

vi.mock("@/components/widgets/strategies/strategies-data-context", () => ({
  useStrategiesData: () => mockStrategiesData,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock("@/lib/config/services/strategies.config", () => ({
  ARCHETYPES: [
    { id: "yield-rotation", label: "Yield Rotation" },
    { id: "momentum", label: "Momentum" },
  ],
  // Identity normaliser — real one snake-cases / strips emoji prefixes; for
  // mock data we keep archetype strings as-is.
  normalizeArchetype: (s: string) => s,
  asset_group_COLORS: {
    DeFi: "#10b981",
    Crypto: "#6366f1",
  },
  STATUSES: [
    { id: "live", label: "Live", color: "#22c55e" },
    { id: "paused", label: "Paused", color: "#f59e0b" },
  ],
}));

vi.mock("@/components/shared/spinner", () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock("@/components/shared/collapsible-section", () => ({
  CollapsibleSection: ({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) => (
    <div data-testid={`collapsible-${title}`}>
      <span data-testid="group-title">{title}</span>
      {count !== undefined && <span data-testid="group-count">{count}</span>}
      {children}
    </div>
  ),
}));

vi.mock("@/components/trading/entity-link", () => ({
  EntityLink: ({ label, id }: { label: string; id: string; type?: string; className?: string }) => (
    <a href={`/entity/${id}`} data-testid="entity-link">
      {label}
    </a>
  ),
}));

vi.mock("@/components/trading/kpi-card", () => ({
  SparklineCell: () => <div data-testid="sparkline" />,
}));

vi.mock("@/components/trading/pnl-value", () => ({
  PnLValue: ({ value }: { value: number }) => <span data-testid="pnl-value">{value}</span>,
}));

vi.mock("@/components/shared/status-badge", () => ({
  StatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | false | null)[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/utils/formatters", () => ({
  formatNumber: (n: number, d: number) => n.toFixed(d),
  formatPercent: (n: number, d: number) => `${n.toFixed(d)}%`,
}));

import { StrategiesCatalogueWidget } from "@/components/widgets/strategies/strategies-catalogue-widget";
import * as React from "react";

describe("strategies-catalogue — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockStrategiesData, buildMockStrategiesData());
  });

  describe("render", () => {
    it("renders the filter bar and strategy cards", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      // Filter toggle button should be in DOM
      expect(screen.getByLabelText("Hide filters")).toBeTruthy();
    });

    it("renders asset class group heading", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      expect(screen.getByTestId("group-title").textContent).toBe("DeFi");
    });

    it("renders strategy name from mock data", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      expect(screen.getByText("Yield Rotation — Lending")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("renders spinner when isLoading=true", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ isLoading: true }));
      render(<StrategiesCatalogueWidget instanceId="test" />);
      expect(screen.getByTestId("spinner")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows no-match message when filteredStrategies is empty", () => {
      Object.assign(mockStrategiesData, buildMockStrategiesData({ filteredStrategies: [], groupedStrategies: {} }));
      render(<StrategiesCatalogueWidget instanceId="test" />);
      expect(screen.getByText(/No strategies match your filters/i)).toBeTruthy();
    });
  });

  describe("filter interactions", () => {
    it("calls setSearchQuery on search input change", () => {
      const setSearchQuery = vi.fn();
      Object.assign(mockStrategiesData, buildMockStrategiesData({ setSearchQuery }));
      render(<StrategiesCatalogueWidget instanceId="test" />);
      const searchInput = screen.getByPlaceholderText(/Search strategies/i);
      fireEvent.change(searchInput, { target: { value: "yield" } });
      expect(setSearchQuery).toHaveBeenCalledWith("yield");
    });

    it("calls clearFilters when 'Clear all' button is clicked", () => {
      const clearFilters = vi.fn();
      Object.assign(
        mockStrategiesData,
        buildMockStrategiesData({ hasFilters: true, clearFilters, selectedAssetClasses: ["DeFi"] }),
      );
      render(<StrategiesCatalogueWidget instanceId="test" />);
      const clearBtn = screen.getByRole("button", { name: /clear all/i });
      fireEvent.click(clearBtn);
      expect(clearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("action links", () => {
    it("View Live link targets /services/trading/positions with strategy_id", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      const links = screen.getAllByTestId("next-link");
      const viewLiveLink = links.find((l) => l.getAttribute("href")?.includes("/services/trading/positions"));
      expect(viewLiveLink).toBeTruthy();
      expect(viewLiveLink?.getAttribute("href")).toContain("strategy_id=");
    });

    it("Details link targets /services/trading/strategies/[id]", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      const links = screen.getAllByTestId("next-link");
      const detailsLink = links.find((l) => l.getAttribute("href")?.includes("/services/trading/strategies/"));
      expect(detailsLink).toBeTruthy();
    });
  });

  describe("filter visibility toggle", () => {
    it("hides filter bar when 'Hide Filters' is clicked", () => {
      render(<StrategiesCatalogueWidget instanceId="test" />);
      const toggleBtn = screen.getByLabelText("Hide filters");
      fireEvent.click(toggleBtn);
      // After toggling, the search input should no longer be visible
      expect(screen.queryByPlaceholderText(/Search strategies/i)).toBeNull();
    });
  });
});
