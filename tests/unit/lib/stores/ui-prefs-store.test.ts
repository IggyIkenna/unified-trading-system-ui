import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useUIPrefsStore } from "@/lib/stores/ui-prefs-store";

describe("ui-prefs-store — writer actions", () => {
  beforeEach(() => {
    act(() => useUIPrefsStore.getState().reset());
  });

  it("setLastVisitedPage updates state", () => {
    act(() => useUIPrefsStore.getState().setLastVisitedPage("/services/trading/overview"));
    expect(useUIPrefsStore.getState().lastVisitedPage).toBe(
      "/services/trading/overview",
    );
  });

  it("setColumnPreferences stores per-table column visibility", () => {
    act(() =>
      useUIPrefsStore
        .getState()
        .setColumnPreferences("table-A", ["col1", "col2"]),
    );
    expect(useUIPrefsStore.getState().columnPreferences["table-A"]).toEqual([
      "col1",
      "col2",
    ]);
  });

  it("setColumnPreferences on a second table preserves the first", () => {
    act(() => {
      useUIPrefsStore.getState().setColumnPreferences("table-A", ["col1"]);
      useUIPrefsStore.getState().setColumnPreferences("table-B", ["colX"]);
    });
    const prefs = useUIPrefsStore.getState().columnPreferences;
    expect(prefs["table-A"]).toEqual(["col1"]);
    expect(prefs["table-B"]).toEqual(["colX"]);
  });

  it("setPanelSizes stores per-panel size arrays", () => {
    act(() => useUIPrefsStore.getState().setPanelSizes("main", [40, 60]));
    expect(useUIPrefsStore.getState().panelSizes.main).toEqual([40, 60]);
  });

  it("setPanelSizes preserves existing panels when a new one is added", () => {
    act(() => {
      useUIPrefsStore.getState().setPanelSizes("main", [30, 70]);
      useUIPrefsStore.getState().setPanelSizes("side", [25, 75]);
    });
    const sizes = useUIPrefsStore.getState().panelSizes;
    expect(sizes.main).toEqual([30, 70]);
    expect(sizes.side).toEqual([25, 75]);
  });

  it("resetPreferences clears all state and wipes localStorage", () => {
    act(() => {
      useUIPrefsStore.getState().toggleSidebar();
      useUIPrefsStore.getState().setLastVisitedPage("/x");
      useUIPrefsStore.getState().setColumnPreferences("t", ["c"]);
      useUIPrefsStore.getState().resetPreferences();
    });
    const s = useUIPrefsStore.getState();
    expect(s.sidebarCollapsed).toBe(false);
    expect(s.lastVisitedPage).toBeNull();
    expect(s.columnPreferences).toEqual({});
  });
});
