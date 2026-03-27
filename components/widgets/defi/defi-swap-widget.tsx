"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, ArrowLeftRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CollapsibleSection } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";

export function DeFiSwapWidget(_props: WidgetComponentProps) {
  const { swapTokens, swapRoute, executeDeFiOrder } = useDeFiData();
  const tokens = swapTokens as string[];

  const [tokenIn, setTokenIn] = React.useState("ETH");
  const [tokenOut, setTokenOut] = React.useState("USDC");
  const [amountIn, setAmountIn] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");

  const amountNum = parseFloat(amountIn) || 0;
  const route = amountNum > 0 && swapRoute ? swapRoute : null;

  return (
    <div className="space-y-3 p-1">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">You pay</label>
        <div className="flex gap-2">
          <Select value={tokenIn} onValueChange={setTokenIn}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="font-mono">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="font-mono flex-1"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
          }}
        >
          <ArrowLeftRight className="size-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">You receive</label>
        <div className="flex gap-2">
          <Select value={tokenOut} onValueChange={setTokenOut}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="font-mono">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex items-center px-3 border rounded-md bg-muted/30 font-mono text-sm">
            {route ? route.expectedOutput.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Slippage tolerance</label>
        <div className="flex gap-1.5">
          {["0.1", "0.5", "1"].map((s) => (
            <Button
              key={s}
              variant={slippage === s ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={() => setSlippage(s)}
            >
              {s}%
            </Button>
          ))}
        </div>
      </div>

      {route && (
        <CollapsibleSection title="Route details" defaultOpen={false}>
          <div className="px-2 pb-2 space-y-2">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {route.path.map((token, i) => (
                  <React.Fragment key={token}>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {token}
                    </Badge>
                    {i < route.path.length - 1 && (
                      <ArrowDown className="size-3 text-muted-foreground rotate-[-90deg]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground">{route.pools.join(" › ")}</div>
              <Separator />
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Price impact</span>
                <span className={cn("font-mono", route.priceImpactPct > 0.5 ? "text-rose-400" : "text-emerald-400")}>
                  {route.priceImpactPct.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">Gas estimate</span>
                <span className="font-mono">
                  {route.gasEstimateEth.toFixed(4)} ETH
                  <span className="text-muted-foreground ml-1">(${route.gasEstimateUsd.toFixed(2)})</span>
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          executeDeFiOrder({
            client_id: "internal-trader",
            instrument_id: `SWAP:${tokenIn}-${tokenOut}`,
            venue: "Uniswap",
            side: "buy",
            order_type: "market",
            quantity: amountNum,
            price: route?.expectedOutput ?? 0,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmountIn("");
          toast({
            title: "Swap submitted",
            description: `${amountNum} ${tokenIn} → ${tokenOut} (mock ledger)`,
          });
        }}
      >
        <ArrowLeftRight className="size-4 mr-2" />
        Swap {tokenIn} for {tokenOut}
      </Button>
    </div>
  );
}
