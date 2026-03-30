import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetPlacement } from "@/components/widgets/widget-registry";
import { getWidget } from "@/components/widgets/widget-registry";
import { getPresetsForTab } from "@/components/widgets/preset-registry";
import { buildDefaultProfile, buildFullProfile } from "@/components/widgets/default-profile";

export interface Workspace {
  id: string;
  name: string;
  tab: string;
  isPreset: boolean;
  layouts: WidgetPlacement[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomPanel {
  id: string;
  name: string;
  icon?: string;
}

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  workspace: Workspace;
  createdAt: string;
}

export type SyncStatus = "local" | "syncing" | "synced" | "error";

/** A workspace profile bundles one workspace per tab — selecting a profile applies to all pages. */
export interface WorkspaceProfile {
  id: string;
  name: string;
  isPreset: boolean;
  /** One workspace per tab — keys are tab strings (e.g. "positions", "overview", "custom-<panelId>") */
  tabs: Record<string, Workspace>;
  /** Custom panels belonging to this profile (nav + `custom-${id}` workspaces in `tabs`). Omitted in legacy persisted profiles. */
  customPanels?: CustomPanel[];
  createdAt: string;
  updatedAt: string;
}

const MAX_UNDO_STACK = 30;
const MAX_SNAPSHOTS_PER_WORKSPACE = 20;

interface WorkspaceState {
  workspaces: Record<string, Workspace[]>;
  activeWorkspaceId: Record<string, string>;
  editMode: boolean;
  customPanels: CustomPanel[];
  snapshots: Record<string, WorkspaceSnapshot[]>;
  undoStack: Record<string, Workspace[]>;
  syncStatus: SyncStatus;
  profiles: WorkspaceProfile[];
  activeProfileId: string;
}

interface WorkspaceActions extends WorkspaceState {
  ensureTab: (tab: string) => void;
  setActiveWorkspace: (tab: string, id: string) => void;
  saveWorkspace: (tab: string, workspace: Workspace) => void;
  duplicateWorkspace: (tab: string, id: string, newName: string) => boolean;
  deleteWorkspace: (tab: string, id: string) => void;
  updateLayout: (tab: string, layouts: WidgetPlacement[]) => void;
  addWidget: (tab: string, widgetId: string) => WidgetPlacement | null;
  removeWidget: (tab: string, instanceId: string) => void;
  mergeWidget: (tab: string, instanceId: string, widgetId: string) => void;
  removeCoTab: (tab: string, instanceId: string, widgetId: string) => void;
  setActiveCoTab: (tab: string, instanceId: string, activeTabId: string) => void;
  toggleEditMode: () => void;
  exportWorkspace: (tab: string, id: string) => string;
  importWorkspace: (tab: string, json: string) => boolean;
  createCustomPanel: (name: string) => string | null;
  deleteCustomPanel: (id: string) => void;
  renameCustomPanel: (id: string, name: string) => void;
  saveSnapshot: (tab: string, name: string) => string | null;
  restoreSnapshot: (tab: string, snapshotId: string) => boolean;
  deleteSnapshot: (tab: string, snapshotId: string) => void;
  undo: (tab: string) => boolean;
  pushUndo: (tab: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setActiveProfile: (profileId: string) => void;
  exportProfile: (profileId: string) => string;
  importProfile: (json: string) => boolean;
  saveCurrentAsProfile: (name: string) => string | null;
  deleteProfile: (profileId: string) => void;
  duplicateProfile: (profileId: string, newName: string) => string | null;
  ensureProfiles: () => void;
  reset: () => void;
}

const STORAGE_KEY = "unified-workspace-layouts";

function normalizedCustomPanelName(name: string): string {
  return name.trim().toLowerCase();
}

/** Case-insensitive unique label for profiles, per-tab workspaces, and layout snapshots. */
function normalizedWorkspaceLabel(name: string): string {
  return normalizedCustomPanelName(name);
}

function uniqueImportedProfileName(state: WorkspaceState, desired: string): string {
  const base = desired.trim() || "Imported";
  let candidate = base;
  let i = 0;
  while (state.profiles.some((p) => normalizedWorkspaceLabel(p.name) === normalizedWorkspaceLabel(candidate))) {
    i += 1;
    candidate = `${base} (${i})`;
  }
  return candidate;
}

function buildInitialState(): WorkspaceState {
  return {
    workspaces: {},
    activeWorkspaceId: {},
    editMode: true,
    customPanels: [],
    snapshots: {},
    undoStack: {},
    syncStatus: "local",
    profiles: [],
    activeProfileId: "",
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

function snapshotCurrentProfile(state: WorkspaceState): WorkspaceProfile {
  const tabs: Record<string, Workspace> = {};
  for (const [tab, wsList] of Object.entries(state.workspaces)) {
    const activeId = state.activeWorkspaceId[tab];
    const ws = wsList.find((w) => w.id === activeId) ?? wsList[0];
    if (ws) tabs[tab] = JSON.parse(JSON.stringify(ws));
  }
  const customPanels = JSON.parse(JSON.stringify(state.customPanels)) as CustomPanel[];
  for (const p of customPanels) {
    const tab = `custom-${p.id}`;
    if (tabs[tab]) continue;
    const wsList = state.workspaces[tab];
    const activeId = state.activeWorkspaceId[tab];
    const ws = wsList?.find((w) => w.id === activeId) ?? wsList?.[0];
    if (ws) tabs[tab] = JSON.parse(JSON.stringify(ws));
  }
  const now = new Date().toISOString();
  return {
    id: `profile-current-${Date.now()}`,
    name: "My Workspace",
    isPreset: false,
    tabs,
    customPanels,
    createdAt: now,
    updatedAt: now,
  };
}

function profileCustomPanels(profile: WorkspaceProfile): CustomPanel[] {
  const customTabKeys = Object.keys(profile.tabs).filter((t) => t.startsWith("custom-"));
  const hasCustomTabs = customTabKeys.length > 0;
  const stored = profile.customPanels;
  if (Array.isArray(stored) && stored.length > 0) {
    return JSON.parse(JSON.stringify(stored)) as CustomPanel[];
  }
  if (Array.isArray(stored) && stored.length === 0 && !hasCustomTabs) {
    return [];
  }
  if (!hasCustomTabs) {
    return [];
  }
  const inferred: CustomPanel[] = [];
  for (const tab of customTabKeys) {
    const id = tab.slice("custom-".length);
    if (!id || inferred.some((p) => p.id === id)) continue;
    inferred.push({ id, name: `Panel ${inferred.length + 1}` });
  }
  return inferred;
}

/** Default empty workspace for a custom panel tab when a profile lists the panel but has no tab entry (e.g. legacy export). */
function defaultCustomTabWorkspace(tab: string): Workspace {
  const now = new Date().toISOString();
  const wsId = `${tab}-default`;
  return {
    id: wsId,
    name: "Default",
    tab,
    isPreset: false,
    layouts: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Keep the active non-preset profile in sync when custom panels change (so switching profiles does not drop new panels). */
function mapActiveUserProfile(s: WorkspaceState, map: (p: WorkspaceProfile) => WorkspaceProfile): WorkspaceProfile[] {
  const activeId = s.activeProfileId;
  const active = s.profiles.find((p) => p.id === activeId);
  if (!active?.id || active.isPreset) return s.profiles;
  return s.profiles.map((p) => (p.id === activeId ? map(p) : p));
}

export const useWorkspaceStore = create<WorkspaceActions>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      ensureTab: (tab) => {
        const state = get();
        if (state.workspaces[tab] && state.workspaces[tab].length > 0) return;
        const presets = getPresetsForTab(tab);
        if (presets.length === 0) return;
        set((s) => ({
          workspaces: { ...s.workspaces, [tab]: presets },
          activeWorkspaceId: {
            ...s.activeWorkspaceId,
            [tab]: s.activeWorkspaceId[tab] ?? presets[0].id,
          },
        }));
      },

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

      duplicateWorkspace: (tab, id, newName) => {
        const trimmed = newName.trim();
        if (!trimmed) return false;
        const state = get();
        const key = normalizedWorkspaceLabel(trimmed);
        if (state.workspaces[tab]?.some((w) => normalizedWorkspaceLabel(w.name) === key)) {
          return false;
        }
        const source = state.workspaces[tab]?.find((w) => w.id === id);
        if (!source) return false;
        const newId = `${tab}-${Date.now()}`;
        const clone: Workspace = {
          ...source,
          id: newId,
          name: trimmed,
          isPreset: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          workspaces: { ...s.workspaces, [tab]: [...(s.workspaces[tab] ?? []), clone] },
          activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: newId },
        }));
        return true;
      },

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
              return { ...l, coTabs: [...existing, widgetId], activeTabId: widgetId };
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

      createCustomPanel: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const state = get();
        const key = normalizedCustomPanelName(trimmed);
        if (state.customPanels.some((p) => normalizedCustomPanelName(p.name) === key)) {
          return null;
        }
        const id = `panel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const tab = `custom-${id}`;
        const wsId = `${tab}-default`;
        const now = new Date().toISOString();
        const defaultWorkspace: Workspace = {
          id: wsId,
          name: "Default",
          tab,
          isPreset: false,
          layouts: [],
          createdAt: now,
          updatedAt: now,
        };
        const wsSnapshot = JSON.parse(JSON.stringify(defaultWorkspace)) as Workspace;
        set((s) => {
          const nextPanels = [...s.customPanels, { id, name: trimmed }];
          return {
            customPanels: nextPanels,
            workspaces: { ...s.workspaces, [tab]: [defaultWorkspace] },
            activeWorkspaceId: { ...s.activeWorkspaceId, [tab]: wsId },
            profiles: mapActiveUserProfile(s, (p) => ({
              ...p,
              customPanels: JSON.parse(JSON.stringify(nextPanels)) as CustomPanel[],
              tabs: { ...p.tabs, [tab]: JSON.parse(JSON.stringify(wsSnapshot)) as Workspace },
              updatedAt: new Date().toISOString(),
            })),
          };
        });
        return id;
      },

      deleteCustomPanel: (id) =>
        set((s) => {
          const tab = `custom-${id}`;
          const nextPanels = s.customPanels.filter((p) => p.id !== id);
          const { [tab]: _removed, ...remainingWorkspaces } = s.workspaces;
          const { [tab]: _removedActive, ...remainingActive } = s.activeWorkspaceId;
          const { [tab]: _removedSnaps, ...remainingSnapshots } = s.snapshots;
          const { [tab]: _removedUndo, ...remainingUndo } = s.undoStack;
          return {
            customPanels: nextPanels,
            workspaces: remainingWorkspaces,
            activeWorkspaceId: remainingActive,
            snapshots: remainingSnapshots,
            undoStack: remainingUndo,
            profiles: mapActiveUserProfile(s, (p) => {
              const { [tab]: _t, ...restTabs } = p.tabs;
              return {
                ...p,
                tabs: restTabs,
                customPanels: JSON.parse(JSON.stringify(nextPanels)) as CustomPanel[],
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }),

      renameCustomPanel: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const state = get();
        const key = normalizedCustomPanelName(trimmed);
        if (state.customPanels.some((p) => p.id !== id && normalizedCustomPanelName(p.name) === key)) {
          return;
        }
        set((s) => {
          const nextPanels = s.customPanels.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
          return {
            customPanels: nextPanels,
            profiles: mapActiveUserProfile(s, (p) => ({
              ...p,
              customPanels: JSON.parse(JSON.stringify(nextPanels)) as CustomPanel[],
              updatedAt: new Date().toISOString(),
            })),
          };
        });
      },

      saveSnapshot: (tab, name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const state = get();
        const key = normalizedWorkspaceLabel(trimmed);
        if (state.snapshots[tab]?.some((s) => normalizedWorkspaceLabel(s.name) === key)) {
          return null;
        }
        const activeId = state.activeWorkspaceId[tab];
        const ws = state.workspaces[tab]?.find((w) => w.id === activeId);
        if (!ws) return null;
        const snapshotId = `snap-${Date.now()}`;
        const snapshot: WorkspaceSnapshot = {
          id: snapshotId,
          name: trimmed,
          workspace: JSON.parse(JSON.stringify(ws)),
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const existing = s.snapshots[tab] ?? [];
          const trimmed =
            existing.length >= MAX_SNAPSHOTS_PER_WORKSPACE
              ? existing.slice(existing.length - MAX_SNAPSHOTS_PER_WORKSPACE + 1)
              : existing;
          return { snapshots: { ...s.snapshots, [tab]: [...trimmed, snapshot] } };
        });
        return snapshotId;
      },

      restoreSnapshot: (tab, snapshotId) => {
        const state = get();
        const snapshot = state.snapshots[tab]?.find((s) => s.id === snapshotId);
        if (!snapshot) return false;
        const activeId = state.activeWorkspaceId[tab];
        // Push current state to undo before restoring
        get().pushUndo(tab);
        set((s) => {
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((w) =>
            w.id === activeId
              ? { ...snapshot.workspace, id: w.id, name: w.name, updatedAt: new Date().toISOString() }
              : w,
          );
          return { workspaces: { ...s.workspaces, [tab]: tabWorkspaces } };
        });
        return true;
      },

      deleteSnapshot: (tab, snapshotId) =>
        set((s) => ({
          snapshots: {
            ...s.snapshots,
            [tab]: (s.snapshots[tab] ?? []).filter((snap) => snap.id !== snapshotId),
          },
        })),

      pushUndo: (tab) => {
        const state = get();
        const activeId = state.activeWorkspaceId[tab];
        const ws = state.workspaces[tab]?.find((w) => w.id === activeId);
        if (!ws) return;
        const clone: Workspace = JSON.parse(JSON.stringify(ws));
        set((s) => {
          const stack = s.undoStack[tab] ?? [];
          const trimmed = stack.length >= MAX_UNDO_STACK ? stack.slice(1) : stack;
          return { undoStack: { ...s.undoStack, [tab]: [...trimmed, clone] } };
        });
      },

      undo: (tab) => {
        const state = get();
        const stack = state.undoStack[tab] ?? [];
        if (stack.length === 0) return false;
        const previous = stack[stack.length - 1];
        const activeId = state.activeWorkspaceId[tab];
        set((s) => {
          const newStack = (s.undoStack[tab] ?? []).slice(0, -1);
          const tabWorkspaces = (s.workspaces[tab] ?? []).map((w) =>
            w.id === activeId ? { ...previous, id: w.id, updatedAt: new Date().toISOString() } : w,
          );
          return {
            undoStack: { ...s.undoStack, [tab]: newStack },
            workspaces: { ...s.workspaces, [tab]: tabWorkspaces },
          };
        });
        return true;
      },

      setSyncStatus: (status) => set({ syncStatus: status }),

      setActiveProfile: (profileId) => {
        const state = get();
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) return;

        const customPanels = profileCustomPanels(profile);
        const allowedCustomTabs = new Set(customPanels.map((p) => `custom-${p.id}`));

        const newWorkspaces = { ...state.workspaces };
        const newActiveWorkspaceId = { ...state.activeWorkspaceId };
        const newSnapshots = { ...state.snapshots };

        for (const key of Object.keys(newWorkspaces)) {
          if (!key.startsWith("custom-")) continue;
          if (!allowedCustomTabs.has(key)) {
            delete newWorkspaces[key];
            delete newActiveWorkspaceId[key];
            delete newSnapshots[key];
          }
        }

        const tabsToApply: Record<string, Workspace> = { ...profile.tabs };
        for (const p of customPanels) {
          const tab = `custom-${p.id}`;
          if (!tabsToApply[tab]) {
            tabsToApply[tab] = defaultCustomTabWorkspace(tab);
          }
        }

        for (const [tab, ws] of Object.entries(tabsToApply)) {
          const wsClone = JSON.parse(JSON.stringify(ws)) as Workspace;
          const tabList = newWorkspaces[tab] ?? [];
          const idx = tabList.findIndex((w) => w.id === wsClone.id);
          newWorkspaces[tab] = idx >= 0 ? tabList.map((w, i) => (i === idx ? wsClone : w)) : [...tabList, wsClone];
          newActiveWorkspaceId[tab] = wsClone.id;
        }

        set({
          activeProfileId: profileId,
          activeWorkspaceId: newActiveWorkspaceId,
          workspaces: newWorkspaces,
          customPanels,
          snapshots: newSnapshots,
        });
      },

      exportProfile: (profileId) => {
        const state = get();
        const profile = state.profiles.find((p) => p.id === profileId);
        if (!profile) {
          const current = snapshotCurrentProfile(state);
          return JSON.stringify({ version: 2, profile: current }, null, 2);
        }
        return JSON.stringify({ version: 2, profile }, null, 2);
      },

      importProfile: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed?.version === 2 && parsed?.profile?.tabs) {
            const incoming = parsed.profile as WorkspaceProfile;
            const now = new Date().toISOString();
            const newId = `profile-imported-${Date.now()}`;
            const stateBefore = get();
            const uniqueName = uniqueImportedProfileName(stateBefore, incoming.name);
            const profile: WorkspaceProfile = {
              ...incoming,
              id: newId,
              name: uniqueName,
              isPreset: false,
              customPanels: incoming.customPanels ?? [],
              createdAt: now,
              updatedAt: now,
            };
            set((s) => ({
              profiles: [...s.profiles, profile],
            }));
            get().setActiveProfile(newId);
            return true;
          }
          if (parsed?.version === 1 && parsed?.workspace) {
            const tab = parsed.workspace.tab as string;
            return get().importWorkspace(tab || "overview", json);
          }
          return false;
        } catch {
          return false;
        }
      },

      saveCurrentAsProfile: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const state = get();
        const key = normalizedWorkspaceLabel(trimmed);
        if (state.profiles.some((p) => normalizedWorkspaceLabel(p.name) === key)) {
          return null;
        }
        const profile = snapshotCurrentProfile(state);
        const newId = `profile-${Date.now()}`;
        const now = new Date().toISOString();
        const saved: WorkspaceProfile = {
          ...profile,
          id: newId,
          name: trimmed,
          isPreset: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          profiles: [...s.profiles, saved],
          activeProfileId: newId,
        }));
        return newId;
      },

      deleteProfile: (profileId) => {
        const state = get();
        const filtered = state.profiles.filter((p) => p.id !== profileId);
        const wasActive = state.activeProfileId === profileId;
        const newActiveId = wasActive ? (filtered[0]?.id ?? "") : state.activeProfileId;
        set({ profiles: filtered, activeProfileId: newActiveId });
        if (wasActive && newActiveId) {
          get().setActiveProfile(newActiveId);
        }
        if (wasActive && !newActiveId) {
          set({ customPanels: [], snapshots: {} });
        }
      },

      duplicateProfile: (profileId, newName) => {
        const trimmed = newName.trim();
        if (!trimmed) return null;
        const state = get();
        const key = normalizedWorkspaceLabel(trimmed);
        if (state.profiles.some((p) => normalizedWorkspaceLabel(p.name) === key)) {
          return null;
        }
        const source = state.profiles.find((p) => p.id === profileId);
        if (!source) return null;
        const newId = `profile-${Date.now()}`;
        const now = new Date().toISOString();
        const clone: WorkspaceProfile = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: trimmed,
          isPreset: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          profiles: [...s.profiles, clone],
          activeProfileId: newId,
        }));
        return newId;
      },

      ensureProfiles: () => {
        const state = get();
        const defaultProfile = buildDefaultProfile();
        const fullProfile = buildFullProfile();

        const insertFullAfterDefault = (profiles: WorkspaceProfile[]): WorkspaceProfile[] => {
          if (profiles.some((p) => p.id === "full")) return profiles;
          const next = [...profiles];
          const defaultIdx = next.findIndex((p) => p.id === "default");
          const insertAt = defaultIdx >= 0 ? defaultIdx + 1 : 0;
          next.splice(insertAt, 0, fullProfile);
          return next;
        };

        if (state.profiles.length === 0) {
          const current = snapshotCurrentProfile(state);
          if (Object.keys(current.tabs).length > 0) {
            current.name = "My Workspace";
            set({
              profiles: insertFullAfterDefault([defaultProfile, current]),
              activeProfileId: current.id,
            });
          } else {
            set({
              profiles: [defaultProfile, fullProfile],
              activeProfileId: defaultProfile.id,
            });
          }
          return;
        }

        if (!state.profiles.some((p) => p.id === "full")) {
          set({ profiles: insertFullAfterDefault(state.profiles) });
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
        customPanels: s.customPanels,
        snapshots: s.snapshots,
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
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
