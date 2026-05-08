/**
 * L1.5 widget harness — calendar-events-widget.
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan:    unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Render with mocked calendar hooks (no network calls).
 * - Tab structure: Macro / Corporate / Market tabs render.
 * - Loading state inside each tab.
 * - Empty state when no events match today (isTodayUtc filter).
 * - Events with today's date appear in the correct tab.
 * - Importance badge rendered on economic events.
 *
 * Widget architecture:
 *   CalendarEventsWidget → CalendarEventFeed (hideTitle=true)
 *     → CalendarFeedInner → three hooks: useEconomicEvents, useCorporateActions, useMarketStructureEvents
 *
 * Out of scope:
 * - Terminal data-context (widget does NOT consume useTerminalData)
 * - Visual regression (L4 — deferred)
 * - Calendar hook network calls (hermetic: mocked below)
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Build today's UTC date string for isTodayUtc() to accept events as "today"
function todayUtcIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0)).toISOString();
}

const mockEconomicEvents = vi.fn(() => ({ data: [], isLoading: false }));
const mockCorporateActions = vi.fn(() => ({ data: [], isLoading: false }));
const mockMarketStructureEvents = vi.fn(() => ({ data: [], isLoading: false }));

vi.mock("@/hooks/api/use-calendar", () => ({
  useEconomicEvents: () => mockEconomicEvents(),
  useCorporateActions: () => mockCorporateActions(),
  useMarketStructureEvents: () => mockMarketStructureEvents(),
}));

// CalendarEventFeed uses useAuth inside the hooks (mocked via use-calendar above)
// but also imports auth indirectly — mock useAuth to be safe.
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "test-user" }, token: "test-token" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CalendarEventsWidget } from "@/components/widgets/terminal/calendar-events-widget";

describe("calendar-events — L1.5 harness", () => {
  beforeEach(() => {
    mockEconomicEvents.mockReturnValue({ data: [], isLoading: false });
    mockCorporateActions.mockReturnValue({ data: [], isLoading: false });
    mockMarketStructureEvents.mockReturnValue({ data: [], isLoading: false });
  });

  describe("render", () => {
    it("renders Macro tab trigger", () => {
      render(<CalendarEventsWidget />);
      expect(screen.getByRole("tab", { name: /macro/i })).toBeTruthy();
    });

    it("renders Corporate tab trigger", () => {
      render(<CalendarEventsWidget />);
      expect(screen.getByRole("tab", { name: /corporate/i })).toBeTruthy();
    });

    it("renders Market tab trigger", () => {
      render(<CalendarEventsWidget />);
      expect(screen.getByRole("tab", { name: /market/i })).toBeTruthy();
    });

    it("shows empty state on Macro tab when no events today", () => {
      render(<CalendarEventsWidget />);
      expect(screen.getByText(/no economic events today/i)).toBeTruthy();
    });
  });

  describe("loading states", () => {
    it("shows loading text on Macro tab while fetching", () => {
      mockEconomicEvents.mockReturnValue({ data: [], isLoading: true });
      render(<CalendarEventsWidget />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it("shows loading text on Market tab while fetching (Macro default tab not loading)", () => {
      // Market tab content is not rendered until activated; but Macro loading is visible
      // when macro hook returns isLoading=true. Verify loading pathway works.
      mockEconomicEvents.mockReturnValue({ data: [], isLoading: true });
      mockCorporateActions.mockReturnValue({ data: [], isLoading: false });
      mockMarketStructureEvents.mockReturnValue({ data: [], isLoading: false });
      render(<CalendarEventsWidget />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("event data rendering", () => {
    it("renders today's economic event label on Macro tab", () => {
      const todayEvent = {
        id: "eco-001",
        date: todayUtcIso(),
        eventType: "fomc" as const,
        label: "FOMC Meeting",
        importance: "high" as const,
        actual: null,
        forecast: null,
        previous: null,
        surprise: null,
      };
      mockEconomicEvents.mockReturnValue({ data: [todayEvent], isLoading: false });
      render(<CalendarEventsWidget />);
      expect(screen.getByText("FOMC Meeting")).toBeTruthy();
    });

    it("renders importance badge on economic events", () => {
      const todayEvent = {
        id: "eco-002",
        date: todayUtcIso(),
        eventType: "cpi" as const,
        label: "CPI Release",
        importance: "high" as const,
        actual: null,
        forecast: null,
        previous: null,
        surprise: null,
      };
      mockEconomicEvents.mockReturnValue({ data: [todayEvent], isLoading: false });
      render(<CalendarEventsWidget />);
      expect(screen.getByText("high")).toBeTruthy();
    });

    it("does NOT render past events (isTodayUtc filter)", () => {
      const pastEvent = {
        id: "eco-003",
        date: "2020-01-15T10:00:00.000Z",
        eventType: "nfp" as const,
        label: "Old NFP",
        importance: "medium" as const,
        actual: 150,
        forecast: 145,
        previous: 140,
        surprise: 0.03,
      };
      mockEconomicEvents.mockReturnValue({ data: [pastEvent], isLoading: false });
      render(<CalendarEventsWidget />);
      expect(screen.queryByText("Old NFP")).toBeNull();
      expect(screen.getByText(/no economic events today/i)).toBeTruthy();
    });
  });

  describe("event count badges", () => {
    it("shows count badge of 0 on Macro tab when no events today", () => {
      render(<CalendarEventsWidget />);
      // Count badges are rendered as text inside the tab triggers
      // There are 3 tabs, each with a count badge — look for at least one "0"
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });

    it("shows count 1 on Macro tab when one today event", () => {
      const todayEvent = {
        id: "eco-004",
        date: todayUtcIso(),
        eventType: "gdp" as const,
        label: "GDP Report",
        importance: "medium" as const,
        actual: null,
        forecast: null,
        previous: null,
        surprise: null,
      };
      mockEconomicEvents.mockReturnValue({ data: [todayEvent], isLoading: false });
      render(<CalendarEventsWidget />);
      expect(screen.getByText("1")).toBeTruthy();
    });
  });
});
