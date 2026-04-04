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

export function OptionsToolbar({
  assetClass,
  setAssetClass,
  asset,
  setAsset,
  tradFiAsset,
  setTradFiAsset,
  pinnedCryptoAssets,
  setPinnedCryptoAssets,
  pinnedTradFiAssets,
  setPinnedTradFiAssets,
  settlement,
  setSettlement,
  market,
  setMarket,
  tradFiMarket,
  setTradFiMarket,
  activeTab,
  setActiveTab,
  showWatchlist,
  setShowWatchlist,
}: {
  assetClass: AssetClass;
  setAssetClass: (ac: AssetClass) => void;
  asset: Asset;
  setAsset: (a: Asset) => void;
  tradFiAsset: TradFiAsset;
  setTradFiAsset: (a: TradFiAsset) => void;
  pinnedCryptoAssets: Asset[];
  setPinnedCryptoAssets: (a: Asset[]) => void;
  pinnedTradFiAssets: TradFiAsset[];
  setPinnedTradFiAssets: (a: TradFiAsset[]) => void;
  settlement: Settlement;
  setSettlement: (s: Settlement) => void;
  market: Market;
  setMarket: (m: Market) => void;
  tradFiMarket: TradFiMarket;
  setTradFiMarket: (m: TradFiMarket) => void;
  activeTab: MainTab;
  setActiveTab: (t: MainTab) => void;
  showWatchlist: boolean;
  setShowWatchlist: (v: boolean) => void;
}) {
  const isCrypto = assetClass === "crypto";
  const [editingPins, setEditingPins] = React.useState(false);

  const TABS: {
    value: MainTab;
    label: string;
    icon: React.ReactNode;
    cryptoOnly?: boolean;
  }[] = [
    { value: "options", label: "Chain", icon: <Grid3X3 className="size-3" /> },
    {
      value: "futures",
      label: "Futures",
      icon: <TrendingUp className="size-3" />,
      cryptoOnly: true,
    },
    {
      value: "strategies",
      label: "Strategies",
      icon: <Activity className="size-3" />,
    },
    { value: "scenario", label: "Scenario", icon: <Zap className="size-3" /> },
  ];

  // All available symbols for adding
  const unpinnedCrypto = ASSETS.filter((a) => !pinnedCryptoAssets.includes(a));
  const unpinnedTradFi = TRADFI_ASSETS.filter((a) => !pinnedTradFiAssets.includes(a));

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/10 overflow-x-auto min-h-[42px]">
      {/* Watchlist toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => setShowWatchlist(!showWatchlist)}
        title={showWatchlist ? "Hide watchlist" : "Show watchlist"}
      >
        {showWatchlist ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
      </Button>

      <Separator orientation="vertical" className="h-5 shrink-0" />

      {/* Asset class */}
      <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30 shrink-0">
        <Button
          variant={isCrypto ? "default" : "ghost"}
          size="sm"
          className="h-6 px-2.5 text-xs font-medium"
          onClick={() => setAssetClass("crypto")}
        >
          Crypto
        </Button>
        <Button
          variant={!isCrypto ? "default" : "ghost"}
          size="sm"
          className="h-6 px-2.5 text-xs font-medium"
          onClick={() => setAssetClass("tradfi")}
        >
          TradFi
        </Button>
      </div>

      {/* Settlement (crypto only) */}
      {isCrypto && (
        <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30 shrink-0">
          <Button
            variant={settlement === "inverse" ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setSettlement("inverse")}
          >
            Inv
          </Button>
          <Button
            variant={settlement === "linear" ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setSettlement("linear")}
          >
            Lin
          </Button>
        </div>
      )}

      {/* Exchange */}
      {isCrypto ? (
        <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
          <SelectTrigger className="h-7 w-[100px] text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deribit">Deribit</SelectItem>
            <SelectItem value="okx">OKX</SelectItem>
            <SelectItem value="bybit">Bybit</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Select value={tradFiMarket} onValueChange={(v) => setTradFiMarket(v as TradFiMarket)}>
          <SelectTrigger className="h-7 w-[110px] text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cboe">CBOE</SelectItem>
            <SelectItem value="td">TD Ameritrade</SelectItem>
            <SelectItem value="ibkr">IBKR</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Separator orientation="vertical" className="h-5 shrink-0" />

      {/* Pinned asset pills — up to 5, configurable */}
      <div className="flex items-center gap-0.5 shrink-0">
        {isCrypto
          ? pinnedCryptoAssets.map((a) => (
              <div key={a} className="relative group">
                <Button
                  variant={asset === a ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs font-mono"
                  onClick={() => setAsset(a)}
                >
                  {a}
                </Button>
                {editingPins && pinnedCryptoAssets.length > 1 && (
                  <button
                    onClick={() => {
                      const next = pinnedCryptoAssets.filter((x) => x !== a);
                      setPinnedCryptoAssets(next);
                      if (asset === a) setAsset(next[0]);
                    }}
                    className="absolute -top-1 -right-1 z-10 rounded-full bg-destructive text-destructive-foreground size-3.5 flex items-center justify-center"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </div>
            ))
          : pinnedTradFiAssets.map((a) => (
              <div key={a} className="relative group">
                <Button
                  variant={tradFiAsset === a ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs font-mono"
                  onClick={() => setTradFiAsset(a)}
                >
                  {a}
                </Button>
                {editingPins && pinnedTradFiAssets.length > 1 && (
                  <button
                    onClick={() => {
                      const next = pinnedTradFiAssets.filter((x) => x !== a);
                      setPinnedTradFiAssets(next);
                      if (tradFiAsset === a) setTradFiAsset(next[0]);
                    }}
                    className="absolute -top-1 -right-1 z-10 rounded-full bg-destructive text-destructive-foreground size-3.5 flex items-center justify-center"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </div>
            ))}

        {/* Add pin — only when < 5 pinned and in edit mode */}
        {editingPins &&
          (isCrypto
            ? unpinnedCrypto.length > 0 &&
              pinnedCryptoAssets.length < 5 && (
                <Select onValueChange={(v) => setPinnedCryptoAssets([...pinnedCryptoAssets, v as Asset])}>
                  <SelectTrigger className="h-7 w-16 text-xs shrink-0 border-dashed">
                    <Plus className="size-3 mr-0.5" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpinnedCrypto.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            : unpinnedTradFi.length > 0 &&
              pinnedTradFiAssets.length < 5 && (
                <Select onValueChange={(v) => setPinnedTradFiAssets([...pinnedTradFiAssets, v as TradFiAsset])}>
                  <SelectTrigger className="h-7 w-16 text-xs shrink-0 border-dashed">
                    <Plus className="size-3 mr-0.5" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpinnedTradFi.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

        {/* Edit / done toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setEditingPins(!editingPins)}
          title={editingPins ? "Done editing" : "Edit pinned symbols"}
        >
          {editingPins ? <Check className="size-3.5" /> : <Pencil className="size-3" />}
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Tabs on the right */}
      <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30 shrink-0">
        {TABS.filter((t) => !t.cryptoOnly || isCrypto).map((t) => (
          <Button
            key={t.value}
            variant={activeTab === t.value ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2.5 text-xs gap-1"
            onClick={() => setActiveTab(t.value)}
          >
            {t.icon}
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
