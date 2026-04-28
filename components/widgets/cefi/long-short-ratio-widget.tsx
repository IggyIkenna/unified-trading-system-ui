"use client";

import { MetricGauge } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface LongShortRatioResponse {
  asset: string;
  ratio: number;
  long_pct: number;
  short_pct: number;
  change_24h: number;
  history: ReadonlyArray<number>;
}

/**
 * Coinglass-style long/short ratio gauge — single asset, cross-venue
 * imbalance with historical sparkline. Built on the MetricGauge primitive.
 *
 * Ratio is rendered as a 0–100 scale where 50 = balanced, >50 = long-heavy.
 */
export function LongShortRatioWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<LongShortRatioResponse, { asset: string }>("long-short-ratio", {
    assetGroup: "CEFI",
    params: { asset: "BTC" },
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading long/short…</div>
    );
  }

  return (
    <div className="h-full w-full p-2 flex items-center justify-center">
      <MetricGauge
        title={`${data.asset} Long/Short`}
        value={data.long_pct * 100}
        sparkline={[...data.history]}
        min={0}
        max={100}
        zones={[
          { from: 0, to: 40, tone: "negative" },
          { from: 40, to: 60, tone: "neutral" },
          { from: 60, to: 100, tone: "positive" },
        ]}
        format={(v) => `${v.toFixed(1)}% L`}
        subtitle={`Ratio ${data.ratio.toFixed(2)} · 24h ${data.change_24h >= 0 ? "+" : ""}${data.change_24h.toFixed(2)}`}
        change={data.change_24h}
      />
    </div>
  );
}
