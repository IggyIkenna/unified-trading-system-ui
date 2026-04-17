"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowDown, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_CHAINS, GAS_TOKEN_MIN_THRESHOLDS, DEFI_ALGO_TYPES } from "@/lib/config/services/defi.config";
import type { AlgoType } from "@/lib/types/defi";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function DeFiSwapWidget(props: WidgetComponentProps) {
  const {
    swapTokens,
    executeDeFiOrder,
    selectedChain,
    setSelectedChain,
    chainPortfolios,
    generateSwapRoute,
    getMockPrice,
    calculateBasisTradeFundingImpact,
    calculateBasisTradeCostOfCarry,
  } = useDeFiData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();
  const tokens = swapTokens;

  // Check if this widget is in basis-trade mode
  const isBasisTrade = props.config?.mode === "basis-trade";
  const isStakedBasis = props.config?.mode === "staked-basis";

  const [tokenIn, setTokenIn] = React.useState("USDT");
  const [tokenOut, setTokenOut] = React.useState("ETH");

  React.useEffect(() => {
    if (isStakedBasis) {
      setTokenIn("USDT");
      setTokenOut("weETH");
    }
  }, [isStakedBasis]);

  const [amountIn, setAmountIn] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");
  const [algoType, setAlgoType] = React.useState<AlgoType>("SOR_DEX");

  const swapAlgos = DEFI_ALGO_TYPES.filter((a) =>
    (["SOR_DEX", "SOR_TWAP", "SOR_CROSS_CHAIN"] as string[]).includes(a.value),
  );

  // Gas balance check for selected chain
  const chainPortfolio = chainPortfolios.find((p) => p.chain === selectedChain);
  const gasBalance = chainPortfolio?.gasTokenBalance ?? 0;
  const gasSymbol = chainPortfolio?.gasTokenSymbol ?? "ETH";
  const gasThreshold = GAS_TOKEN_MIN_THRESHOLDS[gasSymbol] ?? 0.01;
  const isGasInsufficient = gasBalance < gasThreshold;

  const amountNum = parseFloat(amountIn) || 0;

  // Dynamic route: recomputes on every input change (amount, tokens, algo, chain)
  const route = React.useMemo(() => {
    if (amountNum <= 0) return null;
    return generateSwapRoute(tokenIn, tokenOut, amountNum, algoType, selectedChain);
  }, [amountNum, tokenIn, tokenOut, algoType, selectedChain, generateSwapRoute]);

  // Loading / empty state: token list not yet available
  if (tokens.length === 0) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
      </div>
    );
  }

  return (
    <FormWidget error={error} onClearError={clearError}>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Chain</label>
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFI_CHAINS.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isGasInsufficient && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
          <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-amber-400">
            Low {gasSymbol} balance ({formatNumber(gasBalance, 4)} {gasSymbol}). You may not have enough gas for this
            swap.
          </span>
        </div>
      )}

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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Routing algo</label>
        <Select value={algoType} onValueChange={(v) => setAlgoType(v as AlgoType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {swapAlgos.map((a) => (
              <SelectItem key={a.value} value={a.value} className="text-xs">
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isStakedBasis && (
        <>
          <Separator className="my-2" />
          <CollapsibleSection title="Staked basis — swap leg" defaultOpen={true}>
            <p className="text-xs text-muted-foreground px-1 pb-2">
              SOR swap stable → weETH (EtherFi LST). Then use{" "}
              <span className="font-mono text-foreground">Transfer &amp; Bridge</span> for Hyperliquid margin and{" "}
              <span className="font-mono text-foreground">Book</span> for ETH-USDC perp short to complete delta-neutral
              deployment.
            </p>
          </CollapsibleSection>
        </>
      )}

      {isBasisTrade && amountIn && (
        <>
          <Separator className="my-2" />
          <CollapsibleSection title="Basis Trade Metrics" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">Funding APY</div>
                <div className="font-mono font-semibold text-green-600">
                  {formatPercent(calculateBasisTradeFundingImpact(tokenOut) / 100, 1)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Cost of Carry</div>
                <div className="font-mono font-semibold text-amber-500">
                  {formatPercent(calculateBasisTradeCostOfCarry(parseFloat(amountIn), tokenOut) / 100, 2)}
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <div className="text-muted-foreground">Net APY</div>
                <div
                  className={cn(
                    "font-mono font-bold",
                    calculateBasisTradeFundingImpact(tokenOut) >
                      calculateBasisTradeCostOfCarry(parseFloat(amountIn), tokenOut)
                      ? "text-green-600"
                      : "text-red-500",
                  )}
                >
                  {formatPercent(
                    (calculateBasisTradeFundingImpact(tokenOut) -
                      calculateBasisTradeCostOfCarry(parseFloat(amountIn), tokenOut)) /
                      100,
                    1,
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {route && (
        <CollapsibleSection title="Route details" defaultOpen={true}>
          <div className="px-2 pb-2 space-y-2">
            {/* Token path */}
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
              <Separator />
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Algo</span>
                <span className="font-mono">{swapAlgos.find((a) => a.value === algoType)?.label ?? algoType}</span>
                <span className="text-muted-foreground">Ref price</span>
                <span className="font-mono">{route.reference_price?.toFixed(6) ?? "—"}</span>
                <span className="text-muted-foreground">Agg. impact</span>
                <span className={cn("font-mono", route.priceImpactPct > 0.5 ? "text-rose-400" : "text-emerald-400")}>
                  {(route.priceImpactPct * 100).toFixed(2)} bps
                </span>
                <span className="text-muted-foreground">Total gas</span>
                <span className="font-mono">
                  {formatNumber(route.gasEstimateEth, 4)} ETH
                  <span className="text-muted-foreground ml-1">(${formatNumber(route.gasEstimateUsd, 2)})</span>
                </span>
              </div>
            </div>

            {/* Per-venue fill breakdown */}
            {route.venue_fills && route.venue_fills.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  SOR Venue Splits ({route.venue_fills.length} venues)
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-2 py-1 text-left">Venue</th>
                      <th className="px-2 py-1 text-right">Alloc</th>
                      <th className="px-2 py-1 text-right">Amount</th>
                      <th className="px-2 py-1 text-right">Fill Price</th>
                      <th className="px-2 py-1 text-right">Impact</th>
                      <th className="px-2 py-1 text-right">Fee</th>
                      <th className="px-2 py-1 text-right">Gas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {route.venue_fills.map((f) => (
                      <tr key={f.venue} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-2 py-1 font-mono">{f.venue_display}</td>
                        <td className="px-2 py-1 text-right font-mono font-medium">{f.allocation_pct.toFixed(1)}%</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(f.input_amount, 4)}</td>
                        <td className="px-2 py-1 text-right font-mono">{f.fill_price.toFixed(6)}</td>
                        <td
                          className={cn(
                            "px-2 py-1 text-right font-mono",
                            f.price_impact_bps > 5 ? "text-rose-400" : "text-emerald-400",
                          )}
                        >
                          {f.price_impact_bps.toFixed(2)} bps
                        </td>
                        <td className="px-2 py-1 text-right font-mono text-muted-foreground">{f.fee_bps} bps</td>
                        <td className="px-2 py-1 text-right font-mono">${formatNumber(f.gas_usd, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      <Button
        className="w-full"
        disabled={amountNum <= 0 || isSubmitting}
        onClick={() =>
          handleSubmit(() => {
            executeDeFiOrder({
              client_id: "internal-trader",
              strategy_id: isBasisTrade ? "BASIS_TRADE" : isStakedBasis ? "STAKED_BASIS" : "AAVE_LENDING",
              instruction_type: "SWAP",
              algo_type: algoType,
              instrument_id: `SWAP:${tokenIn}-${tokenOut}`,
              venue: route?.venue_fills?.map((f) => f.venue).join("+") ?? "UNISWAPV3-ETHEREUM",
              side: "buy",
              order_type: "market",
              quantity: amountNum,
              price: getMockPrice(tokenIn),
              max_slippage_bps: Number(slippage) * 100,
              expected_output: route?.expectedOutput ?? 0,
              benchmark_price: route?.reference_price ?? 0,
              asset_class: "DeFi",
              lane: "defi",
            });
            setAmountIn("");
            toast.success(
              isStakedBasis
                ? "Staked basis swap submitted"
                : isBasisTrade
                  ? "Basis trade swap submitted"
                  : "Swap submitted",
              {
                description: `${amountNum} ${tokenIn} → ${tokenOut} (mock ledger)`,
              },
            );
          })
        }
      >
        <ArrowLeftRight className="size-4 mr-2" />
        {isStakedBasis
          ? "Execute staked-basis swap (USDT → weETH)"
          : isBasisTrade
            ? "Execute Basis Trade Swap"
            : `Swap ${tokenIn} for ${tokenOut}`}
      </Button>
    </FormWidget>
  );
}
