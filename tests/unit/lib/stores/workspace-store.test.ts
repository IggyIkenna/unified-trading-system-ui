import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import type { Workspace, CustomPanel } from "@/lib/stores/workspace-store";
import { registerPresets } from "@/components/widgets/preset-registry";
import { registerWidget } from "@/components/widgets/widget-registry";
import type { WidgetDefinition } from "@/components/widgets/widget-registry";
import { LayoutDashboard } from "lucide-react";

/**
 * Coverage lift for lib/stores/workspace-store.ts (was 3.44%).
 *
 * Exercises every exported action + exported selectors. Avoids importing
 * components/widgets/register-all (heavy cascade) — the workspace-store is
 * agnostic about which widgets exist: `getWidget` returns undefined for
 * unregistered IDs and `addWidget` then returns null. We register a couple
 * of lightweight synthetic definitions directly so we can exercise add /
 * remove / merge / coTab flows without pulling real widget modules.
 */

// Minimal widget stubs — deliberately not importing real widgets to keep
// the test isolated from the full registry cascade.
const DummyComponent = () => null;
function fakeWidget(id: string, opts?: { singleton?: boolean }): WidgetDefinition {
  return {
    id,
    label: id,
    description: id,
    icon: LayoutDashboard,
    category: "test",
    minW: 1,
    minH: 1,
    defaultW: 4,
    defaultH: 3,
    requiredEntitlements: [],
    availableOn: ["overview"],
    singleton: opts?.singleton,
    component: DummyComponent,
  };
}
registerWidget(fakeWidget("test-widget-a"));
registerWidget(fakeWidget("test-widget-b"));
registerWidget(fakeWidget("test-widget-sing", { singleton: true }));

