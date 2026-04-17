"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { BasisTradeHistoryEntry } from "@/lib/types/defi";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function DeFiBasisTradeWidget(_props: WidgetComponentProps) {
  const {
    executeDeFiOrder,
    basisTradeAssets,
    basisTradeMarketData,
    calculateBasisTradeExpectedOutput,
    calculateBasisTradeMarginUsage,
    calculateBasisTradeFundingImpact,
    calculateBasisTradeCostOfCarry,
    calculateBreakevenFundingRate,
  } = useDeFiData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();

  // Form state
  const [capital, setCapital] = React.useState("100000");
  const [asset, setAsset] = React.useState("ETH");
  const [hedgeRatio, setHedgeRatio] = React.useState("100");
  const [maxSlippageBps, setMaxSlippageBps] = React.useState("5");
  const [operation, setOperation] = React.useState<"SWAP" | "TRADE" | "BOTH">("BOTH");

  // Local trade history state
  const [basisTradeHistory, setBasisTradeHistory] = React.useState<BasisTradeHistoryEntry[]>([]);

  const capitalNum = parseFloat(capital) || 0;
  const slippageBps = parseFloat(maxSlippageBps) || 5;
  const hedgeRatioNum = parseFloat(hedgeRatio) || 100;

  // Get market data for selected asset
  const marketData = basisTradeMarketData[asset];

  // Calculate outputs
  const expectedOutput = calculateBasisTradeExpectedOutput(capitalNum, asset, operation, slippageBps);
  const marginUsage = calculateBasisTradeMarginUsage(capitalNum, asset, marketData?.fundingRate || 0);
  const fundingImpactAPY = calculateBasisTradeFundingImpact(asset);
  const costOfCarry = calculateBasisTradeCostOfCarry(capitalNum, asset);
  const breakeven = calculateBreakevenFundingRate(capitalNum, asset);

  // Profitability check
  const isProfitable = fundingImpactAPY > costOfCarry;
  const netAPY = fundingImpactAPY - costOfCarry;

  const handleExecute = () => {
    if (!capitalNum || capitalNum <= 0) {
      toast.error("Invalid input", {
        description: "Please enter a capital amount greater than 0",
      });
      return;
    }

    // Create new trade history entry
    const newEntry: BasisTradeHistoryEntry = {
      seq: basisTradeHistory.length + 1,
      timestamp: new Date().toISOString(),
      operation,
      asset,
      amount: capitalNum,
      expectedOutput,
      actualOutput: expectedOutput * 0.999, // Simulate minor slippage
      slippage: slippageBps / 10000,
      marginUsage,
      fundingRate: marketData?.fundingRate || 0,
      fundingPnL: expectedOutput * (marketData?.spotPrice || 0) * (marketData?.fundingRate || 0) || 0,
      basisBps: marketData?.basisBps || 0,
      status: "filled",
      runningPnL: basisTradeHistory.reduce((sum, t) => sum + t.fundingPnL, 0),
    };

    setBasisTradeHistory([...basisTradeHistory, newEntry]);

    executeDeFiOrder({
      client_id: "internal-trader",
      strategy_id: "BASIS_TRADE",
      instruction_type: operation === "BOTH" ? "TRADE" : operation,
      algo_type: "BENCHMARK_FILL",
      instrument_id: `BASIS:${asset}:${operation}`,
      venue: `${asset}-PERP`,
      side: "buy",
      order_type: "market",
      quantity: capitalNum,
      price: marketData?.spotPrice ?? 0,
      max_slippage_bps: slippageBps,
      expected_output: expectedOutput,
      benchmark_price: marketData?.spotPrice ?? 0,
      asset_class: "DeFi",
      lane: "defi",
    });

    toast.success("Trade Executed", {
      description: `${operation} order executed successfully`,
    });

    // Reset form
    setCapital("");
    setHedgeRatio("100");
  };

  return (
    <FormWidget error={error} onClearError={clearError}>
      {/* Asset Selection */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Asset</label>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger className="h-8 text-xs" data-testid="asset-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {basisTradeAssets.map((a) => (
              <SelectItem key={a} value={a} className="text-xs">
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-2" />

      {/* Capital Input */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Capital Amount (USDT)</label>
        <Input
          type="number"
          placeholder="100000"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          className="font-mono text-xs h-8"
          data-testid="capital-input"
        />
      </div>

      {/* Slippage */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Max Slippage (bps)</label>
        <Input
          type="number"
          placeholder="5"
          value={maxSlippageBps}
          onChange={(e) => setMaxSlippageBps(e.target.value)}
          className="font-mono text-xs h-8"
          data-testid="slippage-input"
        />
      </div>

      {/* Hedge Ratio */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Hedge Ratio (%)</label>
        <Input
          type="number"
          placeholder="100"
          value={hedgeRatio}
          onChange={(e) => setHedgeRatio(e.target.value)}
          className="font-mono text-xs h-8"
          data-testid="hedge-ratio-input"
        />
      </div>

      {/* Operation Type */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Operation</label>
        <Select value={operation} onValueChange={(val) => setOperation(val as "SWAP" | "TRADE" | "BOTH")}>
          <SelectTrigger className="h-8 text-xs" data-testid="operation-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SWAP" className="text-xs">
              SWAP Only
            </SelectItem>
            <SelectItem value="TRADE" className="text-xs">
              TRADE Only
            </SelectItem>
            <SelectItem value="BOTH" className="text-xs">
              BOTH (SWAP + TRADE)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-2" />

      {/* Calculated Outputs */}
      <CollapsibleSection title="Strategy Metrics" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Expected Output */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Expected Output</div>
            <div className="font-mono font-semibold" data-testid="expected-output">
              {formatNumber(expectedOutput, 4)} {asset}
            </div>
          </div>

          {/* Margin Usage */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Margin Usage</div>
            <div
              className={cn("font-mono font-semibold", marginUsage > 80 ? "text-red-500" : "text-green-600")}
              data-testid="margin-usage"
            >
              {formatPercent(marginUsage / 100, 1)}
            </div>
          </div>

          {/* Funding Rate APY */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Funding APY</div>
            <div
              className={cn("font-mono font-semibold", fundingImpactAPY > 0 ? "text-green-600" : "text-red-500")}
              data-testid="funding-apy"
            >
              {formatPercent(fundingImpactAPY / 100, 1)}
            </div>
          </div>

          {/* Cost of Carry */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Cost of Carry</div>
            <div className="font-mono font-semibold text-amber-500" data-testid="cost-of-carry">
              {formatPercent(costOfCarry / 100, 2)}
            </div>
          </div>

          {/* Net APY */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Net APY</div>
            <div
              className={cn("font-mono font-bold", isProfitable ? "text-green-600" : "text-red-500")}
              data-testid="net-apy"
            >
              {formatPercent(netAPY / 100, 1)}
            </div>
          </div>

          {/* Breakeven Funding */}
          <div className="space-y-1">
            <div className="text-muted-foreground">Breakeven Funding</div>
            <div className="font-mono font-semibold text-blue-500" data-testid="breakeven-funding">
              {formatPercent(breakeven / 100, 2)}
            </div>
          </div>
        </div>

        {/* Profitability Badge */}
        <div className="mt-2">
          {isProfitable ? (
            <Badge className="bg-green-600">Profitable ({formatPercent(netAPY / 100, 1)} APY)</Badge>
          ) : (
            <Badge variant="destructive">Unprofitable ({formatPercent(netAPY / 100, 1)} APY)</Badge>
          )}
        </div>
      </CollapsibleSection>

      {/* Execute Button */}
      <Button
        onClick={() => handleSubmit(handleExecute)}
        disabled={!capitalNum || capitalNum <= 0 || isSubmitting}
        className="w-full h-8 text-xs"
        data-testid="execute-button"
      >
        <TrendingUp className="size-3 mr-1" />
        Execute {operation}
      </Button>

      <Separator className="my-2" />

      {/* Trade History */}
      <CollapsibleSection title={`Trade History (${basisTradeHistory.length} trades)`} defaultOpen={false}>
        {basisTradeHistory.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">No trades yet</div>
        ) : (
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            {basisTradeHistory.map((trade) => (
              <div key={trade.seq} className="p-2 border rounded-sm bg-muted/20" data-testid="trade-history-row">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-mono font-semibold">#{trade.seq}</div>
                  <Badge variant={trade.status === "filled" ? "outline" : "secondary"} className="text-xs">
                    {trade.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <div>{trade.operation}</div>
                  <div>{trade.asset}</div>
                  <div>${formatNumber(trade.amount, 0)}</div>
                  <div>{formatNumber(trade.expectedOutput, 4)}</div>
                  <div>Margin: {formatPercent(trade.marginUsage / 100, 1)}</div>
                  <div>Funding: {formatPercent(trade.fundingRate, 3)}</div>
                </div>
                <div className="mt-1 font-mono font-semibold text-green-600">
                  PnL: ${formatNumber(trade.runningPnL, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </FormWidget>
  );
}
