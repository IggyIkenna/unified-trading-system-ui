/**
 * L1.5 widget harness — risk-term-structure-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Loading state: spinner shown, chart footnote hidden.
 * - Error state: error message shown.
 * - Empty state (termStructureData = []): "No term structure data" shown.
 * - Populated state: chart footnote visible; error / empty messages absent.
 * - State priority: error takes precedence over populated data.
 *
 * Note: mock-risk-context.ts sets termStructureData: [] always (not in overrides).
 *   Populated-state tests extend mockRiskData.termStructureData directly via Object.assign.
 *
 * Out of scope:
 * - Recharts SVG assertions (chart internals; skipped per harness rules).
 * - Visual regression (L4 — deferred).
 * - Live route wiring (L2 smoke).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockRiskData } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
  formatCurrency: (v: number) => `$${v}`,
  getAssetClassColor: (_: string) => "var(--muted-foreground)",
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { RiskTermStructureWidget } from "@/components/widgets/risk/risk-term-structure-widget";

const MOCK_BUCKETS = [
  { bucket: "Overnight", defi: 100000, cefi: 50000, tradfi: 0, sports: 0 },
  { bucket: "1W", defi: 200000, cefi: 100000, tradfi: 0, sports: 0 },
];

describe("risk-term-structure-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("loading state", () => {
    it("does not render chart footnote while loading", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      mockRiskData.termStructureData = MOCK_BUCKETS;
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/DeFi\/CeFi perpetuals classified as Overnight/i)).toBeNull();
    });

    it("does not show empty state message while loading", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/No term structure data/i)).toBeNull();
    });
  });

  describe("error state", () => {
    it("shows error message when hasError is true", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load term structure data/i)).toBeTruthy();
    });

    it("does not render chart footnote on error", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/DeFi\/CeFi perpetuals classified as Overnight/i)).toBeNull();
    });

    it("shows error state even when termStructureData has items", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      mockRiskData.termStructureData = MOCK_BUCKETS;
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load term structure data/i)).toBeTruthy();
      expect(screen.queryByText(/DeFi\/CeFi perpetuals classified as Overnight/i)).toBeNull();
    });
  });

  describe("empty state", () => {
    it("shows no-data message when termStructureData is empty", () => {
      // mock-risk-context always returns [] for termStructureData by default
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.getByText(/No term structure data/i)).toBeTruthy();
    });

    it("does not show error message in empty state", () => {
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/Failed to load term structure data/i)).toBeNull();
    });
  });

  describe("populated state", () => {
    beforeEach(() => {
      mockRiskData.termStructureData = MOCK_BUCKETS;
    });

    it("renders chart footnote about perpetuals classification", () => {
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.getByText(/DeFi\/CeFi perpetuals classified as Overnight/i)).toBeTruthy();
    });

    it("does not show error state when data is present", () => {
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/Failed to load term structure data/i)).toBeNull();
    });

    it("does not show empty-data state when data is present", () => {
      render(<RiskTermStructureWidget instanceId="risk-term-structure" layoutMode="grid" />);
      expect(screen.queryByText(/No term structure data/i)).toBeNull();
    });
  });
});
