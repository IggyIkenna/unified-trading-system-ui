"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BacktestRun, StrategySignal } from "@/lib/types/strategy-platform";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ─── Backtest List Item ───────────────────────────────────────────────────────

export function BacktestListItem({
  bt,
  isSelected,
  isCompareSelected,
  onSelect,
  onToggleCompare,
}: {
  bt: BacktestRun;
  isSelected: boolean;
  isCompareSelected: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
}) {
  const kind = bt.strategyKind ?? "ml";
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare();
        }}
        title="Add to compare"
        className={cn(
          "mt-0.5 flex items-center justify-center size-5 rounded border transition-colors shrink-0",
          isCompareSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary",
        )}
      >
        {isCompareSelected && <CheckCircle2 className="size-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{bt.configName ?? bt.templateName ?? bt.id}</span>
          <StatusBadge status={bt.status} />
          {bt.isCandidate && (
            <Badge variant="outline" className="text-[10px] h-5 gap-0.5 border-amber-400/40 text-amber-400">
              <Star className="size-2.5" />
              Candidate
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          <Badge variant="secondary" className="text-[10px] h-4">
            {bt.archetype}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-4 font-normal">
            {kind === "ml" ? "ML" : "Rule"}
          </Badge>
          <span className="text-[10px] px-1 rounded bg-muted/30 font-mono">{bt.shard}</span>
          <span>{bt.instrument ?? "—"}</span>
          <span>·</span>
          <span>{bt.venue}</span>
        </div>
        {bt.metrics && (
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span
              className={cn(
                "font-mono tabular-nums",
                bt.metrics.sharpe > 1.5 ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              Sharpe {formatNumber(bt.metrics.sharpe, 2)}
            </span>
            <span
              className={cn("font-mono tabular-nums", bt.metrics.totalReturn > 0 ? "text-emerald-400" : "text-red-400")}
            >
              {formatPercent(bt.metrics.totalReturn * 100, 1)}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {bt.metrics.hitRate ? `${formatPercent(bt.metrics.hitRate * 100, 0)} hit` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Signal List View ─────────────────────────────────────────────────────────

export function SignalListView({ signals }: { signals: StrategySignal[] }) {
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 30;
  const displayed = signals.slice(0, (page + 1) * PAGE_SIZE);

  const cumulativeByIndex = React.useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of signals) {
      acc += s.pnl_usd ?? 0;
      out.push(acc);
    }
    return out;
  }, [signals]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-2 pr-2">#</th>
              <th className="text-left py-2 pr-2">Timestamp</th>
              <th className="text-left py-2 pr-2">Dir</th>
              <th className="text-left py-2 pr-2">Instrument</th>
              <th className="text-right py-2 px-2">Conf</th>
              <th className="text-right py-2 px-2">P&L</th>
              <th className="text-right py-2 px-2">Cum. P&L</th>
              <th className="text-right py-2 px-2">MFE</th>
              <th className="text-right py-2 px-2">MAE</th>
              <th className="text-left py-2 px-2">Regime</th>
              <th className="text-left py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((s, i) => (
              <tr key={s.id} className="border-t border-border/20">
                <td className="py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                <td className="py-1.5 pr-2 font-mono tabular-nums">
                  {new Date(s.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-1.5 pr-2">
                  <span
                    className={cn(
                      "font-medium",
                      s.direction === "LONG"
                        ? "text-emerald-400"
                        : s.direction === "SHORT"
                          ? "text-red-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.direction}
                  </span>
                </td>
                <td className="py-1.5 pr-2">{s.instrument}</td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums">{formatNumber(s.confidence, 2)}</td>
                <td
                  className={cn(
                    "py-1.5 px-2 text-right font-mono tabular-nums",
                    s.pnl_usd != null && s.pnl_usd >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {s.pnl_usd != null ? `${s.pnl_usd >= 0 ? "+" : ""}$${formatNumber(s.pnl_usd, 0)}` : "—"}
                </td>
                <td
                  className={cn(
                    "py-1.5 px-2 text-right font-mono tabular-nums",
                    cumulativeByIndex[i] >= 0 ? "text-emerald-400/90" : "text-red-400/90",
                  )}
                >
                  {cumulativeByIndex[i] >= 0 ? "+" : ""}${formatNumber(cumulativeByIndex[i], 0)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums text-emerald-400/70">
                  {s.mfe_pct != null ? `+${s.mfe_pct}%` : "—"}
                </td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums text-red-400/70">
                  {s.mae_pct != null ? `${s.mae_pct}%` : "—"}
                </td>
                <td className="py-1.5 px-2 capitalize text-muted-foreground">{s.regime_at_signal ?? "—"}</td>
                <td className="py-1.5">
                  {s.outcome === "win" ? (
                    <Badge variant="outline" className="text-[10px] h-4 border-emerald-400/30 text-emerald-400">
                      Win
                    </Badge>
                  ) : s.outcome === "loss" ? (
                    <Badge variant="outline" className="text-[10px] h-4 border-red-400/30 text-red-400">
                      Loss
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {displayed.length < signals.length && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setPage((p) => p + 1)}>
          Load more ({signals.length - displayed.length} remaining)
        </Button>
      )}
    </div>
  );
}
