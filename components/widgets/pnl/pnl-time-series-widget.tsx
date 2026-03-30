"use client";

import * as React from "react";
import { PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { PNL_FACTOR_CHART_COLORS } from "@/lib/config/services/pnl.config";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePnLData } from "./pnl-data-context";
import { formatNumber } from "@/lib/utils/formatters";
import { Layers, GitCompare } from "lucide-react";

// ---------------------------------------------------------------------------
// Backtest vs Live mock data (14 days)
// ---------------------------------------------------------------------------

const BACKTEST_VS_LIVE_DATA = [
  { day: "03-17", backtest: 1020000, live: 1018000 },
  { day: "03-18", backtest: 1035000, live: 1031000 },
  { day: "03-19", backtest: 1042000, live: 1046000 },
  { day: "03-20", backtest: 1058000, live: 1052000 },
  { day: "03-21", backtest: 1071000, live: 1065000 },
  { day: "03-22", backtest: 1080000, live: 1082000 },
  { day: "03-23", backtest: 1094000, live: 1088000 },
  { day: "03-24", backtest: 1105000, live: 1097000 },
  { day: "03-25", backtest: 1112000, live: 1115000 },
  { day: "03-26", backtest: 1125000, live: 1120000 },
  { day: "03-27", backtest: 1136000, live: 1128000 },
  { day: "03-28", backtest: 1142000, live: 1139000 },
  { day: "03-29", backtest: 1150000, live: 1145000 },
  { day: "03-30", backtest: 1160000, live: 1155000 },
];

function BacktestVsLiveChart() {
  return (
    <div className="flex-1 min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={BACKTEST_VS_LIVE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `$${formatNumber(v / 1000, 0)}k`}
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
          {/* Shaded area between backtest and live = tracking error */}
          <Area
            type="monotone"
            dataKey="backtest"
            stroke="none"
            fill="#3b82f6"
            fillOpacity={0.15}
            name="Tracking Error"
          />
          <Area
            type="monotone"
            dataKey="live"
            stroke="none"
            fill="var(--popover)"
            fillOpacity={1}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="backtest"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Backtest"
          />
          <Line
            type="monotone"
            dataKey="live"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Live"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PnlTimeSeriesWidget(_props: WidgetComponentProps) {
  const { timeSeriesData, timeSeriesNetPnL } = usePnLData();
  const C = PNL_FACTOR_CHART_COLORS;
  const [overlay, setOverlay] = React.useState<"factors" | "backtest">("factors");

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={overlay === "factors" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 gap-1 text-[11px]"
            onClick={() => setOverlay("factors")}
          >
            <Layers className="size-3" />
            Factors
          </Button>
          <Button
            variant={overlay === "backtest" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 gap-1 text-[11px]"
            onClick={() => setOverlay("backtest")}
          >
            <GitCompare className="size-3" />
            Backtest vs Live
          </Button>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground mr-2">Net:</span>
          <PnLValue value={timeSeriesNetPnL} size="lg" showSign />
        </div>
      </div>

      {overlay === "factors" ? (
        <>
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => `$${formatNumber(v / 1000, 0)}k`}
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
        </>
      ) : (
        <>
          <BacktestVsLiveChart />
          <p className="text-[10px] text-muted-foreground shrink-0">
            Blue = backtest prediction, Green = live result. Shaded area = tracking error.
          </p>
        </>
      )}
    </div>
  );
}
