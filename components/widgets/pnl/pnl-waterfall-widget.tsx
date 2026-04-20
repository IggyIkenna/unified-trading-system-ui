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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { usePnLData } from "./pnl-data-context";
import { formatPercent } from "@/lib/utils/formatters";
import type { PnLComponent } from "@/lib/types/pnl";
import { SHARE_CLASSES, SHARE_CLASS_LABELS, type ShareClass } from "@/lib/types/defi";

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
      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div className="shrink-0 space-y-1.5 pb-2 border-b border-border/60">
        {/* Row 1: Live/Batch · Date range · Badge · Report */}
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
            <Badge variant={dataMode === "live" ? "default" : "secondary"} className="gap-1 text-[10px]">
              {dataMode === "live" ? <Radio className="size-3" /> : <Database className="size-3" />}
              {dataMode === "live" ? "Live" : "Batch"}
            </Badge>
            <Button variant="outline" size="sm" className="h-6 gap-1 text-[11px]" onClick={handleGenerateReport}>
              <FileText className="size-3" />
              Report
            </Button>
          </div>
        </div>

        {/* Row 2: Group-by · Factor view · Currency */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted-foreground shrink-0">Group:</span>
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

          {/* Factor Attribution view switch (scoped to the Factor Attribution section only) */}
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
            <span className="text-[10px] text-muted-foreground">Ccy:</span>
            <Select value={shareClass} onValueChange={(v) => setShareClass(v as ShareClass | "all")}>
              <SelectTrigger className="h-6 w-[110px] text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">
                  All (USD)
                </SelectItem>
                {SHARE_CLASSES.map((sc) => (
                  <SelectItem key={sc} value={sc} className="text-[10px] font-mono">
                    {sc} — {SHARE_CLASS_LABELS[sc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Residual alert */}
        {isResidualAlert && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-[10px] text-[var(--status-warning)]">
            <AlertTriangle className="size-3 shrink-0" />
            <span>
              Unexplained residual <strong>${Math.abs(residualPnL.value).toLocaleString()}</strong> exceeds{" "}
              {residualThresholdPct}% of net P&L — missing risk factor?
            </span>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ──────────────────────────────────────── */}
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
          {/* ── Net P&L header ───────────────────────────────────────── */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">Cross-section net</span>
            <PnLValue value={netPnL} size="lg" showSign />
          </div>

          {/* ── Structural P&L ───────────────────────────────────────── */}
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
                          component.name === "Realized" ? "bg-[var(--pnl-positive)]/70" : "bg-[var(--accent-blue)]/60"
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

          {/* ── Factor Attribution ───────────────────────────────────── */}
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
                      className={`group cursor-pointer rounded-lg p-2 -mx-1 transition-colors ${
                        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedFactor(isSelected ? null : component.name)}
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

          {/* ── DeFi P&L Attribution ─────────────────────────────────── */}
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

          {/* ── Residual ─────────────────────────────────────────────── */}
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

      {/* ── Net P&L footer ───────────────────────────────────────── */}
      <div className="pt-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">NET P&L</span>
          <PnLValue value={netPnL} size="lg" showSign />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factor Attribution — shared helpers
// ---------------------------------------------------------------------------

interface FactorSubviewProps {
  components: PnLComponent[];
  selectedFactor: string | null;
  onSelect: (name: string) => void;
}

const POS_FILL = "var(--pnl-positive)";
const NEG_FILL = "var(--pnl-negative)";

/** Unicode minus (not hyphen), signed $ with compact magnitude suffix. */
function formatSignedCompact(value: number): string {
  const sign = value >= 0 ? "+" : "\u2212";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  if (abs >= 1_000) return `${sign}$${(abs / 1000).toFixed(2)}k`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

/** Y-axis ticks use shorter compact forms without the $ prefix fuss. */
function formatAxisCompact(value: number): string {
  const sign = value >= 0 ? "" : "\u2212";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** Shared tooltip card used by both histogram + pie. */
function FactorTooltipCard({
  name,
  signed,
  pctOfAbs,
  rank,
  total,
}: {
  name: string;
  signed: number;
  pctOfAbs: number;
  rank: number;
  total: number;
}) {
  const isNeg = signed < 0;
  return (
    <div className="rounded-md border border-border/80 bg-popover/95 shadow-lg px-2.5 py-2 backdrop-blur-sm min-w-[160px]">
      <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-border/60">
        <span className="text-[11px] font-semibold tracking-tight text-foreground truncate">{name}</span>
        <span className="text-[9px] font-mono tabular-nums text-muted-foreground shrink-0">
          #{rank} / {total}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-muted-foreground">P&amp;L</span>
        <span
          className="font-mono tabular-nums text-right font-semibold"
          style={{ color: isNeg ? "var(--pnl-negative)" : "var(--pnl-positive)" }}
        >
          {formatSignedCompact(signed)}
        </span>
        <span className="text-muted-foreground">% of |net|</span>
        <span className="font-mono tabular-nums text-right text-foreground/90">{pctOfAbs.toFixed(2)}%</span>
      </div>
    </div>
  );
}

/** Sort factors by magnitude descending, tagging rank. */
function rankByMagnitude(components: PnLComponent[]): Array<PnLComponent & { rank: number; abs: number }> {
  return [...components]
    .map((c) => ({ ...c, abs: Math.abs(c.value) }))
    .sort((a, b) => b.abs - a.abs)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Factor Attribution — Histogram (diverging vertical bars) view
// ---------------------------------------------------------------------------

function FactorHistogram({ components, selectedFactor, onSelect }: FactorSubviewProps) {
  const ranked = React.useMemo(() => rankByMagnitude(components), [components]);
  const total = components.length;
  const totalAbs = React.useMemo(() => ranked.reduce((s, c) => s + c.abs, 0) || 1, [ranked]);
  const maxAbs = React.useMemo(() => Math.max(...ranked.map((c) => c.abs), 1), [ranked]);
  const hasSelection = selectedFactor !== null;

  // Rotate labels when the name is long or density is high.
  const needsRotate = components.length > 6 || components.some((c) => c.name.length > 6);

  // Short axis labels — keep ≤ 7 chars, truncate longer with ellipsis.
  const formatXTick = React.useCallback((name: string) => (name.length <= 7 ? name : `${name.slice(0, 6)}\u2026`), []);

  return (
    <div className="w-full h-[280px] shrink-0" data-testid="factor-histogram">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={components}
          margin={{ top: 18, right: 10, bottom: needsRotate ? 54 : 22, left: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.6 }}
            tickLine={false}
            interval={0}
            angle={needsRotate ? -32 : 0}
            textAnchor={needsRotate ? "end" : "middle"}
            height={needsRotate ? 54 : 22}
            tickFormatter={formatXTick}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
            tickFormatter={(v: number) => formatAxisCompact(v)}
            width={56}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} strokeOpacity={0.9} ifOverflow="extendDomain" />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.35, strokeDasharray: "2 3", strokeWidth: 1 }}
            wrapperStyle={{ outline: "none" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0]?.payload as PnLComponent | undefined;
              if (!row) return null;
              const rankEntry = ranked.find((r) => r.name === row.name);
              const rank = rankEntry?.rank ?? 0;
              const pctOfAbs = (Math.abs(row.value) / totalAbs) * 100;
              return (
                <FactorTooltipCard name={row.name} signed={row.value} pctOfAbs={pctOfAbs} rank={rank} total={total} />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[2, 2, 0, 0]}
            isAnimationActive
            animationDuration={320}
            animationEasing="ease-out"
            onClick={(datum: unknown) => {
              const d = datum as { name?: string } | undefined;
              if (d?.name) onSelect(d.name);
            }}
            cursor="pointer"
          >
            {components.map((c) => {
              const isSelected = selectedFactor === c.name;
              const baseOpacity = hasSelection ? (isSelected ? 0.95 : 0.28) : 0.72;
              return (
                <Cell
                  key={c.name}
                  fill={c.isNegative ? NEG_FILL : POS_FILL}
                  fillOpacity={baseOpacity}
                  stroke={isSelected ? "var(--primary)" : "transparent"}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
            <LabelList
              dataKey="value"
              content={(props: unknown) => {
                const p = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  value?: number;
                  index?: number;
                };
                const { x = 0, y = 0, width = 0, value = 0, index } = p;
                if (!width || Math.abs(width) < 8) return null;
                // Hide labels on bars whose magnitude is less than 10% of the
                // max bar — prevents overlap/collision near the zero line.
                const absVal = Math.abs(value);
                if (absVal < maxAbs * 0.1) return null;
                // Also hide if the corresponding bar is currently faded (selection dim)
                if (hasSelection && typeof index === "number") {
                  const cName = components[index]?.name;
                  if (cName && cName !== selectedFactor) return null;
                }
                const isNeg = value < 0;
                const h = p.height ?? 0;
                const labelY = isNeg ? y + h + 11 : y - 5;
                return (
                  <text
                    x={x + width / 2}
                    y={labelY}
                    fill="var(--foreground)"
                    fillOpacity={0.72}
                    fontSize={9.5}
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}
                  >
                    {formatSignedCompact(value)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factor Attribution — Donut / Pie view with hero KPI center
// ---------------------------------------------------------------------------

interface PieDatum {
  name: string;
  value: number; // absolute magnitude (dataKey)
  signed: number;
  isNegative: boolean;
  rank: number;
  pctOfAbs: number;
}

/** Active shape: emphasis on hover/selection — outer radius bump + stroke. */
function renderActiveSector(props: unknown) {
  const p = props as {
    cx?: number;
    cy?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    fill?: string;
  };
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = p;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={(outerRadius ?? 0) + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--primary)"
      strokeWidth={1.5}
      fillOpacity={0.95}
    />
  );
}

function FactorPie({ components, selectedFactor, onSelect }: FactorSubviewProps) {
  const totalAbs = React.useMemo(() => components.reduce((s, c) => s + Math.abs(c.value), 0) || 1, [components]);
  const netSigned = React.useMemo(() => components.reduce((s, c) => s + c.value, 0), [components]);
  const posCount = components.filter((c) => !c.isNegative).length;
  const negCount = components.filter((c) => c.isNegative).length;

  // Slice order (starting 12 o'clock, clockwise):
  //   positives by magnitude desc, then negatives by magnitude desc.
  // This visually separates contribution (green arc) from drag (red arc).
  // Legend ranks globally (by |value|) for decision-making — not by slice order.
  const data: PieDatum[] = React.useMemo(() => {
    const enriched = components.map((c) => ({
      name: c.name,
      value: Math.abs(c.value),
      signed: c.value,
      isNegative: !!c.isNegative,
      pctOfAbs: (Math.abs(c.value) / totalAbs) * 100,
    }));
    // Rank globally by absolute magnitude for the data table
    const rankMap = new Map([...enriched].sort((a, b) => b.value - a.value).map((d, i) => [d.name, i + 1] as const));
    const positives = enriched.filter((d) => !d.isNegative).sort((a, b) => b.value - a.value);
    const negatives = enriched.filter((d) => d.isNegative).sort((a, b) => b.value - a.value);
    return [...positives, ...negatives].map((d) => ({ ...d, rank: rankMap.get(d.name) ?? 0 }));
  }, [components, totalAbs]);

  // Data ordered by rank for legend table (top factors first regardless of sign).
  const rankedForLegend = React.useMemo(() => [...data].sort((a, b) => a.rank - b.rank), [data]);

  const [hoverName, setHoverName] = React.useState<string | null>(null);
  const [showAllLegend, setShowAllLegend] = React.useState(false);

  const emphasisName = hoverName ?? selectedFactor ?? null;
  const hasEmphasis = emphasisName !== null;
  const activeIndex = hasEmphasis ? data.findIndex((d) => d.name === emphasisName) : -1;

  const visibleLegend = showAllLegend ? rankedForLegend : rankedForLegend.slice(0, 8);

  return (
    <div className="w-full h-[280px] shrink-0 flex gap-3" data-testid="factor-pie">
      {/* ── Chart + hero KPI center ─────────────────────────────────── */}
      <div className="relative flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0]?.payload as PieDatum | undefined;
                if (!row) return null;
                return (
                  <FactorTooltipCard
                    name={row.name}
                    signed={row.signed}
                    pctOfAbs={row.pctOfAbs}
                    rank={row.rank}
                    total={data.length}
                  />
                );
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={1.2}
              startAngle={90}
              endAngle={-270}
              stroke="var(--background)"
              strokeWidth={1}
              isAnimationActive
              animationDuration={360}
              animationEasing="ease-out"
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeShape={renderActiveSector}
              onMouseEnter={(datum: unknown) => {
                const d = datum as { name?: string } | undefined;
                if (d?.name) setHoverName(d.name);
              }}
              onMouseLeave={() => setHoverName(null)}
              onClick={(datum: unknown) => {
                const d = datum as { name?: string } | undefined;
                if (d?.name) onSelect(d.name);
              }}
              cursor="pointer"
            >
              {data.map((d, i) => {
                const isEmphasized = emphasisName === d.name;
                const dim = hasEmphasis && !isEmphasized;
                // Subtle alternation within the same-sign run — just enough
                // to keep adjacent slices readable at small sizes. Softer than
                // v2 so the donut reads as a unified arc, not a striped lollipop.
                const alt = i % 2 === 0;
                const baseOpacity = alt ? 0.82 : 0.66;
                return (
                  <Cell
                    key={d.name}
                    fill={d.isNegative ? NEG_FILL : POS_FILL}
                    fillOpacity={dim ? 0.26 : baseOpacity}
                    stroke="var(--background)"
                    strokeWidth={1.25}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Hero KPI — centered over donut */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          aria-hidden
        >
          <span className="text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/70 font-medium">
            Net attribution
          </span>
          <span
            className="font-mono tabular-nums text-[18px] leading-none font-semibold mt-1.5 whitespace-nowrap"
            style={{
              color: netSigned < 0 ? "var(--pnl-negative)" : "var(--pnl-positive)",
              letterSpacing: "-0.015em",
            }}
          >
            {formatSignedCompact(netSigned)}
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono tabular-nums text-muted-foreground/80">
            <span>{data.length} factors</span>
            <span className="h-2 w-px bg-border/70" />
            <span className="inline-flex items-center gap-0.5">
              <span className="h-2 w-[2px] rounded-[1px] bg-[var(--pnl-positive)]/85" />
              <span className="text-[var(--pnl-positive)]/90">{posCount}</span>
            </span>
            <span className="inline-flex items-center gap-0.5">
              <span className="h-2 w-[2px] rounded-[1px] bg-[var(--pnl-negative)]/85" />
              <span className="text-[var(--pnl-negative)]/90">{negCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Compact legend/data table on right ─────────────────────── */}
      <div className="w-[44%] min-w-[180px] max-w-[260px] shrink-0 overflow-auto pr-0.5">
        <div className="grid grid-cols-[8px_1fr_auto_auto] items-center gap-x-2 text-[9px] uppercase tracking-[0.08em] text-muted-foreground/60 border-b border-border/60 pb-1 mb-1 sticky top-0 bg-background/95 backdrop-blur-sm">
          <span />
          <span>Factor</span>
          <span className="text-right">Value</span>
          <span className="text-right w-[38px]">%</span>
        </div>
        <div className="space-y-[1px]">
          {visibleLegend.map((d) => {
            const isSelected = selectedFactor === d.name;
            const isHovered = hoverName === d.name;
            const emphasized = isSelected || isHovered;
            const dim = hasEmphasis && !emphasized;
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => onSelect(d.name)}
                onMouseEnter={() => setHoverName(d.name)}
                onMouseLeave={() => setHoverName(null)}
                className={`w-full grid grid-cols-[8px_1fr_auto_auto] items-center gap-x-2 rounded-[3px] px-1.5 py-[3px] text-left transition-colors duration-150 ${
                  isSelected ? "bg-primary/12 ring-1 ring-primary/25" : isHovered ? "bg-muted/60" : "hover:bg-muted/40"
                } ${dim ? "opacity-55" : "opacity-100"}`}
              >
                <span
                  className="h-3 w-[3px] rounded-[1px]"
                  style={{
                    backgroundColor: d.isNegative ? NEG_FILL : POS_FILL,
                    opacity: 0.9,
                  }}
                />
                <span
                  className={`truncate text-[11px] ${isSelected ? "text-primary font-medium" : "text-foreground/90"}`}
                  title={`${d.name} · rank #${d.rank}`}
                >
                  {d.name}
                </span>
                <span
                  className="text-[10.5px] font-mono tabular-nums text-right whitespace-nowrap"
                  style={{ color: d.isNegative ? "var(--pnl-negative)" : "var(--pnl-positive)" }}
                >
                  {formatSignedCompact(d.signed)}
                </span>
                <span className="text-[10.5px] font-mono tabular-nums text-right text-muted-foreground w-[38px]">
                  {d.pctOfAbs.toFixed(1)}%
                </span>
              </button>
            );
          })}
          {data.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllLegend((v) => !v)}
              className="w-full text-[10px] text-muted-foreground/80 hover:text-foreground transition-colors pt-1.5 text-left pl-3.5"
            >
              {showAllLegend ? "\u2212 Show top 8" : `+ Show all ${data.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
