"use client";

import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { fmtUsdPrecise } from "@/components/trading/predictions/helpers";
import { usePredictionsData } from "./predictions-data-context";
import { formatPercent } from "@/lib/utils/formatters";

export function PredPortfolioKpisWidget(_props: WidgetComponentProps) {
  const { openPositions, settledPositions, portfolioKpis } = usePredictionsData();
  const { totalStaked, totalUnrealisedPnl, winRate, winCount } = portfolioKpis;

  const metrics: KpiMetric[] = [
    {
      label: `Open Positions (${settledPositions.length} settled)`,
      value: String(openPositions.length),
      sentiment: "neutral",
    },
    {
      label: "Total Staked",
      value: fmtUsdPrecise(totalStaked),
      sentiment: "neutral",
    },
    {
      label: "Unrealised P&L",
      value: `${totalUnrealisedPnl > 0 ? "+" : ""}${fmtUsdPrecise(totalUnrealisedPnl)}`,
      sentiment: totalUnrealisedPnl > 0 ? "positive" : totalUnrealisedPnl < 0 ? "negative" : "neutral",
    },
    {
      label: `Win Rate (${winCount}/${settledPositions.length})`,
      value: `${formatPercent(winRate, 0)}`,
      sentiment: portfolioKpis.totalRealisedPnl >= 0 ? "positive" : "negative",
    },
  ];

  return <KpiStrip metrics={metrics} columns={4} />;
}
