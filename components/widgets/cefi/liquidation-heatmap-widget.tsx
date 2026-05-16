"use client";

import { ContinuousHeatmap, type ContinuousHeatmapPoint } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface LiquidationHeatmapResponse {
  /** Asset symbol the heatmap is scoped to (e.g. "BTC"). */
  asset: string;
  /** Time bucket size in minutes. */
  bucket_minutes: number;
  /** Liquidation events bucketed into (timestamp, price level, $-notional). */
  points: ReadonlyArray<{ t: number; price: number; notional: number; side: "long" | "short" }>;
}

/**
 * Coinglass-style liquidation heatmap — x=time, y=price level, cell intensity
 * = aggregate $-notional liquidated. Long/short colour split via the diverging
 * mode of the ContinuousHeatmap primitive.
 */
export function LiquidationHeatmapWidget(_props: WidgetComponentProps) {
  const { data, isLoading, isError } = useAssetGroupData<LiquidationHeatmapResponse, { asset: string }>(
    "liquidation-heatmap",
    {
      assetGroup: "CEFI",
      params: { asset: "BTC" },
      staleTime: 30_000,
    },
  );

  const points = React.useMemo<ReadonlyArray<ContinuousHeatmapPoint>>(() => {
    if (!data) return [];
    return data.points.map((p) => ({
      x: p.t,
      y: p.price,
      // Sign the magnitude so diverging mode renders longs (+green) vs
      // shorts (-red) on the same canvas.
      v: p.side === "long" ? p.notional : -p.notional,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading liquidations…</div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>Liquidation data unavailable.</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <ContinuousHeatmap
        points={points}
        xKind="time"
        scale="log"
        diverging
        xLabel="time"
        yLabel="price"
        height="100%"
      />
    </div>
  );
}
