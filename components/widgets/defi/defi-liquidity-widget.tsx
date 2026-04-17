"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { Droplets, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_FEE_TIERS } from "@/lib/config/services/defi.config";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function DeFiLiquidityWidget(_props: WidgetComponentProps) {
  const { liquidityPools, executeDeFiOrder } = useDeFiData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();

  const [selectedPool, setSelectedPool] = React.useState(liquidityPools[0]?.name ?? "");
  const [feeTier, setFeeTier] = React.useState("0.05");
  const [operation, setOperation] = React.useState<"ADD_LIQUIDITY" | "REMOVE_LIQUIDITY">("ADD_LIQUIDITY");
  const [amount, setAmount] = React.useState("");
  const [priceMin, setPriceMin] = React.useState("");
  const [priceMax, setPriceMax] = React.useState("");

  const pool = liquidityPools.find((p) => p.name === selectedPool) ?? liquidityPools[0];

  if (!pool) {
    return <div className="p-4 text-xs text-muted-foreground text-center">No liquidity pools available.</div>;
  }

  return (
    <FormWidget error={error} onClearError={clearError}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={operation === "ADD_LIQUIDITY" ? "default" : "outline"}
          size="sm"
          className={cn("text-xs", operation === "ADD_LIQUIDITY" && "bg-emerald-600 hover:bg-emerald-700")}
          onClick={() => setOperation("ADD_LIQUIDITY")}
        >
          <Plus className="size-3 mr-1.5" />
          Add liquidity
        </Button>
        <Button
          variant={operation === "REMOVE_LIQUIDITY" ? "default" : "outline"}
          size="sm"
          className={cn("text-xs", operation === "REMOVE_LIQUIDITY" && "bg-rose-600 hover:bg-rose-700")}
          onClick={() => setOperation("REMOVE_LIQUIDITY")}
        >
          <Trash2 className="size-3 mr-1.5" />
          Remove liquidity
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Pool</label>
        <Select value={selectedPool} onValueChange={setSelectedPool}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {liquidityPools.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                <span className="font-mono">{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  TVL ${formatNumber(p.tvl / 1_000_000, 0)}M / APR {formatPercent(p.apr24h, 1)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Fee tier</label>
        <div className="grid grid-cols-4 gap-1">
          {DEFI_FEE_TIERS.map((ft) => (
            <Button
              key={ft.value}
              variant={feeTier === ft.value ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-10 flex flex-col gap-0 px-1"
              onClick={() => setFeeTier(ft.value)}
            >
              <span className="font-mono font-bold">{ft.label}</span>
              <span className="text-muted-foreground">{ft.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Price range ({pool.token1} per {pool.token0})
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Min price</span>
            <Input
              type="number"
              placeholder="0.00"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Max price</span>
            <Input
              type="number"
              placeholder="0.00"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Position size ({pool.token0})</label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
      </div>

      <CollapsibleSection title="Pool TVL / APR" defaultOpen={false}>
        <div className="px-2 pb-2">
          <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">TVL</span>
              <span className="font-mono">${formatNumber(pool.tvl / 1_000_000, 0)}M</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">24h APR</span>
              <span className="font-mono text-emerald-400">{formatPercent(pool.apr24h, 1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pool fee tier</span>
              <span className="font-mono">{pool.feeTier}%</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <Button
        className="w-full"
        disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
        onClick={() => {
          const amountNum = parseFloat(amount) || 0;
          handleSubmit(() => {
            executeDeFiOrder({
              client_id: "internal-trader",
              strategy_id: "AMM_LP",
              instruction_type: operation,
              algo_type: "AMM_CONCENTRATED",
              instrument_id: `${pool.venue_id}:LP:${pool.name}`,
              venue: pool.venue_id,
              side: operation === "ADD_LIQUIDITY" ? "buy" : "sell",
              order_type: "market",
              quantity: amountNum,
              price: pool.apr24h,
              max_slippage_bps: 50,
              expected_output: amountNum,
              benchmark_price: pool.apr24h,
              asset_class: "DeFi",
              lane: "defi",
            });
            setAmount("");
            toast.success("Liquidity order placed", {
              description: `${operation === "ADD_LIQUIDITY" ? "Add" : "Remove"} ${amountNum} ${pool.token0} in ${pool.name} (mock ledger)`,
            });
          });
        }}
      >
        <Droplets className="size-4 mr-2" />
        {operation === "ADD_LIQUIDITY" ? "Add" : "Remove"} liquidity
      </Button>
    </FormWidget>
  );
}
