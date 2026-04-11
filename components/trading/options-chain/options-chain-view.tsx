"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOptionsChain } from "@/hooks/api/use-market-data";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import * as React from "react";
import { ExpirySection } from "./expiry-section";
import { generateMockOptionsChain, UNDERLYINGS } from "./mock-generators";
import { MultiLegBuilder } from "./multi-leg-builder";
import type { OptionsChainProps, OptionsChainResponse } from "./types";

export function OptionsChain({ underlying: initialUnderlying, venue, onSelectStrike, className }: OptionsChainProps) {
  const [underlying, setUnderlying] = React.useState(initialUnderlying);
  const [showSpreadBuilder, setShowSpreadBuilder] = React.useState(false);
  const { data, isLoading, isError } = useOptionsChain(underlying, venue);

  const decimals = underlying === "BTC" ? 2 : underlying === "ETH" ? 2 : 2;

  const chain: OptionsChainResponse = React.useMemo(() => {
    if (data && typeof data === "object" && "expiries" in (data as Record<string, unknown>)) {
      return data as OptionsChainResponse;
    }
    return generateMockOptionsChain(underlying, venue);
  }, [data, underlying, venue]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Options Chain
            <Badge variant="secondary" className="text-[10px]">
              {venue}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showSpreadBuilder ? "secondary" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowSpreadBuilder(!showSpreadBuilder)}
            >
              <Layers className="size-3 mr-1" />
              Build Spread
            </Button>
            <Select value={underlying} onValueChange={setUnderlying}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNDERLYINGS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] font-mono">
              Spot:{" "}
              {chain.spotPrice.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </Badge>
          </div>
        </div>

        {isLoading && <div className="text-xs text-muted-foreground mt-1">Loading options chain...</div>}
        {isError && <div className="text-xs text-muted-foreground mt-1">API unavailable -- showing mock data</div>}
        {!data && !isLoading && !isError && (
          <div className="text-xs text-muted-foreground mt-1">No live data -- displaying sample options chain</div>
        )}
      </CardHeader>

      <CardContent className="pt-0 px-0">
        {showSpreadBuilder && <MultiLegBuilder chain={chain} onClose={() => setShowSpreadBuilder(false)} />}

        <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">CALLS</span>
            <span className="inline-block w-3 h-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-rose-400">PUTS</span>
            <span className="inline-block w-3 h-2 bg-rose-500/10 border border-rose-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-yellow-500/10 border border-yellow-500/30 rounded-sm" />
            <span>ATM</span>
          </div>
        </div>

        <div className="max-h-[700px] overflow-y-auto">
          {chain.expiries.map((group) => (
            <ExpirySection key={group.expiry} group={group} decimals={decimals} onSelectStrike={onSelectStrike} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
