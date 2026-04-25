import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { DashboardFilterProvider, appendFilterToHref, EMPTY_FILTER } from "@/lib/context/dashboard-filter-context";
import { useDashboardFilter } from "@/hooks/use-dashboard-filter";

const TEST_USER_ID = "test-user-abc";

function wrapper({ children }: { children: React.ReactNode }) {
  return <DashboardFilterProvider userId={TEST_USER_ID}>{children}</DashboardFilterProvider>;
}

describe("DashboardFilterContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists filter updates to localStorage scoped per-user", () => {
    const { result } = renderHook(() => useDashboardFilter(), { wrapper });

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.setFilter({ family: "STAT_ARB_PAIRS" });
    });

    expect(result.current.filter.family).toBe("STAT_ARB_PAIRS");
    expect(result.current.isActive).toBe(true);

    const raw = window.localStorage.getItem(`dashboardFilter:${TEST_USER_ID}`);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { family: string };
    expect(parsed.family).toBe("STAT_ARB_PAIRS");
  });

  it("Clear filters resets every dimension to null and removes localStorage", () => {
    const { result } = renderHook(() => useDashboardFilter(), { wrapper });

    act(() => {
      result.current.setFilter({
        family: "ML_DIRECTIONAL",
        archetype: "ML_DIRECTIONAL_CONTINUOUS",
        shareClass: "USD",
      });
    });
    expect(result.current.isActive).toBe(true);
    expect(window.localStorage.getItem(`dashboardFilter:${TEST_USER_ID}`)).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.filter).toEqual(EMPTY_FILTER);
    expect(result.current.isActive).toBe(false);
    expect(window.localStorage.getItem(`dashboardFilter:${TEST_USER_ID}`)).toBeNull();
  });

  it("emits dashboardFilter.changed CustomEvent on change", () => {
    const events: unknown[] = [];
    const handler = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("dashboardFilter.changed", handler);

    const { result } = renderHook(() => useDashboardFilter(), { wrapper });
    act(() => {
      result.current.setFilter({ family: "VOL_TRADING" });
    });

    window.removeEventListener("dashboardFilter.changed", handler);
    expect(events.length).toBeGreaterThan(0);
  });

  it("persists expanded state independently of filter state", () => {
    const { result } = renderHook(() => useDashboardFilter(), { wrapper });

    expect(result.current.expanded).toBe(false);
    act(() => {
      result.current.setExpanded(true);
    });

    expect(result.current.expanded).toBe(true);
    expect(window.localStorage.getItem(`dashboardFilter:${TEST_USER_ID}:expanded`)).toBe("1");
  });

  it("restores filter state on mount from localStorage", () => {
    window.localStorage.setItem(
      `dashboardFilter:${TEST_USER_ID}`,
      JSON.stringify({ family: "CARRY_AND_YIELD", archetype: null }),
    );

    const { result } = renderHook(() => useDashboardFilter(), { wrapper });

    // Mount effect runs synchronously in renderHook — state hydrates.
    expect(result.current.filter.family).toBe("CARRY_AND_YIELD");
  });
});

describe("appendFilterToHref", () => {
  it("returns href unchanged when filter is empty", () => {
    expect(appendFilterToHref("/services/trading/overview", EMPTY_FILTER)).toBe("/services/trading/overview");
  });

  it("appends filter dims as query params", () => {
    const href = appendFilterToHref("/services/research/overview", {
      family: "STAT_ARB_PAIRS",
      archetype: "STAT_ARB_PAIRS_FIXED",
      venueSetVariant: "base_3cex",
      shareClass: "USD",
      instrumentType: "perp",
    });
    expect(href).toContain("family=STAT_ARB_PAIRS");
    expect(href).toContain("archetype=STAT_ARB_PAIRS_FIXED");
    expect(href).toContain("venue_set_variant=base_3cex");
    expect(href).toContain("share_class=USD");
    expect(href).toContain("instrument_type=perp");
    expect(href.startsWith("/services/research/overview?")).toBe(true);
  });

  it("uses & separator when href already has ?", () => {
    const href = appendFilterToHref("/services/reports?view=summary", {
      ...EMPTY_FILTER,
      family: "VOL_TRADING",
    });
    expect(href).toBe("/services/reports?view=summary&family=VOL_TRADING");
  });
});

describe("DashboardFilterProvider render tree integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders children and exposes filter context to consumers", () => {
    function Consumer() {
      const { filter, setFilter } = useDashboardFilter();
      return (
        <div>
          <span data-testid="current-family">{filter.family ?? "null"}</span>
          <button data-testid="set-family" type="button" onClick={() => setFilter({ family: "MARKET_MAKING" })}>
            set
          </button>
        </div>
      );
    }

    render(
      <DashboardFilterProvider userId={TEST_USER_ID}>
        <Consumer />
      </DashboardFilterProvider>,
    );

    expect(screen.getByTestId("current-family")).toHaveTextContent("null");
    fireEvent.click(screen.getByTestId("set-family"));
    expect(screen.getByTestId("current-family")).toHaveTextContent("MARKET_MAKING");
  });
});
