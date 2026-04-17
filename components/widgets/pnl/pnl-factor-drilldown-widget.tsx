"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityLink } from "@/components/trading/entity-link";
import { PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePnLData } from "./pnl-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { MousePointerClick } from "lucide-react";

const STRATEGY_AREA_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

// ---------------------------------------------------------------------------
// Empty-state factor summary table — shown when no factor is selected.
// Lets users scan all factors at a glance before drilling in.
// ---------------------------------------------------------------------------

function FactorSummaryTable() {
  const { pnlComponents, setSelectedFactor, netPnL } = usePnLData();

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">All factors · click any row to drill in</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MousePointerClick className="size-3" />
          Select to see per-strategy attribution
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left py-1.5 px-2 font-medium">Factor</th>
              <th className="text-right py-1.5 px-2 font-medium">Value</th>
              <th className="text-right py-1.5 px-2 font-medium hidden sm:table-cell">% of Net</th>
              <th className="text-right py-1.5 px-2 font-medium hidden md:table-cell">Bar</th>
            </tr>
          </thead>
          <tbody>
            {pnlComponents.map((c) => {
              const maxAbs = Math.max(...pnlComponents.map((x) => Math.abs(x.value)), 1);
              const barWidth = (Math.abs(c.value) / maxAbs) * 100;
              const pctOfNet = netPnL !== 0 ? (c.value / Math.abs(netPnL)) * 100 : 0;

              return (
                <tr
                  key={c.name}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0"
                  onClick={() => setSelectedFactor(c.name)}
                >
                  <td className="py-1.5 px-2 font-medium group-hover:text-primary transition-colors">{c.name}</td>
                  <td className="py-1.5 px-2 text-right">
                    <PnLValue value={c.value} size="sm" showSign />
                  </td>
                  <td className="py-1.5 px-2 text-right hidden sm:table-cell">
                    <span
                      className={`text-xs ${pctOfNet >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
                    >
                      {pctOfNet >= 0 ? "+" : ""}
                      {formatPercent(Math.abs(pctOfNet), 1)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 hidden md:table-cell w-[120px]">
                    <div className="h-4 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${c.isNegative ? "bg-[var(--pnl-negative)]/60" : "bg-[var(--pnl-positive)]/60"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border text-sm font-semibold">
              <td className="py-2 px-2">Net P&L</td>
              <td className="py-2 px-2 text-right">
                <PnLValue value={netPnL} size="sm" showSign />
              </td>
              <td className="py-2 px-2 hidden sm:table-cell" />
              <td className="py-2 px-2 hidden md:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function PnlFactorDrilldownWidget(_props: WidgetComponentProps) {
  const { selectedFactorData, setSelectedFactor, isLoading } = usePnLData();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-2 h-full">
        <div className="flex items-center justify-between shrink-0">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24 ml-auto" />
              <Skeleton className="h-4 w-[120px] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {selectedFactorData ? `${selectedFactorData.factor.name} — by strategy` : "Factor Breakdown"}
        </p>
        {selectedFactorData && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setSelectedFactor(null)}>
            ← All Factors
          </Button>
        )}
      </div>

      {selectedFactorData ? (
        <div className="space-y-4 flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <h4 className="text-xs font-medium text-muted-foreground">By strategy</h4>
              {selectedFactorData.breakdown.map((item) => {
                const maxVal = Math.max(...selectedFactorData.breakdown.map((b) => Math.abs(b.value)), 1);
                const width = (Math.abs(item.value) / maxVal) * 100;
                const isNegative = item.value < 0;
                return (
                  <div key={item.id} className="group">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="min-w-0">
                        <EntityLink type="strategy" id={item.id} label={item.name} className="text-sm font-medium" />
                        <span className="text-xs text-muted-foreground ml-1">({item.client})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatPercent(item.percentage, 1)}</span>
                        <PnLValue value={item.value} size="sm" showSign />
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${isNegative ? "bg-[var(--pnl-negative)]/60" : "bg-[var(--pnl-positive)]/60"}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="min-h-[180px] min-w-0">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Over time</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedFactorData.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v) => `$${formatNumber(v / 1000, 0)}k`}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                    />
                    {selectedFactorData.strategyNames.map((name, idx) => (
                      <Area
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stackId="1"
                        fill={STRATEGY_AREA_COLORS[idx % STRATEGY_AREA_COLORS.length]}
                        stroke={STRATEGY_AREA_COLORS[idx % STRATEGY_AREA_COLORS.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedFactorData.factor.name} across top strategies · Total:{" "}
            <PnLValue value={selectedFactorData.factor.value} size="sm" showSign className="inline" />
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <FactorSummaryTable />
        </div>
      )}
    </div>
  );
}
