"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "./entity-link";
import { StatusDot } from "./status-badge";
import { PnLValue } from "./pnl-value";
import { SparklineCell } from "./kpi-card";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export interface StrategyPerformance {
  id: string;
  name: string;
  status: "live" | "paused" | "warning" | "critical";
  pnl: number;
  sharpe: number;
  maxDrawdown: number;
  sparklineData: number[];
  assetClass: string;
}

interface StrategyPerformanceTableProps {
  strategies: StrategyPerformance[];
  onRowClick?: (strategyId: string) => void;
  className?: string;
}

export function StrategyPerformanceTable({ strategies, onRowClick, className }: StrategyPerformanceTableProps) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Strategy</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-right">P&L</TableHead>
            <TableHead className="font-semibold text-right">Sharpe</TableHead>
            <TableHead className="font-semibold text-right">Max DD</TableHead>
            <TableHead className="font-semibold text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategies.map((strategy) => (
            <TableRow
              key={strategy.id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => onRowClick?.(strategy.id)}
            >
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <EntityLink type="strategy" id={strategy.id} label={strategy.name} className="font-medium" />
                  <span className="text-xs text-muted-foreground">{strategy.assetClass}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1.5">
                  <StatusDot status={strategy.status} />
                  <span className="text-xs capitalize">{strategy.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <PnLValue value={strategy.pnl} size="sm" />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {strategy.sharpe != null ? formatNumber(strategy.sharpe, 2) : "-"}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {strategy.maxDrawdown != null ? `${formatPercent(strategy.maxDrawdown, 1)}` : "-"}
              </TableCell>
              <TableCell className="text-right">
                <SparklineCell data={strategy.sparklineData ?? []} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
