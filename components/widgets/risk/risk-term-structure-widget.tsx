"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency } from "./risk-data-context";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/utils/formatters";

export function RiskTermStructureWidget(_props: WidgetComponentProps) {
  const { termStructureData } = useRiskData();

  if (termStructureData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No term structure data
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={termStructureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={9} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={9}
              tickFormatter={(v) => `$${formatNumber((v as number) / 1_000_000, 1)}M`}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "10px",
              }}
              formatter={(value: number) => [formatCurrency(value)]}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            <Bar dataKey="defi" stackId="a" fill="var(--surface-config)" name="DeFi" />
            <Bar dataKey="cefi" stackId="a" fill="var(--surface-trading)" name="CeFi" />
            <Bar dataKey="tradfi" stackId="a" fill="var(--surface-markets)" name="TradFi" />
            <Bar dataKey="sports" stackId="a" fill="var(--surface-strategy)" name="Sports" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-1 pt-1 text-[9px] text-muted-foreground shrink-0">
        DeFi/CeFi perpetuals classified as Overnight (8h funding settlement).
      </div>
    </div>
  );
}
