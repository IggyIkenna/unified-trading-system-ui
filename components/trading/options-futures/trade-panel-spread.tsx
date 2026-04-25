"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { formatUsd } from "@/lib/mocks/fixtures/options-futures-mock";
import type { SelectedInstrument } from "@/lib/types/options";
import { formatNumber } from "@/lib/utils/formatters";

interface TradePanelSpreadProps {
  instrument: SelectedInstrument;
  amount: string;
  setAmount: (v: string) => void;
}

export function TradePanelSpread({ instrument, amount, setAmount }: TradePanelSpreadProps) {
  const amountNum = parseFloat(amount) || 0;
  const spreadMargin = amountNum > 0 ? Math.abs(instrument.spreadAsk ?? 0) * amountNum * 1.2 : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Spread Order</p>
        <div className="text-sm font-mono font-bold">
          <p className="truncate text-emerald-400">Long: {instrument.longLeg}</p>
          <p className="truncate text-rose-400">Short: {instrument.shortLeg}</p>
        </div>
      </div>

      <Separator />

      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Spread Pricing</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bid</span>
          <span className="font-mono font-medium text-emerald-400">
            {instrument.spreadBid !== undefined
              ? `${instrument.spreadBid >= 0 ? "+" : ""}${formatNumber(instrument.spreadBid, 2)}`
              : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Ask</span>
          <span className="font-mono font-medium">
            {instrument.spreadAsk !== undefined
              ? `${instrument.spreadAsk >= 0 ? "+" : ""}${formatNumber(instrument.spreadAsk, 2)}`
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
          <span className="font-mono font-medium">{spreadMargin > 0 ? formatUsd(spreadMargin) : "--"}</span>
        </div>
      </div>

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
            asset_group: "CeFi",
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
