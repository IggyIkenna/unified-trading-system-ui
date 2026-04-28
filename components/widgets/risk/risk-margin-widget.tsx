"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { LimitBar } from "@/components/trading/limit-bar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_SPAN_MARGIN_IBKR } from "@/lib/config/services/risk-margin.config";
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
import { CollapsibleSection } from "@/components/shared";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function RiskMarginWidget(_props: WidgetComponentProps) {
  const { sortedLimits, hfTimeSeries, distanceToLiquidation, isLoading, hasError } = useRiskData();

  const marginLimits = sortedLimits.filter((l) => l.category === "margin");
  const ltvLimits = sortedLimits.filter((l) => l.category === "ltv");

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Failed to load margin data
      </div>
    );
  }

  const isEmpty = marginLimits.length === 0 && ltvLimits.length === 0 && hfTimeSeries.length === 0;
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No margin data available
      </div>
    );
  }

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

        <CollapsibleSection title="SPAN Margin: IBKR" defaultOpen={true}>
          <div className="space-y-1.5 text-caption pt-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Margin</span>
              <span className="font-mono font-medium">{formatCurrency(MOCK_SPAN_MARGIN_IBKR.initialMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance Margin</span>
              <span className="font-mono font-medium">{formatCurrency(MOCK_SPAN_MARGIN_IBKR.maintenanceMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cross-Margin Offset</span>
              <span className="font-mono font-medium text-emerald-400">
                {formatCurrency(MOCK_SPAN_MARGIN_IBKR.crossMarginOffset)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-medium">Net Margin Required</span>
              <span className="font-mono font-bold">{formatCurrency(MOCK_SPAN_MARGIN_IBKR.netMarginRequired)}</span>
            </div>
            <div className="mt-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">Margin Utilization</span>
                <span className="font-mono">{MOCK_SPAN_MARGIN_IBKR.utilizationPct}%</span>
              </div>
              <Progress value={MOCK_SPAN_MARGIN_IBKR.utilizationPct} className="h-1.5" />
            </div>
          </div>
        </CollapsibleSection>

        {ltvLimits.length > 0 && (
          <CollapsibleSection title="DeFi Health Factor (Aave v3)" defaultOpen={true} count={ltvLimits.length}>
            <div className="space-y-2 pt-1">
              {ltvLimits.map((limit) => {
                // LTV is stored as ratio (0.72). HF = 1 / LTV. Display HF, not LTV.
                const hf = limit.value > 0 ? 1 / limit.value : 0;
                const hfLimit = limit.limit > 0 ? 1 / limit.limit : 2;
                return (
                  <LimitBar
                    key={limit.id}
                    label={`${limit.entity} HF (= 1/LTV)`}
                    value={Math.round(hf * 100) / 100}
                    limit={Math.round(hfLimit * 100) / 100}
                    unit="HF"
                  />
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {hfTimeSeries.length > 0 && (
          <div>
            <div className="text-micro font-medium text-muted-foreground mb-1">HF Time Series (7d)</div>
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
                    formatter={(value: number) => [formatNumber(value, 2), "HF"]}
                  />
                  <ReferenceLine
                    y={1.0}
                    stroke="var(--destructive)"
                    strokeDasharray="5 5"
                    label={{ value: "Liquidation 1.0", position: "right", fontSize: 8 }}
                  />
                  <ReferenceLine
                    y={1.2}
                    stroke="var(--risk-emergency)"
                    strokeDasharray="4 4"
                    label={{ value: "Emergency 1.2", position: "right", fontSize: 8 }}
                  />
                  <ReferenceLine
                    y={1.5}
                    stroke="var(--warning)"
                    strokeDasharray="5 5"
                    label={{ value: "Deleverage 1.5", position: "right", fontSize: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hf"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
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
                  <TableHead className="text-micro">Venue</TableHead>
                  <TableHead className="text-micro">HF / Margin</TableHead>
                  <TableHead className="text-micro text-right">Dist.</TableHead>
                  <TableHead className="text-micro">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distanceToLiquidation.map((row) => (
                  <TableRow key={row.venue as string}>
                    <TableCell className="text-caption font-medium">{row.venue as string}</TableCell>
                    <TableCell className="text-caption font-mono">{row.metric as string}</TableCell>
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
                          "font-mono text-micro",
                          (row.distToLiq as number) > 20 && "bg-emerald-500/20 text-emerald-400",
                          (row.distToLiq as number) <= 20 &&
                            (row.distToLiq as number) > 10 &&
                            "bg-amber-500/20 text-amber-400",
                        )}
                      >
                        {formatPercent(row.distToLiq as number, 1)}
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
