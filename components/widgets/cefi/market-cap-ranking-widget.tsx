"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface MarketCapRankingResponse {
  items: ReadonlyArray<{
    symbol: string;
    name: string;
    market_cap_usd: number;
    volume_24h_usd: number;
    change_24h: number;
    change_7d: number;
    dominance_pct: number;
    sparkline_7d: ReadonlyArray<number>;
  }>;
}

/** CoinMarketCap-style market-cap ranking with dominance + volume + sparkline. */
export function MarketCapRankingWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<MarketCapRankingResponse>("market-cap-ranking", {
    assetGroup: "CEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: row.symbol,
        name: row.symbol,
        subname: row.name,
        value: row.market_cap_usd,
        change24h: row.change_24h,
        change7d: row.change_7d,
        sparkline: [...row.sparkline_7d],
        extra: { dominance: `${row.dominance_pct.toFixed(2)}%`, volume24h: row.volume_24h_usd },
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading market cap…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={items}
        title="Market cap ranking"
        valueLabel="Market cap ($)"
        extraColumns={[
          { id: "dominance", label: "Dominance", align: "right", type: "percent" },
          {
            id: "volume24h",
            label: "Vol 24h",
            align: "right",
            type: "currency",
            format: (item) => {
              const v = (item.extra?.volume24h as number) ?? 0;
              return v >= 1_000_000_000 ? `$${(v / 1_000_000_000).toFixed(2)}B` : `$${(v / 1_000_000).toFixed(0)}M`;
            },
          },
        ]}
        enableSearch
      />
    </div>
  );
}
