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

export function FuturesTab({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [filter, setFilter] = React.useState("all");
  const [assetFilter, setAssetFilter] = React.useState<"all" | Asset>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [favourites, setFavourites] = React.useState<Set<string>>(new Set());

  const allFutures = React.useMemo(() => {
    const rows: FutureRow[] = [];
    const assets = assetFilter === "all" ? ASSETS : [assetFilter];
    for (const a of assets) {
      rows.push(...generateFuturesData(a));
    }
    return rows;
  }, [assetFilter]);

  const filteredFutures = allFutures.filter((f) => {
    if (filter === "perpetuals" && !f.isPerpetual) return false;
    if (filter !== "all" && filter !== "perpetuals" && !f.contract.includes(filter.replace(/ /g, ""))) return false;
    if (searchQuery && !f.contract.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleFavourite = (contract: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(contract)) next.delete(contract);
      else next.add(contract);
      return next;
    });
  };

  const handleRowClick = (row: FutureRow) => {
    onSelectInstrument({
      name: row.contract,
      type: "future",
      price: row.markPrice,
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1">
            {["all", "perpetuals", ...EXPIRY_DATES.slice(1, 6)].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-[10px] font-mono whitespace-nowrap shrink-0"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "perpetuals" ? "Perpetuals" : f}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Asset filter + search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          <Button
            variant={assetFilter === "all" ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setAssetFilter("all")}
          >
            All
          </Button>
          {ASSETS.map((a) => (
            <Button
              key={a}
              variant={assetFilter === a ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[10px] font-mono"
              onClick={() => setAssetFilter(a)}
            >
              {a}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-40 text-xs"
          />
        </div>
      </div>

      {/* Futures table */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-1.5 px-1.5 text-center w-8 font-normal" />
                <th className="py-1.5 px-2 text-left font-normal">Contract</th>
                <th className="py-1.5 px-2 text-left font-normal">Settlement</th>
                <th className="py-1.5 px-2 text-right font-normal">Mark Price</th>
                <th className="py-1.5 px-2 text-right font-normal">24h %</th>
                <th className="py-1.5 px-2 text-right font-normal">24h Volume</th>
                <th className="py-1.5 px-2 text-right font-normal">Open Interest</th>
                <th className="py-1.5 px-2 text-right font-normal">Funding</th>
                <th className="py-1.5 px-2 text-right font-normal">Basis%</th>
              </tr>
            </thead>
            <tbody>
              {filteredFutures.map((row) => (
                <tr
                  key={row.contract}
                  className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  <td className="py-1.5 px-1.5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(row.contract);
                      }}
                    >
                      <Star
                        className={cn(
                          "size-3",
                          favourites.has(row.contract) ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                        )}
                      />
                    </Button>
                  </td>
                  <td className="py-1.5 px-2 font-mono font-medium">
                    {row.contract}
                    {row.isPerpetual && (
                      <Badge variant="outline" className="ml-1.5 text-[8px] px-1 py-0 h-3.5">
                        PERP
                      </Badge>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-muted-foreground">{row.settlement}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{formatUsd(row.markPrice)}</td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono font-medium",
                      row.change24h >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {row.change24h >= 0 ? "+" : ""}
                    {row.change24h.toFixed(2)}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{formatUsd(row.volume24h)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                    {formatUsd(row.openInterest)}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono",
                      row.fundingRate !== null
                        ? row.fundingRate >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.fundingRate !== null
                      ? `${row.fundingRate >= 0 ? "+" : ""}${(row.fundingRate * 100).toFixed(4)}%`
                      : "--"}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono",
                      row.basis !== null ? "text-blue-400" : "text-muted-foreground",
                    )}
                  >
                    {row.basis !== null ? `${row.basis.toFixed(2)}%` : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
