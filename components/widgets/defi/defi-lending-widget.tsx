"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowDown, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";

export function DeFiLendingWidget(_props: WidgetComponentProps) {
  const {
    lendingProtocols,
    selectedLendingProtocol,
    setSelectedLendingProtocol,
    healthFactor: currentHf,
    executeDeFiOrder,
  } = useDeFiData();

  const [operation, setOperation] = React.useState<"LEND" | "BORROW" | "WITHDRAW" | "REPAY">("LEND");
  const [asset, setAsset] = React.useState("ETH");
  const [amount, setAmount] = React.useState("");

  const selectedProtocol = lendingProtocols.find((p) => p.name === selectedLendingProtocol) ?? lendingProtocols[0];
  const supplyApy = selectedProtocol ? (selectedProtocol.supplyApy[asset] ?? 0) : 0;
  const borrowApy = selectedProtocol ? (selectedProtocol.borrowApy[asset] ?? 0) : 0;

  const amountNum = parseFloat(amount) || 0;
  const hfDelta = operation === "LEND" || operation === "REPAY" ? amountNum * 0.01 : -(amountNum * 0.015);
  const newHf = Math.max(0, currentHf + hfDelta);

  React.useEffect(() => {
    if (selectedProtocol && !selectedProtocol.assets.includes(asset)) {
      setAsset(selectedProtocol.assets[0] ?? "ETH");
    }
  }, [selectedProtocol, asset]);

  if (!selectedProtocol) {
    return <div className="p-2 text-xs text-muted-foreground">No lending protocols (mock).</div>;
  }

  return (
    <div className="space-y-3 p-1">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Protocol</label>
        <Select value={selectedLendingProtocol} onValueChange={setSelectedLendingProtocol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lendingProtocols.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {(["LEND", "BORROW", "WITHDRAW", "REPAY"] as const).map((op) => (
          <Button
            key={op}
            variant={operation === op ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-8",
              operation === op && (op === "LEND" || op === "REPAY")
                ? "bg-emerald-600 hover:bg-emerald-700"
                : operation === op
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "",
            )}
            onClick={() => setOperation(op)}
          >
            {op}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Asset</label>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectedProtocol.assets.map((a) => (
              <SelectItem key={a} value={a}>
                <span className="font-mono">{a}</span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  Supply {selectedProtocol.supplyApy[a]?.toFixed(1)}% / Borrow{" "}
                  {selectedProtocol.borrowApy[a]?.toFixed(1)}%
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Amount</label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
      </div>

      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Supply APY</span>
          <span className="font-mono text-emerald-400">{supplyApy.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Borrow APY</span>
          <span className="font-mono text-rose-400">{borrowApy.toFixed(2)}%</span>
        </div>
      </div>

      <div className="p-3 rounded-lg border space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Shield className="size-3.5" />
          Health factor preview
        </p>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Current</p>
            <p
              className={cn(
                "text-lg font-mono font-bold",
                currentHf >= 1.5 ? "text-emerald-400" : currentHf >= 1.1 ? "text-amber-400" : "text-rose-400",
              )}
            >
              {currentHf.toFixed(2)}
            </p>
          </div>
          <ArrowDown className="size-4 text-muted-foreground rotate-[-90deg]" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">After</p>
            <p
              className={cn(
                "text-lg font-mono font-bold",
                newHf >= 1.5 ? "text-emerald-400" : newHf >= 1.1 ? "text-amber-400" : "text-rose-400",
              )}
            >
              {amountNum > 0 ? newHf.toFixed(2) : "—"}
            </p>
          </div>
        </div>
        {newHf > 0 && newHf < 1.1 && amountNum > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertTriangle className="size-3.5" />
            Liquidation risk below 1.1
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Collateral ratio (mock)</span>
          <span className="font-mono">{(currentHf * 75).toFixed(0)}%</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          executeDeFiOrder({
            client_id: "internal-trader",
            instrument_id: `${selectedLendingProtocol.replace(/ /g, "_")}:${operation}:${asset}`,
            venue: selectedLendingProtocol,
            side: operation === "LEND" || operation === "REPAY" ? "buy" : "sell",
            order_type: "market",
            quantity: amountNum,
            price: operation === "LEND" ? supplyApy : borrowApy,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmount("");
          toast({
            title: "DeFi order placed",
            description: `${operation} ${amountNum} ${asset} on ${selectedLendingProtocol} (mock ledger)`,
          });
        }}
      >
        {operation} {asset}
      </Button>
    </div>
  );
}
