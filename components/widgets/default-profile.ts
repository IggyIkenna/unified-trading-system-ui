import type { Workspace, WorkspaceProfile } from "@/lib/stores/workspace-store";
import type { WidgetPlacement } from "@/components/widgets/widget-registry";
import { getWidgetsForTab } from "@/components/widgets/widget-registry";
import { getPresetsForTab } from "./preset-registry";

export const ALL_WIDGET_TABS = [
  "overview",
  "terminal",
  "positions",
  "orders",
  "alerts",
  "strategies",
  "pnl",
  "risk",
  "markets",
  "sports",
  "predictions",
  "instructions",
  "book",
  "accounts",
  "bundles",
  "defi",
  "options",
] as const;

export type WidgetTab = (typeof ALL_WIDGET_TABS)[number];

const GRID_COLS = 12;

/** Pack widgets into a non-overlapping grid (same strategy as workspace-store). */
function findOpenPosition(
  existing: WidgetPlacement[],
  w: number,
  h: number,
  cols: number = GRID_COLS,
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

/** One placement per widget registered for the tab (all catalogue widgets visible). */
export function buildFullLayoutsForTab(tab: string): WidgetPlacement[] {
  const widgets = getWidgetsForTab(tab)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  const placements: WidgetPlacement[] = [];
  let seq = 0;
  for (const def of widgets) {
    const pos = findOpenPosition(placements, def.defaultW, def.defaultH);
    placements.push({
      widgetId: def.id,
      instanceId: `${def.id}-full-${seq++}`,
      x: pos.x,
      y: pos.y,
      w: def.defaultW,
      h: def.defaultH,
    });
  }
  return placements;
}

/** Preset profile: every tab shows every widget available on that page (demo / completeness). */
export function buildFullProfile(): WorkspaceProfile {
  const tabs: Record<string, Workspace> = {};
  const now = new Date().toISOString();

  for (const tab of ALL_WIDGET_TABS) {
    const layouts = buildFullLayoutsForTab(tab);
    tabs[tab] = {
      id: `full-profile-${tab}`,
      name: "Full",
      tab,
      isPreset: true,
      layouts,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: "full",
    name: "Full",
    isPreset: true,
    tabs,
    customPanels: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDefaultProfile(): WorkspaceProfile {
  const tabs: Record<string, Workspace> = {};
  const now = new Date().toISOString();

  for (const tab of ALL_WIDGET_TABS) {
    const presets = getPresetsForTab(tab);
    const defaultPreset = presets.find((p) => p.name === "Default") ?? presets[0];
    if (defaultPreset) {
      tabs[tab] = {
        ...defaultPreset,
        id: `default-profile-${tab}`,
        tab,
        isPreset: true,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  return {
    id: "default",
    name: "Default",
    isPreset: true,
    tabs,
    customPanels: [],
    createdAt: now,
    updatedAt: now,
  };
}
