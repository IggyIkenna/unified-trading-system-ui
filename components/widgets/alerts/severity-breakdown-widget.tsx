"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAlertsData, type AlertSeverity } from "./alerts-data-context";

/**
 * Severity Breakdown — pie chart of active alerts by severity.
 *
 * Spec: `unified-trading-pm/plans/active/end-to-end-testing/020_alerting_service.md`
 * § "Frontend API Surface" — "Alert severity breakdown -> Pie chart by severity".
 * Operator-facing widget for the DART alerts dashboard. Counts only `active`
 * alerts (acknowledged / resolved are excluded — operator already triaged them).
 */

const SEVERITY_ORDER: AlertSeverity[] = ["critical", "high", "medium", "low", "info"];

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: "#dc2626", // status-critical
  high: "#ea580c", // orange-600
  medium: "#ca8a04", // amber-600
  low: "#2563eb", // blue-600
  info: "#0891b2", // cyan-600
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

interface SeverityBucket {
  severity: AlertSeverity;
  label: string;
  count: number;
  color: string;
}

export function SeverityBreakdownWidget(_props: WidgetComponentProps) {
  const { alerts, isLoading } = useAlertsData();

  const buckets: SeverityBucket[] = React.useMemo(() => {
    const counts: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const alert of alerts) {
      if (alert.status !== "active") continue;
      counts[alert.severity] = (counts[alert.severity] ?? 0) + 1;
    }
    return SEVERITY_ORDER.map((severity) => ({
      severity,
      label: SEVERITY_LABEL[severity],
      count: counts[severity],
      color: SEVERITY_COLOR[severity],
    }));
  }, [alerts]);

  const chartData = React.useMemo(() => buckets.filter((b) => b.count > 0), [buckets]);
  const total = chartData.reduce((acc, b) => acc + b.count, 0);

  if (isLoading) {
    return (
      <div
        data-testid="severity-breakdown-widget"
        className="flex items-center justify-center h-full text-xs text-muted-foreground"
      >
        Loading severity breakdown…
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        data-testid="severity-breakdown-widget"
        data-empty="true"
        className="flex flex-col items-center justify-center h-full p-3 text-center"
      >
        <div className="text-sm font-medium">No active alerts</div>
        <div className="text-xs text-muted-foreground mt-1">All systems operating normally.</div>
      </div>
    );
  }

  return (
    <div data-testid="severity-breakdown-widget" data-total-active={total} className="h-full w-full p-2 flex flex-col">
      <div className="flex items-baseline justify-between px-1 mb-1">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Active alerts by severity</span>
        <span className="text-xs font-mono">{total} total</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius="75%"
              innerRadius="40%"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.severity}
                  fill={entry.color}
                  data-testid={`severity-breakdown-slice-${entry.severity}`}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} alert${value === 1 ? "" : "s"}`, name]}
              contentStyle={{ fontSize: 11, padding: "4px 8px" }}
            />
            <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
