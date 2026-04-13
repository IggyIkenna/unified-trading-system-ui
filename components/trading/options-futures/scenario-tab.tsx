"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Star,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  BarChart3,
  Grid3X3,
  Activity,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  Pencil,
  Check,
} from "lucide-react";
import { WatchlistPanel, type WatchlistSymbol } from "@/components/trading/watchlist-panel";
import type {
  AssetClass,
  Asset,
  TradFiAsset,
  Settlement,
  Market,
  TradFiMarket,
  MainTab,
  TradeDirection,
  OrderType,
  GreekSurface,
  StrategiesMode,
  ComboType,
  ComboLeg,
  OptionRow,
  FutureRow,
  SpreadCell,
  SelectedInstrument,
  SpreadAsset,
} from "@/lib/types/options";
import {
  ASSETS,
  TRADFI_ASSETS,
  SPOT_PRICES,
  TRADFI_SPOT_PRICES,
  IV_INDEX,
  TRADFI_IV_INDEX,
  EXPIRY_DATES,
  TRADFI_EXPIRY_DATES,
  EXPIRIES_WITH_POSITIONS,
  STRIKE_INCREMENTS,
  TRADFI_STRIKE_INCREMENTS,
  SCENARIO_PRESETS,
  DEFAULT_WATCHLISTS,
  seededRandom,
  generateStrikes,
  generateOptionChain,
  generateFuturesData,
  generateSpreadMatrix,
  SPREAD_EXPIRIES,
  generateTradFiOptionChain,
  generateScenarioGrid,
  formatUsd,
  formatCompact,
  generateVolSurface,
  ivToColor,
  SPOT_STEPS,
  VOL_STEPS,
} from "@/lib/mocks/fixtures/options-futures-mock";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------- Scenario Analysis Tab ----------

function pnlColor(pnl: number, liq: number): string {
  if (pnl <= liq) return "bg-red-800 text-white font-bold";
  if (pnl < 0) {
    const ratio = pnl / liq;
    if (ratio > 0.7) return "bg-red-900/80 text-red-200";
    if (ratio > 0.4) return "bg-red-900/50 text-red-300";
    return "bg-red-900/30 text-red-400";
  }
  if (pnl < liq * -0.1) return "bg-emerald-900/20 text-emerald-400";
  if (pnl < liq * -0.3) return "bg-emerald-900/40 text-emerald-300";
  return "bg-emerald-900/60 text-emerald-200 font-semibold";
}

