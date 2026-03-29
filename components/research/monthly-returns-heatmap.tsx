"use client";

import { cn } from "@/lib/utils";
import type { MonthlyReturn } from "@/lib/backtest-analytics-types";
import { formatPercent } from "@/lib/utils/formatters";

interface MonthlyReturnsHeatmapProps {
  monthlyReturns: MonthlyReturn[];
  className?: string;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cellColor(pct: number): string {
  if (pct >= 3) return "bg-emerald-500/90 text-white";
  if (pct >= 1) return "bg-emerald-600/50 text-emerald-50";
  if (pct > 0) return "bg-emerald-900/40 text-emerald-200";
  if (pct === 0) return "bg-muted/40 text-muted-foreground";
  if (pct > -1) return "bg-red-900/35 text-red-200";
  if (pct > -3) return "bg-red-700/45 text-red-50";
  return "bg-red-500/80 text-white";
}

export function MonthlyReturnsHeatmap({ monthlyReturns, className }: MonthlyReturnsHeatmapProps) {
  const byYear = new Map<number, Map<number, number>>();
  for (const m of monthlyReturns) {
    if (!byYear.has(m.year)) byYear.set(m.year, new Map());
    byYear.get(m.year)!.set(m.month, m.return_pct);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  if (years.length === 0) {
    return <p className="text-xs text-muted-foreground">No monthly returns data.</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Returns (%)</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[10px] sm:text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted-foreground font-medium w-10" />
              {MONTH_LABELS.map((label) => (
                <th key={label} className="p-1 text-center text-muted-foreground font-medium min-w-[2.25rem]">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td className="p-1 font-mono text-muted-foreground pr-2 whitespace-nowrap">{year}</td>
                {MONTH_LABELS.map((_, mi) => {
                  const month = mi + 1;
                  const v = byYear.get(year)?.get(month);
                  const display = v === undefined ? "—" : `${v > 0 ? "+" : ""}${formatPercent(v, 1)}`;
                  return (
                    <td key={month} className="p-0.5">
                      <div
                        className={cn(
                          "rounded px-0.5 py-1 text-center font-mono tabular-nums min-h-[1.75rem] flex items-center justify-center",
                          v === undefined ? "bg-muted/10 text-muted-foreground" : cellColor(v),
                        )}
                        title={v !== undefined ? `${year}-${String(month).padStart(2, "0")}: ${v}%` : undefined}
                      >
                        {display}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-emerald-500/90" /> Strong +
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-red-500/80" /> Strong −
        </span>
      </div>
    </div>
  );
}
