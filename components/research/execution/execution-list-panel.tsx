"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { EXECUTION_BACKTESTS } from "@/lib/mocks/fixtures/build-data";
import type { ExecutionBacktest } from "@/lib/mocks/fixtures/build-data";
import { StatusBadge, ALGO_COLORS } from "@/components/research/execution/status-helpers";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ─── Execution List Panel ───────────────────────────────────────────────────

export function ExecutionListPanel({
  selectedBt,
  onSelect,
  compareSelected,
  onToggleCompare,
  candidates,
}: {
  selectedBt: ExecutionBacktest | null;
  onSelect: (bt: ExecutionBacktest) => void;
  compareSelected: string[];
  onToggleCompare: (id: string) => void;
  candidates: Set<string>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">All Backtests</p>
        <Badge variant="secondary" className="text-xs">
          {EXECUTION_BACKTESTS.length}
        </Badge>
      </div>
      {EXECUTION_BACKTESTS.map((bt) => {
        const isSelected = selectedBt?.id === bt.id;
        const isCompare = compareSelected.includes(bt.id);
        const isCandidate = candidates.has(bt.id);
        return (
          <div
            key={bt.id}
            className={cn(
              "rounded-lg border p-3 cursor-pointer transition-colors space-y-2",
              isSelected ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-border",
            )}
            onClick={() => onSelect(bt)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{bt.name}</p>
                  {isCandidate && (
                    <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-400/30">
                      Candidate
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{bt.strategy_name}</p>
              </div>
              <StatusBadge status={bt.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: `${ALGO_COLORS[bt.algo]}40`,
                  color: ALGO_COLORS[bt.algo],
                }}
              >
                {bt.algo}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {bt.instrument}
              </Badge>
            </div>
            {bt.results && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className={cn("font-medium", bt.results.sharpe_ratio > 1.5 ? "text-emerald-400" : "")}>
                  Sharpe {formatNumber(bt.results.sharpe_ratio, 2)}
                </span>
                <span className={cn("font-medium", bt.results.net_profit > 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatPercent(bt.results.net_profit_pct, 1)}
                </span>
                <span>DD {formatPercent(bt.results.max_drawdown_pct, 1)}</span>
              </div>
            )}
            {bt.status === "running" && (
              <div className="space-y-1">
                <Progress value={92} className="h-1" />
                <p className="text-xs text-muted-foreground">92% complete</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(bt.id);
                }}
                className={cn(
                  "text-xs border rounded px-2 py-0.5 transition-colors",
                  isCompare
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border",
                )}
              >
                {isCompare ? "✓ Compare" : "Compare"}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(bt.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
