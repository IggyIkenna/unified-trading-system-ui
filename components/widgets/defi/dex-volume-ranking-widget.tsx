"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface DexVolumeRankingResponse {
  items: ReadonlyArray<{
    protocol: string;
    chain: string;
    volume_24h_usd: number;
    change_24h: number;
    sparkline_24h: ReadonlyArray<number>;
  }>;
}

/** DefiLlama / DEXScreener style 24h DEX volume ranking. */
export function DexVolumeRankingWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<DexVolumeRankingResponse>("dex-volume-ranking", {
    assetGroup: "DEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: `${row.protocol}@${row.chain}`,
        name: row.protocol,
        value: row.volume_24h_usd,
        change24h: row.change_24h,
        sparkline: [...row.sparkline_24h],
        source: row.chain,
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading DEX volume…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset items={items} title="DEX volume — 24h" valueLabel="Volume ($)" enableSearch />
    </div>
  );
}
