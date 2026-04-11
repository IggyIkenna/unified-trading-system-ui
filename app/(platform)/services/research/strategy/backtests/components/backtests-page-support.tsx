"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BacktestRun } from "@/lib/types/strategy-platform";
import type { ExportColumn } from "@/lib/utils/export";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Export columns
// ---------------------------------------------------------------------------

export const backtestExportColumns: ExportColumn[] = [
  { key: "name", header: "Name" },
  { key: "archetype", header: "Archetype" },
  { key: "assetClass", header: "Asset Class" },
  { key: "status", header: "Status" },
  { key: "sharpe", header: "Sharpe", format: "number" },
  { key: "totalReturn", header: "Total Return", format: "percent" },
  { key: "maxDrawdown", header: "Max Drawdown", format: "percent" },
  { key: "tradesCount", header: "Trades Count", format: "number" },
  { key: "sortino", header: "Sortino", format: "number" },
  { key: "hitRate", header: "Hit Rate", format: "percent" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function backtestStatusColor(status: BacktestRun["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "running":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "cancelled":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

export function fmtPct(v: number) {
  return `${formatPercent(v * 100, 1)}`;
}

export function fmtNum(v: number, decimals = 2) {
  return formatNumber(v, decimals);
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface FilterState {
  archetype: string;
  assetClass: string;
  venue: string;
  stage: string;
  search: string;
}

export const EMPTY_FILTERS: FilterState = {
  archetype: "",
  assetClass: "",
  venue: "",
  stage: "",
  search: "",
};

// ---------------------------------------------------------------------------
// Collapsible Config Section (matches ML Training ConfigSection pattern)
// ---------------------------------------------------------------------------

export function CollapsibleConfigSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card className="border-border/50">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && <CardContent className="pt-0 pb-4 space-y-4">{children}</CardContent>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// New Backtest Form
// ---------------------------------------------------------------------------

export interface BacktestFormState {
  templateId: string;
  instrument: string;
  venue: string;
  dateStart: string;
  dateEnd: string;
  entryThreshold: string;
  exitThreshold: string;
  maxLeverage: string;
  // Risk Config
  maxPositionSize: string;
  stopLossPct: string;
  takeProfitPct: string;
  maxDrawdownPct: string;
  positionSizing: string;
  // Signal Config
  signalSource: string;
  confidenceThreshold: number;
  directionMapping: string;
  featureSets: string[];
  lookbackWindow: string;
  rebalanceFrequency: string;
  // DeFi Config
  protocol: string;
  chain: string;
  minSpreadBps: string;
  healthFactorThreshold: string;
  smartOrderRouting: boolean;
  gasBudgetUsd: string;
}

export const INITIAL_FORM: BacktestFormState = {
  templateId: "",
  instrument: "",
  venue: "",
  dateStart: "2024-01-01",
  dateEnd: "2024-12-31",
  entryThreshold: "0.05",
  exitThreshold: "0.02",
  maxLeverage: "3.0",
  // Risk Config
  maxPositionSize: "100000",
  stopLossPct: "0.05",
  takeProfitPct: "0.10",
  maxDrawdownPct: "0.15",
  positionSizing: "fixed",
  // Signal Config
  signalSource: "rule-based",
  confidenceThreshold: 65,
  directionMapping: "binary",
  featureSets: ["momentum", "volatility"],
  lookbackWindow: "1d",
  rebalanceFrequency: "1h",
  // DeFi Config
  protocol: "Aave",
  chain: "Ethereum",
  minSpreadBps: "10",
  healthFactorThreshold: "1.3",
  smartOrderRouting: true,
  gasBudgetUsd: "50",
};

export const FEATURE_SET_OPTIONS = ["momentum", "volatility", "on-chain", "macro", "calendar"] as const;

export const DEFI_ARCHETYPES = ["DEFI_YIELD", "DEFI_BASIS", "DEFI_LENDING", "RECURSIVE_BASIS", "STAKED_BASIS"] as const;
