"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, MOCK_STRATEGIES } from "./risk-data-context";
import { CollapsibleSection } from "@/components/shared";
import { PnLValue } from "@/components/trading/pnl-value";
import { Spinner } from "@/components/shared/spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { getStatusFromUtil } from "./risk-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function RiskExposureAttributionWidget(_props: WidgetComponentProps) {
  const {
    riskFilterStrategy,
    setRiskFilterStrategy,
    filteredExposureRows,
    groupedExposure,
    exposureTimeSeries,
    exposurePeriod,
    setExposurePeriod,
    isLoading,
    hasError,
  } = useRiskData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-rose-400">Failed to load exposure data</div>
    );
  }

  const selectedStrategy = MOCK_STRATEGIES.find((s) => s.archetype === riskFilterStrategy);

  const formatExp = (v: number | string) => {
    if (typeof v === "string") return v;
    if (v >= 1_000_000) return `$${formatNumber(v / 1_000_000, 1)}m`;
    if (v >= 1_000) return `$${formatNumber(v / 1_000, 0)}k`;
    return formatNumber(v, 2);
  };

  const slicedTimeSeries = exposureTimeSeries.slice(exposurePeriod === "1W" ? -7 : exposurePeriod === "1M" ? -30 : -90);

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-2 p-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            {filteredExposureRows.length} of 23 risk types
            {selectedStrategy && ` for ${selectedStrategy.name}`}
          </span>
          <Select value={riskFilterStrategy} onValueChange={setRiskFilterStrategy}>
            <SelectTrigger className="w-[200px] h-7 text-[10px]">
              <SelectValue placeholder="All strategies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All strategies (23 risk types)</SelectItem>
              {MOCK_STRATEGIES.map((s) => (
                <SelectItem key={s.id} value={s.archetype}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {Object.entries(groupedExposure).map(([category, rows]) => (
          <CollapsibleSection
            key={category}
            title={`${category.replace(/_/g, " ")} (${rows.length})`}
            defaultOpen={category === "first_order" || category === "domain_specific"}
            count={rows.length}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px]">Component</TableHead>
                  <TableHead className="text-[10px] text-right">P&L</TableHead>
                  <TableHead className="text-[10px] text-right">Exposure</TableHead>
                  <TableHead className="text-[10px] text-right">Limit</TableHead>
                  <TableHead className="text-[10px] text-right">Util</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const status = getStatusFromUtil(row.utilization);
                  return (
                    <TableRow key={row.component}>
                      <TableCell className="text-[11px] font-medium">{row.component}</TableCell>
                      <TableCell className="text-right">
                        <PnLValue value={row.pnl} size="sm" />
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] tabular-nums">
                        {formatExp(row.exposure)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatExp(row.limit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] tabular-nums">
                        {formatPercent(row.utilization, 0)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} showDot={true} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CollapsibleSection>
        ))}

        {exposureTimeSeries.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">Exposure Time Series (Top 3)</span>
              <div className="flex items-center gap-0.5">
                {(["1W", "1M", "3M"] as const).map((period) => (
                  <Button
                    key={period}
                    variant={exposurePeriod === period ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setExposurePeriod(period)}
                    className="text-[10px] h-5 px-1.5"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slicedTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={9} />
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
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="delta" stroke="#3b82f6" name="Delta" strokeWidth={1.5} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="funding"
                    stroke="#22c55e"
                    name="Funding"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </WidgetScroll>
  );
}
