"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
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

// ---------- TradFi Options Chain ----------

export function TradFiOptionsChainTab({
  tradFiAsset,
  onSelectInstrument,
}: {
  tradFiAsset: TradFiAsset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [selectedExpiry, setSelectedExpiry] = React.useState("18 APR 26");
  const [aroundAtm, setAroundAtm] = React.useState(false);
  const [displayUsd, setDisplayUsd] = React.useState(true);

  const spot = TRADFI_SPOT_PRICES[tradFiAsset];
  const chain = React.useMemo(
    () => generateTradFiOptionChain(tradFiAsset, selectedExpiry),
    [tradFiAsset, selectedExpiry],
  );

  const filteredChain = aroundAtm ? chain.filter((row) => Math.abs(row.strike - spot) / spot < 0.1) : chain;

  const atmStrike = chain.reduce(
    (closest, row) => (Math.abs(row.strike - spot) < Math.abs(closest.strike - spot) ? row : closest),
    chain[0],
  );

  const expectedMoveExpiry = spot * (TRADFI_IV_INDEX[tradFiAsset] / 100) * Math.sqrt(0.25);

  // First 5 expiries inline, rest in overflow dropdown
  const TF_INLINE = 5;
  const tfInlineExpiries = TRADFI_EXPIRY_DATES.filter((e) => e !== "ALL").slice(0, TF_INLINE);
  const tfOverflowExpiries = TRADFI_EXPIRY_DATES.filter((e) => e !== "ALL").slice(TF_INLINE);
  const tfSelectedIsOverflow = (tfOverflowExpiries as readonly string[]).includes(selectedExpiry);

  return (
    <div className="space-y-0">
      {/* ── Top controls row ── */}
      <div className="flex items-center gap-2 px-1 pb-2 flex-wrap">
        {/* Inline expiry pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {tfInlineExpiries.map((exp) => (
            <Button
              key={exp}
              variant={selectedExpiry === exp ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-[10px] font-mono whitespace-nowrap shrink-0"
              onClick={() => setSelectedExpiry(exp)}
            >
              {exp}
            </Button>
          ))}

          {tfOverflowExpiries.length > 0 && (
            <Select value={tfSelectedIsOverflow ? selectedExpiry : ""} onValueChange={(v) => setSelectedExpiry(v)}>
              <SelectTrigger
                className={cn(
                  "h-7 w-[110px] text-[10px] font-mono shrink-0",
                  tfSelectedIsOverflow && "border-primary bg-primary text-primary-foreground",
                )}
              >
                <SelectValue placeholder="More…" />
              </SelectTrigger>
              <SelectContent>
                {tfOverflowExpiries.map((exp) => (
                  <SelectItem key={exp} value={exp} className="text-[11px] font-mono">
                    {exp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        {/* Expected move display */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <span>Exp. move:</span>
          <span className="font-mono font-medium text-foreground">
            ±{formatCurrency(expectedMoveExpiry, "USD", 2)} (±
            {formatPercent((expectedMoveExpiry / spot) * 100, 1)})
          </span>
        </div>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        {/* Around ATM */}
        <div className="flex items-center gap-1.5">
          <Checkbox id="tf-around-atm" checked={aroundAtm} onCheckedChange={(c) => setAroundAtm(c === true)} />
          <label htmlFor="tf-around-atm" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            ±ATM
          </label>
        </div>

        {/* USD / $ toggle */}
        <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30">
          <Button
            variant={displayUsd ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setDisplayUsd(true)}
          >
            USD
          </Button>
          <Button
            variant={!displayUsd ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setDisplayUsd(false)}
          >
            Pts
          </Button>
        </div>

        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0">
          <Download className="size-3" />
          CSV
        </Button>
      </div>

      {/* Chain table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30">
              <th colSpan={5} className="text-center py-1 text-[10px] font-semibold text-emerald-400 border-r">
                CALLS
              </th>
              <th className="text-center py-1 font-bold text-muted-foreground px-3">STRIKE</th>
              <th colSpan={5} className="text-center py-1 text-[10px] font-semibold text-red-400 border-l">
                PUTS
              </th>
            </tr>
            <tr className="bg-muted/10 text-[10px] text-muted-foreground">
              <th className="text-right pr-1 py-1">Bid</th>
              <th className="text-right pr-1 py-1">Ask</th>
              <th className="text-right pr-1 py-1">IV%</th>
              <th className="text-right pr-1 py-1">Δ</th>
              <th className="text-right pr-2 py-1 border-r">OI</th>
              <th className="text-center px-3 py-1 font-bold text-foreground">Strike</th>
              <th className="text-right pr-1 py-1 border-l">OI</th>
              <th className="text-right pr-1 py-1">Δ</th>
              <th className="text-right pr-1 py-1">IV%</th>
              <th className="text-right pr-1 py-1">Bid</th>
              <th className="text-right pr-1 py-1">Ask</th>
            </tr>
          </thead>
          <tbody>
            {filteredChain.map((row) => {
              const isAtm = row.strike === atmStrike.strike;
              return (
                <tr
                  key={row.strike}
                  className={cn(
                    "border-t hover:bg-muted/10 cursor-pointer",
                    isAtm && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  )}
                  onClick={() =>
                    onSelectInstrument({
                      type: "option",
                      name: `${tradFiAsset} ${selectedExpiry} ${row.strike}C`,
                      strike: row.strike,
                      expiry: selectedExpiry,
                      putCall: "C",
                      price: row.callMark,
                    })
                  }
                >
                  <td className="text-right pr-1 py-0.5 font-mono text-emerald-400">
                    {displayUsd ? formatCurrency(row.callBid, "USD", 2) : formatNumber(row.callBid, 2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">
                    {displayUsd ? formatCurrency(row.callAsk, "USD", 2) : formatNumber(row.callAsk, 2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-amber-400">{formatNumber(row.callIvAsk, 1)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-blue-400">{formatNumber(row.callDelta, 2)}</td>
                  <td className="text-right pr-2 py-0.5 text-muted-foreground border-r">
                    {formatNumber(row.callOi / 1000, 0)}k
                  </td>
                  <td
                    className={cn(
                      "text-center px-3 py-0.5 font-mono font-bold",
                      isAtm ? "text-primary" : "text-foreground",
                    )}
                  >
                    {row.strike}
                  </td>
                  <td className="text-right pr-1 py-0.5 text-muted-foreground border-l">
                    {formatNumber(row.putOi / 1000, 0)}k
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">{formatNumber(row.putDelta, 2)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-amber-400">{formatNumber(row.putIvAsk, 1)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-emerald-400">
                    {displayUsd ? formatCurrency(row.putBid, "USD", 2) : formatNumber(row.putBid, 2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">
                    {displayUsd ? formatCurrency(row.putAsk, "USD", 2) : formatNumber(row.putAsk, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
