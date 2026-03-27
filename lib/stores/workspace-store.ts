import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetPlacement } from "@/components/widgets/widget-registry";
import { getWidget } from "@/components/widgets/widget-registry";
import { OVERVIEW_PRESETS, TERMINAL_PRESETS } from "@/components/widgets/workspace-presets";

export interface Workspace {
  id: string;
  name: string;
  tab: string;
  isPreset: boolean;
  layouts: WidgetPlacement[];
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceState {
  workspaces: Record<string, Workspace[]>;
  activeWorkspaceId: Record<string, string>;
  editMode: boolean;
}

interface WorkspaceActions extends WorkspaceState {
  setActiveWorkspace: (tab: string, id: string) => void;
  saveWorkspace: (tab: string, workspace: Workspace) => void;
  duplicateWorkspace: (tab: string, id: string, newName: string) => void;
  deleteWorkspace: (tab: string, id: string) => void;
  updateLayout: (tab: string, layouts: WidgetPlacement[]) => void;
  addWidget: (tab: string, widgetId: string) => WidgetPlacement | null;
  removeWidget: (tab: string, instanceId: string) => void;
  /** Merge a widget as a co-tab into an existing placement cell */
  mergeWidget: (tab: string, instanceId: string, widgetId: string) => void;
  /** Remove a co-tab from a placement (or revert to primary if last co-tab) */
  removeCoTab: (tab: string, instanceId: string, widgetId: string) => void;
  /** Set the active tab in a multi-tab cell */
  setActiveCoTab: (tab: string, instanceId: string, activeTabId: string) => void;
  toggleEditMode: () => void;
  exportWorkspace: (tab: string, id: string) => string;
  importWorkspace: (tab: string, json: string) => boolean;
  reset: () => void;
}

const STORAGE_KEY = "unified-workspace-layouts";

function buildInitialState(): WorkspaceState {
  return {
    workspaces: {
      overview: [...OVERVIEW_PRESETS],
      terminal: [...TERMINAL_PRESETS],
    },
    activeWorkspaceId: {
      overview: "overview-default",
      terminal: "terminal-default",
    },
    editMode: true,
  };
}

function getActiveLayouts(state: WorkspaceState, tab: string): WidgetPlacement[] {
  const activeId = state.activeWorkspaceId[tab];
  const ws = state.workspaces[tab]?.find((w) => w.id === activeId);
  return ws?.layouts ?? [];
}

function findOpenPosition(
  existing: WidgetPlacement[],
  w: number,
  h: number,
  cols: number = 12,
): { x: number; y: number } {
  if (existing.length === 0) return { x: 0, y: 0 };
  const maxY = Math.max(...existing.map((p) => p.y + p.h));
  for (let y = 0; y <= maxY + 1; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const overlaps = existing.some((p) => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y);
      if (!overlaps) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

export const useWorkspaceStore = create<WorkspaceActions>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      setActiveWorkspace: (tab, id) =>
        set((s) => ({
          activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: id },
        })),

      saveWorkspace: (tab, workspace) =>
        set((s) => {
          const tabWorkspaces = s.workspaces[tab] ?? [];
          const idx = tabWorkspaces.findIndex((w) => w.id === workspace.id);
          const updated = [...tabWorkspaces];
          if (idx >= 0) {
            updated[idx] = { ...workspace, updatedAt: new Date().toISOString() };
          } else {
            updated.push({ ...workspace, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          }
          return { workspaces: { ...s.workspaces, [tab]: updated } };
        }),

      duplicateWorkspace: (tab, id, newName) =>
        set((s) => {
          const source = s.workspaces[tab]?.find((w) => w.id === id);
          if (!source) return s;
          const newId = `${tab}-${Date.now()}`;
          const clone: Workspace = {
            ...source,
            id: newId,
            name: newName,
            isPreset: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            workspaces: { ...s.workspaces, [tab]: [...(s.workspaces[tab] ?? []), clone] },
            activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: newId },
          };
        }),

      deleteWorkspace: (tab, id) =>
        set((s) => {
          const filtered = (s.workspaces[tab] ?? []).filter((w) => w.id !== id);
          const activeId = s.activeWorkspaceId[tab] === id ? (filtered[0]?.id ?? "") : s.activeWorkspaceId[tab];
          return {
            workspaces: { ...s.workspaces, [tab]: filtered },
            activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: activeId },
          };
        }),

      updateLayout: (tab, layouts) =>
        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((w) =>
            w.id === activeId ? { ...w, layouts, updatedAt: new Date().toISOString() } : w,
          );
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        }),

      addWidget: (tab, widgetId) => {
        const def = getWidget(widgetId);
        if (!def) return null;

        const state = get();
        const layouts = getActiveLayouts(state, tab);

        if (def.singleton && layouts.some((l) => l.widgetId === widgetId)) {
          return null;
        }

        const instanceId = `${widgetId}-${Date.now()}`;
        const pos = findOpenPosition(layouts, def.defaultW, def.defaultH);
        const placement: WidgetPlacement = {
          widgetId,
          instanceId,
          x: pos.x,
          y: pos.y,
          w: def.defaultW,
          h: def.defaultH,
        };

        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((ws) =>
            ws.id === activeId
              ? { ...ws, layouts: [...ws.layouts, placement], updatedAt: new Date().toISOString() }
              : ws,
          );
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        });
        return placement;
      },

      removeWidget: (tab, instanceId) =>
        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((ws) =>
            ws.id === activeId
              ? {
                  ...ws,
                  layouts: ws.layouts.filter((l) => l.instanceId !== instanceId),
                  updatedAt: new Date().toISOString(),
                }
              : ws,
          );
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        }),

      mergeWidget: (tab, instanceId, widgetId) =>
        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((ws) => {
            if (ws.id !== activeId) return ws;
            const layouts = ws.layouts.map((l) => {
              if (l.instanceId !== instanceId) return l;
              const existing = l.coTabs ?? [];
              if (existing.includes(widgetId) || l.widgetId === widgetId) return l;
              return {
                ...l,
                coTabs: [...existing, widgetId],
                activeTabId: widgetId,
              };
            });
            return { ...ws, layouts, updatedAt: new Date().toISOString() };
          });
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        }),

      removeCoTab: (tab, instanceId, widgetId) =>
        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((ws) => {
            if (ws.id !== activeId) return ws;
            const layouts = ws.layouts.map((l) => {
              if (l.instanceId !== instanceId) return l;
              const coTabs = (l.coTabs ?? []).filter((id) => id !== widgetId);
              const activeTabId =
                l.activeTabId === widgetId ? (coTabs[coTabs.length - 1] ?? l.widgetId) : l.activeTabId;
              return { ...l, coTabs, activeTabId };
            });
            return { ...ws, layouts, updatedAt: new Date().toISOString() };
          });
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        }),

      setActiveCoTab: (tab, instanceId, activeTabId) =>
        set((s) => {
          const activeId = s.activeWorkspaceId[tab];
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((ws) => {
            if (ws.id !== activeId) return ws;
            const layouts = ws.layouts.map((l) => (l.instanceId === instanceId ? { ...l, activeTabId } : l));
            return { ...ws, layouts, updatedAt: new Date().toISOString() };
          });
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        }),

      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

      exportWorkspace: (tab, id) => {
        const ws = get().workspaces[tab]?.find((w) => w.id === id);
        if (!ws) return "{}";
        return JSON.stringify({ version: 1, workspace: ws }, null, 2);
      },

      importWorkspace: (tab, json) => {
        try {
          const parsed = JSON.parse(json);
          if (!parsed?.workspace?.layouts || !Array.isArray(parsed.workspace.layouts)) return false;
          const ws: Workspace = {
            ...parsed.workspace,
            id: `${tab}-imported-${Date.now()}`,
            isPreset: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            workspaces: { ...s.workspaces, [tab]: [...(s.workspaces[tab] ?? []), ws] },
            activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: ws.id },
          }));
          return true;
        } catch {
          return false;
        }
      },

      reset: () => set(buildInitialState()),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        workspaces: s.workspaces,
        activeWorkspaceId: s.activeWorkspaceId,
        editMode: s.editMode,
      }),
    },
  ),
);

export function useActiveWorkspace(tab: string): Workspace | undefined {
  const workspaces = useWorkspaceStore((s) => s.workspaces[tab]);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId[tab]);
  return workspaces?.find((w) => w.id === activeId);
}

export function useActiveLayouts(tab: string): WidgetPlacement[] {
  const ws = useActiveWorkspace(tab);
  return ws?.layouts ?? [];
}
