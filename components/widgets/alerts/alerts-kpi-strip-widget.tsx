"use client";

import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";
import { MOCK_AVG_RESOLUTION_DISPLAY, MOCK_LAST_24H_DISPLAY } from "@/lib/config/services/alerts.config";
import { useAlertsData } from "./alerts-data-context";

export function AlertsKpiStripWidget(_props: WidgetComponentProps) {
  const legacy = useAlertsData();
  // Pull live scenario events from the cockpit-ops store. Inside the
  // cockpit, "active alerts" is the count of unresolved warn/error events
  // emitted by the scenario engine for strategies in scope. Outside the
  // cockpit, fall back to the legacy alerts data context.
  const tierZero = useTierZeroScenario();
  const strategyEvents = useCockpitOpsStore((s) => s.strategyEvents);
  const useTierZero = tierZero.status === "match" && tierZero.strategies.length > 0;

  const scopedEvents = strategyEvents.filter((e) =>
    // Match by archetype + asset_group against any matched scenario.
    tierZero.matchedScenarios.some(
      (sc) => sc.archetypes.includes(e.archetype as never) && sc.assetGroups.includes(e.assetGroup),
    ),
  );
  const tzActiveCount = scopedEvents.filter((e) => e.tone === "warn" || e.tone === "error").length;
  const tzCriticalCount = scopedEvents.filter((e) => e.tone === "error").length;

  const activeCount = useTierZero ? tzActiveCount : legacy.activeCount;
  const criticalCount = useTierZero ? tzCriticalCount : legacy.criticalCount;
  const isLoading = legacy.isLoading;

  const metrics: KpiMetric[] = [
    {
      label: "Active Alerts",
      value: isLoading && !useTierZero ? "-" : activeCount,
      sentiment: "neutral",
    },
    {
      label: "Critical",
      value: isLoading && !useTierZero ? "-" : criticalCount,
      sentiment: criticalCount > 0 ? "negative" : "neutral",
    },
    {
      label: "Avg Resolution",
      value: isLoading && !useTierZero ? "-" : MOCK_AVG_RESOLUTION_DISPLAY,
      sentiment: "neutral",
    },
    {
      label: "Last 24h",
      value: isLoading && !useTierZero ? "-" : MOCK_LAST_24H_DISPLAY,
      sentiment: "neutral",
    },
  ];

  return (
    <div data-testid="alerts-kpi-strip-widget" data-source={useTierZero ? "tier-zero" : "legacy"} className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-alerts-kpi-layout" />
    </div>
  );
}
