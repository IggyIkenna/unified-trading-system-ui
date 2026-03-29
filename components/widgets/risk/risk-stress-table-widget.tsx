"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableWidget, type DataTableColumn } from "../shared";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

interface StressRow {
  name: string;
  multiplier: number;
  pnlImpact: number;
  varImpact: number;
  positionsBreaching: number;
  largestLoss: string;
}

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

  const columns: DataTableColumn<StressRow>[] = [
    { key: "name", label: "Scenario", accessor: "name", sortable: true },
    {
      key: "multiplier",
      label: "Multiplier",
      accessor: (row) => `${row.multiplier}x`,
      align: "right",
      sortable: true,
    },
    {
      key: "pnlImpact",
      label: "P&L Impact",
      accessor: (row) => <span className="text-rose-400 font-semibold">{formatCurrency(row.pnlImpact)}</span>,
      align: "right",
      sortable: true,
    },
    {
      key: "varImpact",
      label: "VaR Impact",
      accessor: (row) => formatCurrency(row.varImpact),
      align: "right",
      sortable: true,
    },
    {
      key: "positionsBreaching",
      label: "Breaches",
      accessor: (row) => (
        <Badge
          variant={row.positionsBreaching > 10 ? "destructive" : row.positionsBreaching > 5 ? "secondary" : "outline"}
        >
          {row.positionsBreaching}
        </Badge>
      ),
      align: "right",
    },
    { key: "largestLoss", label: "Largest Loss", accessor: "largestLoss" },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 px-1 shrink-0">
        {regimeData && (
          <Badge
            className={cn(
              "text-[10px]",
              regimeData.regime === "normal" && "bg-emerald-500/20 text-emerald-400",
              regimeData.regime === "stressed" && "bg-amber-500/20 text-amber-400",
              regimeData.regime === "crisis" && "bg-rose-500/20 text-rose-400",
            )}
          >
            Regime: {regimeData.regime.charAt(0).toUpperCase() + regimeData.regime.slice(1)}
          </Badge>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
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

      {selectedStressScenario && (
        <div className="px-1 shrink-0">
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
                  {formatCurrency(-stressTestResult.expected_loss_usd)}
                </div>
              </div>
              <div className="p-2 rounded bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground">Portfolio Impact</div>
                <div className="text-sm font-bold font-mono text-rose-400">
                  {formatPercent(stressTestResult.portfolio_impact_pct, 1)}
                </div>
              </div>
              <div className="p-2 rounded bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground">Worst Strategy</div>
                <div className="text-sm font-bold font-mono">{stressTestResult.worst_strategy}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-xs py-2">
              No data for {selectedStressScenario.replace(/_/g, " ")}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <DataTableWidget
          columns={columns}
          data={stressScenarios as unknown as StressRow[]}
          rowKey={(row) => row.name}
          compact
        />
      </div>
    </div>
  );
}
