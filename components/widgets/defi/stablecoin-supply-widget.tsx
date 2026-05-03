"use client";

import { FlowChart, type FlowChartBucket } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface StablecoinSupplyResponse {
  /** Stablecoin symbol the chart is scoped to (e.g. "USDT"). */
  symbol: string;
  /** Per-bucket supply changes — mints (inflow) and burns (outflow). */
  buckets: ReadonlyArray<{ t: number; mint_usd: number; burn_usd: number }>;
}

/**
 * Stablecoin supply changes over time — mints as inflow, burns as outflow.
 * Built on the FlowChart primitive (P0.3) with cumulative net overlay.
 */
export function StablecoinSupplyWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<StablecoinSupplyResponse, { symbol: string }>("stablecoin-supply", {
    assetGroup: "DEFI",
    params: { symbol: "USDT" },
    staleTime: 60_000,
  });

  const buckets = React.useMemo<ReadonlyArray<FlowChartBucket>>(
    () => data?.buckets.map((b) => ({ t: b.t, inflow: b.mint_usd, outflow: b.burn_usd })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading supply…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <FlowChart data={buckets} yLabel={`${data.symbol} mint/burn ($)`} height="100%" />
    </div>
  );
}
