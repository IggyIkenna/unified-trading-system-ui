"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { cn } from "@/lib/utils";

export function RiskWhatIfSliderWidget(_props: WidgetComponentProps) {
  const { btcPriceChangePct, setBtcPriceChangePct, estimatedPnl, portfolioGreeks, portfolioGreeksData } = useRiskData();

  const greeks = portfolioGreeksData?.portfolio ?? portfolioGreeks;
  const btcSpot = 65000;
  const dS = btcSpot * (btcPriceChangePct / 100);

  return (
    <div className="flex items-center gap-4 h-full px-2">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium">BTC Price Change</span>
          <span
            className={cn(
              "font-mono font-bold text-sm",
              btcPriceChangePct > 0 && "text-emerald-400",
              btcPriceChangePct < 0 && "text-rose-400",
              btcPriceChangePct === 0 && "text-muted-foreground",
            )}
          >
            {btcPriceChangePct > 0 ? "+" : ""}
            {btcPriceChangePct}%
          </span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={btcPriceChangePct}
          onChange={(e) => setBtcPriceChangePct(Number(e.target.value))}
          className="w-full h-1.5 rounded appearance-none cursor-pointer bg-muted accent-blue-500"
        />
        <div className="flex justify-between mt-0.5 text-[9px] text-muted-foreground">
          <span>-30%</span>
          <span>0%</span>
          <span>+30%</span>
        </div>
      </div>
      <div className="w-px h-10 bg-border" />
      <div className="text-center min-w-[140px]">
        <div className="text-[10px] text-muted-foreground mb-0.5">Estimated Portfolio PnL</div>
        <div
          className={cn(
            "text-xl font-bold font-mono",
            estimatedPnl > 0 && "text-emerald-400",
            estimatedPnl < 0 && "text-rose-400",
            estimatedPnl === 0 && "text-muted-foreground",
          )}
        >
          {estimatedPnl >= 0 ? "+" : ""}
          {formatCurrency(estimatedPnl)}
        </div>
        <div className="text-[9px] text-muted-foreground mt-0.5">
          dS={formatCurrency(dS)} | Δ={greeks.delta.toFixed(2)} | Γ={greeks.gamma.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
