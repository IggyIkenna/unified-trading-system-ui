"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { formatUsd } from "@/lib/mocks/fixtures/options-futures-mock";
import type { OrderType, SelectedInstrument, TradeDirection } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { TrendingDown, TrendingUp } from "lucide-react";
import * as React from "react";
import { TradePanelCombo } from "./trade-panel-combo";
import { TradePanelSpread } from "./trade-panel-spread";

export function TradePanel({ instrument }: { instrument: SelectedInstrument | null }) {
  const [direction, setDirection] = React.useState<TradeDirection>("buy");
  const [orderType, setOrderType] = React.useState<OrderType>("limit");
  const [price, setPrice] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [leverage, setLeverage] = React.useState([10]);

  React.useEffect(() => {
    if (instrument) {
      setPrice(formatNumber(instrument.price, 2));
    }
  }, [instrument]);

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(price) || 0;
  const leverageVal = leverage[0];

  const liqPrice =
    instrument?.type === "future" && priceNum > 0 && leverageVal > 1
      ? direction === "buy"
        ? priceNum * (1 - 1 / leverageVal)
        : priceNum * (1 + 1 / leverageVal)
      : null;

  const marginRequired =
    amountNum > 0 && priceNum > 0 ? (amountNum * priceNum) / (instrument?.type === "future" ? leverageVal : 1) : 0;

  const noInstrument = !instrument;

  if (instrument?.type === "combo") {
    return <TradePanelCombo instrument={instrument} amount={amount} setAmount={setAmount} />;
  }

  if (instrument?.type === "spread") {
    return <TradePanelSpread instrument={instrument} amount={amount} setAmount={setAmount} />;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Selected Instrument</p>
        <p className="text-sm font-mono font-bold truncate">{instrument ? instrument.name : "Click a row to select"}</p>
      </div>

      <Separator />

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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Size (contracts)</label>
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
          disabled={noInstrument}
        />
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

      {instrument?.type === "option" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Implied Volatility</label>
            <div className="p-2 rounded-md border bg-muted/30 font-mono text-sm">
              {instrument.iv != null ? formatPercent(instrument.iv, 1) : "-"}
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Greeks</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&Delta;</p>
                      <p className="font-mono text-xs font-medium">
                        {instrument.delta != null ? formatNumber(instrument.delta, 3) : "-"}
                      </p>
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
                      <p className="font-mono text-xs font-medium">
                        {instrument.gamma != null ? formatNumber(instrument.gamma, 4) : "-"}
                      </p>
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
                      <p className="font-mono text-xs font-medium">
                        {instrument.theta != null ? formatNumber(instrument.theta, 1) : "-"}
                      </p>
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
                      <p className="font-mono text-xs font-medium">
                        {instrument.vega != null ? formatNumber(instrument.vega, 3) : "-"}
                      </p>
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
                  {formatPercent((Math.abs(priceNum - liqPrice) / priceNum) * 100, 1)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <Separator />

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
            asset_group: "CeFi",
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
