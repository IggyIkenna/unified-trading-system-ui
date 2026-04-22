"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { useActiveStrategyId } from "@/hooks/use-active-strategy-id";
import { TrendingDown } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeFiData } from "./defi-data-context";

const DEFAULT_PERP_VENUE = "HYPERLIQUID";

export function DeFiPerpShortWidget(_props: WidgetComponentProps) {
  const { basisTradeAssets, basisTradeMarketData, executeDeFiOrder } = useDeFiData();
  const activeStrategyId = useActiveStrategyId();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();

  const [asset, setAsset] = React.useState(basisTradeAssets[0] ?? "ETH");
  const [venue, setVenue] = React.useState(DEFAULT_PERP_VENUE);
  const [size, setSize] = React.useState("");

  const market = basisTradeMarketData[asset];
  const sizeNum = parseFloat(size) || 0;
  const perpPrice = market?.perpPrice ?? 0;
  const notional = sizeNum * perpPrice;
  const fundingApy = market ? market.fundingRateAnnualized : 0;

  return (
    <FormWidget isLoading={false} error={error} onClearError={clearError} data-testid="defi-perp-short-widget">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Asset</label>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger data-testid="perp-asset-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {basisTradeAssets.map((a) => (
              <SelectItem key={a} value={a}>
                {a}-PERP
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Venue</label>
        <Select value={venue} onValueChange={setVenue}>
          <SelectTrigger data-testid="perp-venue-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HYPERLIQUID">Hyperliquid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Size ({asset})</label>
        <Input
          type="number"
          placeholder="0.00"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="font-mono"
          data-testid="perp-size-input"
        />
      </div>

      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Perp price</span>
          <span className="font-mono" data-testid="perp-price">
            ${formatNumber(perpPrice, 2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Notional</span>
          <span className="font-mono" data-testid="perp-notional">
            {sizeNum > 0 ? `$${formatNumber(notional, 2)}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Funding APY (long pays short)</span>
          <span className="font-mono text-emerald-400" data-testid="perp-funding-apy">
            {formatPercent(fundingApy * 100, 2)}
          </span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={sizeNum <= 0 || isSubmitting || !market}
        data-testid="perp-execute-button"
        onClick={() =>
          handleSubmit(() => {
            executeDeFiOrder({
              client_id: "internal-trader",
              strategy_id: activeStrategyId ?? "CARRY_BASIS_PERP@binance-btc-usdt-prod",
              instruction_type: "TRADE",
              algo_type: "BENCHMARK_FILL",
              instrument_id: `${venue}:PERP:${asset}`,
              venue,
              side: "sell",
              order_type: "market",
              quantity: sizeNum,
              price: perpPrice,
              max_slippage_bps: 50,
              expected_output: notional,
              benchmark_price: perpPrice,
              asset_class: "DeFi",
              lane: "defi",
            });
            setSize("");
            toast.success("Perp short submitted", {
              description: `SHORT ${sizeNum} ${asset}-PERP on ${venue} @ $${formatNumber(perpPrice, 2)} (mock ledger)`,
            });
          })
        }
      >
        <TrendingDown className="size-4 mr-2" />
        Short {asset}-PERP on {venue}
      </Button>
    </FormWidget>
  );
}
