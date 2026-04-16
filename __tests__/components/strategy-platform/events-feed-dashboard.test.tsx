import { render, screen } from "@testing-library/react";
import { CalendarEventsWidget } from "@/components/widgets/terminal/calendar-events-widget";

/**
 * CalendarEventsWidget wraps CalendarEventFeed which uses data hooks.
 * Mock the hooks to isolate rendering behavior.
 */
vi.mock("@/hooks/api/use-calendar", () => ({
  useEconomicResults: () => ({
    data: [
      {
        id: "ev-1",
        indicator: "CPI YoY",
        status: "released",
        release_date: "2026-04-10",
        release_time: "08:30",
        actual: 3.2,
        estimated: 3.1,
        previous: 3.0,
        unit: "percent",
        region: "US",
        impact: "HIGH",
      },
      {
        id: "ev-2",
        indicator: "NFP",
        status: "upcoming",
        release_date: "2026-04-20",
        release_time: "08:30",
        actual: null,
        estimated: 200,
        previous: 180,
        unit: "thousands",
        region: "US",
        impact: "HIGH",
      },
    ],
    isLoading: false,
  }),
  useCorporateActions: () => ({
    data: [],
    isLoading: false,
  }),
}));

const defaultProps = { instanceId: "test-events-feed" };

describe("CalendarEventsWidget", () => {
  it("renders without crashing", () => {
    const { container } = render(<CalendarEventsWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders event indicator names", () => {
    render(<CalendarEventsWidget {...defaultProps} />);
    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("CPI YoY");
  });

  it("renders upcoming section for future events", () => {
    render(<CalendarEventsWidget {...defaultProps} />);
    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("Upcoming");
  });

  it("renders NFP event", () => {
    render(<CalendarEventsWidget {...defaultProps} />);
    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("NFP");
  });
});

describe("CalendarEventsWidget loading state", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders loading message when data is loading", async () => {
    vi.doMock("@/hooks/api/use-calendar", () => ({
      useEconomicResults: () => ({
        data: [],
        isLoading: true,
      }),
      useCorporateActions: () => ({
        data: [],
        isLoading: true,
      }),
    }));

    // Re-import after mock to get fresh module
    const { CalendarEventsWidget: FreshWidget } = await import(
      "@/components/widgets/terminal/calendar-events-widget"
    );

    render(<FreshWidget instanceId="test-loading" />);
    const bodyText = document.body.textContent || "";
    expect(bodyText).toMatch(/Loading|loading/);
  });
});