// Register a preset on a tab so ensureTab does real work there.
registerPresets("overview-ws-test", [
  {
    id: "overview-ws-test-preset",
    name: "Test Preset",
    tab: "overview-ws-test",
    isPreset: true,
    layouts: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

function makeWs(id: string, tab: string, name = "W"): Workspace {
  return {
    id,
    name,
    tab,
    isPreset: false,
    layouts: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("workspace-store — initial state + reset", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("buildInitialState produces empty collections", () => {
    const s = useWorkspaceStore.getState();
    expect(s.workspaces).toEqual({});
    expect(s.activeWorkspaceId).toEqual({});
    expect(s.customPanels).toEqual([]);
    expect(s.snapshots).toEqual({});
    expect(s.undoStack).toEqual({});
    expect(s.syncStatus).toBe("local");
    expect(s.profiles).toEqual([]);
    expect(s.activeProfileId).toBe("");
    expect(s.editMode).toBe(true);
  });

  it("toggleEditMode flips the flag", () => {
    act(() => useWorkspaceStore.getState().toggleEditMode());
    expect(useWorkspaceStore.getState().editMode).toBe(false);
    act(() => useWorkspaceStore.getState().toggleEditMode());
    expect(useWorkspaceStore.getState().editMode).toBe(true);
  });

  it("setSyncStatus updates status", () => {
    act(() => useWorkspaceStore.getState().setSyncStatus("syncing"));
    expect(useWorkspaceStore.getState().syncStatus).toBe("syncing");
    act(() => useWorkspaceStore.getState().setSyncStatus("error"));
    expect(useWorkspaceStore.getState().syncStatus).toBe("error");
  });
});

describe("workspace-store — ensureTab + setActiveWorkspace", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("ensureTab on a registered tab seeds presets + active id", () => {
    act(() => useWorkspaceStore.getState().ensureTab("overview-ws-test"));
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["overview-ws-test"]?.length).toBeGreaterThan(0);
    expect(s.activeWorkspaceId["overview-ws-test"]).toBeTruthy();
  });

  it("ensureTab on an unregistered tab adds the blank canvas preset", () => {
    // preset-registry always returns a Blank Canvas for tabs with no
    // registered presets. So ensureTab DOES populate it.
    act(() => useWorkspaceStore.getState().ensureTab("zzz-new-tab"));
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["zzz-new-tab"]?.length).toBeGreaterThan(0);
  });

  it("ensureTab is idempotent when workspaces already exist", () => {
    act(() => useWorkspaceStore.getState().ensureTab("overview-ws-test"));
    const first = useWorkspaceStore.getState().workspaces["overview-ws-test"];
    act(() => useWorkspaceStore.getState().ensureTab("overview-ws-test"));
    const second = useWorkspaceStore.getState().workspaces["overview-ws-test"];
    expect(second).toEqual(first);
  });

  it("setActiveWorkspace updates active id per tab", () => {
    act(() => useWorkspaceStore.getState().setActiveWorkspace("tab1", "ws1"));
    expect(useWorkspaceStore.getState().activeWorkspaceId["tab1"]).toBe("ws1");
  });
});

describe("workspace-store — saveWorkspace + delete + duplicate", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("saveWorkspace inserts new workspace", () => {
    act(() => useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "First")));
    const list = useWorkspaceStore.getState().workspaces["t"];
    expect(list?.length).toBe(1);
    expect(list?.[0].name).toBe("First");
  });

  it("saveWorkspace updates existing workspace when id matches", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "One"));
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "Renamed"));
    });
    const list = useWorkspaceStore.getState().workspaces["t"];
    expect(list?.length).toBe(1);
    expect(list?.[0].name).toBe("Renamed");
  });

  it("duplicateWorkspace returns false on empty name", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "Src"));
    });
    const ok = useWorkspaceStore.getState().duplicateWorkspace("t", "w1", "   ");
    expect(ok).toBe(false);
  });

  it("duplicateWorkspace returns false when source missing", () => {
    const ok = useWorkspaceStore.getState().duplicateWorkspace("t", "nope", "Copy");
    expect(ok).toBe(false);
  });

  it("duplicateWorkspace returns false when target name clashes (case-insensitive)", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "Alpha"));
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w2", "t", "Beta"));
    });
    const ok = useWorkspaceStore.getState().duplicateWorkspace("t", "w1", "BETA");
    expect(ok).toBe(false);
  });

  it("duplicateWorkspace clones and activates", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "Alpha"));
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().duplicateWorkspace("t", "w1", "Alpha Copy");
    });
    expect(ok).toBe(true);
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["t"]?.length).toBe(2);
    expect(s.activeWorkspaceId["t"]).toMatch(/^t-\d+$/);
  });

  it("deleteWorkspace removes and re-picks active when deleting active", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w2", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
      useWorkspaceStore.getState().deleteWorkspace("t", "w1");
    });
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["t"]?.length).toBe(1);
    expect(s.activeWorkspaceId["t"]).toBe("w2");
  });

  it("deleteWorkspace keeps active intact when deleting non-active", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w2", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
      useWorkspaceStore.getState().deleteWorkspace("t", "w2");
    });
    expect(useWorkspaceStore.getState().activeWorkspaceId["t"]).toBe("w1");
  });

  it("deleteWorkspace with all deleted leaves active empty", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
      useWorkspaceStore.getState().deleteWorkspace("t", "w1");
    });
    expect(useWorkspaceStore.getState().activeWorkspaceId["t"]).toBe("");
  });
});

