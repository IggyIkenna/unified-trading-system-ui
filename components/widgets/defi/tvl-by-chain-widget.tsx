"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface TvlByChainResponse {
  items: ReadonlyArray<{
    chain: string;
    tvl_usd: number;
    change_24h: number;
    change_7d: number;
    sparkline_7d: ReadonlyArray<number>;
  }>;
}

/** DefiLlama-style TVL ranking by chain. */
export function TvlByChainWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<TvlByChainResponse>("tvl-by-chain", {
    assetGroup: "DEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: row.chain,
        name: row.chain,
        value: row.tvl_usd,
        change24h: row.change_24h,
        change7d: row.change_7d,
        sparkline: [...row.sparkline_7d],
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading TVL…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset items={items} title="TVL by chain" valueLabel="TVL ($)" enableSearch />
    </div>
  );
}
