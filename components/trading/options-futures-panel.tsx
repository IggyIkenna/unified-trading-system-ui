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

// ---------- Sub-components ----------

// Single compact toolbar — all controls + tabs in one row
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

export function OptionsChainTab({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [selectedExpiry, setSelectedExpiry] = React.useState("26 JUN 26");
  const [aroundAtm, setAroundAtm] = React.useState(false);
  const [showExpectedMove, setShowExpectedMove] = React.useState(false);
  const [displayUsd, setDisplayUsd] = React.useState(true);

  const spot = SPOT_PRICES[asset];
  const chain = React.useMemo(() => generateOptionChain(asset, selectedExpiry), [asset, selectedExpiry]);

  const filteredChain = aroundAtm ? chain.filter((row) => Math.abs(row.strike - spot) / spot < 0.08) : chain;

  // Expected move bounds (1-sigma)
  const iv = IV_INDEX[asset];
  const sigma1 = spot * (iv / 100) * Math.sqrt(94 / 365);
  const moveUpper = spot + sigma1;
  const moveLower = spot - sigma1;

  const handleCellClick = (row: OptionRow, side: "C" | "P", useAsk: boolean) => {
    const price = side === "C" ? (useAsk ? row.callAsk : row.callBid) : useAsk ? row.putAsk : row.putBid;
    const delta = side === "C" ? row.callDelta : row.putDelta;
    const mark = side === "C" ? row.callMark : row.putMark;

    onSelectInstrument({
      name: `${asset}-${selectedExpiry.replace(/ /g, "")}-${row.strike}-${side}`,
      type: "option",
      strike: row.strike,
      expiry: selectedExpiry,
      putCall: side,
      price,
      delta,
      gamma: 0.003 + seededRandom(row.strike) * 0.005,
      theta: -(8 + seededRandom(row.strike + 1) * 15),
      vega: 0.1 + seededRandom(row.strike + 2) * 0.2,
      iv: side === "C" ? (row.callIvBid + row.callIvAsk) / 2 : (row.putIvBid + row.putIvAsk) / 2,
    });
  };

  const closestAtmStrike = chain.reduce((prev, curr) =>
    Math.abs(curr.strike - spot) < Math.abs(prev.strike - spot) ? curr : prev,
  ).strike;

  // First 5 expiries shown inline, the rest in overflow dropdown
  const INLINE_COUNT = 5;
  const inlineExpiries = EXPIRY_DATES.filter((e) => e !== "ALL").slice(0, INLINE_COUNT);
  const overflowExpiries = EXPIRY_DATES.filter((e) => e !== "ALL").slice(INLINE_COUNT);
  const selectedIsOverflow = (overflowExpiries as readonly string[]).includes(selectedExpiry);

  // Mock time-to-expiry stats per expiry
  const EXPIRY_META: Record<string, { days: number; hours: number; mins: number; kind: string }> = {
    "24 MAR 26": { days: 0, hours: 6, mins: 42, kind: "Daily" },
    "25 MAR 26": { days: 1, hours: 6, mins: 42, kind: "Daily" },
    "26 MAR 26": { days: 2, hours: 6, mins: 42, kind: "Daily" },
    "27 MAR 26": { days: 3, hours: 6, mins: 42, kind: "Daily" },
    "03 APR 26": { days: 10, hours: 6, mins: 42, kind: "Weekly" },
    "10 APR 26": { days: 17, hours: 6, mins: 42, kind: "Weekly" },
    "24 APR 26": { days: 31, hours: 6, mins: 42, kind: "Monthly" },
    "29 MAY 26": { days: 66, hours: 6, mins: 42, kind: "Monthly" },
    "26 JUN 26": { days: 94, hours: 18, mins: 13, kind: "Quarterly" },
    "25 SEP 26": { days: 185, hours: 18, mins: 13, kind: "Quarterly" },
    "25 DEC 26": { days: 276, hours: 18, mins: 13, kind: "Quarterly" },
  };
  const meta = EXPIRY_META[selectedExpiry] ?? {
    days: 94,
    hours: 18,
    mins: 13,
    kind: "Quarterly",
  };
  const underlyingFuture = spot + spot * 0.001;

  return (
    <div className="space-y-0">
      {/* ── Top controls row: expiries + filters + CSV ── */}
      <div className="flex items-center gap-2 px-1 pb-2 flex-wrap">
        {/* Inline expiry pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {inlineExpiries.map((exp) => (
            <Button
              key={exp}
              variant={selectedExpiry === exp ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 px-2.5 text-[10px] font-mono whitespace-nowrap shrink-0",
                selectedExpiry === exp && "shadow-sm",
              )}
              onClick={() => setSelectedExpiry(exp)}
            >
              {exp}
              {EXPIRIES_WITH_POSITIONS.has(exp) && (
                <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0 h-3.5">
                  POS
                </Badge>
              )}
            </Button>
          ))}

          {/* Overflow dropdown */}
          {overflowExpiries.length > 0 && (
            <Select value={selectedIsOverflow ? selectedExpiry : ""} onValueChange={(v) => setSelectedExpiry(v)}>
              <SelectTrigger
                className={cn(
                  "h-7 w-[110px] text-[10px] font-mono shrink-0",
                  selectedIsOverflow && "border-primary bg-primary text-primary-foreground",
                )}
              >
                <SelectValue placeholder="More…" />
              </SelectTrigger>
              <SelectContent>
                {overflowExpiries.map((exp) => (
                  <SelectItem key={exp} value={exp} className="text-[11px] font-mono">
                    {exp}
                    {EXPIRIES_WITH_POSITIONS.has(exp) && (
                      <Badge variant="secondary" className="ml-1.5 text-[8px] px-1 py-0 h-3.5">
                        POS
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        {/* Expiry stats — underlying future + time to expiry */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-muted-foreground">Fut:</span>
            <span className="font-mono font-semibold">{formatUsd(underlyingFuture, 0)}</span>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-muted-foreground">Exp:</span>
            <span className="font-mono text-foreground">
              {meta.days}d {meta.hours}h {meta.mins}m
            </span>
            <span className="text-[10px] text-muted-foreground">({meta.kind})</span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        {/* Around ATM */}
        <div className="flex items-center gap-1.5">
          <Checkbox id="around-atm" checked={aroundAtm} onCheckedChange={(c) => setAroundAtm(c === true)} />
          <label htmlFor="around-atm" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            ±ATM
          </label>
        </div>

        {/* Expected move */}
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="expected-move"
            checked={showExpectedMove}
            onCheckedChange={(c) => setShowExpectedMove(c === true)}
          />
          <label htmlFor="expected-move" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            Exp. move
          </label>
        </div>

        {/* USD / Coin toggle */}
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
            Coin
          </Button>
        </div>

        {/* CSV — pushed to far right */}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0">
          <Download className="size-3" />
          CSV
        </Button>
      </div>

      {/* Options chain table */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th colSpan={6} className="text-center text-xs font-semibold py-1.5 text-emerald-400 border-r">
                  CALLS
                </th>
                <th className="text-center text-xs font-semibold py-1.5 px-3 border-x bg-muted/60">STRIKE</th>
                <th colSpan={6} className="text-center text-xs font-semibold py-1.5 text-rose-400 border-l">
                  PUTS
                </th>
              </tr>
              <tr className="border-b bg-muted/20 text-muted-foreground">
                <th className="py-1 px-1.5 text-right font-normal">OI</th>
                <th className="py-1 px-1.5 text-right font-normal">Delta</th>
                <th className="py-1 px-1.5 text-right font-normal">Size</th>
                <th className="py-1 px-1.5 text-right font-normal">IV</th>
                <th className="py-1 px-1.5 text-right font-normal">Bid</th>
                <th className="py-1 px-1.5 text-right font-normal border-r">Mark</th>
                <th className="py-1 px-3 text-center font-semibold text-foreground border-x bg-muted/40" />
                <th className="py-1 px-1.5 text-left font-normal border-l">Mark</th>
                <th className="py-1 px-1.5 text-left font-normal">Ask</th>
                <th className="py-1 px-1.5 text-left font-normal">IV</th>
                <th className="py-1 px-1.5 text-left font-normal">Delta</th>
                <th className="py-1 px-1.5 text-left font-normal">OI</th>
              </tr>
            </thead>
            <tbody>
              {filteredChain.map((row) => {
                const isAtm = row.strike === closestAtmStrike;
                const callItm = row.strike < spot;
                const putItm = row.strike > spot;
                const inExpectedMove = showExpectedMove && row.strike >= moveLower && row.strike <= moveUpper;
                const coinDivisor = displayUsd ? 1 : spot;

                return (
                  <tr
                    key={row.strike}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                      isAtm && "bg-amber-500/10 border-amber-500/30",
                      inExpectedMove && !isAtm && "bg-blue-500/5",
                    )}
                  >
                    {/* Calls side */}
                    <td
                      className={cn("py-1 px-1.5 text-right font-mono", callItm && "bg-emerald-500/5")}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {formatCompact(row.callOi)}
                    </td>
                    <td
                      className={cn("py-1 px-1.5 text-right font-mono", callItm && "bg-emerald-500/5")}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      <span
                        className={cn(
                          row.callDelta > 0.7
                            ? "text-emerald-500"
                            : row.callDelta > 0.3
                              ? "text-emerald-400/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.callDelta.toFixed(2)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono text-muted-foreground",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {row.callSize}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono text-muted-foreground",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {row.callIvBid.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono font-medium text-emerald-400",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {displayUsd ? formatUsd(row.callBid) : (row.callBid / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn("py-1 px-1.5 text-right font-mono border-r", callItm && "bg-emerald-500/5")}
                      onClick={() => handleCellClick(row, "C", true)}
                    >
                      {displayUsd ? formatUsd(row.callMark) : (row.callMark / coinDivisor).toFixed(4)}
                    </td>

                    {/* Strike centre */}
                    <td
                      className={cn(
                        "py-1 px-3 text-center font-mono font-bold border-x bg-muted/20",
                        isAtm && "text-amber-400",
                      )}
                    >
                      {row.strike.toLocaleString()}
                      {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                    </td>

                    {/* Puts side */}
                    <td
                      className={cn("py-1 px-1.5 text-left font-mono border-l", putItm && "bg-rose-500/5")}
                      onClick={() => handleCellClick(row, "P", false)}
                    >
                      {displayUsd ? formatUsd(row.putMark) : (row.putMark / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono font-medium text-rose-400",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {displayUsd ? formatUsd(row.putAsk) : (row.putAsk / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn("py-1 px-1.5 text-left font-mono text-muted-foreground", putItm && "bg-rose-500/5")}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {row.putIvAsk.toFixed(1)}%
                    </td>
                    <td
                      className={cn("py-1 px-1.5 text-left font-mono", putItm && "bg-rose-500/5")}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      <span
                        className={cn(
                          row.putDelta < -0.7
                            ? "text-rose-500"
                            : row.putDelta < -0.3
                              ? "text-rose-400/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.putDelta.toFixed(2)}
                      </span>
                    </td>
                    <td
                      className={cn("py-1 px-1.5 text-left font-mono", putItm && "bg-rose-500/5")}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {formatCompact(row.putOi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

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

export function FuturesSpreadsTab({ onSelectInstrument }: { onSelectInstrument: (inst: SelectedInstrument) => void }) {
  const [spreadAsset, setSpreadAsset] = React.useState<SpreadAsset>("BTC");

  const matrix = React.useMemo(() => generateSpreadMatrix(spreadAsset), [spreadAsset]);

  const handleCellClick = (cell: SpreadCell) => {
    const longContract = `${spreadAsset}-${cell.longLabel.replace(/ /g, "")}`;
    const shortContract = `${spreadAsset}-${cell.shortLabel.replace(/ /g, "")}`;
    onSelectInstrument({
      name: `Long: ${longContract} / Short: ${shortContract}`,
      type: "spread",
      price: (cell.bid + cell.ask) / 2,
      longLeg: longContract,
      shortLeg: shortContract,
      spreadBid: cell.bid,
      spreadAsk: cell.ask,
    });
  };

  return (
    <div className="space-y-3">
      {/* Asset selector pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Asset:</span>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          {(["BTC", "ETH"] as const).map((a) => (
            <Button
              key={a}
              variant={spreadAsset === a ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs font-mono"
              onClick={() => setSpreadAsset(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar spread matrix */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Long Leg &darr; / Short Leg &rarr;
                </th>
                {SPREAD_EXPIRIES.map((exp) => (
                  <th key={exp} className="py-2 px-2 text-center font-mono font-medium text-xs whitespace-nowrap">
                    {exp === "Perpetual" ? "PERP" : exp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPREAD_EXPIRIES.map((longExp, longIdx) => (
                <tr key={longExp} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-xs whitespace-nowrap bg-muted/20">
                    {longExp === "Perpetual" ? "PERP" : longExp}
                  </td>
                  {SPREAD_EXPIRIES.map((_, shortIdx) => {
                    const cell = matrix[longIdx][shortIdx];
                    if (!cell) {
                      return (
                        <td
                          key={shortIdx}
                          className={cn("py-2 px-2 text-center", shortIdx === longIdx ? "bg-muted/40" : "bg-muted/15")}
                        >
                          {shortIdx === longIdx ? <span className="text-muted-foreground/40">&mdash;</span> : null}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={shortIdx}
                        className="py-1 px-1.5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => handleCellClick(cell)}
                      >
                        <div className="rounded border bg-card/80 p-1.5 min-w-[90px] space-y-0.5">
                          <p className="text-[9px] text-muted-foreground font-medium truncate">{cell.spreadLabel}</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-emerald-400 font-medium">
                              {cell.bid >= 0 ? "+" : ""}
                              {cell.bid.toFixed(1)}
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {cell.ask >= 0 ? "+" : ""}
                              {cell.ask.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground/60">
                            <span>{cell.bidDepth} bid</span>
                            <span>{cell.askDepth} ask</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        Click a cell to pre-fill a two-legged spread order in the Trade Panel. Values show net spread (far mark - near
        mark). Green = bid, grey = ask.
      </p>
    </div>
  );
}

// ---------- Options Combos ----------

const COMBO_TYPES: { value: ComboType; label: string }[] = [
  { value: "vertical-spread", label: "Vertical Spread" },
  { value: "straddle", label: "Straddle" },
  { value: "strangle", label: "Strangle" },
  { value: "calendar", label: "Calendar" },
  { value: "butterfly", label: "Butterfly" },
  { value: "risk-reversal", label: "Risk Reversal" },
];

const CALENDAR_EXPIRIES = ["26 JUN 26", "25 SEP 26", "25 DEC 26", "26 MAR 27", "26 JUN 27", "25 SEP 27"] as const;

export function OptionsCombosPanel({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [comboType, setComboType] = React.useState<ComboType>("vertical-spread");
  const spot = SPOT_PRICES[asset];
  const strikes = React.useMemo(() => generateStrikes(asset), [asset]);
  const chain = React.useMemo(() => generateOptionChain(asset, "26 JUN 26"), [asset]);
  const inc = STRIKE_INCREMENTS[asset];

  // Map strike -> OptionRow for quick lookup
  const chainMap = React.useMemo(() => {
    const m = new Map<number, OptionRow>();
    for (const row of chain) {
      m.set(row.strike, row);
    }
    return m;
  }, [chain]);

  const closestAtmStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev,
  );
  const atmIdx = strikes.indexOf(closestAtmStrike);

  // Strikes above and below ATM for directional combos
  const strikesAboveAtm = strikes.filter((s) => s > closestAtmStrike);
  const strikesBelowAtm = strikes.filter((s) => s < closestAtmStrike);

  // Wing widths for butterfly
  const wingWidths = [1, 2, 3, 4, 5].map((n) => n * inc);

  const getGreeks = (strike: number, side: "call" | "put") => {
    const row = chainMap.get(strike);
    if (!row) {
      return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
    }
    if (side === "call") {
      return {
        price: row.callMark,
        delta: row.callDelta,
        gamma: 0.003 + seededRandom(strike) * 0.005,
        theta: -(8 + seededRandom(strike + 1) * 15),
        vega: 0.1 + seededRandom(strike + 2) * 0.2,
      };
    }
    return {
      price: row.putMark,
      delta: row.putDelta,
      gamma: 0.003 + seededRandom(strike + 10) * 0.005,
      theta: -(8 + seededRandom(strike + 11) * 15),
      vega: 0.1 + seededRandom(strike + 12) * 0.2,
    };
  };

  const buildComboInstrument = (
    label: string,
    legs: ComboLeg[],
    type: string,
    netDebit: number,
  ): SelectedInstrument => ({
    name: label,
    type: "combo",
    price: Math.abs(netDebit),
    delta: legs.reduce((s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1), 0),
    gamma: legs.reduce((s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1), 0),
    theta: legs.reduce((s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1), 0),
    vega: legs.reduce((s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1), 0),
    legs,
    comboType: type,
    netDebit,
  });

  // --- Vertical Spread ---
  if (comboType === "vertical-spread") {
    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Bull call spread: BUY lower strike call, SELL higher strike call (same expiry). Lower triangle shows valid
          combinations. Click a cell to trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Long &darr; / Short &rarr;
                  </th>
                  {strikes.map((s) => (
                    <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {s.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strikes.map((longStrike, lIdx) => (
                  <tr key={longStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {longStrike.toLocaleString()}
                    </td>
                    {strikes.map((shortStrike, sIdx) => {
                      if (sIdx <= lIdx) {
                        return (
                          <td
                            key={sIdx}
                            className={cn("py-1.5 px-1 text-center", sIdx === lIdx ? "bg-muted/40" : "bg-muted/15")}
                          >
                            {sIdx === lIdx ? <span className="text-muted-foreground/40">&mdash;</span> : null}
                          </td>
                        );
                      }
                      const longG = getGreeks(longStrike, "call");
                      const shortG = getGreeks(shortStrike, "call");
                      const netDebit = longG.price - shortG.price;
                      const spread = Math.abs(netDebit) * 0.02 + seededRandom(longStrike + shortStrike) * 2;
                      const legs: ComboLeg[] = [
                        {
                          strike: longStrike,
                          type: "call",
                          direction: "buy",
                          ...longG,
                        },
                        {
                          strike: shortStrike,
                          type: "call",
                          direction: "sell",
                          ...shortG,
                        },
                      ];

                      return (
                        <td
                          key={sIdx}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${longStrike}-C / SELL ${asset}-26JUN26-${shortStrike}-C`;
                            onSelectInstrument(buildComboInstrument(label, legs, "Vertical Spread", netDebit));
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[80px] space-y-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0 ? "text-rose-400" : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit - spread), 1)}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {formatUsd(Math.abs(netDebit + spread), 1)}
                              </span>
                            </div>
                            <p className="text-[8px] text-muted-foreground/60 truncate">
                              {netDebit > 0 ? "Debit" : "Credit"}
                            </p>
                          </div>
                        </td>
                      );
                    })}
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

  // --- Straddle (list/table, not matrix) ---
  if (comboType === "straddle") {
    const straddleStrikes = strikes.slice(Math.max(0, atmIdx - 5), Math.min(strikes.length, atmIdx + 6));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy call + buy put at the same strike. Click a row to trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="py-1.5 px-2 text-right font-normal">Strike</th>
                  <th className="py-1.5 px-2 text-right font-normal">Call Price</th>
                  <th className="py-1.5 px-2 text-right font-normal">Put Price</th>
                  <th className="py-1.5 px-2 text-right font-normal">Net Cost</th>
                  <th className="py-1.5 px-2 text-right font-normal">Combined IV</th>
                  <th className="py-1.5 px-2 text-right font-normal">Net Delta</th>
                </tr>
              </thead>
              <tbody>
                {straddleStrikes.map((strike) => {
                  const callG = getGreeks(strike, "call");
                  const putG = getGreeks(strike, "put");
                  const netCost = callG.price + putG.price;
                  const row = chainMap.get(strike);
                  const combinedIv = row ? (row.callIvBid + row.callIvAsk + row.putIvBid + row.putIvAsk) / 4 : 0;
                  const netDelta = callG.delta + putG.delta;
                  const isAtm = strike === closestAtmStrike;
                  const legs: ComboLeg[] = [
                    { strike, type: "call", direction: "buy", ...callG },
                    { strike, type: "put", direction: "buy", ...putG },
                  ];

                  return (
                    <tr
                      key={strike}
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                        isAtm && "bg-amber-500/10 border-amber-500/30",
                      )}
                      onClick={() => {
                        const label = `BUY ${asset}-26JUN26-${strike}-C + BUY ${asset}-26JUN26-${strike}-P`;
                        onSelectInstrument(buildComboInstrument(label, legs, "Straddle", netCost));
                      }}
                    >
                      <td className="py-1.5 px-2 text-right font-mono font-medium">
                        {strike.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatUsd(callG.price)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatUsd(putG.price)}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-medium text-rose-400">
                        {formatUsd(netCost)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                        {combinedIv.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          "py-1.5 px-2 text-right font-mono",
                          netDelta >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {netDelta >= 0 ? "+" : ""}
                        {netDelta.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Strangle (OTM call + OTM put, full matrix) ---
  if (comboType === "strangle") {
    const callStrikes = strikesAboveAtm.slice(0, 8);
    const putStrikes = strikesBelowAtm.slice(-8);

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy OTM call + buy OTM put at different strikes. Full matrix (any combination valid).
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Call &darr; / Put &rarr;
                  </th>
                  {putStrikes.map((s) => (
                    <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {s.toLocaleString()}P
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callStrikes.map((callStrike) => (
                  <tr key={callStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {callStrike.toLocaleString()}C
                    </td>
                    {putStrikes.map((putStrike) => {
                      const callG = getGreeks(callStrike, "call");
                      const putG = getGreeks(putStrike, "put");
                      const netCost = callG.price + putG.price;
                      const legs: ComboLeg[] = [
                        {
                          strike: callStrike,
                          type: "call",
                          direction: "buy",
                          ...callG,
                        },
                        {
                          strike: putStrike,
                          type: "put",
                          direction: "buy",
                          ...putG,
                        },
                      ];

                      return (
                        <td
                          key={putStrike}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${callStrike}-C + BUY ${asset}-26JUN26-${putStrike}-P`;
                            onSelectInstrument(buildComboInstrument(label, legs, "Strangle", netCost));
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                            <span className="font-mono font-medium text-rose-400">{formatUsd(netCost, 1)}</span>
                            <p className="text-[8px] text-muted-foreground/60">Debit</p>
                          </div>
                        </td>
                      );
                    })}
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

  // --- Calendar Spread (same strike, different expiries) ---
  if (comboType === "calendar") {
    const calStrikes = strikes.slice(Math.max(0, atmIdx - 4), Math.min(strikes.length, atmIdx + 5));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Long far-expiry call, short near-expiry call at the same strike. Net debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Strike &darr; / Expiry &rarr;
                  </th>
                  {CALENDAR_EXPIRIES.map((exp) => (
                    <th
                      key={exp}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calStrikes.map((strike) => {
                  const isAtm = strike === closestAtmStrike;
                  const baseG = getGreeks(strike, "call");

                  return (
                    <tr key={strike} className={cn("border-b", isAtm && "bg-amber-500/10")}>
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {strike.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      {CALENDAR_EXPIRIES.map((exp, eIdx) => {
                        // Near expiry is always first column; further expiries cost more
                        const timePremium = (eIdx + 1) * baseG.price * 0.08;
                        const farPrice = baseG.price + timePremium;
                        const nearPrice = baseG.price;
                        const netDebit = farPrice - nearPrice;
                        const legs: ComboLeg[] = [
                          {
                            strike,
                            type: "call",
                            direction: "buy",
                            price: farPrice,
                            delta: baseG.delta * 0.95,
                            gamma: baseG.gamma * 0.9,
                            theta: baseG.theta * 0.7,
                            vega: baseG.vega * 1.2,
                          },
                          {
                            strike,
                            type: "call",
                            direction: "sell",
                            price: nearPrice,
                            delta: baseG.delta,
                            gamma: baseG.gamma,
                            theta: baseG.theta,
                            vega: baseG.vega,
                          },
                        ];

                        return (
                          <td
                            key={exp}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${asset}-${exp.replace(/ /g, "")}-${strike}-C / SELL ${asset}-26JUN26-${strike}-C`;
                              onSelectInstrument(buildComboInstrument(label, legs, "Calendar Spread", netDebit));
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span className="font-mono font-medium text-rose-400">{formatUsd(netDebit, 1)}</span>
                              <p className="text-[8px] text-muted-foreground/60">Debit</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Butterfly (buy 1 lower, sell 2 middle, buy 1 upper) ---
  if (comboType === "butterfly") {
    const centerStrikes = strikes.slice(Math.max(0, atmIdx - 4), Math.min(strikes.length, atmIdx + 5));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy 1 lower wing, sell 2 center, buy 1 upper wing. Net debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Center &darr; / Width &rarr;
                  </th>
                  {wingWidths.map((w) => (
                    <th key={w} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {w.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centerStrikes.map((center) => {
                  const isAtm = center === closestAtmStrike;
                  return (
                    <tr key={center} className={cn("border-b", isAtm && "bg-amber-500/10")}>
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {center.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      {wingWidths.map((width) => {
                        const lower = center - width;
                        const upper = center + width;
                        // Check that both wing strikes exist in the chain
                        const lowerG = getGreeks(lower, "call");
                        const centerG = getGreeks(center, "call");
                        const upperG = getGreeks(upper, "call");
                        const hasData = chainMap.has(lower) && chainMap.has(upper);

                        if (!hasData) {
                          return (
                            <td key={width} className="py-1.5 px-1 text-center bg-muted/15">
                              <span className="text-muted-foreground/40 text-[9px]">N/A</span>
                            </td>
                          );
                        }

                        const netDebit = lowerG.price - 2 * centerG.price + upperG.price;
                        const legs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta * -2,
                            gamma: centerG.gamma * -2,
                            theta: centerG.theta * -2,
                            vega: centerG.vega * -2,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];
                        // Fix center leg: direction=sell but we store raw greeks; sign handled in buildComboInstrument
                        legs[1] = {
                          strike: center,
                          type: "call",
                          direction: "sell",
                          price: centerG.price,
                          delta: centerG.delta,
                          gamma: centerG.gamma,
                          theta: centerG.theta,
                          vega: centerG.vega,
                        };

                        // Sell 2x center: duplicate the sell leg
                        const allLegs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];

                        return (
                          <td
                            key={width}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${lower}C / SELL 2x${center}C / BUY ${upper}C`;
                              onSelectInstrument(buildComboInstrument(label, allLegs, "Butterfly", netDebit));
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0 ? "text-rose-400" : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit), 1)}
                              </span>
                              <p className="text-[8px] text-muted-foreground/60">{netDebit > 0 ? "Debit" : "Credit"}</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Risk Reversal (sell OTM put, buy OTM call) ---
  // comboType === "risk-reversal"
  const rrCallStrikes = strikesAboveAtm.slice(0, 8);
  const rrPutStrikes = strikesBelowAtm.slice(-8);

  return (
    <div className="space-y-3">
      <ComboTypePills comboType={comboType} setComboType={setComboType} />
      <p className="text-[10px] text-muted-foreground px-1">Sell OTM put, buy OTM call. Net credit or debit shown.</p>
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Call &darr; / Put &rarr;
                </th>
                {rrPutStrikes.map((s) => (
                  <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                    {s.toLocaleString()}P
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rrCallStrikes.map((callStrike) => (
                <tr key={callStrike} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                    {callStrike.toLocaleString()}C
                  </td>
                  {rrPutStrikes.map((putStrike) => {
                    const callG = getGreeks(callStrike, "call");
                    const putG = getGreeks(putStrike, "put");
                    // Net = sell put premium - buy call premium
                    const netCredit = putG.price - callG.price;
                    const legs: ComboLeg[] = [
                      {
                        strike: callStrike,
                        type: "call",
                        direction: "buy",
                        ...callG,
                      },
                      {
                        strike: putStrike,
                        type: "put",
                        direction: "sell",
                        ...putG,
                      },
                    ];

                    return (
                      <td
                        key={putStrike}
                        className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => {
                          const label = `BUY ${asset}-26JUN26-${callStrike}-C / SELL ${asset}-26JUN26-${putStrike}-P`;
                          onSelectInstrument(buildComboInstrument(label, legs, "Risk Reversal", -netCredit));
                        }}
                      >
                        <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                          <span
                            className={cn(
                              "font-mono font-medium",
                              netCredit >= 0 ? "text-emerald-400" : "text-rose-400",
                            )}
                          >
                            {formatUsd(Math.abs(netCredit), 1)}
                          </span>
                          <p className="text-[8px] text-muted-foreground/60">{netCredit >= 0 ? "Credit" : "Debit"}</p>
                        </div>
                      </td>
                    );
                  })}
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

function ComboTypePills({ comboType, setComboType }: { comboType: ComboType; setComboType: (ct: ComboType) => void }) {
  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-1 pb-1">
        {COMBO_TYPES.map((ct) => (
          <Button
            key={ct.value}
            variant={comboType === ct.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-[10px] whitespace-nowrap shrink-0"
            onClick={() => setComboType(ct.value)}
          >
            {ct.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export function TradePanel({ instrument }: { instrument: SelectedInstrument | null }) {
  const [direction, setDirection] = React.useState<TradeDirection>("buy");
  const [orderType, setOrderType] = React.useState<OrderType>("limit");
  const [price, setPrice] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [leverage, setLeverage] = React.useState([10]);

  // Sync price when instrument changes
  React.useEffect(() => {
    if (instrument) {
      setPrice(instrument.price.toFixed(2));
    }
  }, [instrument]);

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(price) || 0;
  const leverageVal = leverage[0];

  // Futures liquidation price: price * (1 - 1/leverage) for longs, price * (1 + 1/leverage) for shorts
  const liqPrice =
    instrument?.type === "future" && priceNum > 0 && leverageVal > 1
      ? direction === "buy"
        ? priceNum * (1 - 1 / leverageVal)
        : priceNum * (1 + 1 / leverageVal)
      : null;

  const marginRequired =
    amountNum > 0 && priceNum > 0 ? (amountNum * priceNum) / (instrument?.type === "future" ? leverageVal : 1) : 0;

  // Spread margin: combined margin for both legs
  const spreadMargin =
    instrument?.type === "spread" && amountNum > 0 ? Math.abs(instrument.spreadAsk ?? 0) * amountNum * 1.2 : 0;

  const noInstrument = !instrument;

  // ---------- Mode 4: Combo Trade Panel ----------
  if (instrument?.type === "combo") {
    const legs = instrument.legs ?? [];
    const netDelta = legs.reduce((s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1), 0);
    const netGamma = legs.reduce((s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1), 0);
    const netTheta = legs.reduce((s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1), 0);
    const netVega = legs.reduce((s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1), 0);
    const netDebit = instrument.netDebit ?? 0;
    const comboMargin = amountNum > 0 ? Math.abs(netDebit) * amountNum * 1.2 : 0;

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Combo Order</p>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              {instrument.comboType}
            </Badge>
          </div>
        </div>

        {/* Legs */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Legs</p>
          {legs.map((leg, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span
                className={cn("font-mono font-medium", leg.direction === "buy" ? "text-emerald-400" : "text-rose-400")}
              >
                {leg.direction === "buy" ? "BUY" : "SELL"} {leg.strike.toLocaleString()}
                {leg.type === "call" ? "C" : "P"}
              </span>
              <span className="font-mono text-muted-foreground">{formatUsd(leg.price)}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Net Debit/Credit */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Net {netDebit > 0 ? "Debit" : "Credit"}</span>
            <span className={cn("font-mono font-bold text-sm", netDebit > 0 ? "text-rose-400" : "text-emerald-400")}>
              {formatUsd(Math.abs(netDebit))}
            </span>
          </div>
        </div>

        {/* Combined Greeks */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Combined Greeks</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Delta;</p>
                    <p
                      className={cn(
                        "font-mono text-xs font-medium",
                        netDelta >= 0 ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {netDelta >= 0 ? "+" : ""}
                      {netDelta.toFixed(3)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net delta across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Gamma;</p>
                    <p className="font-mono text-xs font-medium">{netGamma.toFixed(4)}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net gamma across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&nu;</p>
                    <p className="font-mono text-xs font-medium">{netVega.toFixed(3)}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net vega across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Theta;</p>
                    <p className="font-mono text-xs font-medium">{netTheta.toFixed(1)}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net theta across all legs (USD/day)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Size (contracts)</label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] flex-1 font-mono"
                onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Margin */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Combined Margin Required</span>
            <span className="font-mono font-medium">{comboMargin > 0 ? formatUsd(comboMargin) : "--"}</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
          disabled={amountNum <= 0}
          onClick={() => {
            const legDesc = legs.map((l) => `${l.direction} ${l.strike}`).join("+");
            const order = placeMockOrder({
              client_id: "internal-trader",
              instrument_id: `OPTIONS:COMBO:${instrument.comboType}:${legDesc}`,
              venue: "Deribit",
              side: "buy",
              order_type: "limit",
              quantity: amountNum,
              price: Math.abs(netDebit),
              asset_class: "CeFi",
              lane: "options",
            });
            setAmount("");
            toast({
              title: "Combo order placed",
              description: `${instrument.comboType} ${amountNum} contracts (${order.id})`,
            });
          }}
        >
          Place Combo Order
        </Button>
      </div>
    );
  }

  // ---------- Mode 3: Spread Trade Panel ----------
  if (instrument?.type === "spread") {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Spread Order</p>
          <div className="text-sm font-mono font-bold">
            <p className="truncate text-emerald-400">Long: {instrument.longLeg}</p>
            <p className="truncate text-rose-400">Short: {instrument.shortLeg}</p>
          </div>
        </div>

        <Separator />

        {/* Net cost (Bid/Ask) */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Spread Pricing</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bid</span>
            <span className="font-mono font-medium text-emerald-400">
              {instrument.spreadBid !== undefined
                ? `${instrument.spreadBid >= 0 ? "+" : ""}${instrument.spreadBid.toFixed(2)}`
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ask</span>
            <span className="font-mono font-medium">
              {instrument.spreadAsk !== undefined
                ? `${instrument.spreadAsk >= 0 ? "+" : ""}${instrument.spreadAsk.toFixed(2)}`
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mid</span>
            <span className="font-mono">
              {instrument.spreadBid !== undefined && instrument.spreadAsk !== undefined
                ? formatUsd((instrument.spreadBid + instrument.spreadAsk) / 2)
                : "--"}
            </span>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Size (contracts)</label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] flex-1 font-mono"
                onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Combined margin */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Combined Margin Required</span>
            <span className="font-mono font-medium">{spreadMargin > 0 ? formatUsd(spreadMargin) : "--"}</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
          disabled={amountNum <= 0}
          onClick={() => {
            const order = placeMockOrder({
              client_id: "internal-trader",
              instrument_id: `OPTIONS:SPREAD:${instrument.longLeg}/${instrument.shortLeg}`,
              venue: "Deribit",
              side: "buy",
              order_type: "limit",
              quantity: amountNum,
              price: Math.abs(instrument.spreadAsk ?? 0),
              asset_class: "CeFi",
              lane: "options",
            });
            setAmount("");
            toast({
              title: "Spread order placed",
              description: `${instrument.longLeg} / ${instrument.shortLeg} ${amountNum} contracts (${order.id})`,
            });
          }}
        >
          Place Spread Order
        </Button>
      </div>
    );
  }

  // ---------- Mode 1 (Option) & Mode 2 (Future) ----------
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Selected Instrument</p>
        <p className="text-sm font-mono font-bold truncate">{instrument ? instrument.name : "Click a row to select"}</p>
      </div>

      <Separator />

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          variant={direction === "buy" ? "default" : "outline"}
          size="sm"
          className={cn("h-9 text-sm font-semibold", direction === "buy" && "bg-emerald-600 hover:bg-emerald-700")}
          onClick={() => setDirection("buy")}
          disabled={noInstrument}
        >
          <TrendingUp className="size-4 mr-1.5" />
          Buy
        </Button>
        <Button
          variant={direction === "sell" ? "default" : "outline"}
          size="sm"
          className={cn("h-9 text-sm font-semibold", direction === "sell" && "bg-rose-600 hover:bg-rose-700")}
          onClick={() => setDirection("sell")}
          disabled={noInstrument}
        >
          <TrendingDown className="size-4 mr-1.5" />
          Sell
        </Button>
      </div>

      {/* Order type */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Order Type</label>
        <div className="grid grid-cols-4 gap-1">
          {(["limit", "market", "post-only", "reduce-only"] as const).map((ot) => (
            <Button
              key={ot}
              variant={orderType === ot ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-7 px-1"
              onClick={() => setOrderType(ot)}
              disabled={noInstrument}
            >
              {ot === "post-only" ? "Post" : ot === "reduce-only" ? "Reduce" : ot.charAt(0).toUpperCase() + ot.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Price (USD)</label>
        <Input
          type="number"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="font-mono"
          disabled={noInstrument || orderType === "market"}
        />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          {instrument?.type === "option" ? "Size (contracts)" : "Size (contracts)"}
        </label>
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
          disabled={noInstrument}
        />
        {/* Quick-size buttons */}
        <div className="flex items-center gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <Button
              key={pct}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] flex-1 font-mono"
              onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              disabled={noInstrument}
            >
              {pct}%
            </Button>
          ))}
        </div>
      </div>

      {/* Options-specific: IV + Greeks (Mode 1 only) */}
      {instrument?.type === "option" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Implied Volatility</label>
            <div className="p-2 rounded-md border bg-muted/30 font-mono text-sm">{instrument.iv?.toFixed(1)}%</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Greeks</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&Delta;</p>
                      <p className="font-mono text-xs font-medium">{instrument.delta?.toFixed(3)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Delta: price sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&Gamma;</p>
                      <p className="font-mono text-xs font-medium">{instrument.gamma?.toFixed(4)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Gamma: delta sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&Theta;</p>
                      <p className="font-mono text-xs font-medium">{instrument.theta?.toFixed(1)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Theta: time decay (USD/day)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&nu;</p>
                      <p className="font-mono text-xs font-medium">{instrument.vega?.toFixed(3)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Vega: IV sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </>
      )}

      {/* Futures-specific: Leverage + Liquidation (Mode 2 only, NO Greeks) */}
      {instrument?.type === "future" && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Leverage</label>
              <span className="text-xs font-mono font-bold">{leverageVal}x</span>
            </div>
            <Slider value={leverage} onValueChange={setLeverage} min={1} max={50} step={1} className="w-full" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>1x</span>
              <span>10x</span>
              <span>25x</span>
              <span>50x</span>
            </div>
          </div>
          {liqPrice !== null && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Liquidation Price</span>
                <span className={cn("font-mono font-bold", direction === "buy" ? "text-rose-400" : "text-emerald-400")}>
                  {formatUsd(liqPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-mono text-muted-foreground">
                  {((Math.abs(priceNum - liqPrice) / priceNum) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <Separator />

      {/* Margin / Total */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Order Value</span>
          <span className="font-mono">{amountNum > 0 && priceNum > 0 ? formatUsd(amountNum * priceNum) : "--"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {instrument?.type === "future" ? "Margin Required" : "Total Cost"}
          </span>
          <span className="font-mono font-medium">{marginRequired > 0 ? formatUsd(marginRequired) : "--"}</span>
        </div>
      </div>

      {/* Submit */}
      <Button
        className={cn(
          "w-full h-10 text-sm font-semibold",
          direction === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
        )}
        disabled={noInstrument || amountNum <= 0 || (orderType !== "market" && priceNum <= 0)}
        onClick={() => {
          if (!instrument) return;
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: instrument.name,
            venue: "Deribit",
            side: direction,
            order_type: orderType === "market" ? "market" : "limit",
            quantity: amountNum,
            price: orderType === "market" ? (instrument.lastPrice ?? priceNum) : priceNum,
            asset_class: "CeFi",
            lane: "options",
          });
          setAmount("");
          setPrice("");
          toast({
            title: "Order placed",
            description: `${direction.toUpperCase()} ${amountNum} ${instrument.name} @ ${orderType} (${order.id})`,
          });
        }}
      >
        Place {direction === "buy" ? "Buy" : "Sell"} Order
      </Button>
    </div>
  );
}

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
                        {iv.toFixed(1)}%
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
        return val.toFixed(2);
      case "gamma":
        return val.toFixed(5);
      case "vega":
        return val.toFixed(2);
      case "theta":
        return val.toFixed(2);
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
            ±${expectedMoveExpiry.toFixed(2)} (±
            {((expectedMoveExpiry / spot) * 100).toFixed(1)}%)
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
                    {displayUsd ? `$${row.callBid.toFixed(2)}` : row.callBid.toFixed(2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">
                    {displayUsd ? `$${row.callAsk.toFixed(2)}` : row.callAsk.toFixed(2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-amber-400">{row.callIvAsk.toFixed(1)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-blue-400">{row.callDelta.toFixed(2)}</td>
                  <td className="text-right pr-2 py-0.5 text-muted-foreground border-r">
                    {(row.callOi / 1000).toFixed(0)}k
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
                    {(row.putOi / 1000).toFixed(0)}k
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">{row.putDelta.toFixed(2)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-amber-400">{row.putIvAsk.toFixed(1)}</td>
                  <td className="text-right pr-1 py-0.5 font-mono text-emerald-400">
                    {displayUsd ? `$${row.putBid.toFixed(2)}` : row.putBid.toFixed(2)}
                  </td>
                  <td className="text-right pr-1 py-0.5 font-mono text-red-400">
                    {displayUsd ? `$${row.putAsk.toFixed(2)}` : row.putAsk.toFixed(2)}
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
                        {iv.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
            IV (%). Spot: ${spot.toFixed(2)} · Base IV: {baseIv.toFixed(1)}% · Yellow = vol premium above ATM
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

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
              <span className="font-mono">{isCrypto ? formatUsd(scenarioSpot) : `$${scenarioSpot.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">IV →</span>
              <span className="font-mono">{scenarioIv.toFixed(1)}%</span>
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
                        {viewMode === "pnl" ? `${val >= 0 ? "+" : ""}${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
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
            value: `±${(Math.abs(liqThreshold) / (notional * 0.003)).toFixed(1)}%`,
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

// ---------- Main Component ----------

interface OptionsFuturesPanelProps {
  className?: string;
}

export function OptionsFuturesPanel({ className }: OptionsFuturesPanelProps) {
  // Asset-class state
  const [assetClass, setAssetClass] = React.useState<AssetClass>("crypto");
  const isCrypto = assetClass === "crypto";

  // Crypto instrument state
  const [asset, setAsset] = React.useState<Asset>("BTC");
  const [settlement, setSettlement] = React.useState<Settlement>("inverse");
  const [market, setMarket] = React.useState<Market>("deribit");

  // TradFi instrument state
  const [tradFiAsset, setTradFiAsset] = React.useState<TradFiAsset>("SPY");
  const [tradFiMarket, setTradFiMarket] = React.useState<TradFiMarket>("cboe");

  // UI state
  const [selectedInstrument, setSelectedInstrument] = React.useState<SelectedInstrument | null>(null);
  const [activeTab, setActiveTab] = React.useState<MainTab>("options");
  const [strategiesMode, setStrategiesMode] = React.useState<StrategiesMode>("futures-spreads");
  const [showWatchlist, setShowWatchlist] = React.useState(true);
  const [watchlistId, setWatchlistId] = React.useState("crypto-top");
  const [selectedWatchlistSymbolId, setSelectedWatchlistSymbolId] = React.useState<string>("btc");

  // Pinned asset pills (up to 5, user-configurable)
  const [pinnedCryptoAssets, setPinnedCryptoAssets] = React.useState<Asset[]>(["BTC", "ETH", "SOL", "AVAX"]);
  const [pinnedTradFiAssets, setPinnedTradFiAssets] = React.useState<TradFiAsset[]>(["SPY", "QQQ", "SPX"]);

  // When switching asset class, swap to the relevant default watchlist and reset tab
  function handleAssetClassChange(ac: AssetClass) {
    setAssetClass(ac);
    if (ac === "tradfi") {
      if (activeTab === "futures") setActiveTab("options");
      setWatchlistId("tradfi-us");
    } else {
      setWatchlistId("crypto-top");
    }
  }

  // Selecting a symbol from the watchlist drives the active underlying
  function handleWatchlistSelect(sym: WatchlistSymbol) {
    setSelectedWatchlistSymbolId(sym.id);
    if (isCrypto) {
      const a = ASSETS.find((x) => x === sym.symbol);
      if (a) setAsset(a);
    } else {
      const a = TRADFI_ASSETS.find((x) => x === sym.symbol);
      if (a) setTradFiAsset(a);
    }
  }

  // Keep watchlist selection in sync when asset pills change
  React.useEffect(() => {
    const id = isCrypto ? asset.toLowerCase() : tradFiAsset.toLowerCase();
    setSelectedWatchlistSymbolId(id);
  }, [asset, tradFiAsset, isCrypto]);

  return (
    <div className={cn("flex flex-col h-full overflow-hidden rounded-lg border bg-background", className)}>
      {/* ── Single toolbar row ── */}
      <OptionsToolbar
        assetClass={assetClass}
        setAssetClass={handleAssetClassChange}
        asset={asset}
        setAsset={setAsset}
        tradFiAsset={tradFiAsset}
        setTradFiAsset={setTradFiAsset}
        pinnedCryptoAssets={pinnedCryptoAssets}
        setPinnedCryptoAssets={setPinnedCryptoAssets}
        pinnedTradFiAssets={pinnedTradFiAssets}
        setPinnedTradFiAssets={setPinnedTradFiAssets}
        settlement={settlement}
        setSettlement={setSettlement}
        market={market}
        setMarket={setMarket}
        tradFiMarket={tradFiMarket}
        setTradFiMarket={setTradFiMarket}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showWatchlist={showWatchlist}
        setShowWatchlist={setShowWatchlist}
      />

      {/* ── Three-column body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT — Watchlist */}
        {showWatchlist && (
          <div className="w-[190px] shrink-0 overflow-hidden">
            <WatchlistPanel
              watchlists={DEFAULT_WATCHLISTS}
              activeListId={watchlistId}
              onListChange={setWatchlistId}
              selectedSymbolId={selectedWatchlistSymbolId}
              onSelectSymbol={handleWatchlistSelect}
              editable
              className="h-full"
            />
          </div>
        )}

        {/* CENTRE — Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-3 space-y-3">
            {/* Tab content */}
            {activeTab === "options" && (
              <>
                {isCrypto ? (
                  <OptionsChainTab asset={asset} onSelectInstrument={setSelectedInstrument} />
                ) : (
                  <TradFiOptionsChainTab tradFiAsset={tradFiAsset} onSelectInstrument={setSelectedInstrument} />
                )}
                <div className="space-y-1">
                  {isCrypto ? (
                    <>
                      <VolSurfacePanel asset={asset} />
                      <GreeksSurfacePanel asset={asset} />
                    </>
                  ) : (
                    <TradFiVolSurfacePanel tradFiAsset={tradFiAsset} />
                  )}
                </div>
              </>
            )}

            {activeTab === "futures" && isCrypto && (
              <FuturesTab asset={asset} onSelectInstrument={setSelectedInstrument} />
            )}

            {activeTab === "strategies" && (
              <div className="space-y-3">
                <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30 w-fit">
                  <Button
                    variant={strategiesMode === "futures-spreads" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => setStrategiesMode("futures-spreads")}
                    disabled={!isCrypto}
                  >
                    Futures Spreads
                  </Button>
                  <Button
                    variant={strategiesMode === "options-combos" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => setStrategiesMode("options-combos")}
                  >
                    Options Combos
                  </Button>
                </div>
                {strategiesMode === "futures-spreads" && isCrypto ? (
                  <FuturesSpreadsTab onSelectInstrument={setSelectedInstrument} />
                ) : (
                  <OptionsCombosPanel asset={asset} onSelectInstrument={setSelectedInstrument} />
                )}
              </div>
            )}

            {activeTab === "scenario" && (
              <ScenarioTab assetClass={assetClass} asset={asset} tradFiAsset={tradFiAsset} />
            )}
          </div>
        </div>

        {/* RIGHT — Trade panel (hidden on Scenario tab) */}
        {activeTab !== "scenario" && (
          <div className="w-64 shrink-0 border-l overflow-y-auto">
            <div className="p-3">
              <TradePanel instrument={selectedInstrument} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