export function ScenarioTab({
  assetClass,
  asset,
  tradFiAsset,
}: {
  assetClass: AssetClass;
  asset: Asset;
  tradFiAsset: TradFiAsset;
}) {
  const isCrypto = assetClass === "crypto";
  const spotPrice = isCrypto ? SPOT_PRICES[asset] : TRADFI_SPOT_PRICES[tradFiAsset];
  const baseIv = isCrypto ? IV_INDEX[asset] : TRADFI_IV_INDEX[tradFiAsset];
  const label = isCrypto ? asset : `$${tradFiAsset}`;
  const notional = isCrypto ? 1_000_000 : 500_000;

  const [activePreset, setActivePreset] = React.useState(0);
  const [customSpot, setCustomSpot] = React.useState(0);
  const [customVol, setCustomVol] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"pnl" | "delta">("pnl");

  const { pnl, delta, liqThreshold } = React.useMemo(
    () => generateScenarioGrid(spotPrice, baseIv, SPOT_STEPS, VOL_STEPS, notional),
    [spotPrice, baseIv, notional],
  );

  const matrix = viewMode === "pnl" ? pnl : delta;

  // Single-point scenario from slider / preset
  const presetSpot = activePreset === -1 ? customSpot : SCENARIO_PRESETS[activePreset].spotPct;
  const presetVol = activePreset === -1 ? customVol : SCENARIO_PRESETS[activePreset].volPct;

  const scenarioPnl = React.useMemo(() => {
    const dS = spotPrice * (presetSpot / 100);
    const dVol = presetVol / 100;
    const gamma = notional * 0.00002;
    const theta = notional * 0.0003;
    const vega = notional * 0.008;
    const baseDelta = notional * 0.3;
    return baseDelta * dS + 0.5 * gamma * dS * dS - theta * (1 / 252) * 365 + vega * dVol;
  }, [spotPrice, presetSpot, presetVol, notional]);

  const scenarioSpot = spotPrice * (1 + presetSpot / 100);
  const scenarioIv = baseIv + presetVol;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-amber-400" />
            Scenario Analysis — {label}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Deribit-style P&amp;L and Greeks across spot × vol shock grid. Notional: {formatUsd(notional, 0)}.
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          <Button
            variant={viewMode === "pnl" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("pnl")}
          >
            P&amp;L
          </Button>
          <Button
            variant={viewMode === "delta" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("delta")}
          >
            Delta
          </Button>
        </div>
      </div>

      {/* Preset + single-scenario card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Preset selector */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Scenario Presets</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {SCENARIO_PRESETS.map((p, idx) => (
                <Button
                  key={p.label}
                  variant={activePreset === idx ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActivePreset(idx)}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                variant={activePreset === -1 ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActivePreset(-1)}
              >
                Custom
              </Button>
            </div>
            {activePreset === -1 && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground">
                    Spot shock: {customSpot > 0 ? "+" : ""}
                    {customSpot}%
                  </label>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={customSpot}
                    onChange={(e) => setCustomSpot(Number(e.target.value))}
                    className="w-full h-1.5 accent-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground">
                    Vol shock: {customVol > 0 ? "+" : ""}
                    {customVol} pp
                  </label>
                  <input
                    type="range"
                    min={-40}
                    max={60}
                    step={1}
                    value={customVol}
                    onChange={(e) => setCustomVol(Number(e.target.value))}
                    className="w-full h-1.5 accent-primary"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single-scenario result */}
        <Card className={cn("border", scenarioPnl < 0 ? "border-red-900/40" : "border-emerald-900/40")}>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Scenario Result</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Spot →</span>
              <span className="font-mono">
                {isCrypto ? formatUsd(scenarioSpot) : `$${formatNumber(scenarioSpot, 2)}`}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">IV →</span>
              <span className="font-mono">{formatPercent(scenarioIv, 1)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>P&amp;L</span>
              <span className={cn("font-mono", scenarioPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                {scenarioPnl >= 0 ? "+" : ""}
                {formatUsd(scenarioPnl, 0)}
              </span>
            </div>
            {scenarioPnl <= liqThreshold && (
              <div className="rounded bg-red-900/60 px-2 py-1 text-[11px] text-red-200 font-medium text-center">
                ⚠ Near liquidation threshold
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full P&L / Delta matrix */}
      <Card>
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            {viewMode === "pnl" ? "P&L Matrix" : "Delta Matrix"}
            <span className="ml-1 text-[10px] normal-case">rows = spot shock %, cols = vol shock pp</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="text-right pr-2 py-1 font-medium text-muted-foreground w-14">Spot ↓ / Vol →</th>
                {VOL_STEPS.map((v) => (
                  <th key={v} className="text-center px-2 py-1 font-medium text-muted-foreground whitespace-nowrap">
                    {v > 0 ? "+" : ""}
                    {v} pp
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPOT_STEPS.map((s, si) => (
                <tr key={s} className={s === 0 ? "ring-1 ring-inset ring-white/10" : ""}>
                  <td className="text-right pr-2 py-0.5 font-medium text-muted-foreground whitespace-nowrap">
                    {s > 0 ? "+" : ""}
                    {s}%
                  </td>
                  {VOL_STEPS.map((_v, vi) => {
                    const val = matrix[si][vi];
                    const cellClass =
                      viewMode === "pnl"
                        ? pnlColor(val, liqThreshold)
                        : val > 0
                          ? "bg-emerald-900/30 text-emerald-300"
                          : "bg-red-900/30 text-red-400";
                    return (
                      <td key={vi} className={cn("text-center px-2 py-0.5 font-mono rounded-sm", cellClass)}>
                        {viewMode === "pnl"
                          ? `${val >= 0 ? "+" : ""}${formatNumber(val / 1000, 1)}k`
                          : formatNumber(val, 0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-muted-foreground">
            P&amp;L values in USD (k). Red cells = loss; darker red = near/at liq threshold (
            {formatUsd(liqThreshold, 0)}).
          </p>
        </CardContent>
      </Card>

      {/* Key risk metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Max Gain",
            value: `+${formatUsd(Math.max(...pnl.flat()), 0)}`,
            color: "text-emerald-400",
          },
          {
            label: "Max Loss",
            value: formatUsd(Math.min(...pnl.flat()), 0),
            color: "text-red-400",
          },
          {
            label: "Break-even Spot",
            value: `±${formatPercent(Math.abs(liqThreshold) / (notional * 0.003), 1)}`,
            color: "text-foreground",
          },
          {
            label: "Liq Threshold",
            value: formatUsd(liqThreshold, 0),
            color: "text-red-500",
          },
        ].map((m) => (
          <Card key={m.label} className="bg-muted/20">
            <CardContent className="px-3 py-2 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className={cn("text-sm font-mono font-semibold", m.color)}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
