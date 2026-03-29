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

export function VolSurfacePanel({ asset }: { asset: Asset }) {
  const [open, setOpen] = React.useState(false);
  const surface = React.useMemo(() => generateVolSurface(asset), [asset]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-9 px-3 text-xs">
          <span className="flex items-center gap-1.5">
            <Grid3X3 className="size-3.5" />
            Vol Surface / Term Structure
          </span>
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border rounded-lg mt-1">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-1 px-2 text-left text-muted-foreground font-normal">Strike</th>
                  {surface.expiries.map((exp) => (
                    <th key={exp} className="py-1 px-2 text-center text-muted-foreground font-normal">
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surface.strikes.map((strike, sIdx) => (
                  <tr key={strike}>
                    <td className="py-1 px-2 font-mono font-medium">{strike.toLocaleString()}</td>
                    {surface.ivs[sIdx].map((iv, eIdx) => (
                      <td
                        key={eIdx}
                        className="py-1 px-2 text-center font-mono"
                        style={{
                          backgroundColor: ivToColor(iv),
                          color: iv > 65 ? "#fff" : "#1a1a2e",
                        }}
                      >
                        {formatPercent(iv, 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: ivToColor(42) }} />
              Low IV
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: ivToColor(60) }} />
              Mid IV
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: ivToColor(78) }} />
              High IV
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GreeksSurfacePanel({ asset }: { asset: Asset }) {
  const [open, setOpen] = React.useState(false);
  const [selectedGreek, setSelectedGreek] = React.useState<GreekSurface>("delta");
  const surface = React.useMemo(() => generateVolSurface(asset), [asset]);

  // Generate greek values from IV surface
  const greekValues = React.useMemo(() => {
    const spot = SPOT_PRICES[asset];
    return surface.strikes.map((strike, sIdx) => {
      const moneyness = (strike - spot) / spot;
      return surface.expiries.map((_, eIdx) => {
        const iv = surface.ivs[sIdx][eIdx];
        const t = (eIdx + 1) * 0.08; // rough time to expiry
        const sqrtT = Math.sqrt(t);
        const d1 = -moneyness / ((iv / 100) * sqrtT);
        const normCdf = 0.5 + 0.4 * Math.tanh(d1);

        switch (selectedGreek) {
          case "delta":
            return normCdf;
          case "gamma":
            return (0.01 / ((iv / 100) * sqrtT * spot)) * Math.exp((-d1 * d1) / 2);
          case "vega":
            return spot * sqrtT * Math.exp((-d1 * d1) / 2) * 0.01;
          case "theta":
            return -(spot * (iv / 100) * Math.exp((-d1 * d1) / 2)) / (2 * sqrtT) / 365;
        }
      });
    });
  }, [asset, surface, selectedGreek]);

  const formatGreek = (val: number): string => {
    switch (selectedGreek) {
      case "delta":
        return formatNumber(val, 2);
      case "gamma":
        return formatNumber(val, 5);
      case "vega":
        return formatNumber(val, 2);
      case "theta":
        return formatNumber(val, 2);
    }
  };

  const greekColor = (val: number): string => {
    switch (selectedGreek) {
      case "delta": {
        const ratio = Math.max(0, Math.min(1, val));
        const r = Math.round(50 + (1 - ratio) * 200);
        const g = Math.round(100 + ratio * 150);
        const b = Math.round(80 + ratio * 100);
        return `rgb(${r}, ${g}, ${b})`;
      }
      case "gamma":
      case "vega": {
        const maxVal = selectedGreek === "gamma" ? 0.0005 : 50;
        const ratio = Math.max(0, Math.min(1, Math.abs(val) / maxVal));
        const r = Math.round(50 + ratio * 180);
        const g = Math.round(120 + (1 - ratio) * 80);
        const b = Math.round(200 - ratio * 120);
        return `rgb(${r}, ${g}, ${b})`;
      }
      case "theta": {
        const ratio = Math.max(0, Math.min(1, Math.abs(val) / 50));
        const r = Math.round(200 + ratio * 55);
        const g = Math.round(150 - ratio * 100);
        const b = Math.round(80 - ratio * 40);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-9 px-3 text-xs">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            Greeks Surface
          </span>
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border rounded-lg mt-1 space-y-2">
          <Select value={selectedGreek} onValueChange={(v) => setSelectedGreek(v as GreekSurface)}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delta">Delta</SelectItem>
              <SelectItem value="gamma">Gamma</SelectItem>
              <SelectItem value="vega">Vega</SelectItem>
              <SelectItem value="theta">Theta</SelectItem>
            </SelectContent>
          </Select>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-1 px-2 text-left text-muted-foreground font-normal">Strike</th>
                  {surface.expiries.map((exp) => (
                    <th key={exp} className="py-1 px-2 text-center text-muted-foreground font-normal">
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surface.strikes.map((strike, sIdx) => (
                  <tr key={strike}>
                    <td className="py-1 px-2 font-mono font-medium">{strike.toLocaleString()}</td>
                    {greekValues[sIdx].map((val, eIdx) => (
                      <td
                        key={eIdx}
                        className="py-1 px-2 text-center font-mono"
                        style={{
                          backgroundColor: greekColor(val),
                          color: "#fff",
                        }}
                      >
                        {formatGreek(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
