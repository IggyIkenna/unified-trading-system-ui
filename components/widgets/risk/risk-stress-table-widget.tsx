"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { formatCurrency, useRiskData } from "./risk-data-context";

interface StressRow {
  name: string;
  multiplier: number;
  pnlImpact: number;
  varImpact: number;
  positionsBreaching: number;
  largestLoss: string;
}

const columns: ColumnDef<StressRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Scenario",
    enableSorting: true,
    cell: ({ row }) => <span>{row.getValue<string>("name")}</span>,
  },
  {
    accessorKey: "multiplier",
    header: () => <span className="flex justify-end">Multiplier</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{row.getValue<number>("multiplier")}x</div>,
  },
  {
    accessorKey: "pnlImpact",
    header: () => <span className="flex justify-end">P&L Impact</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        <span className="text-rose-400 font-semibold">{formatCurrency(row.getValue<number>("pnlImpact"))}</span>
      </div>
    ),
  },
  {
    accessorKey: "varImpact",
    header: () => <span className="flex justify-end">VaR Impact</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue<number>("varImpact"))}</div>,
  },
  {
    accessorKey: "positionsBreaching",
    header: () => <span className="flex justify-end">Breaches</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const count = row.getValue<number>("positionsBreaching");
      return (
        <div className="flex justify-end">
          <Badge variant={count > 10 ? "destructive" : count > 5 ? "secondary" : "outline"}>{count}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "largestLoss",
    header: "Largest Loss",
    enableSorting: false,
    cell: ({ row }) => <span>{row.getValue<string>("largestLoss")}</span>,
  },
];

export function RiskStressTableWidget(_props: WidgetComponentProps) {
  const {
    stressScenarios,
    selectedStressScenario,
    setSelectedStressScenario,
    stressTestResult,
    stressTestLoading,
    regimeData,
    regimeMultiplier,
    setRegimeMultiplier,
  } = useRiskData();

  const extraActions = (
    <div className="flex items-center gap-2 shrink-0">
      {regimeData && (
        <Badge
          className={cn(
            "text-[10px]",
            String(regimeData.regime) === "normal" && "bg-emerald-500/20 text-emerald-400",
            String(regimeData.regime) === "stressed" && "bg-amber-500/20 text-amber-400",
            String(regimeData.regime) === "crisis" && "bg-rose-500/20 text-rose-400",
          )}
        >
          Regime: {String(regimeData.regime).charAt(0).toUpperCase() + String(regimeData.regime).slice(1)}
        </Badge>
      )}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">Stress</span>
        <span className="text-[10px] font-mono font-bold">{formatNumber(regimeMultiplier, 1)}x</span>
        <input
          type="range"
          min={0.5}
          max={3.0}
          step={0.1}
          value={regimeMultiplier}
          onChange={(e) => setRegimeMultiplier(Number(e.target.value))}
          className="w-20 h-1.5 rounded appearance-none cursor-pointer bg-muted accent-blue-500"
        />
      </div>
      <Select value={selectedStressScenario ?? ""} onValueChange={(v) => setSelectedStressScenario(v || null)}>
        <SelectTrigger className="w-[160px] h-7 text-[10px]">
          <SelectValue placeholder="On-demand test..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GFC_2008">GFC 2008</SelectItem>
          <SelectItem value="COVID_2020">COVID 2020</SelectItem>
          <SelectItem value="CRYPTO_BLACK_THURSDAY">Crypto Black Thursday</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actionsConfig: TableActionsConfig = {
    extraActions,
  };

  const resultsPanel = selectedStressScenario ? (
    <div className="px-3 py-2 border-b border-border/40 shrink-0">
      {stressTestLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-2 rounded bg-muted/30 space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : stressTestResult ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-muted/30 text-center">
            <div className="text-[10px] text-muted-foreground">Expected Loss</div>
            <div className="text-sm font-bold font-mono text-rose-400">
              {formatCurrency(-Number(stressTestResult.expected_loss_usd ?? 0))}
            </div>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <div className="text-[10px] text-muted-foreground">Portfolio Impact</div>
            <div className="text-sm font-bold font-mono text-rose-400">
              {formatPercent(Number(stressTestResult.portfolio_impact_pct ?? 0), 1)}
            </div>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <div className="text-[10px] text-muted-foreground">Worst Strategy</div>
            <div className="text-sm font-bold font-mono">{String(stressTestResult.worst_strategy ?? "—")}</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground text-xs py-2">
          No data for {selectedStressScenario.replace(/_/g, " ")}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      {resultsPanel}
      <TableWidget
        columns={columns}
        data={stressScenarios as unknown as StressRow[]}
        actions={actionsConfig}
        enableSorting
        enableColumnVisibility={false}
        emptyMessage="No stress scenarios available"
        className="flex-1 min-h-0"
      />
    </div>
  );
}