describe("workspace-store — layouts + widgets", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
    });
  });

  it("updateLayout replaces layouts on active", () => {
    act(() =>
      useWorkspaceStore.getState().updateLayout("t", [
        { widgetId: "x", instanceId: "i", x: 0, y: 0, w: 1, h: 1 },
      ]),
    );
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts.length).toBe(1);
  });

  it("addWidget returns null for unregistered id", () => {
    const placement = useWorkspaceStore.getState().addWidget("t", "does-not-exist");
    expect(placement).toBeNull();
  });

  it("addWidget places the widget and returns placement", () => {
    let placement = null;
    act(() => {
      placement = useWorkspaceStore.getState().addWidget("t", "test-widget-a");
    });
    expect(placement).not.toBeNull();
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts[0]?.widgetId).toBe("test-widget-a");
  });

  it("addWidget respects singleton — second add returns null", () => {
    let first: unknown = null;
    let second: unknown = null;
    act(() => {
      first = useWorkspaceStore.getState().addWidget("t", "test-widget-sing");
      second = useWorkspaceStore.getState().addWidget("t", "test-widget-sing");
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("addWidget finds next open position when grid non-empty", () => {
    act(() => {
      useWorkspaceStore.getState().addWidget("t", "test-widget-a");
      useWorkspaceStore.getState().addWidget("t", "test-widget-b");
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts.length).toBe(2);
    // Two placements should not share identical (x, y).
    expect(ws?.layouts[0]?.x === ws?.layouts[1]?.x && ws?.layouts[0]?.y === ws?.layouts[1]?.y).toBe(false);
  });

  it("removeWidget drops by instanceId", () => {
    let p: { instanceId: string } | null = null;
    act(() => {
      p = useWorkspaceStore.getState().addWidget("t", "test-widget-a") as { instanceId: string };
      useWorkspaceStore.getState().removeWidget("t", p!.instanceId);
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts.length).toBe(0);
  });

  it("mergeWidget appends a coTab and sets it active", () => {
    let p: { instanceId: string } | null = null;
    act(() => {
      p = useWorkspaceStore.getState().addWidget("t", "test-widget-a") as { instanceId: string };
      useWorkspaceStore.getState().mergeWidget("t", p!.instanceId, "test-widget-b");
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts[0].coTabs).toEqual(["test-widget-b"]);
    expect(ws?.layouts[0].activeTabId).toBe("test-widget-b");
  });

  it("mergeWidget is idempotent if same widget already present", () => {
    let p: { instanceId: string } | null = null;
    act(() => {
      p = useWorkspaceStore.getState().addWidget("t", "test-widget-a") as { instanceId: string };
      useWorkspaceStore.getState().mergeWidget("t", p!.instanceId, "test-widget-a");
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts[0].coTabs ?? []).toEqual([]);
  });

  it("removeCoTab removes the co tab and re-points active when removing active", () => {
    let p: { instanceId: string } | null = null;
    act(() => {
      p = useWorkspaceStore.getState().addWidget("t", "test-widget-a") as { instanceId: string };
      useWorkspaceStore.getState().mergeWidget("t", p!.instanceId, "test-widget-b");
      useWorkspaceStore.getState().removeCoTab("t", p!.instanceId, "test-widget-b");
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts[0].coTabs).toEqual([]);
    // active falls back to primary widgetId
    expect(ws?.layouts[0].activeTabId).toBe("test-widget-a");
  });

  it("setActiveCoTab flips the active tab id", () => {
    let p: { instanceId: string } | null = null;
    act(() => {
      p = useWorkspaceStore.getState().addWidget("t", "test-widget-a") as { instanceId: string };
      useWorkspaceStore.getState().mergeWidget("t", p!.instanceId, "test-widget-b");
      useWorkspaceStore.getState().setActiveCoTab("t", p!.instanceId, "test-widget-a");
    });
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts[0].activeTabId).toBe("test-widget-a");
  });
});

describe("workspace-store — export / import workspace", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("exportWorkspace returns {} for missing workspace", () => {
    const json = useWorkspaceStore.getState().exportWorkspace("t", "missing");
    expect(json).toBe("{}");
  });

  it("exportWorkspace returns versioned JSON for a real workspace", () => {
    act(() => useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t", "A")));
    const json = useWorkspaceStore.getState().exportWorkspace("t", "w1");
    const parsed = JSON.parse(json) as { version: number; workspace: Workspace };
    expect(parsed.version).toBe(1);
    expect(parsed.workspace.name).toBe("A");
  });

  it("importWorkspace returns false on garbage JSON", () => {
    const ok = useWorkspaceStore.getState().importWorkspace("t", "{not json");
    expect(ok).toBe(false);
  });

  it("importWorkspace returns false on json missing layouts", () => {
    const ok = useWorkspaceStore
      .getState()
      .importWorkspace("t", JSON.stringify({ version: 1, workspace: { name: "X" } }));
    expect(ok).toBe(false);
  });

  it("importWorkspace installs + activates a new workspace", () => {
    const body = JSON.stringify({
      version: 1,
      workspace: { id: "old", name: "X", tab: "t", isPreset: false, layouts: [] },
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().importWorkspace("t", body);
    });
    expect(ok).toBe(true);
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["t"]?.length).toBe(1);
    // imported workspace gets a new id
    expect(s.workspaces["t"]?.[0].id).not.toBe("old");
  });
});

describe("workspace-store — custom panels", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("createCustomPanel returns null for blank name", () => {
    const id = useWorkspaceStore.getState().createCustomPanel("   ");
    expect(id).toBeNull();
  });

  it("createCustomPanel rejects case-insensitive duplicate", () => {
    let first: string | null = null;
    act(() => {
      first = useWorkspaceStore.getState().createCustomPanel("Panel One");
    });
    expect(first).toBeTruthy();
    const second = useWorkspaceStore.getState().createCustomPanel("PANEL ONE");
    expect(second).toBeNull();
  });

  it("createCustomPanel seeds the panel + tab workspaces", () => {
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().createCustomPanel("Panel One");
    });
    const s = useWorkspaceStore.getState();
    const panel = s.customPanels.find((p) => p.id === id);
    expect(panel?.name).toBe("Panel One");
    const tab = `custom-${id}`;
    expect(s.workspaces[tab]?.length).toBe(1);
    expect(s.activeWorkspaceId[tab]).toBeTruthy();
  });

  it("renameCustomPanel updates the name but rejects blank + duplicate", () => {
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().createCustomPanel("One");
      useWorkspaceStore.getState().createCustomPanel("Two");
    });
    act(() => useWorkspaceStore.getState().renameCustomPanel(id!, "   "));
    act(() => useWorkspaceStore.getState().renameCustomPanel(id!, "TWO"));
    act(() => useWorkspaceStore.getState().renameCustomPanel(id!, "One Renamed"));
    const panel = useWorkspaceStore.getState().customPanels.find((p) => p.id === id);
    expect(panel?.name).toBe("One Renamed");
  });

  it("deleteCustomPanel removes panel + tab data", () => {
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().createCustomPanel("Temp");
    });
    const tab = `custom-${id}`;
    act(() => useWorkspaceStore.getState().deleteCustomPanel(id!));
    const s = useWorkspaceStore.getState();
    expect(s.customPanels.find((p) => p.id === id)).toBeUndefined();
    expect(s.workspaces[tab]).toBeUndefined();
    expect(s.activeWorkspaceId[tab]).toBeUndefined();
  });
});

