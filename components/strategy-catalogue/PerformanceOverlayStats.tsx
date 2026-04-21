"use client";

/**
 * <PerformanceOverlayStats> — sidecar that recomputes per-view summary
 * statistics for a `<PerformanceOverlay>` series payload.
 *
 * Mirrors the §5 contract in
 * `unified-trading-pm/codex/09-strategy/architecture-v2/performance-overlay.md`.
 * Sharpe / MDD / CAGR / win-rate / avg trade size are recomputed in-memory
 * from the rendered series so the sidecar always stays in sync with the
 * chart range. When two views are rendered, a Residual row is added.
 */

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  PerformancePerViewSeries,
  PerformanceSeriesPoint,
  PerformanceView,
} from "@/lib/api/performance-overlay";

const VIEW_LABEL: Record<PerformanceView, string> = {
  backtest: "Backtest",
  paper: "Paper",
  live: "Live",
};

export interface PerformanceOverlayStatsProps {
  readonly series: Readonly<Partial<Record<PerformanceView, PerformancePerViewSeries>>>;
  readonly views: readonly PerformanceView[];
  readonly className?: string;
}

interface ViewStats {
  readonly sharpe: number | null;
  readonly maxDrawdownPct: number | null;
  readonly cagrPct: number | null;
  readonly winRatePct: number | null;
  readonly avgTradeNotional: number | null;
}

const ANNUALISATION_DAYS = 252;

function dailyReturns(points: readonly PerformanceSeriesPoint[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr || prev.equity <= 0) continue;
    result.push(curr.equity / prev.equity - 1);
  }
  return result;
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function stddev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const mu = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - mu) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}

function maxDrawdown(points: readonly PerformanceSeriesPoint[]): number {
  let peak = -Infinity;
  let worst = 0;
  for (const p of points) {
    if (p.equity > peak) peak = p.equity;
    if (peak > 0) {
      const dd = (p.equity - peak) / peak;
      if (dd < worst) worst = dd;
    }
  }
  return worst * 100;
}

function cagrPct(points: readonly PerformanceSeriesPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || first.equity <= 0) return null;
  const totalReturn = last.equity / first.equity;
  const days =
    (new Date(last.t).getTime() - new Date(first.t).getTime()) / 86_400_000;
  if (days <= 0) return null;
  const years = days / 365.25;
  return (Math.pow(totalReturn, 1 / Math.max(years, 1e-6)) - 1) * 100;
}

function computeStats(series: PerformancePerViewSeries | undefined): ViewStats {
  if (!series || series.aggregate.length < 2) {
    return {
      sharpe: null,
      maxDrawdownPct: null,
      cagrPct: null,
      winRatePct: null,
      avgTradeNotional: null,
    };
  }
  const returns = dailyReturns(series.aggregate);
  const sigma = stddev(returns);
  const sharpe =
    sigma > 0 ? (mean(returns) * ANNUALISATION_DAYS) / (sigma * Math.sqrt(ANNUALISATION_DAYS)) : null;
  const winRate =
    returns.length > 0
      ? (returns.filter((r) => r > 0).length / returns.length) * 100
      : null;
  // Avg trade notional: mean absolute equity change between samples,
  // a useful coarse "trade size" proxy for daily samples.
  const moves = series.aggregate
    .slice(1)
    .map((p, i) => Math.abs(p.equity - series.aggregate[i]!.equity));
  const avgTradeNotional = moves.length > 0 ? mean(moves) : null;
  return {
    sharpe,
    maxDrawdownPct: maxDrawdown(series.aggregate),
    cagrPct: cagrPct(series.aggregate),
    winRatePct: winRate,
    avgTradeNotional,
  };
}

function fmt(value: number | null, suffix = "", digits = 2): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}${suffix}`;
}

function fmtCurrency(value: number | null): string {
  if (value === null) return "—";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export function PerformanceOverlayStats({
  series,
  views,
  className,
}: PerformanceOverlayStatsProps) {
  const stats = useMemo(() => {
    return views.map((view) => ({
      view,
      stats: computeStats(series[view]),
    }));
  }, [series, views]);

  // Residual row when exactly two views are rendered (paper - live or backtest - live).
  const residual = useMemo(() => {
    if (views.length !== 2) return null;
    const a = views[0];
    const b = views[1];
    if (!a || !b) return null;
    const seriesA = series[a]?.aggregate ?? [];
    const seriesB = series[b]?.aggregate ?? [];
    if (seriesA.length === 0 || seriesB.length === 0) return null;
    const lastA = seriesA[seriesA.length - 1]!.pnl;
    const lastB = seriesB[seriesB.length - 1]!.pnl;
    return { label: `${VIEW_LABEL[a]} − ${VIEW_LABEL[b]}`, value: lastA - lastB };
  }, [series, views]);

  return (
    <div
      className={`overflow-x-auto rounded-md border bg-card/40 ${className ?? ""}`}
      data-testid="performance-overlay-stats"
    >
      <table className="w-full text-left text-xs tabular-nums">
        <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">View</th>
            <th className="px-3 py-2 text-right">Sharpe</th>
            <th className="px-3 py-2 text-right">MDD</th>
            <th className="px-3 py-2 text-right">CAGR</th>
            <th className="px-3 py-2 text-right">Win-rate</th>
            <th className="px-3 py-2 text-right">Avg trade</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ view, stats: row }) => (
            <tr
              key={view}
              data-testid={`performance-overlay-stats-row-${view}`}
              className="border-t border-border/60"
            >
              <td className="px-3 py-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {VIEW_LABEL[view]}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right font-mono">{fmt(row.sharpe)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(row.maxDrawdownPct, "%", 1)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(row.cagrPct, "%", 1)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(row.winRatePct, "%", 1)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmtCurrency(row.avgTradeNotional)}</td>
            </tr>
          ))}
          {residual !== null ? (
            <tr
              className="border-t border-border/60 bg-muted/20"
              data-testid="performance-overlay-stats-residual"
            >
              <td className="px-3 py-2" colSpan={5}>
                Residual ({residual.label})
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {fmtCurrency(residual.value)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
