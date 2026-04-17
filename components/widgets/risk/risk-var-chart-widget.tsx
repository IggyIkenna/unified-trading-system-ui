"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency, getAssetClassColor } from "./risk-data-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

export function RiskVarChartWidget(_props: WidgetComponentProps) {
  const { adjustedVarData, varMethod, setVarMethod, isLoading, hasError } = useRiskData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (hasError) {
    return <div className="flex items-center justify-center h-full text-xs text-rose-400">Failed to load VaR data</div>;
  }

  const methods = ["historical", "parametric", "monte_carlo", "filtered_historical"] as const;

  if (adjustedVarData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No VaR data available</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-1 pb-1 shrink-0">
        {methods.map((method) => (
          <Button
            key={method}
            variant={varMethod === method ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setVarMethod(method)}
            className="text-[10px] h-6 px-1.5 capitalize"
          >
            {method.replace("_", " ")}
          </Button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={adjustedVarData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v as number)}
              stroke="var(--muted-foreground)"
              fontSize={10}
            />
            <YAxis type="category" dataKey="instrument" stroke="var(--muted-foreground)" fontSize={10} width={75} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              formatter={(value: number, _name: string, props: { payload?: Record<string, unknown> }) => [
                `${formatCurrency(value)} (${props.payload?.pct ?? 0}%)`,
                `VaR 95% - ${props.payload?.venue ?? ""}`,
              ]}
            />
            <Bar dataKey="var95" radius={[0, 4, 4, 0]}>
              {adjustedVarData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getAssetClassColor(entry.assetClass as string)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 px-1 pt-1 text-[10px] text-muted-foreground shrink-0">
        {[
          { label: "DeFi", color: "var(--surface-config)" },
          { label: "CeFi", color: "var(--surface-trading)" },
          { label: "TradFi", color: "var(--surface-markets)" },
          { label: "Sports", color: "var(--surface-strategy)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="size-2.5 rounded" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
