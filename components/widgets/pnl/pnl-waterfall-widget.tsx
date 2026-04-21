"use client";

import * as React from "react";
import { PnLValue } from "@/components/trading/pnl-value";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, BarChartHorizontal, ChartPie, Database, FileText, Radio } from "lucide-react";
import { toast } from "sonner";
import { usePnLData } from "./pnl-data-context";
import { formatPercent } from "@/lib/utils/formatters";
import { SHARE_CLASSES, SHARE_CLASS_LABELS, type ShareClass } from "@/lib/types/defi";
import { FactorHistogram } from "./pnl-waterfall-factor-histogram";
import { FactorPie } from "./pnl-waterfall-factor-pie";

type FactorViewMode = "bars" | "histogram" | "pie";

export function PnlWaterfallWidget(_props: WidgetComponentProps) {
  const {
    structuralPnL,
    residualPnL,
    pnlComponents,
    netPnL,
    selectedFactor,
    setSelectedFactor,
    dataMode,
    setDataMode,
    dateRange,
    setDateRange,
    groupBy,
    setGroupBy,
    shareClass,
    setShareClass,
    isResidualAlert,
    residualThresholdPct,
    isLoading,
    defiPnlAttribution,
    defiPnlNet,
  } = usePnLData();

  const maxFactorAbs = Math.max(...pnlComponents.map((c) => Math.abs(c.value)), 1);
  const defiPnlMax = Math.max(...defiPnlAttribution.map((c) => Math.abs(c.value)), 1);

  const [factorView, setFactorView] = React.useState<FactorViewMode>("bars");

  function handleGenerateReport() {
    toast.success("P&L report queued", {
      description: `${dateRange.toUpperCase()} · ${dataMode} data · group by ${groupBy}. Delivery in ~2 min.`,
      duration: 5000,
    });
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 p-2">
      <div className="shrink-0 space-y-1.5 pb-2 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-md">
            <Button
              variant={dataMode === "live" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-[11px]"
              onClick={() => setDataMode("live")}
            >
              <Radio className="size-3" />
              Live
            </Button>
            <Button
              variant={dataMode === "batch" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-[11px]"
              onClick={() => setDataMode("batch")}
            >
              <Database className="size-3" />
              Batch
            </Button>
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="wtd">Week to Date</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant={dataMode === "live" ? "default" : "secondary"} className="gap-1 text-micro">
              {dataMode === "live" ? <Radio className="size-3" /> : <Database className="size-3" />}
              {dataMode === "live" ? "Live" : "Batch"}
            </Badge>
            <Button variant="outline" size="sm" className="h-6 gap-1 text-[11px]" onClick={handleGenerateReport}>
              <FileText className="size-3" />
              Report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-micro text-muted-foreground shrink-0">Group:</span>
          <div className="flex gap-0.5">
            {["all", "client", "strategy", "venue", "asset"].map((g) => (
              <Button
                key={g}
                variant={groupBy === g ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-1.5 text-[11px] capitalize"
                onClick={() => setGroupBy(g)}
              >
                {g === "all" ? "Total" : g}
              </Button>
            ))}
          </div>

          <div
            className="ml-auto flex items-center gap-0.5 p-0.5 bg-muted rounded-md"
            title="Factor Attribution view"
            aria-label="Factor Attribution view"
          >
            <Button
              variant={factorView === "bars" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-[11px]"
              onClick={() => setFactorView("bars")}
              aria-pressed={factorView === "bars"}
              data-testid="factor-view-bars"
            >
              <BarChartHorizontal className="size-3" />
              Bars
            </Button>
            <Button
              variant={factorView === "histogram" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-[11px]"
              onClick={() => setFactorView("histogram")}
              aria-pressed={factorView === "histogram"}
              data-testid="factor-view-histogram"
            >
              <BarChart3 className="size-3" />
              Histogram
            </Button>
            <Button
              variant={factorView === "pie" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-[11px]"
              onClick={() => setFactorView("pie")}
              aria-pressed={factorView === "pie"}
              data-testid="factor-view-pie"
            >
              <ChartPie className="size-3" />
              Pie
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-micro text-muted-foreground">Ccy:</span>
            <Select value={shareClass} onValueChange={(v) => setShareClass(v as ShareClass | "all")}>
              <SelectTrigger className="h-6 w-[110px] text-micro">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-micro">
                  All (USD)
                </SelectItem>
                {SHARE_CLASSES.map((sc) => (
                  <SelectItem key={sc} value={sc} className="text-micro font-mono">
                    {sc} — {SHARE_CLASS_LABELS[sc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isResidualAlert && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-micro text-[var(--status-warning)]">
            <AlertTriangle className="size-3 shrink-0" />
            <span>
              Unexplained residual <strong>${Math.abs(residualPnL.value).toLocaleString()}</strong> exceeds{" "}
              {residualThresholdPct}% of net P&L — missing risk factor?
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 flex-1 py-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <Skeleton className="h-5 rounded-md" style={{ width: `${70 - i * 10}%` }} />
            </div>
          ))}
        </div>
      ) : pnlComponents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-6">
          No P&L data available
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">Cross-section net</span>
            <PnLValue value={netPnL} size="lg" showSign />
          </div>

          <CollapsibleSection title="Structural" defaultOpen>
            <div className="space-y-2 pb-2 px-1">
              {structuralPnL.map((component) => {
                const totalStruct = structuralPnL.reduce((s, c) => s + c.value, 0);
                const maxStructVal = Math.max(...structuralPnL.map((c) => c.value));
                const width = (component.value / maxStructVal) * 100;
                return (
                  <div key={component.name} className="p-2 -mx-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{component.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatPercent((component.value / totalStruct) * 100, 1)}
                        </span>
                        <PnLValue value={component.value} size="sm" showSign />
                      </div>
                    </div>
                    <div className="h-5 bg-muted rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-300 ${
                          component.name === "Realized" ? "bg-[var(--pnl-positive)]/70" : "bg-chart-3/60"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-sm font-semibold">Total P&L</span>
                <PnLValue value={structuralPnL.reduce((s, c) => s + c.value, 0)} size="md" showSign />
              </div>
            </div>
          </CollapsibleSection>

          <div className="space-y-2 py-1 min-h-0 overflow-auto flex-1 flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 shrink-0">
              Factor Attribution
            </p>

            {factorView === "bars" && (
              <div className="space-y-2">
                {pnlComponents.map((component) => {
                  const width = (Math.abs(component.value) / maxFactorAbs) * 100;
                  const isSelected = selectedFactor === component.name;
                  return (
                    <div
                      key={component.name}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      className={`group cursor-pointer rounded-lg p-2 -mx-1 transition-colors ${
                        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedFactor(isSelected ? null : component.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedFactor(isSelected ? null : component.name);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                          {component.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {component.percentage > 0 ? "+" : ""}
                            {formatPercent(component.percentage, 1)}
                          </span>
                          <PnLValue value={component.value} size="sm" showSign />
                        </div>
                      </div>
                      <div className="h-5 bg-muted rounded-md overflow-hidden">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ${
                            component.isNegative ? "bg-[var(--pnl-negative)]/60" : "bg-[var(--pnl-positive)]/60"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {factorView === "histogram" && (
              <FactorHistogram
                components={pnlComponents}
                selectedFactor={selectedFactor}
                onSelect={(name) => setSelectedFactor(selectedFactor === name ? null : name)}
              />
            )}

            {factorView === "pie" && (
              <FactorPie
                components={pnlComponents}
                selectedFactor={selectedFactor}
                onSelect={(name) => setSelectedFactor(selectedFactor === name ? null : name)}
              />
            )}
          </div>

          <CollapsibleSection title="DeFi P&L Attribution" defaultOpen={false} count={defiPnlAttribution.length}>
            <div className="space-y-2 pb-2 px-1">
              {defiPnlAttribution.map((cat) => {
                const width = (Math.abs(cat.value) / defiPnlMax) * 100;
                return (
                  <div key={cat.name} className="p-2 -mx-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <PnLValue value={cat.value} size="sm" showSign />
                    </div>
                    <div className="h-4 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-300"
                        style={{ width: `${width}%`, backgroundColor: cat.color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-2 pt-1 border-t border-border">
                <span className="text-sm font-semibold">DeFi Net P&L</span>
                <PnLValue value={defiPnlNet} size="md" showSign />
              </div>
            </div>
          </CollapsibleSection>

          <div className="pt-2 border-t border-dashed border-[var(--status-warning)]/40 space-y-2 shrink-0">
            <div
              className="p-2 -mx-1 rounded-lg bg-[var(--status-warning)]/5 border border-dashed border-[var(--status-warning)]/30"
              title="Unexplained P&L — large residual indicates a missing risk factor."
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--status-warning)]">{residualPnL.name}</span>
                  <span className="text-xs text-muted-foreground">(unexplained)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatPercent(residualPnL.percentage, 1)}</span>
                  <PnLValue value={residualPnL.value} size="sm" showSign />
                </div>
              </div>
              <div className="h-4 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md bg-[var(--status-warning)]/50"
                  style={{ width: `${(Math.abs(residualPnL.value) / maxFactorAbs) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="pt-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">NET P&L</span>
          <PnLValue value={netPnL} size="lg" showSign />
        </div>
      </div>
    </div>
  );
}
