"use client";

import { Button } from "@/components/ui/button";
import { EntityLink } from "@/components/trading/entity-link";
import { PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePnLData } from "./pnl-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

const STRATEGY_AREA_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

export function PnlFactorDrilldownWidget(_props: WidgetComponentProps) {
  const { selectedFactorData, setSelectedFactor, viewMode } = usePnLData();

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {selectedFactorData ? `${selectedFactorData.factor.name} — by strategy` : "Component breakdown"}
        </p>
        {selectedFactorData && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setSelectedFactor(null)}>
            Clear
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
            {selectedFactorData.factor.name} across top strategies. Total:{" "}
            <PnLValue value={selectedFactorData.factor.value} size="sm" showSign className="inline" />
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground flex-1">
          {viewMode === "time-series"
            ? "Time series shows factor contributions over time. Adjust filters in P&L Controls."
            : "Select a factor in the waterfall to see per-strategy attribution and a mini time series."}
        </p>
      )}
    </div>
  );
}
