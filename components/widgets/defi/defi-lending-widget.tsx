"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { SLIPPAGE_OPTIONS } from "@/lib/config/services/defi.config";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { useActiveStrategyId } from "@/hooks/use-active-strategy-id";
import { asDeFiStrategyId } from "@/lib/types/defi";
import { AlertTriangle, ArrowDown, Shield } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeFiData } from "./defi-data-context";

export function DeFiLendingWidget(_props: WidgetComponentProps) {
  const {
    lendingProtocols,
    selectedLendingProtocol,
    setSelectedLendingProtocol,
    healthFactor: currentHf,
    executeDeFiOrder,
    getAssetParams,
    calculateHealthFactorDelta,
  } = useDeFiData();
  const activeStrategyId = useActiveStrategyId();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();

  // Context is synchronous (mock) so isLoading is always false;
  // retained for when a real data source is wired in.
  const isLoading = false;

  const [operation, setOperation] = React.useState<"LEND" | "BORROW" | "WITHDRAW" | "REPAY">("LEND");
  const [asset, setAsset] = React.useState("ETH");
  const [amount, setAmount] = React.useState("");
  const [maxSlippageBps, setMaxSlippageBps] = React.useState(50);

  const selectedProtocol = lendingProtocols.find((p) => p.name === selectedLendingProtocol) ?? lendingProtocols[0];
  const supplyApy = selectedProtocol ? (selectedProtocol.supplyApy[asset] ?? 0) : 0;
  const borrowApy = selectedProtocol ? (selectedProtocol.borrowApy[asset] ?? 0) : 0;

  const amountNum = parseFloat(amount) || 0;

  // Get asset parameters from DeFi protocol data (realistic Aave/Morpho/Compound values)
  const assetParams = getAssetParams("AAVEV3", asset);
  const amountUsd = amountNum * (assetParams?.price_usd ?? 1);

  // Health factor changes based on protocol parameters and operation type
  const hfDelta = calculateHealthFactorDelta("AAVEV3", asset, operation, amountUsd, currentHf);
  const newHf = Math.max(0, currentHf + hfDelta);

  React.useEffect(() => {
    if (selectedProtocol && !selectedProtocol.assets.includes(asset)) {
      setAsset(selectedProtocol.assets[0] ?? "ETH");
    }
  }, [selectedProtocol, asset]);

  if (!selectedProtocol) {
    return (
      <div className="p-2 text-xs text-rose-400 flex items-center gap-1.5">
        <AlertTriangle className="size-3.5 shrink-0" />
        No lending protocols available.
      </div>
    );
  }

  return (
    <FormWidget isLoading={isLoading} error={error} onClearError={clearError}>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Protocol</label>
        <Select value={selectedLendingProtocol} onValueChange={setSelectedLendingProtocol}>
          <SelectTrigger data-testid="protocol-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lendingProtocols.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                <span>{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">{p.venue_id}</span>
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
            data-testid={`operation-button-${op}`}
          >
            {op}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Asset</label>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger data-testid="asset-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectedProtocol.assets.map((a) => (
              <SelectItem key={a} value={a}>
                <span className="font-mono">{a}</span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  Supply {formatPercent(selectedProtocol.supplyApy[a] ?? 0, 1)} / Borrow{" "}
                  {formatPercent(selectedProtocol.borrowApy[a] ?? 0, 1)}
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
          data-testid="amount-input"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Max slippage</label>
        <Select value={String(maxSlippageBps)} onValueChange={(v) => setMaxSlippageBps(Number(v))}>
          <SelectTrigger className="h-8 text-xs" data-testid="slippage-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLIPPAGE_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={String(s.value)} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {amountNum > 0 && (
        <div className="flex items-center justify-between text-xs px-1" data-testid="expected-output">
          <span className="text-muted-foreground">Expected output</span>
          <span className="font-mono">
            {(() => {
              const slippageMultiplier = 1 - maxSlippageBps / 10000;
              let outputAmount = amountNum * slippageMultiplier;
              let outputAsset = asset;

              // Different expected outputs based on operation
              if (operation === "LEND") {
                // LEND: convert to aToken (1:1 at current liquidity index)
                outputAsset = `a${asset}`;
                outputAmount = amountNum * slippageMultiplier;
              } else if (operation === "BORROW") {
                // BORROW: borrowed amount with interest rate applied
                outputAsset = asset;
                outputAmount = amountNum * slippageMultiplier;
              } else if (operation === "WITHDRAW") {
                // WITHDRAW: aToken burned, underlying + accrued yield received
                outputAsset = asset;
                // Add ~0.5% yield accrual for demo (varies by APY)
                const yieldMultiplier = 1.005;
                outputAmount = amountNum * yieldMultiplier * slippageMultiplier;
              } else if (operation === "REPAY") {
                // REPAY: debt reduction (principal + accrued interest)
                outputAsset = asset;
                // Interest accrual ~0.3% (lower than lending yield)
                const interestMultiplier = 1.003;
                outputAmount = amountNum * interestMultiplier * slippageMultiplier;
              }

              return `${formatNumber(outputAmount, 4)} ${outputAsset}`;
            })()}
          </span>
        </div>
      )}

      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Supply APY</span>
          <span className="font-mono text-emerald-400" data-testid="supply-apy">
            {formatPercent(supplyApy, 2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Borrow APY</span>
          <span className="font-mono text-rose-400" data-testid="borrow-apy">
            {formatPercent(borrowApy, 2)}
          </span>
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
              data-testid="current-hf"
            >
              {formatNumber(currentHf, 2)}
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
              data-testid="after-hf"
            >
              {amountNum > 0 ? formatNumber(newHf, 2) : "—"}
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
          <span className="text-muted-foreground">Collateral ratio</span>
          <span className="font-mono">{formatPercent(currentHf * 75, 0)}</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={amountNum <= 0 || isSubmitting}
        onClick={() =>
          handleSubmit(() => {
            executeDeFiOrder({
              client_id: "internal-trader",
              strategy_id: asDeFiStrategyId(activeStrategyId) ?? "AAVE_LENDING",
              instruction_type: operation,
              algo_type: "DIRECT",
              instrument_id: `${selectedProtocol.venue_id}:${operation}:${asset}`,
              venue: selectedProtocol.venue_id,
              side: operation === "LEND" || operation === "REPAY" ? "buy" : "sell",
              order_type: "market",
              quantity: amountNum,
              price: 1,
              max_slippage_bps: maxSlippageBps,
              expected_output: amountNum * (1 - maxSlippageBps / 10000),
              benchmark_price: 1,
              asset_class: "DeFi",
              lane: "defi",
            });
            setAmount("");
            toast.success("DeFi order placed", {
              description: `${operation} ${amountNum} ${asset} on ${selectedLendingProtocol}`,
            });
          })
        }
        data-testid="execute-button"
      >
        {operation} {asset}
      </Button>
    </FormWidget>
  );
}
