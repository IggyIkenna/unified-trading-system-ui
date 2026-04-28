"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface TrendingTokensResponse {
  items: ReadonlyArray<{
    symbol: string;
    name: string;
    volume_24h_usd: number;
    volume_7d_avg_usd: number;
    volume_change_pct: number;
    sparkline_7d: ReadonlyArray<number>;
  }>;
}

/** CMC-style trending tokens — ranked by 24h volume %change vs 7d average. */
export function TrendingTokensWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<TrendingTokensResponse>("trending-tokens", {
    assetGroup: "CEFI",
    staleTime: 30_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: row.symbol,
        name: row.symbol,
        subname: row.name,
        value: row.volume_24h_usd,
        change24h: row.volume_change_pct,
        sparkline: [...row.sparkline_7d],
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset items={items} title="Trending — vol vs 7d avg" valueLabel="24h volume" enableSearch={false} />
    </div>
  );
}
