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
