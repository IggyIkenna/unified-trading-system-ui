import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface WidgetComponentProps {
  instanceId: string;
  config?: Record<string, unknown>;
}

export interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Display category for grouping in the widget catalogue (e.g. "Positions", "Risk") */
  category: string;

  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  defaultW: number;
  defaultH: number;

  requiredEntitlements: string[];
  availableOn: string[];
  singleton?: boolean;
  component: ComponentType<WidgetComponentProps>;
}

export interface WidgetPlacement {
  widgetId: string;
  instanceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
  /** Additional widget IDs merged into this cell as tabs alongside the primary widgetId */
  coTabs?: string[];
  /** Which co-tab is active; defaults to widgetId (the primary) */
  activeTabId?: string;
}

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getWidgetsForTab(tab: string): WidgetDefinition[] {
  return Array.from(registry.values()).filter((w) => w.availableOn.includes(tab));
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

/** Returns all widgets grouped by their category field, sorted alphabetically by category. */
export function getAllWidgetsByCategory(): Record<string, WidgetDefinition[]> {
  const grouped: Record<string, WidgetDefinition[]> = {};
  for (const w of registry.values()) {
    (grouped[w.category] ??= []).push(w);
  }
  return grouped;
}
