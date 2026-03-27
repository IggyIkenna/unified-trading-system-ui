"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { LimitBar } from "@/components/trading/limit-bar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { CollapsibleSection } from "../shared";

export function RiskMarginWidget(_props: WidgetComponentProps) {
  const { sortedLimits, hfTimeSeries, distanceToLiquidation } = useRiskData();

  const marginLimits = sortedLimits.filter((l) => l.category === "margin");
  const ltvLimits = sortedLimits.filter((l) => l.category === "ltv");

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-3 p-1">
        {marginLimits.length > 0 && (
          <CollapsibleSection title="CeFi Margin by Venue" defaultOpen={true} count={marginLimits.length}>
            <div className="space-y-2 pt-1">
              {marginLimits.map((limit) => (
                <LimitBar
                  key={limit.id}
                  label={limit.entity}
                  value={limit.value}
                  limit={limit.limit}
                  unit={limit.unit}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="SPAN Margin — IBKR" defaultOpen={true}>
          <div className="space-y-1.5 text-[11px] pt-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Margin</span>
              <span className="font-mono font-medium">$180,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance Margin</span>
              <span className="font-mono font-medium">$135,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cross-Margin Offset</span>
              <span className="font-mono font-medium text-emerald-400">-$22,000</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-medium">Net Margin Required</span>
              <span className="font-mono font-bold">$158,000</span>
            </div>
            <div className="mt-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">Margin Utilization</span>
                <span className="font-mono">79%</span>
              </div>
              <Progress value={79} className="h-1.5" />
            </div>
          </div>
        </CollapsibleSection>

        {ltvLimits.length > 0 && (
          <CollapsibleSection title="DeFi Health Factor (Aave v3)" defaultOpen={true} count={ltvLimits.length}>
            <div className="space-y-2 pt-1">
              {ltvLimits.map((limit) => (
                <LimitBar
                  key={limit.id}
                  label={`${limit.name} (${limit.entity})`}
                  value={limit.value}
                  limit={limit.limit}
                  unit={limit.unit}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {hfTimeSeries.length > 0 && (
          <div>
            <div className="text-[10px] font-medium text-muted-foreground mb-1">HF Time Series (7d)</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hfTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={9} tickFormatter={(v) => `D${v}`} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} domain={[1, 2]} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "10px",
                    }}
                    formatter={(value: number) => [value.toFixed(2), "HF"]}
                  />
                  <ReferenceLine y={1.0} stroke="var(--destructive)" strokeDasharray="5 5" />
                  <ReferenceLine y={1.5} stroke="var(--warning)" strokeDasharray="5 5" />
                  <Area
                    type="monotone"
                    dataKey="hf"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {distanceToLiquidation.length > 0 && (
          <CollapsibleSection title="Distance to Liquidation" defaultOpen={true}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px]">Venue</TableHead>
                  <TableHead className="text-[10px]">HF / Margin</TableHead>
                  <TableHead className="text-[10px] text-right">Dist.</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distanceToLiquidation.map((row) => (
                  <TableRow key={row.venue as string}>
                    <TableCell className="text-[11px] font-medium">{row.venue as string}</TableCell>
                    <TableCell className="text-[11px] font-mono">{row.metric as string}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          (row.distToLiq as number) > 20
                            ? "default"
                            : (row.distToLiq as number) > 10
                              ? "secondary"
                              : "destructive"
                        }
                        className={cn(
                          "font-mono text-[10px]",
                          (row.distToLiq as number) > 20 && "bg-emerald-500/20 text-emerald-400",
                          (row.distToLiq as number) <= 20 &&
                            (row.distToLiq as number) > 10 &&
                            "bg-amber-500/20 text-amber-400",
                        )}
                      >
                        {(row.distToLiq as number).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "size-2 rounded-full inline-block",
                          (row.distToLiq as number) > 20 && "bg-emerald-500",
                          (row.distToLiq as number) <= 20 && (row.distToLiq as number) > 10 && "bg-amber-500",
                          (row.distToLiq as number) <= 10 && "bg-rose-500",
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleSection>
        )}
      </div>
    </WidgetScroll>
  );
}
