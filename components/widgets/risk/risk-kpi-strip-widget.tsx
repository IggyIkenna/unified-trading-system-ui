"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function RiskKpiStripWidget(_props: WidgetComponentProps) {
  const {
    totalVar95,
    totalVar99,
    totalES95,
    totalES99,
    criticalCount,
    warningCount,
    killedStrategies,
    regimeMultiplier,
    varSummary,
  } = useRiskData();

  const baseMetrics: KpiMetric[] = [
    { label: "Firm P&L", value: "+$1.04M", sentiment: "positive" },
    { label: "Net Exposure", value: "$5.2M", sentiment: "neutral" },
    { label: "Margin Used", value: "47%", sentiment: "neutral" },
    {
      label: `VaR 95%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalVar95),
      sentiment: "negative",
    },
    {
      label: `ES 95%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalES95),
      sentiment: "negative",
    },
    {
      label: "Active Alerts",
      value: String(criticalCount + warningCount),
      sentiment: warningCount > 0 ? "negative" : "neutral",
    },
    {
      label: `VaR 99%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalVar99),
      sentiment: "negative",
    },
    {
      label: `ES 99%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalES99),
      sentiment: "negative",
    },
    { label: "Kill Switches", value: String(killedStrategies.size + 1), sentiment: "negative" },
  ];

  const extendedMetrics: KpiMetric[] = varSummary
    ? [
        { label: "Hist VaR 99%", value: formatCurrency(-varSummary.historical_var_99), sentiment: "negative" },
        { label: "Param VaR 99%", value: formatCurrency(-varSummary.parametric_var_99), sentiment: "negative" },
        { label: "CVaR 99%", value: formatCurrency(-varSummary.cvar_99), sentiment: "negative" },
      ]
    : [];

  const metrics = [...baseMetrics, ...extendedMetrics].slice(0, 9);

  return <KpiSummaryWidget metrics={metrics} storageKey="uts-risk-kpi-strip-layout" className="h-full" />;
}
