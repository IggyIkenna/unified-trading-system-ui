"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Button } from "@/components/ui/button";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import { cn } from "@/lib/utils";
import * as React from "react";

interface GainersLosersResponse {
  gainers: ReadonlyArray<{
    symbol: string;
    name: string;
    price_usd: number;
    change_24h: number;
    sparkline_24h: ReadonlyArray<number>;
  }>;
  losers: ReadonlyArray<{
    symbol: string;
    name: string;
    price_usd: number;
    change_24h: number;
    sparkline_24h: ReadonlyArray<number>;
  }>;
}

/** CoinMarketCap-style gainers/losers with two-tab toggle. */
export function GainersLosersWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<GainersLosersResponse>("gainers-losers", {
    assetGroup: "CEFI",
    staleTime: 30_000,
  });
  const [tab, setTab] = React.useState<"gainers" | "losers">("gainers");

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(() => {
    if (!data) return [];
    const rows = tab === "gainers" ? data.gainers : data.losers;
    return rows.map((row) => ({
      id: row.symbol,
      name: row.symbol,
      subname: row.name,
      value: row.price_usd,
      change24h: row.change_24h,
      sparkline: [...row.sparkline_24h],
    }));
  }, [data, tab]);

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={tab === "gainers" ? "default" : "ghost"}
          onClick={() => setTab("gainers")}
          className={cn("h-6 px-2 text-[10px]", tab === "gainers" ? "bg-emerald-500/20 text-emerald-300" : undefined)}
        >
          Gainers
        </Button>
        <Button
          size="sm"
          variant={tab === "losers" ? "default" : "ghost"}
          onClick={() => setTab("losers")}
          className={cn("h-6 px-2 text-[10px]", tab === "losers" ? "bg-rose-500/20 text-rose-300" : undefined)}
        >
          Losers
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <RankingListPreset items={items} valueLabel="Price ($)" enableSearch={false} />
      </div>
    </div>
  );
}
