"use client";

/**
 * TradFi widgets — P4 of the DART cross-asset-group market-data terminal plan.
 *
 * Net-new asset_group surface bootstrapped on the trading-common entitlement.
 * Four widgets co-located:
 *  - RatesCurveWidget — FRED-sourced US Treasury yield curve (DGS1-DGS30).
 *  - VolSurfaceTradfiWidget — OPRA options vol surface (single underlying).
 *  - EtfFlowsTradfiWidget — TradFi ETF flows from the existing Tardis adapter.
 *  - SectorHeatmapWidget — sector %change matrix.
 */

import {
  CategoricalMatrix,
  type CategoricalMatrixCell,
  FlowChart,
  type FlowChartBucket,
  ScatterPlot,
  type ScatterPlotSeries,
} from "@/components/widgets/_primitives";
import { VolSurfaceChart } from "@/components/trading/vol-surface-chart";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

// ─── RatesCurve — FRED Treasury yields by maturity ────────────────────────

interface RatesCurveResponse {
  asof: string;
  points: ReadonlyArray<{ maturity_days: number; yield_pct: number; series_id: string }>;
}

export function RatesCurveWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<RatesCurveResponse>("rates-curve", {
    assetGroup: "TRADFI",
    staleTime: 300_000,
  });
  const series = React.useMemo<ReadonlyArray<ScatterPlotSeries>>(
    () =>
      data
        ? [
            {
              id: "ust",
              name: `US Treasury (${data.asof})`,
              data: data.points.map((p) => ({ x: p.maturity_days, y: p.yield_pct, label: p.series_id })),
              mode: "line",
            },
          ]
        : [],
    [data],
  );
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading rates…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <ScatterPlot
        series={series}
        xKind="maturity"
        xLabel="Maturity"
        yLabel="Yield (%)"
        formatY={(v) => `${v.toFixed(2)}%`}
        height="100%"
      />
    </div>
  );
}

// ─── VolSurfaceTradfi — wraps existing VolSurfaceChart so it grids ────────

interface VolSurfaceTradfiResponse {
  underlying: string;
  rows: ReadonlyArray<{ strike: number; iv_30d: number; iv_60d: number; iv_90d: number; iv_180d: number }>;
}

export function VolSurfaceTradfiWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<VolSurfaceTradfiResponse>("vol-surface", {
    assetGroup: "TRADFI",
    staleTime: 300_000,
  });
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading vol surface…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <VolSurfaceChart underlying={data.underlying} />
    </div>
  );
}

// ─── EtfFlowsTradfi — directional flows by ticker ─────────────────────────

interface EtfFlowsResponse {
  ticker: string;
  buckets: ReadonlyArray<{ t: number; inflow_usd: number; outflow_usd: number }>;
}

export function EtfFlowsTradfiWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<EtfFlowsResponse, { ticker: string }>("etf-flows", {
    assetGroup: "TRADFI",
    params: { ticker: "SPY" },
    staleTime: 60_000,
  });
  const buckets = React.useMemo<ReadonlyArray<FlowChartBucket>>(
    () => data?.buckets.map((b) => ({ t: b.t, inflow: b.inflow_usd, outflow: b.outflow_usd })) ?? [],
    [data],
  );
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading flows…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <FlowChart data={buckets} yLabel={`${data.ticker} ETF flows ($)`} showNet height="100%" />
    </div>
  );
}

// ─── SectorHeatmap — categorical %change matrix ───────────────────────────

interface SectorHeatmapResponse {
  sectors: ReadonlyArray<string>;
  buckets: ReadonlyArray<string>;
  cells: Readonly<Record<string, Readonly<Record<string, number | null>>>>;
}

export function SectorHeatmapWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<SectorHeatmapResponse>("sector-heatmap", {
    assetGroup: "TRADFI",
    staleTime: 60_000,
  });
  const matrixCells = React.useMemo<Record<string, Record<string, CategoricalMatrixCell>>>(() => {
    if (!data) return {};
    const out: Record<string, Record<string, CategoricalMatrixCell>> = {};
    for (const s of data.sectors) {
      out[s] = {};
      for (const b of data.buckets) {
        const v = data.cells[s]?.[b];
        out[s][b] = { value: v ?? null, label: v == null ? undefined : `${(v * 100).toFixed(2)}%` };
      }
    }
    return out;
  }, [data]);
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading sectors…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <CategoricalMatrix
        rows={data.sectors}
        cols={data.buckets}
        cells={matrixCells}
        scale="diverging"
        rowLabel="Sector"
        colLabel="Period"
        format={(v) => `${(v * 100).toFixed(2)}%`}
      />
    </div>
  );
}
