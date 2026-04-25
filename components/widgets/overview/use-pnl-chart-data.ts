"use client";

// Data hook for the PnL / NAV / Exposure chart widget.
//
// Contract: widget calls this hook with a date range and receives ready-to-render
// time series for live and batch modes. When the backend is wired, replace the
// mock generation below with real API calls — the widget does not change.
//
// TODO (backend wiring):
//   - GET /api/timeseries?from=<date>&to=<date>&mode=live  → replace monthlyLive
//   - GET /api/timeseries?from=<date>&to=<date>&mode=batch → replace monthlyBatch
//   - Expose `isLoading: true` while requests are in flight
//   - Expose `error: Error | null` from fetch failures

import * as React from "react";
import { generateMonthlyTimeSeries, MONTHLY_TS_START as _MOCK_TS_START } from "@/lib/mocks/fixtures/trading-data";
import type { TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";

// The earliest date for which chart data is available.
// When the backend is wired this becomes the API's data retention boundary.
export const CHART_DATA_START = _MOCK_TS_START;

export type { TimeSeriesPoint };

export interface PnlChartSeries {
  pnl: TimeSeriesPoint[];
  nav: TimeSeriesPoint[];
  exposure: TimeSeriesPoint[];
}

export interface PnlChartData {
  live: PnlChartSeries;
  batch: PnlChartSeries;
  isLoading: boolean;
  error: Error | null;
}

// "2026-03-20" → "03/20"  (matches the "MM/DD HH:mm" timestamp format in the series)
function dateToMMDD(dateStr: string): string {
  return dateStr.slice(5).replace("-", "/");
}

function filterToRange(pts: TimeSeriesPoint[], from: string, to: string): TimeSeriesPoint[] {
  const fromMD = dateToMMDD(from);
  const toMD = dateToMMDD(to);
  return pts.filter((p) => {
    const md = p.timestamp.slice(0, 5);
    return md >= fromMD && md <= toMD;
  });
}

function sliceSeries(full: PnlChartSeries, from: string, to: string): PnlChartSeries {
  return {
    pnl: filterToRange(full.pnl, from, to),
    nav: filterToRange(full.nav, from, to),
    exposure: filterToRange(full.exposure, from, to),
  };
}

export function usePnlChartData(dateRange: { from: string; to: string }): PnlChartData {
  // Generate the full walk up to the range end (so the random walk is continuous),
  // then slice to the selected window. Both memos only recompute when `to` changes.
  const fullLive = React.useMemo(() => generateMonthlyTimeSeries(dateRange.to, "live"), [dateRange.to]);
  const fullBatch = React.useMemo(() => generateMonthlyTimeSeries(dateRange.to, "batch"), [dateRange.to]);

  const live = React.useMemo(
    () => sliceSeries(fullLive, dateRange.from, dateRange.to),
    [fullLive, dateRange.from, dateRange.to],
  );

  const batch = React.useMemo(
    () => sliceSeries(fullBatch, dateRange.from, dateRange.to),
    [fullBatch, dateRange.from, dateRange.to],
  );

  return { live, batch, isLoading: false, error: null };
}
