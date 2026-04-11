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

// ---------- TradFi Vol Surface ----------

export function TradFiVolSurfacePanel({ tradFiAsset }: { tradFiAsset: TradFiAsset }) {
  const spot = TRADFI_SPOT_PRICES[tradFiAsset];
  const baseIv = TRADFI_IV_INDEX[tradFiAsset];

  // Generate a simple skew-aware vol surface for display
  const expiryLabels = ["1M", "2M", "3M", "6M", "9M", "12M", "18M", "24M"];
  const strikes = [-20, -15, -10, -5, 0, 5, 10, 15, 20]; // % from spot

  const volSurface = strikes.map((k) =>
    expiryLabels.map((_e, ti) => {
      const tenor = (ti + 1) * 0.083;
      // Equity put skew — left tail has higher vol
      const putSkew = k < 0 ? Math.abs(k) * 0.8 : k * 0.3;
      const termStructure = baseIv - ti * 0.3; // term structure: short end elevated
      return Math.max(5, termStructure + putSkew + seededRandom(k + ti * 7) * 1.5);
    }),
  );

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors text-sm font-medium">
        <span className="flex items-center gap-2">
          <BarChart3 className="size-4 text-blue-400" />
          {tradFiAsset} Vol Surface (Put Skew)
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-md border overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-muted/20">
                <th className="text-right pr-2 py-1 text-muted-foreground w-16">Strike</th>
                {expiryLabels.map((e) => (
                  <th key={e} className="text-center px-2 py-1 text-muted-foreground">
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strikes.map((k, ki) => (
                <tr key={k} className={cn("border-t", k === 0 && "bg-primary/5")}>
                  <td className="text-right pr-2 py-0.5 font-mono text-muted-foreground">
                    {k > 0 ? "+" : ""}
                    {k}%
                  </td>
                  {expiryLabels.map((_e, ti) => {
                    const iv = volSurface[ki][ti];
                    const atm = volSurface[4][ti];
                    const diff = iv - atm;
                    const bg =
                      diff > 5
                        ? "bg-amber-900/50 text-amber-200"
                        : diff > 2
                          ? "bg-amber-900/30 text-amber-300"
                          : diff < -2
                            ? "bg-blue-900/30 text-blue-300"
                            : "text-foreground";
                    return (
                      <td key={ti} className={cn("text-center px-2 py-0.5 font-mono rounded-sm", bg)}>
                        {formatNumber(iv, 1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
            IV (%). Spot: ${formatNumber(spot, 2)} · Base IV: {formatPercent(baseIv, 1)} · Yellow = vol premium above
            ATM
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
