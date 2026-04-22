"use client";

import { WidgetScroll } from "@/components/shared/widget-scroll";
import { cn } from "@/lib/utils";
import type { DirectionPerformance, PnlBucket } from "@/lib/types/backtest-analytics";
import { PnlDistributionHistogram } from "./pnl-distribution-histogram";
import { WinLossDonut } from "./win-loss-donut";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

interface TradesAnalysisSectionProps {
  all: DirectionPerformance;
  long: DirectionPerformance;
  short: DirectionPerformance;
  pnlBuckets: PnlBucket[];
  avgProfitPct: number;
  avgLossPct: number;
  signalMode?: boolean;
  className?: string;
}

function MetricRow({
  label,
  all,
  long,
  short,
  format,
}: {
  label: string;
  all: number | string;
  long: number | string;
  short: number | string;
  format?: "usd" | "pct" | "count" | "ratio";
}) {
  const f = (v: number | string) => {
    if (typeof v === "string") return v;
    switch (format) {
      case "usd":
        return `${v >= 0 ? "+" : ""}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      case "pct":
        return `${v >= 0 ? "+" : ""}${formatPercent(v, 2)}`;
      case "count":
        return String(Math.round(v));
      default:
        return formatNumber(v, 2);
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

export function TradesAnalysisSection({
  all,
  long,
  short,
  pnlBuckets,
  avgProfitPct,
  avgLossPct,
  signalMode = false,
  className,
}: TradesAnalysisSectionProps) {
  const itemLabel = signalMode ? "signals" : "trades";

  return (
    <div className={cn("space-y-5", className)}>
      {/* Visual Row: Histogram + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            P&L Distribution
          </h4>
          <PnlDistributionHistogram buckets={pnlBuckets} avgProfitPct={avgProfitPct} avgLossPct={avgLossPct} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Win / Loss Ratio
          </h4>
          <WinLossDonut wins={all.winning_trades} losses={all.losing_trades} breakEven={all.break_even_trades} />
        </div>
      </div>

      {/* Details Table */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
        <WidgetScroll axes="horizontal" scrollbarSize="thin">
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
                label={`Total ${itemLabel}`}
                all={all.total_trades}
                long={long.total_trades}
                short={short.total_trades}
                format="count"
              />
              <MetricRow
                label={`Winning ${itemLabel}`}
                all={all.winning_trades}
                long={long.winning_trades}
                short={short.winning_trades}
                format="count"
              />
              <MetricRow
                label={`Losing ${itemLabel}`}
                all={all.losing_trades}
                long={long.losing_trades}
                short={short.losing_trades}
                format="count"
              />
              <MetricRow
                label="Percent profitable"
                all={all.win_rate}
                long={long.win_rate}
                short={short.win_rate}
                format="pct"
              />
              <MetricRow label="Avg P&L" all={all.avg_pnl} long={long.avg_pnl} short={short.avg_pnl} format="usd" />
              <MetricRow
                label="Avg winning"
                all={all.avg_winning_trade}
                long={long.avg_winning_trade}
                short={short.avg_winning_trade}
                format="usd"
              />
              <MetricRow
                label="Avg losing"
                all={all.avg_losing_trade}
                long={long.avg_losing_trade}
                short={short.avg_losing_trade}
                format="usd"
              />
              <MetricRow
                label="Ratio avg win/loss"
                all={all.ratio_avg_win_loss}
                long={long.ratio_avg_win_loss}
                short={short.ratio_avg_win_loss}
              />
              <MetricRow
                label="Largest win"
                all={all.largest_win}
                long={long.largest_win}
                short={short.largest_win}
                format="usd"
              />
              <MetricRow
                label="Largest win % of gross"
                all={all.largest_win_as_pct_of_gross}
                long={long.largest_win_as_pct_of_gross}
                short={short.largest_win_as_pct_of_gross}
                format="pct"
              />
              <MetricRow
                label="Largest loss"
                all={all.largest_loss}
                long={long.largest_loss}
                short={short.largest_loss}
                format="usd"
              />
              <MetricRow
                label="Largest loss % of gross"
                all={all.largest_loss_as_pct_of_gross}
                long={long.largest_loss_as_pct_of_gross}
                short={short.largest_loss_as_pct_of_gross}
                format="pct"
              />
              <MetricRow
                label={`Avg bars in ${itemLabel}`}
                all={all.avg_bars_in_trades}
                long={long.avg_bars_in_trades}
                short={short.avg_bars_in_trades}
                format="count"
              />
              <MetricRow
                label="Avg bars (winning)"
                all={all.avg_bars_in_winning}
                long={long.avg_bars_in_winning}
                short={short.avg_bars_in_winning}
                format="count"
              />
              <MetricRow
                label="Avg bars (losing)"
                all={all.avg_bars_in_losing}
                long={long.avg_bars_in_losing}
                short={short.avg_bars_in_losing}
                format="count"
              />
            </tbody>
          </table>
        </WidgetScroll>
      </div>
    </div>
  );
}
