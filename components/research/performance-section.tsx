"use client";

import { cn } from "@/lib/utils";
import type { DirectionPerformance, BenchmarkComparison } from "@/lib/backtest-analytics-types";
import { ProfitStructureChart } from "./profit-structure-chart";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

interface PerformanceSectionProps {
  all: DirectionPerformance;
  long: DirectionPerformance;
  short: DirectionPerformance;
  benchmark: BenchmarkComparison;
  className?: string;
}

function fmt(val: number, opts?: { pct?: boolean; usd?: boolean }): string {
  if (opts?.usd) {
    const prefix = val >= 0 ? "+" : "";
    return `${prefix}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (opts?.pct) {
    const prefix = val >= 0 ? "+" : "";
    return `${prefix}${formatPercent(val, 2)}`;
  }
  return formatNumber(val, 2);
}

function MetricRow({
  label,
  all,
  long,
  short,
  format,
}: {
  label: string;
  all: number;
  long: number;
  short: number;
  format?: "usd" | "pct" | "ratio" | "count";
}) {
  const f = (v: number) => {
    switch (format) {
      case "usd":
        return fmt(v, { usd: true });
      case "pct":
        return fmt(v, { pct: true });
      case "count":
        return String(Math.round(v));
      default:
        return fmt(v);
    }
  };

  return (
    <tr className="border-t border-border/30">
      <td className="py-1.5 text-xs text-muted-foreground pr-4">{label}</td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">{f(all)}</td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">{f(long)}</td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">{f(short)}</td>
    </tr>
  );
}

export function PerformanceSection({ all, long, short, benchmark, className }: PerformanceSectionProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {/* Profit Structure Visual */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profit Structure</h4>
        <ProfitStructureChart
          grossProfit={all.gross_profit}
          grossLoss={all.gross_loss}
          commission={all.commission_paid}
          netPnl={all.net_profit}
        />
      </div>

      {/* Returns Table (All | Long | Short) */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Returns</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-medium text-muted-foreground pb-2" />
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">All</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">Long</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">Short</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow
                label="Net P&L"
                all={all.net_profit}
                long={long.net_profit}
                short={short.net_profit}
                format="usd"
              />
              <MetricRow
                label="Net P&L %"
                all={all.net_profit_pct}
                long={long.net_profit_pct}
                short={short.net_profit_pct}
                format="pct"
              />
              <MetricRow
                label="Gross Profit"
                all={all.gross_profit}
                long={long.gross_profit}
                short={short.gross_profit}
                format="usd"
              />
              <MetricRow
                label="Gross Loss"
                all={all.gross_loss}
                long={long.gross_loss}
                short={short.gross_loss}
                format="usd"
              />
              <MetricRow
                label="Profit Factor"
                all={all.profit_factor}
                long={long.profit_factor}
                short={short.profit_factor}
              />
              <MetricRow
                label="Commission"
                all={all.commission_paid}
                long={long.commission_paid}
                short={short.commission_paid}
                format="usd"
              />
              <MetricRow
                label="Expected Payoff"
                all={all.expected_payoff}
                long={long.expected_payoff}
                short={short.expected_payoff}
                format="usd"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Benchmark Comparison
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground">Buy & Hold Return</span>
            <p className="text-sm font-bold tabular-nums mt-0.5">
              {fmt(benchmark.buy_hold_return, { usd: true })}
              <span className="text-xs text-muted-foreground ml-1">
                ({fmt(benchmark.buy_hold_return_pct, { pct: true })})
              </span>
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground">Strategy Outperformance</span>
            <p
              className={cn(
                "text-sm font-bold tabular-nums mt-0.5",
                benchmark.strategy_outperformance >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {fmt(benchmark.strategy_outperformance, { usd: true })}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground">Excess Return</span>
            <p
              className={cn(
                "text-sm font-bold tabular-nums mt-0.5",
                benchmark.strategy_outperformance_pct >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {fmt(benchmark.strategy_outperformance_pct, { pct: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Risk-Adjusted */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Risk-Adjusted Performance
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-medium text-muted-foreground pb-2" />
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">All</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">Long</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">Short</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow label="Sharpe Ratio" all={all.sharpe} long={long.sharpe} short={short.sharpe} />
              <MetricRow label="Sortino Ratio" all={all.sortino} long={long.sortino} short={short.sortino} />
              <MetricRow
                label="Max Drawdown"
                all={all.max_drawdown_pct}
                long={long.max_drawdown_pct}
                short={short.max_drawdown_pct}
                format="pct"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
