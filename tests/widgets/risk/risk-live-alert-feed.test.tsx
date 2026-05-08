/**
 * L1.5 widget harness — risk-live-alert-feed-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Inactive mode guard: "Switch to Live mode" message when isActive=false.
 * - Active + empty feed: "No alerts yet" empty state.
 * - Active + connected: "Live" status indicator shown.
 * - Active + disconnected: "Disconnected" status shown.
 * - Alert rows rendered for each severity (CRITICAL, WARNING, INFO).
 * - Clear button calls clearFeed handler; hidden when feed is empty.
 * - strategy_id optionally shown per alert row.
 *
 * Out of scope:
 * - Real SSE connection (hermetic — useRiskAlertNotifications fully mocked)
 * - Cross-widget alert propagation (L3b)
 * - Visual regression (L4 — deferred)
 */
import type { RiskAlertStreamEvent } from "@/hooks/api/use-sse-channels";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock hook return shape — controlled per test via `mockHookReturn`
// ---------------------------------------------------------------------------

const mockHookReturn = {
  alertFeed: [] as RiskAlertStreamEvent[],
  isConnected: true,
  isActive: true,
  clearFeed: vi.fn(),
  lastEvent: null as RiskAlertStreamEvent | null,
};

vi.mock("@/hooks/api/use-risk-alert-notifications", () => ({
  useRiskAlertNotifications: () => mockHookReturn,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { RiskLiveAlertFeedWidget } from "@/components/widgets/risk/risk-live-alert-feed-widget";

// ---------------------------------------------------------------------------
// Alert factories
// ---------------------------------------------------------------------------

function buildAlert(overrides: Partial<RiskAlertStreamEvent> = {}): RiskAlertStreamEvent {
  return {
    alert_id: "alert-1",
    severity: "WARNING",
    category: "VAR_BREACH",
    message: "VaR limit exceeded for ETH-PERP",
    strategy_id: "DEFI_ETH_BASIS",
    timestamp: "2026-04-24T10:30:00.000Z",
    ...overrides,
  };
}

describe("risk-live-alert-feed — L1.5 harness", () => {
  beforeEach(() => {
    mockHookReturn.alertFeed = [];
    mockHookReturn.isConnected = true;
    mockHookReturn.isActive = true;
    mockHookReturn.clearFeed = vi.fn();
    mockHookReturn.lastEvent = null;
  });

  describe("inactive mode guard", () => {
    it("shows mode-inactive message when isActive=false", () => {
      mockHookReturn.isActive = false;
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText(/switch to live mode for real-time alerts/i)).toBeTruthy();
    });

    it("does not render the connected/disconnected status header when inactive", () => {
      mockHookReturn.isActive = false;
      render(<RiskLiveAlertFeedWidget />);
      // "Live" as the standalone status label (not the mode-guard message) should be absent
      expect(screen.queryByText("Live")).toBeNull();
      expect(screen.queryByText("Disconnected")).toBeNull();
    });
  });

  describe("connection status", () => {
    it("shows 'Live' status when connected and active", () => {
      mockHookReturn.isActive = true;
      mockHookReturn.isConnected = true;
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("Live")).toBeTruthy();
    });

    it("shows 'Disconnected' when isConnected=false", () => {
      mockHookReturn.isActive = true;
      mockHookReturn.isConnected = false;
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("Disconnected")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows 'No alerts yet' when alertFeed is empty", () => {
      mockHookReturn.alertFeed = [];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText(/no alerts yet/i)).toBeTruthy();
    });

    it("hides the Clear button when feed is empty", () => {
      mockHookReturn.alertFeed = [];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.queryByText(/clear/i)).toBeNull();
    });
  });

  describe("alert feed rendering", () => {
    it("renders a WARNING alert row with category and message", () => {
      mockHookReturn.alertFeed = [
        buildAlert({
          alert_id: "w1",
          severity: "WARNING",
          category: "VAR_BREACH",
          message: "VaR limit exceeded",
        }),
      ];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("VAR_BREACH")).toBeTruthy();
      expect(screen.getByText("VaR limit exceeded")).toBeTruthy();
      expect(screen.getByText("WARNING")).toBeTruthy();
    });

    it("renders a CRITICAL alert row", () => {
      mockHookReturn.alertFeed = [
        buildAlert({
          alert_id: "c1",
          severity: "CRITICAL",
          category: "KILL_SWITCH",
          message: "Kill switch triggered",
        }),
      ];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("CRITICAL")).toBeTruthy();
      expect(screen.getByText("KILL_SWITCH")).toBeTruthy();
    });

    it("renders an INFO alert row", () => {
      mockHookReturn.alertFeed = [
        buildAlert({
          alert_id: "i1",
          severity: "INFO",
          category: "REBALANCE",
          message: "Portfolio rebalanced",
        }),
      ];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("INFO")).toBeTruthy();
      expect(screen.getByText("REBALANCE")).toBeTruthy();
    });

    it("shows strategy_id label when present on alert", () => {
      mockHookReturn.alertFeed = [buildAlert({ alert_id: "s1", strategy_id: "MY_STRATEGY_123" })];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText(/strategy: MY_STRATEGY_123/i)).toBeTruthy();
    });

    it("renders multiple alert rows in feed order", () => {
      mockHookReturn.alertFeed = [
        buildAlert({ alert_id: "a1", category: "ALPHA" }),
        buildAlert({ alert_id: "a2", category: "BETA" }),
        buildAlert({ alert_id: "a3", category: "GAMMA" }),
      ];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText("ALPHA")).toBeTruthy();
      expect(screen.getByText("BETA")).toBeTruthy();
      expect(screen.getByText("GAMMA")).toBeTruthy();
    });
  });

  describe("clear button", () => {
    it("shows Clear button with count when feed has alerts", () => {
      mockHookReturn.alertFeed = [buildAlert({ alert_id: "x1" })];
      render(<RiskLiveAlertFeedWidget />);
      expect(screen.getByText(/clear \(1\)/i)).toBeTruthy();
    });

    it("calls clearFeed when Clear button is clicked", () => {
      const clearSpy = vi.fn();
      mockHookReturn.alertFeed = [buildAlert({ alert_id: "x2" })];
      mockHookReturn.clearFeed = clearSpy;
      render(<RiskLiveAlertFeedWidget />);
      fireEvent.click(screen.getByText(/clear \(1\)/i));
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });
});