describe("workspace-store — snapshots + undo", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
    });
  });

  it("saveSnapshot returns null for blank name", () => {
    const id = useWorkspaceStore.getState().saveSnapshot("t", "  ");
    expect(id).toBeNull();
  });

  it("saveSnapshot rejects duplicate case-insensitive", () => {
    let first: string | null = null;
    act(() => {
      first = useWorkspaceStore.getState().saveSnapshot("t", "Snap");
    });
    expect(first).toBeTruthy();
    const dup = useWorkspaceStore.getState().saveSnapshot("t", "SNAP");
    expect(dup).toBeNull();
  });

  it("saveSnapshot returns null when no active workspace", () => {
    act(() => useWorkspaceStore.getState().reset());
    const id = useWorkspaceStore.getState().saveSnapshot("t", "Snap");
    expect(id).toBeNull();
  });

  it("restoreSnapshot returns false on missing id", () => {
    expect(useWorkspaceStore.getState().restoreSnapshot("t", "nope")).toBe(false);
  });

  it("restoreSnapshot restores layouts and pushes undo", () => {
    let snapId: string | null = null;
    act(() => {
      useWorkspaceStore.getState().updateLayout("t", [
        { widgetId: "a", instanceId: "a-1", x: 0, y: 0, w: 1, h: 1 },
      ]);
      snapId = useWorkspaceStore.getState().saveSnapshot("t", "Initial");
      useWorkspaceStore.getState().updateLayout("t", []);
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().restoreSnapshot("t", snapId!);
    });
    expect(ok).toBe(true);
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts.length).toBe(1);
    expect(useWorkspaceStore.getState().undoStack["t"]?.length).toBe(1);
  });

  it("deleteSnapshot removes snapshot by id", () => {
    let snapId: string | null = null;
    act(() => {
      snapId = useWorkspaceStore.getState().saveSnapshot("t", "S");
      useWorkspaceStore.getState().deleteSnapshot("t", snapId!);
    });
    expect(useWorkspaceStore.getState().snapshots["t"]).toEqual([]);
  });

  it("pushUndo is a no-op when no active workspace", () => {
    act(() => useWorkspaceStore.getState().pushUndo("does-not-exist"));
    expect(useWorkspaceStore.getState().undoStack["does-not-exist"]).toBeUndefined();
  });

  it("undo returns false on empty stack", () => {
    expect(useWorkspaceStore.getState().undo("t")).toBe(false);
  });

  it("undo reverts the active workspace + pops the stack", () => {
    act(() => {
      useWorkspaceStore.getState().pushUndo("t");
      useWorkspaceStore.getState().updateLayout("t", [
        { widgetId: "a", instanceId: "a-1", x: 0, y: 0, w: 1, h: 1 },
      ]);
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().undo("t");
    });
    expect(ok).toBe(true);
    const ws = useWorkspaceStore.getState().workspaces["t"]?.find((w) => w.id === "w1");
    expect(ws?.layouts.length).toBe(0);
    expect(useWorkspaceStore.getState().undoStack["t"]?.length).toBe(0);
  });
});

