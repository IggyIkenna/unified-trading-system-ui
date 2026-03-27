import type { Workspace } from "@/lib/stores/workspace-store";

const presetMap = new Map<string, Workspace[]>();

export function registerPresets(tab: string, presets: Workspace[]) {
  const existing = presetMap.get(tab) ?? [];
  presetMap.set(tab, [...existing, ...presets]);
}

export function getPresetsForTab(tab: string): Workspace[] {
  const registered = presetMap.get(tab) ?? [];
  const hasBlank = registered.some((p) => p.layouts.length === 0);
  if (hasBlank) return registered;
  return [
    ...registered,
    {
      id: `${tab}-blank`,
      name: "Blank Canvas",
      tab,
      isPreset: true,
      layouts: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];
}

export function hasPresetsForTab(tab: string): boolean {
  return presetMap.has(tab) && (presetMap.get(tab)?.length ?? 0) > 0;
}
