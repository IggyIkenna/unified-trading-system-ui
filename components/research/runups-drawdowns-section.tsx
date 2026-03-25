"use client";

import { cn } from "@/lib/utils";
import type { RunupDrawdownStats } from "@/lib/backtest-analytics-types";

interface RunupsDrawdownsSectionProps {
  data: RunupDrawdownStats;
  className?: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-border/30">
      <td className="py-1.5 text-xs text-muted-foreground pr-4">{label}</td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">
        {value}
      </td>
    </tr>
  );
}

function fmt$(v: number) {
  return `$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function RunupsDrawdownsSection({
  data,
  className,
}: RunupsDrawdownsSectionProps) {
  const { runups, drawdowns } = data;

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {/* Run-ups */}
      <div>
        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Run-ups
        </h4>
        <table className="w-full">
          <tbody>
            <Row
              label="Avg run-up duration"
              value={`${runups.avg_duration_days} days`}
            />
            <Row
              label="Avg run-up (close-to-close)"
              value={`${fmt$(runups.avg_amount)} (${runups.avg_pct.toFixed(2)}%)`}
            />
            <Row
              label="Max run-up (close-to-close)"
              value={`${fmt$(runups.max_close_to_close)} (${runups.max_close_to_close_pct.toFixed(2)}%)`}
            />
            <Row
              label="Max run-up (intrabar)"
              value={`${fmt$(runups.max_intrabar)} (${runups.max_intrabar_pct.toFixed(2)}%)`}
            />
          </tbody>
        </table>
      </div>

      {/* Drawdowns */}
      <div>
        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
          Drawdowns
        </h4>
        <table className="w-full">
          <tbody>
            <Row
              label="Avg drawdown duration"
              value={`${drawdowns.avg_duration_days} days`}
            />
            <Row
              label="Avg drawdown (close-to-close)"
              value={`${fmt$(drawdowns.avg_amount)} (${drawdowns.avg_pct.toFixed(2)}%)`}
            />
            <Row
              label="Max drawdown (close-to-close)"
              value={`${fmt$(drawdowns.max_close_to_close)} (${drawdowns.max_close_to_close_pct.toFixed(2)}%)`}
            />
            <Row
              label="Max drawdown (intrabar)"
              value={`${fmt$(drawdowns.max_intrabar)} (${drawdowns.max_intrabar_pct.toFixed(2)}%)`}
            />
            <Row
              label="Recovery from max drawdown"
              value={`${drawdowns.recovery_days} days`}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
