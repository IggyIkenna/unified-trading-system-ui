"use client";

import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useInstructionsData } from "./instructions-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function InstructionsSummaryWidget(_props: WidgetComponentProps) {
  const { summary } = useInstructionsData();

  const slippageSentiment: KpiMetric["sentiment"] =
    summary.avgSlippage <= 2 ? "positive" : summary.avgSlippage <= 5 ? "neutral" : "negative";

  const metrics: KpiMetric[] = [
    { label: "Total", value: String(summary.total), sentiment: "neutral" },
    { label: "Filled", value: String(summary.filled), sentiment: "positive" },
    { label: "Partial", value: String(summary.partial), sentiment: "neutral" },
    { label: "Pending", value: String(summary.pending), sentiment: "neutral" },
    {
      label: "Avg slippage",
      value: `${formatNumber(summary.avgSlippage, 1)} bps`,
      sentiment: slippageSentiment,
    },
  ];

  return <KpiStrip metrics={metrics} columns={5} className="rounded-md h-full" />;
}
