"use client";

import { PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { PNL_FACTOR_CHART_COLORS } from "@/lib/config/services/pnl.config";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePnLData } from "./pnl-data-context";

export function PnlTimeSeriesWidget(_props: WidgetComponentProps) {
  const { timeSeriesData, timeSeriesNetPnL } = usePnLData();
  const C = PNL_FACTOR_CHART_COLORS;

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-2">
      <div className="flex items-center justify-end shrink-0">
        <span className="text-xs text-muted-foreground mr-2">Net:</span>
        <PnLValue value={timeSeriesNetPnL} size="lg" showSign />
      </div>
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
            <Area
              type="monotone"
              dataKey="Funding"
              stackId="positive"
              fill={C.Funding}
              stroke={C.Funding}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Carry"
              stackId="positive"
              fill={C.Carry}
              stroke={C.Carry}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Basis"
              stackId="positive"
              fill={C.Basis}
              stroke={C.Basis}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Delta"
              stackId="positive"
              fill={C.Delta}
              stroke={C.Delta}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Gamma"
              stackId="positive"
              fill={C.Gamma}
              stroke={C.Gamma}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Rebates"
              stackId="positive"
              fill={C.Rebates}
              stroke={C.Rebates}
              fillOpacity={0.7}
            />
            <Area type="monotone" dataKey="Vega" stackId="negative" fill={C.Vega} stroke={C.Vega} fillOpacity={0.7} />
            <Area
              type="monotone"
              dataKey="Theta"
              stackId="negative"
              fill={C.Theta}
              stroke={C.Theta}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Slippage"
              stackId="negative"
              fill={C.Slippage}
              stroke={C.Slippage}
              fillOpacity={0.7}
            />
            <Area type="monotone" dataKey="Fees" stackId="negative" fill={C.Fees} stroke={C.Fees} fillOpacity={0.7} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground shrink-0">
        Stacked areas: positive factors up; Vega, Theta, Slippage, Fees down.
      </p>
    </div>
  );
}
