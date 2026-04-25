"use client";

import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useActiveStrategyId } from "@/hooks/use-active-strategy-id";
import { useGasEstimate } from "@/hooks/use-gas-estimate";
import {
  CHAIN_GAS_BASELINE,
  CHAIN_GAS_BASELINE_DEFAULT,
  DEFI_CHAINS,
  DEFI_TOKENS,
  GAS_TOKEN_MIN_THRESHOLDS,
} from "@/lib/config/services/defi.config";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { AlertTriangle, ArrowRight, Clock, Fuel, Globe, Send, Trophy, Wallet } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeFiData } from "./defi-data-context";

export function DeFiTransferWidget(_props: WidgetComponentProps) {
  const {
    connectedWallet,
    tokenBalances,
    transferMode,
    setTransferMode,
    selectedChain,
    setSelectedChain,
    getBridgeRoutes,
    executeDeFiOrder,
    chainPortfolios,
    getMockPrice,
  } = useDeFiData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();
  const activeStrategyId = useActiveStrategyId();

  // Context is synchronous (mock) so isLoading is always false;
  // retained for when a real data source is wired in.
  const isLoading = false;

  const [toAddress, setToAddress] = React.useState("");
  const [fromChain, setFromChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [toChain, setToChain] = React.useState<string>(DEFI_CHAINS[1]);
  const [token, setToken] = React.useState<string>(DEFI_TOKENS[0]);
  const [amount, setAmount] = React.useState("");
  const [selectedRoute, setSelectedRoute] = React.useState<string>("");

  const amountNum = parseFloat(amount) || 0;
  const balance = tokenBalances[token] ?? 0;

  // Send: native-token transfer is cheaper (21k gas) vs ERC-20 (~65k gas).
  const sendNativeSymbol = (CHAIN_GAS_BASELINE[selectedChain] ?? CHAIN_GAS_BASELINE_DEFAULT).nativeSymbol;
  const sendOperation = token === sendNativeSymbol ? "NATIVE_TRANSFER" : "ERC20_TRANSFER";
  const sendGas = useGasEstimate({ chain: selectedChain, operation: sendOperation });

  // Bridge: source-chain lock/burn tx gas; destination gas is baked into protocol fee.
  const bridgeGas = useGasEstimate({ chain: fromChain, operation: "BRIDGE_LOCK" });

  const routes = React.useMemo(
    () => getBridgeRoutes(token, amountNum, fromChain, toChain),
    [getBridgeRoutes, token, amountNum, fromChain, toChain],
  );

  React.useEffect(() => {
    const bestReturn = routes.find((r) => r.isBestReturn);
    if (bestReturn) {
      setSelectedRoute(bestReturn.protocol);
    } else if (routes.length > 0) {
      setSelectedRoute(routes[0].protocol);
    } else {
      setSelectedRoute("");
    }
  }, [routes]);

  const truncateAddr = (addr: string | null) => {
    if (!addr || addr.length < 12) return addr ?? "\u2014";
    return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
  };

  if (!connectedWallet) {
    return (
      <div className="p-2 text-xs text-muted-foreground flex items-center gap-1.5">
        <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
        No wallet connected. Connect a wallet to send or bridge tokens.
      </div>
    );
  }

  return (
    <FormWidget isLoading={isLoading} error={error} onClearError={clearError} data-testid="defi-transfer-widget">
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant={transferMode === "send" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setTransferMode("send")}
          data-testid="transfer-mode-send"
        >
          <Send className="size-3" />
          Send
        </Button>
        <Button
          variant={transferMode === "bridge" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setTransferMode("bridge")}
          data-testid="transfer-mode-bridge"
        >
          <Globe className="size-3" />
          Bridge
        </Button>
      </div>

      {transferMode === "send" ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">From wallet</span>
              <code className="ml-auto font-mono text-[11px]">{truncateAddr(connectedWallet)}</code>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To address</label>
            <Input
              placeholder="0x… or ENS"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="font-mono text-xs"
              data-testid="to-address-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs text-muted-foreground">Chain</label>
              <Select
                value={selectedChain}
                onValueChange={(v) => {
                  setSelectedChain(v);
                }}
              >
                <SelectTrigger size="sm" className="text-xs w-full" data-testid="chain-from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs text-muted-foreground">Token</label>
              <Select value={token} onValueChange={setToken}>
                <SelectTrigger size="sm" className="text-xs w-full" data-testid="asset-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_TOKENS.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="font-mono">{t}</span>
                      <span className="text-micro text-muted-foreground ml-2">
                        Bal: {(tokenBalances[t] ?? 0).toLocaleString()}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Amount</label>
                <span className="text-micro text-muted-foreground font-mono truncate">
                  Bal: {balance.toLocaleString()} {token}
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono h-8 text-xs w-full"
                data-testid="amount-input"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Fuel className="size-3" />
                Gas estimate
              </label>
              <div
                className="h-8 px-3 rounded-md border bg-muted/30 flex items-center justify-end font-mono text-xs"
                title={`${sendGas.gasUnits.toLocaleString()} units × ${(sendGas.baseFeeGwei + sendGas.priorityFeeGwei).toFixed(2)} gwei @ $${sendGas.nativeUsd.toFixed(0)}/${sendGas.nativeSymbol}`}
              >
                ~{formatNumber(sendGas.nativeFee, 5)} {sendGas.nativeSymbol} (${sendGas.usdFee.toFixed(2)})
              </div>
            </div>
          </div>

          {(() => {
            const cp = chainPortfolios.find((p) => p.chain === selectedChain);
            const gb = cp?.gasTokenBalance ?? 0;
            const gs = cp?.gasTokenSymbol ?? "ETH";
            const thr = GAS_TOKEN_MIN_THRESHOLDS[gs] ?? 0.01;
            if (gb < thr) {
              return (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-400">
                    Low {gs} balance ({formatNumber(gb, 4)} {gs}). Transfer may fail due to insufficient gas.
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <Button
            className="w-full"
            disabled={amountNum <= 0 || amountNum > balance || !toAddress || isSubmitting}
            data-testid="execute-button"
            onClick={() =>
              handleSubmit(() => {
                const price = getMockPrice(token);
                executeDeFiOrder({
                  client_id: "internal-trader",
                  strategy_id: activeStrategyId ?? "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
                  instruction_type: "TRANSFER",
                  algo_type: "DIRECT",
                  instrument_id: `TRANSFER:${token}@${selectedChain}`,
                  venue: `WALLET-${selectedChain}`,
                  side: "sell",
                  order_type: "market",
                  quantity: amountNum,
                  price,
                  max_slippage_bps: 0,
                  expected_output: amountNum * price,
                  benchmark_price: price,
                  asset_group: "DeFi",
                  lane: "defi",
                });
                toast.success("Transfer submitted", {
                  description: `${amountNum} ${token} → ${toAddress.slice(0, 10)}... on ${selectedChain}`,
                });
                setAmount("");
              })
            }
          >
            <Send className="size-3.5 mr-1.5" />
            Send {token}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">From chain</label>
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger data-testid="chain-from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">To chain</label>
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger data-testid="chain-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Token</label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger data-testid="asset-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_TOKENS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono">{t}</span>
                    <span className="text-micro text-muted-foreground ml-2">
                      Bal: {(tokenBalances[t] ?? 0).toLocaleString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Amount</label>
                <span className="text-micro text-muted-foreground font-mono truncate">
                  Bal: {balance.toLocaleString()} {token}
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono h-8 text-xs w-full"
                data-testid="amount-input"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Fuel className="size-3" />
                Source gas
              </label>
              <div
                className="h-8 px-3 rounded-md border bg-muted/30 flex items-center justify-end font-mono text-xs"
                title={`${bridgeGas.gasUnits.toLocaleString()} units × ${(bridgeGas.baseFeeGwei + bridgeGas.priorityFeeGwei).toFixed(2)} gwei @ $${bridgeGas.nativeUsd.toFixed(0)}/${bridgeGas.nativeSymbol}`}
              >
                ~{formatNumber(bridgeGas.nativeFee, 5)} {bridgeGas.nativeSymbol} (${bridgeGas.usdFee.toFixed(2)})
              </div>
            </div>
          </div>

          {routes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Available routes</span>
                <span className="text-micro text-muted-foreground">
                  {fromChain} <ArrowRight className="inline size-2.5" /> {toChain}
                </span>
              </div>
              <div className="space-y-1.5">
                {routes.map((route) => (
                  <button
                    key={route.protocol}
                    type="button"
                    className={cn(
                      "w-full rounded-lg border p-2.5 text-left transition-colors",
                      selectedRoute === route.protocol
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20 hover:bg-muted/40",
                    )}
                    onClick={() => setSelectedRoute(route.protocol)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "size-3.5 rounded-full border-2 flex items-center justify-center",
                            selectedRoute === route.protocol ? "border-primary" : "border-muted-foreground/40",
                          )}
                        >
                          {selectedRoute === route.protocol && <div className="size-1.5 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs font-medium">{route.protocol}</span>
                        {route.isBestReturn && (
                          <Badge variant="default" className="h-4 px-1 text-nano gap-0.5">
                            <Trophy className="size-2.5" />
                            Best Return
                          </Badge>
                        )}
                        {route.isFastest && (
                          <Badge variant="outline" className="h-4 px-1 text-nano gap-0.5">
                            <Clock className="size-2.5" />
                            Fastest
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-mono font-medium">
                        {route.outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pl-5">
                      <span className="text-micro text-muted-foreground">
                        Fee: {route.feePct}% (${formatNumber(route.feeUsd, 2)})
                      </span>
                      <span className="text-micro text-muted-foreground flex items-center gap-0.5">
                        <Clock className="size-2.5" />~{route.estimatedTimeMin} min
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={amountNum <= 0 || amountNum > balance || fromChain === toChain || !selectedRoute || isSubmitting}
            data-testid="execute-button"
            onClick={() =>
              handleSubmit(() => {
                const price = getMockPrice(token);
                executeDeFiOrder({
                  client_id: "internal-trader",
                  strategy_id: activeStrategyId ?? "ARBITRAGE_PRICE_DISPERSION@multi-dex-eth-usdc-ethereum-prod",
                  instruction_type: "TRANSFER",
                  algo_type: "SOR_CROSS_CHAIN",
                  instrument_id: `BRIDGE:${token}@${fromChain}-${toChain}`,
                  venue: selectedRoute ?? "ACROSS",
                  side: "sell",
                  order_type: "market",
                  quantity: amountNum,
                  price,
                  max_slippage_bps: 50,
                  expected_output: amountNum * price * 0.9995,
                  benchmark_price: price,
                  asset_group: "DeFi",
                  lane: "defi",
                });
                toast.success("Bridge submitted", {
                  description: `${amountNum} ${token}: ${fromChain} → ${toChain} via ${selectedRoute}`,
                });
                setAmount("");
              })
            }
          >
            <Globe className="size-3.5 mr-1.5" />
            Bridge {token} via {selectedRoute || "..."}
          </Button>
        </div>
      )}
    </FormWidget>
  );
}
