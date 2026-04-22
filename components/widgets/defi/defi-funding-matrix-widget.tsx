"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";
import { FUNDING_RATE_VENUES, FUNDING_RATE_FLOOR } from "@/lib/config/services/defi.config";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function rateColor(rate: number | null): string {
  if (rate === null) return "text-muted-foreground/50";
  if (rate < FUNDING_RATE_FLOOR) return "text-muted-foreground/50";
  if (rate >= 5) return "text-emerald-400";
  return "text-amber-400";
}

function rateBg(rate: number | null): string {
  if (rate === null) return "";
  if (rate < FUNDING_RATE_FLOOR) return "bg-muted/20";
  if (rate >= 5) return "bg-emerald-500/10";
  return "bg-amber-500/10";
}

export function DeFiFundingMatrixWidget(_props: WidgetComponentProps) {
  const { fundingRates } = useDeFiData();

  const coins = Object.keys(fundingRates);

  // Compute best venue per coin
  const bestVenuePerCoin = React.useMemo(() => {
    const result: Record<string, string> = {};
    for (const coin of coins) {
      let best = "";
      let bestRate = -Infinity;
      for (const venue of FUNDING_RATE_VENUES) {
        const rate = fundingRates[coin]?.[venue];
        if (rate !== null && rate !== undefined && rate > bestRate) {
          bestRate = rate;
          best = venue;
        }
      }
      result[coin] = best;
    }
    return result;
  }, [fundingRates, coins]);

  // Average per venue
  const venueAvgs = React.useMemo(() => {
    const result: Record<string, number> = {};
    for (const venue of FUNDING_RATE_VENUES) {
      let sum = 0;
      let count = 0;
      for (const coin of coins) {
        const rate = fundingRates[coin]?.[venue];
        if (rate !== null && rate !== undefined) {
          sum += rate;
          count++;
        }
      }
      result[venue] = count > 0 ? sum / count : 0;
    }
    return result;
  }, [fundingRates, coins]);

  if (coins.length === 0) {
    return (
      <div data-testid="defi-funding-matrix-widget" className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">No funding rate data</p>
      </div>
    );
  }

  return (
    <div data-testid="defi-funding-matrix-widget" className="space-y-2 p-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Annualised funding rates (%). Grey = below {FUNDING_RATE_FLOOR}% floor.
        </p>
      </div>

      <WidgetScroll axes="horizontal" className="min-h-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Coin</th>
              {FUNDING_RATE_VENUES.map((venue) => (
                <th key={venue} className="text-right py-1.5 px-2 text-muted-foreground font-medium">
                  {venue}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin} className="border-b border-border/20 hover:bg-muted/30">
                <td className="py-1.5 px-2 font-mono font-medium">{coin}</td>
                {FUNDING_RATE_VENUES.map((venue) => {
                  const rate = fundingRates[coin]?.[venue] ?? null;
                  const isBest = bestVenuePerCoin[coin] === venue;
                  return (
                    <td key={venue} className={cn("text-right py-1.5 px-2 font-mono", rateColor(rate), rateBg(rate))}>
                      {rate !== null ? (
                        <span className={cn(isBest && "font-bold underline underline-offset-2")}>
                          {formatNumber(rate, 1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/40">
              <td className="py-1.5 px-2 text-muted-foreground font-medium">Avg</td>
              {FUNDING_RATE_VENUES.map((venue) => (
                <td key={venue} className="text-right py-1.5 px-2 font-mono text-muted-foreground">
                  {formatNumber(venueAvgs[venue] ?? 0, 1)}%
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </WidgetScroll>

      <div className="flex items-center gap-4 text-micro text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-400" /> &gt;5%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-400" /> 2.5-5%
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-muted-foreground/50" /> &lt;2.5% (greyed)
        </span>
        <span className="ml-auto">Best venue per coin = underlined</span>
      </div>
    </div>
  );
}
