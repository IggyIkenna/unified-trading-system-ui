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
