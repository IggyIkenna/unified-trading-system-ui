"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface TvlByProtocolResponse {
  items: ReadonlyArray<{
    protocol: string;
    chain: string;
    category: string;
    tvl_usd: number;
    change_24h: number;
    change_7d: number;
    sparkline_7d: ReadonlyArray<number>;
  }>;
}

/** DefiLlama-style TVL ranking by protocol with chain + category as venue tag. */
export function TvlByProtocolWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<TvlByProtocolResponse>("tvl-by-protocol", {
    assetGroup: "DEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: `${row.protocol}@${row.chain}`,
        name: row.protocol,
        subname: row.category,
        value: row.tvl_usd,
        change24h: row.change_24h,
        change7d: row.change_7d,
        sparkline: [...row.sparkline_7d],
        source: row.chain,
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading protocols…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset items={items} title="TVL by protocol" valueLabel="TVL ($)" enableSearch />
    </div>
  );
}
