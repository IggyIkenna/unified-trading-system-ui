import type { Workspace, WorkspaceProfile } from "@/lib/stores/workspace-store";
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
