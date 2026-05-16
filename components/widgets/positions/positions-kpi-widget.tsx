"use client";

import * as React from "react";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";
import { formatCurrency } from "@/lib/reference-data";
import { usePositionsData } from "./positions-data-context";

export function PositionsKpiWidget(_props: WidgetComponentProps) {
  const { summary, isLoading, positionsError } = usePositionsData();
  const tierZero = useTierZeroScenario();
  const useTierZero = tierZero.status === "match" && tierZero.positions.length > 0;

  // Derive scope-filtered KPI summary from tier-zero positions when in
  // cockpit. Falls back to legacy provider on no-match (legacy routes).
  const tzSummary = React.useMemo(() => {
    const totalPositions = tierZero.positions.length;
    const totalNotional = tierZero.positions.reduce((sum, p) => sum + p.notional, 0);
    const unrealizedPnL = tierZero.positions.reduce((sum, p) => sum + p.unrealisedPnlUsd, 0);
    const longExposure = tierZero.positions.filter((p) => p.side === "long").reduce((sum, p) => sum + p.notional, 0);
    const shortExposure = tierZero.positions.filter((p) => p.side === "short").reduce((sum, p) => sum + p.notional, 0);
    // Total margin proxy: 20% of notional (matches LiquidationAssumptions.initialMarginPct).
    const totalMargin = totalNotional * 0.2;
    return { totalPositions, totalNotional, unrealizedPnL, longExposure, shortExposure, totalMargin };
  }, [tierZero.positions]);

  const merged = useTierZero ? tzSummary : summary;

  const metrics: KpiMetric[] = React.useMemo(
    () => [
      {
        label: "Positions",
        value: isLoading && !useTierZero ? "-" : String(merged.totalPositions),
        sentiment: "neutral",
      },
      {
        label: "Total Notional",
        value: isLoading && !useTierZero ? "-" : `$${formatCurrency(merged.totalNotional)}`,
        sentiment: "neutral",
      },
      {
        label: "Unrealized P&L",
        value:
          isLoading && !useTierZero
            ? "-"
            : `${merged.unrealizedPnL >= 0 ? "+" : ""}$${formatCurrency(Math.abs(merged.unrealizedPnL))}`,
        sentiment: merged.unrealizedPnL >= 0 ? "positive" : "negative",
      },
      {
        label: "Total Margin",
        value: isLoading && !useTierZero ? "-" : `$${formatCurrency(merged.totalMargin)}`,
        sentiment: "neutral",
      },
      {
        label: "Long Exposure",
        value: isLoading && !useTierZero ? "-" : `$${formatCurrency(merged.longExposure)}`,
        sentiment: "neutral",
      },
      {
        label: "Short Exposure",
        value: isLoading && !useTierZero ? "-" : `$${formatCurrency(merged.shortExposure)}`,
        sentiment: "neutral",
      },
    ],
    [merged, isLoading, useTierZero],
  );

  if (positionsError && !useTierZero) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-rose-400">Failed to load positions</p>
      </div>
    );
  }

  return (
    <div data-testid="positions-kpi-widget" data-source={useTierZero ? "tier-zero" : "legacy"} className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-positions-kpi-layout" />
    </div>
  );
}