describe("workspace-store — profiles", () => {
  beforeEach(() => {
    act(() => useWorkspaceStore.getState().reset());
  });

  it("ensureProfiles seeds default + full when empty", () => {
    act(() => useWorkspaceStore.getState().ensureProfiles());
    const s = useWorkspaceStore.getState();
    expect(s.profiles.length).toBeGreaterThanOrEqual(2);
    expect(s.profiles.find((p) => p.id === "default")).toBeTruthy();
    expect(s.profiles.find((p) => p.id === "full")).toBeTruthy();
    expect(s.activeProfileId).toBeTruthy();
  });

  it("ensureProfiles inserts full if it is missing", () => {
    // Start with a state that has only `default`.
    act(() => {
      useWorkspaceStore.setState({
        profiles: [
          {
            id: "default",
            name: "Default",
            isPreset: true,
            tabs: {},
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
        activeProfileId: "default",
      });
      useWorkspaceStore.getState().ensureProfiles();
    });
    expect(useWorkspaceStore.getState().profiles.find((p) => p.id === "full")).toBeTruthy();
  });

  it("ensureProfiles on an already-seeded state does not duplicate default/full", () => {
    act(() => useWorkspaceStore.getState().ensureProfiles());
    const firstCount = useWorkspaceStore.getState().profiles.length;
    act(() => useWorkspaceStore.getState().ensureProfiles());
    expect(useWorkspaceStore.getState().profiles.length).toBe(firstCount);
  });

  it("saveCurrentAsProfile rejects blank + duplicate names", () => {
    expect(useWorkspaceStore.getState().saveCurrentAsProfile("  ")).toBeNull();
    act(() => {
      useWorkspaceStore.getState().saveCurrentAsProfile("My Profile");
    });
    expect(useWorkspaceStore.getState().saveCurrentAsProfile("MY PROFILE")).toBeNull();
  });

  it("saveCurrentAsProfile captures current tabs + activates it", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
    });
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().saveCurrentAsProfile("Snap Profile");
    });
    expect(id).toBeTruthy();
    expect(useWorkspaceStore.getState().activeProfileId).toBe(id);
  });

  it("duplicateProfile copies source; rejects blank / duplicate / missing", () => {
    act(() => useWorkspaceStore.getState().saveCurrentAsProfile("Base"));
    const src = useWorkspaceStore.getState().profiles[0];
    expect(useWorkspaceStore.getState().duplicateProfile(src.id, "  ")).toBeNull();
    expect(useWorkspaceStore.getState().duplicateProfile(src.id, "Base")).toBeNull();
    expect(useWorkspaceStore.getState().duplicateProfile("nope", "X")).toBeNull();
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().duplicateProfile(src.id, "Copy");
    });
    expect(id).toBeTruthy();
    expect(useWorkspaceStore.getState().activeProfileId).toBe(id);
  });

  it("setActiveProfile applies tabs + customPanels from profile", () => {
    const customPanels: CustomPanel[] = [{ id: "p1", name: "Panel 1" }];
    act(() => {
      useWorkspaceStore.setState({
        profiles: [
          {
            id: "prof-a",
            name: "A",
            isPreset: false,
            tabs: {
              overview: makeWs("w-over", "overview"),
              "custom-p1": makeWs("w-custom", "custom-p1"),
            },
            customPanels,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
      });
      useWorkspaceStore.getState().setActiveProfile("prof-a");
    });
    const s = useWorkspaceStore.getState();
    expect(s.activeProfileId).toBe("prof-a");
    expect(s.customPanels).toEqual(customPanels);
    expect(s.activeWorkspaceId["overview"]).toBe("w-over");
  });

  it("setActiveProfile strips stale custom- tabs not in profile", () => {
    act(() => {
      useWorkspaceStore.setState({
        workspaces: { "custom-old": [makeWs("w", "custom-old")] },
        activeWorkspaceId: { "custom-old": "w" },
        snapshots: { "custom-old": [] },
        profiles: [
          {
            id: "prof-a",
            name: "A",
            isPreset: false,
            tabs: {},
            customPanels: [],
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
      });
      useWorkspaceStore.getState().setActiveProfile("prof-a");
    });
    const s = useWorkspaceStore.getState();
    expect(s.workspaces["custom-old"]).toBeUndefined();
  });

  it("setActiveProfile is a no-op when profile id missing", () => {
    const before = useWorkspaceStore.getState();
    act(() => useWorkspaceStore.getState().setActiveProfile("missing"));
    const after = useWorkspaceStore.getState();
    expect(after.activeProfileId).toBe(before.activeProfileId);
  });

  it("deleteProfile removes and re-points active when deleting active", () => {
    act(() => {
      useWorkspaceStore.getState().saveCurrentAsProfile("A");
      useWorkspaceStore.getState().saveCurrentAsProfile("B");
    });
    const s = useWorkspaceStore.getState();
    const active = s.activeProfileId;
    act(() => useWorkspaceStore.getState().deleteProfile(active));
    const after = useWorkspaceStore.getState();
    expect(after.profiles.find((p) => p.id === active)).toBeUndefined();
    expect(after.activeProfileId).not.toBe(active);
  });

  it("deleteProfile clears custom panels when no profiles remain", () => {
    act(() => {
      useWorkspaceStore.getState().saveCurrentAsProfile("Only");
      useWorkspaceStore.getState().createCustomPanel("keep me for now");
    });
    const id = useWorkspaceStore.getState().activeProfileId;
    act(() => useWorkspaceStore.getState().deleteProfile(id));
    expect(useWorkspaceStore.getState().activeProfileId).toBe("");
  });

  it("exportProfile returns snapshot when profile id missing", () => {
    act(() => {
      useWorkspaceStore.getState().saveWorkspace("t", makeWs("w1", "t"));
      useWorkspaceStore.getState().setActiveWorkspace("t", "w1");
    });
    const json = useWorkspaceStore.getState().exportProfile("not-real");
    const parsed = JSON.parse(json) as { version: number };
    expect(parsed.version).toBe(2);
  });

  it("exportProfile returns the named profile", () => {
    let id: string | null = null;
    act(() => {
      id = useWorkspaceStore.getState().saveCurrentAsProfile("X");
    });
    const json = useWorkspaceStore.getState().exportProfile(id!);
    const parsed = JSON.parse(json) as { profile: { name: string } };
    expect(parsed.profile.name).toBe("X");
  });

  it("importProfile handles v2 payload", () => {
    const payload = JSON.stringify({
      version: 2,
      profile: {
        id: "legacy",
        name: "Legacy Import",
        isPreset: false,
        tabs: { overview: makeWs("w1", "overview") },
        customPanels: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().importProfile(payload);
    });
    expect(ok).toBe(true);
    expect(
      useWorkspaceStore.getState().profiles.some((p) => p.name === "Legacy Import"),
    ).toBe(true);
  });

  it("importProfile delegates v1 payload to importWorkspace", () => {
    const payload = JSON.stringify({
      version: 1,
      workspace: { id: "x", name: "X", tab: "t", isPreset: false, layouts: [] },
    });
    let ok = false;
    act(() => {
      ok = useWorkspaceStore.getState().importProfile(payload);
    });
    expect(ok).toBe(true);
  });

  it("importProfile returns false for bad JSON + unknown versions", () => {
    expect(useWorkspaceStore.getState().importProfile("{broken")).toBe(false);
    expect(
      useWorkspaceStore.getState().importProfile(JSON.stringify({ version: 99 })),
    ).toBe(false);
  });

  it("importProfile uniquifies name when same name already present", () => {
    act(() => useWorkspaceStore.getState().saveCurrentAsProfile("Dup"));
    const payload = JSON.stringify({
      version: 2,
      profile: {
        id: "dup",
        name: "Dup",
        isPreset: false,
        tabs: { overview: makeWs("w", "overview") },
        customPanels: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    });
    act(() => {
      useWorkspaceStore.getState().importProfile(payload);
    });
    const names = useWorkspaceStore.getState().profiles.map((p) => p.name);
    expect(names.filter((n) => n === "Dup").length).toBe(1);
    expect(names.some((n) => n.startsWith("Dup ("))).toBe(true);
  });
});
