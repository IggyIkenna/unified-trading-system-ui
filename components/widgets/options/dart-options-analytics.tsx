"use client";

/**
 * Deribit-style options analytics widgets — P6 of the DART terminal plan.
 *
 * UI scaffolds. The cell-level data (IV, Greeks, max pain, P/C ratio)
 * depends on a feature-pipeline prereq landing in features-derivatives-
 * service (or UFI): Black-Scholes / Black-76 IV inversion + Greeks
 * computation against the raw Deribit options chain that MTDS already
 * captures. Until that ships, the widgets render the chrome + a "data
 * unavailable" placeholder so the surface is reachable end-to-end and
 * the backend work plugs in without UI re-shaping.
 */

import {
  CategoricalMatrix,
  type CategoricalMatrixCell,
  ScatterPlot,
  type ScatterPlotSeries,
  MetricGauge,
} from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

// ─── IvSmile — strike × expiry IV matrix ──────────────────────────────────

interface IvSmileResponse {
  underlying: string;
  strikes: ReadonlyArray<number>;
  expiries: ReadonlyArray<string>;
  cells: Readonly<Record<string, Readonly<Record<string, number | null>>>>;
}

export function IvSmileWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<IvSmileResponse, { underlying: string }>("iv-smile", {
    assetGroup: "CEFI",
    params: { underlying: "BTC" },
    staleTime: 60_000,
  });
  const matrixCells = React.useMemo<Record<string, Record<string, CategoricalMatrixCell>>>(() => {
    if (!data) return {};
    const out: Record<string, Record<string, CategoricalMatrixCell>> = {};
    for (const k of data.strikes) {
      const key = String(k);
      out[key] = {};
      for (const e of data.expiries) {
        const v = data.cells[key]?.[e];
        out[key][e] = { value: v ?? null, label: v == null ? undefined : `${(v * 100).toFixed(1)}%` };
      }
    }
    return out;
  }, [data]);
  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>IV smile data unavailable.</span>
        <span className="text-[10px] mt-1 text-muted-foreground/60">
          Backend prereq: Greeks/IV computation in features-derivatives-service (P6 data prereq).
        </span>
      </div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <CategoricalMatrix
        rows={data.strikes.map(String)}
        cols={[...data.expiries]}
        cells={matrixCells}
        scale="diverging"
        rowLabel="Strike"
        colLabel="Expiry"
        format={(v) => `${(v * 100).toFixed(1)}%`}
      />
    </div>
  );
}

// ─── IvTermStructure — ATM IV per expiry ──────────────────────────────────

interface IvTermStructureResponse {
  underlying: string;
  points: ReadonlyArray<{ days_to_expiry: number; atm_iv: number; expiry: string }>;
}

export function IvTermStructureWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<IvTermStructureResponse, { underlying: string }>("iv-term-structure", {
    assetGroup: "CEFI",
    params: { underlying: "BTC" },
    staleTime: 60_000,
  });
  const series = React.useMemo<ReadonlyArray<ScatterPlotSeries>>(
    () =>
      data
        ? [
            {
              id: "atm-iv",
              name: `${data.underlying} ATM IV`,
              data: data.points.map((p) => ({ x: p.days_to_expiry, y: p.atm_iv * 100, label: p.expiry })),
              mode: "line",
            },
          ]
        : [],
    [data],
  );
  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>IV term structure data unavailable.</span>
        <span className="text-[10px] mt-1 text-muted-foreground/60">
          Backend prereq: Greeks/IV computation in features-derivatives-service (P6 data prereq).
        </span>
      </div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <ScatterPlot
        series={series}
        xKind="expiry"
        xLabel="Days to expiry"
        yLabel={`${data.underlying} ATM IV (%)`}
        formatY={(v) => `${v.toFixed(1)}%`}
        height="100%"
      />
    </div>
  );
}

// ─── MaxPainChart — pain per strike with current price marker ─────────────

interface MaxPainResponse {
  underlying: string;
  expiry: string;
  current_price: number;
  max_pain_strike: number;
  points: ReadonlyArray<{ strike: number; pain_usd: number }>;
}

export function MaxPainChartWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<MaxPainResponse, { underlying: string }>("max-pain", {
    assetGroup: "CEFI",
    params: { underlying: "BTC" },
    staleTime: 300_000,
  });
  const series = React.useMemo<ReadonlyArray<ScatterPlotSeries>>(
    () =>
      data
        ? [
            {
              id: "pain",
              name: `Pain ($)`,
              data: data.points.map((p) => ({ x: p.strike, y: p.pain_usd })),
              mode: "line",
            },
          ]
        : [],
    [data],
  );
  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>Max pain data unavailable.</span>
        <span className="text-[10px] mt-1 text-muted-foreground/60">
          Backend prereq: max-pain aggregator feature in features-derivatives-service (P6 data prereq).
        </span>
      </div>
    );
  }
  return (
    <div className="h-full w-full p-2 flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground/90 px-1">
        {data.underlying} {data.expiry} — max pain at ${data.max_pain_strike.toLocaleString()} (current $
        {data.current_price.toLocaleString()})
      </span>
      <div className="flex-1 min-h-0">
        <ScatterPlot series={series} xLabel="Strike" yLabel="Pain ($)" height="100%" />
      </div>
    </div>
  );
}

// ─── PutCallRatio — gauge ─────────────────────────────────────────────────

interface PutCallRatioResponse {
  underlying: string;
  ratio: number;
  put_oi: number;
  call_oi: number;
  history: ReadonlyArray<number>;
}

export function PutCallRatioWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<PutCallRatioResponse, { underlying: string }>("put-call-ratio", {
    assetGroup: "CEFI",
    params: { underlying: "BTC" },
    staleTime: 60_000,
  });
  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>P/C ratio data unavailable.</span>
        <span className="text-[10px] mt-1 text-muted-foreground/60">
          Backend prereq: P/C aggregator feature in features-derivatives-service (P6 data prereq).
        </span>
      </div>
    );
  }
  // Normalise ratio (typical 0–2 range) to a 0–100 gauge value clamped to 200.
  const gaugeValue = Math.min(2, data.ratio) * 50;
  return (
    <div className="h-full w-full p-2">
      <MetricGauge
        title={`${data.underlying} P/C ratio`}
        value={gaugeValue}
        sparkline={data.history.map((r) => Math.min(2, r) * 50)}
        min={0}
        max={100}
        zones={[
          { from: 0, to: 35, tone: "warning" },
          { from: 35, to: 65, tone: "neutral" },
          { from: 65, to: 100, tone: "warning" },
        ]}
        format={() => data.ratio.toFixed(2)}
        subtitle={`Put OI ${(data.put_oi / 1e6).toFixed(1)}M · Call OI ${(data.call_oi / 1e6).toFixed(1)}M`}
      />
    </div>
  );
}
