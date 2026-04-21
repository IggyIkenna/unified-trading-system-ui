"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SelectedInstrument } from "@/lib/types/options";
import { formatUsd } from "@/lib/mocks/fixtures/options-futures-mock";

interface TradePanelComboProps {
  instrument: SelectedInstrument;
  amount: string;
  setAmount: (v: string) => void;
}

export function TradePanelCombo({ instrument, amount, setAmount }: TradePanelComboProps) {
  const amountNum = parseFloat(amount) || 0;
  const legs = instrument.legs ?? [];
  const netDelta = legs.reduce((s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1), 0);
  const netGamma = legs.reduce((s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1), 0);
  const netTheta = legs.reduce((s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1), 0);
  const netVega = legs.reduce((s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1), 0);
  const netDebit = instrument.netDebit ?? 0;
  const comboMargin = amountNum > 0 ? Math.abs(netDebit) * amountNum * 1.2 : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">Combo Order</p>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            {instrument.comboType}
          </Badge>
        </div>
      </div>

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

      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Net {netDebit > 0 ? "Debit" : "Credit"}</span>
          <span className={cn("font-mono font-bold text-sm", netDebit > 0 ? "text-rose-400" : "text-emerald-400")}>
            {formatUsd(Math.abs(netDebit))}
          </span>
        </div>
      </div>

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
                    {formatNumber(netDelta, 3)}
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
                  <p className="font-mono text-xs font-medium">{formatNumber(netGamma, 4)}</p>
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
                  <p className="font-mono text-xs font-medium">{formatNumber(netVega, 3)}</p>
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
                  <p className="font-mono text-xs font-medium">{formatNumber(netTheta, 1)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Net theta across all legs (USD/day)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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

      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Combined Margin Required</span>
          <span className="font-mono font-medium">{comboMargin > 0 ? formatUsd(comboMargin) : "--"}</span>
        </div>
      </div>

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
