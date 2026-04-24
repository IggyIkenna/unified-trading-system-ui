/**
 * L1.5 widget harness — risk-circuit-breakers-widget.
 *
 * Safety-critical display widget: per-venue circuit breaker cards with status
 * badges. Covers:
 * - Render cards from venueCircuitBreakers context.
 * - Status badges: CLOSED (green), OPEN (red), HALF_OPEN (amber).
 * - Kill-switch badge only when kill_switch_active is true.
 * - Loading state renders spinner (no cards).
 * - Error state renders error message.
 * - Empty state renders "No venue CB data" (cert L0.7).
 *
 * Note: widget is read-only display (no trip/reset actions). See cert
 * docs/manifest/widget-certification/risk-circuit-breakers.json L4/finding
 * for the deferred action controls gap.
 *
 * Out of scope: route wiring (L2), multi-widget interaction (L3).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockRiskData, buildMockVenueCircuitBreaker } from "../_helpers/mock-risk-context";

const mockRiskData = buildMockRiskData();

vi.mock("@/components/widgets/risk/risk-data-context", () => ({
  useRiskData: () => mockRiskData,
}));

import { RiskCircuitBreakersWidget } from "@/components/widgets/risk/risk-circuit-breakers-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("risk-circuit-breakers — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockRiskData, buildMockRiskData());
  });

  describe("render", () => {
    it("renders one card per venueCircuitBreaker entry", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [
            buildMockVenueCircuitBreaker({ venue: "BINANCE", strategy_id: "s1", status: "CLOSED" }),
            buildMockVenueCircuitBreaker({ venue: "DYDX", strategy_id: "s2", status: "OPEN" }),
            buildMockVenueCircuitBreaker({ venue: "OKX", strategy_id: "s3", status: "HALF_OPEN" }),
          ],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText("BINANCE")).toBeTruthy();
      expect(screen.getByText("DYDX")).toBeTruthy();
      expect(screen.getByText("OKX")).toBeTruthy();
    });

    it("shows strategy_id label inside each card", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [
            buildMockVenueCircuitBreaker({ venue: "BINANCE", strategy_id: "DEFI_ETH_BASIS_HUF_1H", status: "CLOSED" }),
          ],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText("DEFI_ETH_BASIS_HUF_1H")).toBeTruthy();
    });

    it("shows empty-state message when venueCircuitBreakers is empty (cert L0.7)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ venueCircuitBreakers: [] }));
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText(/No venue CB data/i)).toBeTruthy();
    });
  });

  describe("status badges", () => {
    it("renders CLOSED badge for CLOSED status", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [buildMockVenueCircuitBreaker({ status: "CLOSED" })],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText("CLOSED")).toBeTruthy();
    });

    it("renders OPEN badge for OPEN status", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [buildMockVenueCircuitBreaker({ status: "OPEN" })],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText("OPEN")).toBeTruthy();
    });

    it("renders HALF_OPEN badge for HALF_OPEN status", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [buildMockVenueCircuitBreaker({ status: "HALF_OPEN" })],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText("HALF_OPEN")).toBeTruthy();
    });
  });

  describe("kill switch badge", () => {
    it("shows Kill Switch Active badge when kill_switch_active=true", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [buildMockVenueCircuitBreaker({ kill_switch_active: true })],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText(/Kill Switch Active/i)).toBeTruthy();
    });

    it("hides Kill Switch Active badge when kill_switch_active=false", () => {
      Object.assign(
        mockRiskData,
        buildMockRiskData({
          venueCircuitBreakers: [buildMockVenueCircuitBreaker({ kill_switch_active: false })],
        }),
      );
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.queryByText(/Kill Switch Active/i)).toBeNull();
    });
  });

  describe("loading + error states", () => {
    it("renders spinner (no venue cards) when isLoading=true (cert L0.6)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ isLoading: true }));
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      // No venue labels visible during loading
      expect(screen.queryByText("BINANCE")).toBeNull();
    });

    it("renders error message when hasError=true (cert L0.8)", () => {
      Object.assign(mockRiskData, buildMockRiskData({ hasError: true }));
      render(<RiskCircuitBreakersWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load circuit breaker data/i)).toBeTruthy();
    });
  });
});
