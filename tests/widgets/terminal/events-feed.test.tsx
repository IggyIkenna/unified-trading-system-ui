/**
 * L1.5 widget harness — events-feed-widget.
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan:    unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Render with mocked terminal data-context.
 * - Loading, error, empty-state branches (L0.6/0.7/0.8).
 * - Event list rendering: timestamp, domain, severity, title, detail.
 * - Event count badge.
 * - Multiple events with distinct domains/severities.
 *
 * Out of scope:
 * - Real route wiring (L2 smoke)
 * - WS/SSE event bus subscription (future live wiring)
 * - Visual regression (L4 — deferred)
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockTerminalData, buildMockTerminalEvent } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { EventsFeedWidget } from "@/components/widgets/terminal/events-feed-widget";

describe("events-feed — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("renders event titles from mocked context", () => {
      render(<EventsFeedWidget />);
      expect(screen.getByText("Order placed")).toBeTruthy();
    });

    it("renders event count badge", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({ events: [buildMockTerminalEvent(), buildMockTerminalEvent({ id: "evt-002" })] }),
      );
      render(<EventsFeedWidget />);
      expect(screen.getByText("2 events")).toBeTruthy();
    });

    it("renders event timestamps", () => {
      render(<EventsFeedWidget />);
      expect(screen.getAllByText("12:00:00").length).toBeGreaterThan(0);
    });

    it("renders event domain labels", () => {
      render(<EventsFeedWidget />);
      expect(screen.getByText("EXECUTION")).toBeTruthy();
    });

    it("renders event severity badges", () => {
      render(<EventsFeedWidget />);
      expect(screen.getAllByText("INFO").length).toBeGreaterThan(0);
    });
  });

  describe("states", () => {
    it("shows loading state", () => {
      Object.assign(mockData, buildMockTerminalData({ isLoadingEvents: true, events: [] }));
      render(<EventsFeedWidget />);
      expect(screen.getByText(/loading events/i)).toBeTruthy();
    });

    it("shows error state with message", () => {
      Object.assign(mockData, buildMockTerminalData({ errorEvents: "Event bus timeout", events: [] }));
      render(<EventsFeedWidget />);
      expect(screen.getByText(/failed to load events/i)).toBeTruthy();
      expect(screen.getByText(/event bus timeout/i)).toBeTruthy();
    });

    it("shows empty state when no events", () => {
      Object.assign(mockData, buildMockTerminalData({ events: [] }));
      render(<EventsFeedWidget />);
      expect(screen.getByText(/no events to display/i)).toBeTruthy();
    });
  });

  describe("multi-event rendering", () => {
    it("renders WARNING severity badge for risk events", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          events: [buildMockTerminalEvent({ domain: "RISK", severity: "WARNING", title: "Position limit 80%" })],
        }),
      );
      render(<EventsFeedWidget />);
      expect(screen.getByText("WARNING")).toBeTruthy();
      expect(screen.getByText("RISK")).toBeTruthy();
    });

    it("renders CRITICAL severity badge", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          events: [buildMockTerminalEvent({ severity: "CRITICAL", title: "Kill switch activated" })],
        }),
      );
      render(<EventsFeedWidget />);
      expect(screen.getByText("CRITICAL")).toBeTruthy();
    });

    it("renders event detail text", () => {
      render(<EventsFeedWidget />);
      expect(screen.getAllByText("BTC-USDT buy 0.5 @ 63450").length).toBeGreaterThan(0);
    });
  });
});
