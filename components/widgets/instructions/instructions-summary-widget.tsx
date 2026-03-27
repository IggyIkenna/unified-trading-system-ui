"use client";

import { KpiStrip, type KpiMetric } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useInstructionsData } from "./instructions-data-context";

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
      value: `${summary.avgSlippage.toFixed(1)} bps`,
      sentiment: slippageSentiment,
    },
  ];

  return <KpiStrip metrics={metrics} columns={5} className="rounded-md h-full" />;
}
