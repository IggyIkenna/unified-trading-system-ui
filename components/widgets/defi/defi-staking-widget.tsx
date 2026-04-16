"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Coins, TrendingUp } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeFiData } from "./defi-data-context";

export function DeFiStakingWidget(_props: WidgetComponentProps) {
  const { stakingProtocols, tokenBalances, executeDeFiOrder } = useDeFiData();

  const [protocol, setProtocol] = React.useState(stakingProtocols[0]?.name ?? "Lido");
  const [operation, setOperation] = React.useState<"STAKE" | "UNSTAKE">("STAKE");
  const [amount, setAmount] = React.useState("");

  const selected = stakingProtocols.find((p) => p.name === protocol) ?? stakingProtocols[0];
  const amountNum = parseFloat(amount) || 0;
  const annualYield = amountNum * ((selected?.apy ?? 0) / 100);
  const balanceForAsset = selected ? (tokenBalances[selected.asset] ?? tokenBalances.WETH ?? 32) : 32;

  if (!selected) {
    return <div className="p-2 text-xs text-muted-foreground">No staking protocols (mock).</div>;
  }

  return (
    <div className="space-y-3 p-1">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={operation === "STAKE" ? "default" : "outline"}
          size="sm"
          className={cn("text-xs", operation === "STAKE" && "bg-emerald-600 hover:bg-emerald-700")}
          onClick={() => setOperation("STAKE")}
        >
          <TrendingUp className="size-3 mr-1.5" />
          Stake
        </Button>
        <Button
          variant={operation === "UNSTAKE" ? "default" : "outline"}
          size="sm"
          className={cn("text-xs", operation === "UNSTAKE" && "bg-rose-600 hover:bg-rose-700")}
          onClick={() => setOperation("UNSTAKE")}
        >
          Unstake
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Protocol</label>
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stakingProtocols.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
                <span className="text-[10px] text-muted-foreground ml-2">
                  APY {formatPercent(p.apy, 1)} / TVL ${formatNumber(p.tvl / 1_000_000_000, 1)}B
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Amount ({selected.asset})</label>
        <Input
          type="number"
          placeholder="0.00"
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
              className="h-6 px-2 text-[10px] flex-1"
              onClick={() => setAmount(formatNumber((balanceForAsset * pct) / 100, 4))}
            >
              {pct}%
            </Button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expected APY</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">{formatPercent(selected.apy, 1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Annual yield (mock)</span>
          <span className="font-mono text-emerald-400">
            {amountNum > 0 ? `${formatNumber(annualYield, 4)} ${selected.asset}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">TVL</span>
          <span className="font-mono">${formatNumber(selected.tvl / 1_000_000_000, 1)}B</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Min stake</span>
          <span className="font-mono">{selected.minStake > 0 ? `${selected.minStake} ${selected.asset}` : "None"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Unbonding</span>
          <span className="font-mono">{selected.unbondingDays > 0 ? `${selected.unbondingDays} days` : "Instant"}</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          executeDeFiOrder({
            client_id: "internal-trader",
            strategy_id: "ETHENA_BENCHMARK",
            instruction_type: operation,
            algo_type: "BENCHMARK_FILL",
            instrument_id: `${selected.venue_id}:LST:ST${selected.asset}@ETHEREUM`,
            venue: selected.venue_id,
            side: operation === "STAKE" ? "buy" : "sell",
            order_type: "market",
            quantity: amountNum,
            price: selected.apy,
            max_slippage_bps: 50,
            expected_output: amountNum,
            benchmark_price: selected.apy,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmount("");
          toast.success("Staking order placed", {
            description: `${operation} ${amountNum} ${selected.asset} on ${protocol} (mock ledger)`,
          });
        }}
      >
        <Coins className="size-4 mr-2" />
        {operation} {selected.asset} on {protocol}
      </Button>
    </div>
  );
}
