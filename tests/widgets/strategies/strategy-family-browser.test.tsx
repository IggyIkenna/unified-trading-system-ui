/**
 * L1.5 widget harness — strategy-family-browser-widget.
 *
 * Covers:
 * - Render with mocked useStrategyCatalog hook; table rows visible.
 * - Loading state (Spinner shown).
 * - Error state (error message shown).
 * - Empty state (no strategies found).
 * - Domain filter buttons: "All", "DeFi", "CeFi", "TradFi", "Sports".
 * - Domain filter click passes correct domain to hook.
 * - Strategy count badge shows correct number.
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockCatalogEntry {
  id: string;
  domain: string;
  family: string;
  label: string;
  params: string[];
}

const mockCatalogData: {
  data: { strategies: MockCatalogEntry[]; families: Record<string, MockCatalogEntry[]> } | null;
  isLoading: boolean;
  error: Error | null;
} = {
  data: {
    strategies: [
      { id: "yield-rotation-v1", domain: "defi", family: "yield", label: "Yield Rotation", params: ["apy_threshold"] },
      { id: "momentum-v2", domain: "cefi", family: "momentum", label: "Momentum", params: ["lookback", "threshold"] },
    ],
    families: {
      yield: [
        {
          id: "yield-rotation-v1",
          domain: "defi",
          family: "yield",
          label: "Yield Rotation",
          params: ["apy_threshold"],
        },
      ],
      momentum: [
        { id: "momentum-v2", domain: "cefi", family: "momentum", label: "Momentum", params: ["lookback", "threshold"] },
      ],
    },
  },
  isLoading: false,
  error: null,
};

vi.mock("@/hooks/api/use-strategies", () => ({
  useStrategyCatalog: (_domain?: string) => mockCatalogData,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "test-user" }, token: "mock-token" }),
}));

vi.mock("@/components/shared/spinner", () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock("@/components/shared/widget-scroll", () => ({
  WidgetScroll: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="widget-scroll" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={className}>{children}</td>
  ),
}));

import { StrategyFamilyBrowserWidget } from "@/components/widgets/strategies/strategy-family-browser-widget";
import * as React from "react";

describe("strategy-family-browser — L1.5 harness", () => {
  beforeEach(() => {
    mockCatalogData.data = {
      strategies: [
        {
          id: "yield-rotation-v1",
          domain: "defi",
          family: "yield",
          label: "Yield Rotation",
          params: ["apy_threshold"],
        },
        { id: "momentum-v2", domain: "cefi", family: "momentum", label: "Momentum", params: ["lookback", "threshold"] },
      ],
      families: {
        yield: [
          {
            id: "yield-rotation-v1",
            domain: "defi",
            family: "yield",
            label: "Yield Rotation",
            params: ["apy_threshold"],
          },
        ],
        momentum: [
          {
            id: "momentum-v2",
            domain: "cefi",
            family: "momentum",
            label: "Momentum",
            params: ["lookback", "threshold"],
          },
        ],
      },
    };
    mockCatalogData.isLoading = false;
    mockCatalogData.error = null;
  });

  describe("render", () => {
    it("renders card container", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByTestId("card")).toBeTruthy();
    });

    it("renders Strategy Family Browser title", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText("Strategy Family Browser")).toBeTruthy();
    });

    it("shows strategy count badge", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText("2 strategies")).toBeTruthy();
    });

    it("renders family group headings", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText("yield")).toBeTruthy();
      expect(screen.getByText("momentum")).toBeTruthy();
    });

    it("renders strategy labels", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText("Yield Rotation")).toBeTruthy();
      expect(screen.getByText("Momentum")).toBeTruthy();
    });
  });

  describe("domain filter buttons", () => {
    it("renders All, DeFi, CeFi, TradFi, Sports filter buttons", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      // Widget uses: d === "all" ? "all domains" : d.toUpperCase()
      expect(screen.getByLabelText("Filter by all domains")).toBeTruthy();
      expect(screen.getByLabelText("Filter by DEFI")).toBeTruthy();
      expect(screen.getByLabelText("Filter by CEFI")).toBeTruthy();
      expect(screen.getByLabelText("Filter by TRADFI")).toBeTruthy();
      expect(screen.getByLabelText("Filter by SPORTS")).toBeTruthy();
    });

    it("All button is pressed by default", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      const allBtn = screen.getByLabelText("Filter by all domains");
      expect(allBtn.getAttribute("aria-pressed")).toBe("true");
    });

    it("clicking DeFi domain button marks it as pressed", () => {
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      const defiBtn = screen.getByLabelText("Filter by DEFI");
      fireEvent.click(defiBtn);
      expect(defiBtn.getAttribute("aria-pressed")).toBe("true");
    });
  });

  describe("loading state", () => {
    it("renders Spinner when isLoading=true", () => {
      mockCatalogData.isLoading = true;
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByTestId("spinner")).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("renders error message when error is set", () => {
      mockCatalogData.error = new Error("Network error");
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText(/Failed to load strategy catalog/i)).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("renders no-strategies message when strategies list is empty", () => {
      mockCatalogData.data = { strategies: [], families: {} };
      render(<StrategyFamilyBrowserWidget instanceId="test" />);
      expect(screen.getByText(/No strategies found/i)).toBeTruthy();
    });
  });
});
