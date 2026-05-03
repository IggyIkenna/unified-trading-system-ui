"use client";

import { ScatterPlot, type ScatterPlotSeries } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface BasisCurveResponse {
  asset: string;
  /** Per-asset, per-expiry basis points. */
  series: ReadonlyArray<{
    venue: string;
    points: ReadonlyArray<{ days_to_expiry: number; basis_bp: number; expiry: string }>;
  }>;
}

/**
 * Cross-venue basis curve — futures premium over spot by expiry.
 * Built on ScatterPlot (xKind="expiry") which collapses the original plan's
 * separate TermStructureChart primitive into a config of ScatterPlot.
 */
export function BasisCurveWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<BasisCurveResponse, { asset: string }>("basis-curve", {
    assetGroup: "CEFI",
    params: { asset: "BTC" },
    staleTime: 60_000,
  });

  const series = React.useMemo<ReadonlyArray<ScatterPlotSeries>>(() => {
    if (!data) return [];
    return data.series.map((s) => ({
      id: s.venue,
      name: s.venue,
      data: s.points.map((p) => ({ x: p.days_to_expiry, y: p.basis_bp, label: p.expiry })),
      mode: "line" as const,
    }));
  }, [data]);

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading basis…</div>;
  }

  return (
    <div className="h-full w-full p-2">
      <ScatterPlot
        series={series}
        xKind="expiry"
        xLabel="Days to expiry"
        yLabel={`${data.asset} basis (bp)`}
        formatY={(v) => `${v.toFixed(1)}bp`}
        height="100%"
      />
    </div>
  );
}
