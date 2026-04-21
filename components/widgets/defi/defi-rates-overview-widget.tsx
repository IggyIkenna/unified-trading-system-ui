"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { DeFiRatesRow } from "@/lib/types/defi";
import type { ColumnDef } from "@tanstack/react-table";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

function formatTvl(usd: number): string {
  if (usd >= 1e9) return `$${formatNumber(usd / 1e9, 1)}B`;
  if (usd >= 1e6) return `$${formatNumber(usd / 1e6, 0)}M`;
  return `$${formatNumber(usd, 0)}`;
}

const columns: ColumnDef<DeFiRatesRow, unknown>[] = [
  {
    accessorKey: "protocol",
    header: "Protocol / Pool",
    enableSorting: true,
    cell: ({ row }) => <span>{row.getValue<string>("protocol")}</span>,
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: true,
    cell: ({ row }) => <span>{row.getValue<string>("category")}</span>,
  },
  {
    accessorKey: "detail",
    header: "Detail",
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue<string>("detail")}</span>,
  },
  {
    accessorKey: "apyPct",
    header: () => <span className="flex justify-end">APY / APR %</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">{formatNumber(row.getValue<number>("apyPct"), 2)}</div>,
  },
  {
    accessorKey: "tvlUsd",
    header: () => <span className="flex justify-end">TVL</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const v = row.getValue<number | undefined>("tvlUsd");
      return <div className="text-right font-mono text-muted-foreground">{v == null ? "—" : formatTvl(v)}</div>;
    },
  },
];

export function DeFiRatesOverviewWidget(_props: WidgetComponentProps) {
  const { lendingProtocols, stakingProtocols, liquidityPools } = useDeFiData();

  const rows = React.useMemo<DeFiRatesRow[]>(() => {
    const out: DeFiRatesRow[] = [];
    let n = 0;
    for (const p of lendingProtocols) {
      let bestSupply = { asset: p.assets[0] ?? "", apy: 0 };
      let bestBorrow = { asset: p.assets[0] ?? "", apy: 0 };
      for (const a of p.assets) {
        const s = p.supplyApy[a] ?? 0;
        const b = p.borrowApy[a] ?? 0;
        if (s > bestSupply.apy) bestSupply = { asset: a, apy: s };
        if (b > bestBorrow.apy) bestBorrow = { asset: a, apy: b };
      }
      // tvlUsd omitted: LendingProtocol has no TVL field yet (see DeFiRatesRow JSDoc).
      out.push({
        id: `lend-s-${n++}`,
        protocol: p.name,
        venue_id: p.venue_id,
        category: "Lending supply",
        detail: `Best: ${bestSupply.asset}`,
        apyPct: bestSupply.apy,
      });
      out.push({
        id: `lend-b-${n++}`,
        protocol: p.name,
        venue_id: p.venue_id,
        category: "Lending borrow",
        detail: `Best: ${bestBorrow.asset}`,
        apyPct: bestBorrow.apy,
      });
    }
    for (const s of stakingProtocols) {
      out.push({
        id: `stake-${n++}`,
        protocol: s.name,
        venue_id: s.venue_id,
        category: "Staking",
        detail: s.asset,
        apyPct: s.apy,
        tvlUsd: s.tvl,
      });
    }
    for (const lp of liquidityPools) {
      out.push({
        id: `lp-${n++}`,
        protocol: lp.name,
        venue_id: lp.venue_id,
        category: "LP",
        detail: `${lp.token0}/${lp.token1}`,
        apyPct: lp.apr24h,
        tvlUsd: lp.tvl,
      });
    }
    return out;
  }, [lendingProtocols, stakingProtocols, liquidityPools]);

  const maxApy = React.useMemo(() => (rows.length ? Math.max(...rows.map((r) => r.apyPct)) : 0), [rows]);

  const headerMetrics: KpiMetric[] = [
    { label: "Rows", value: String(rows.length), sentiment: "neutral" },
    { label: "Max APY / APR (mock)", value: `${formatPercent(maxApy, 1)}`, sentiment: "positive" },
  ];

  return (
    // isLoading/error wired explicitly; context does not yet expose these fields.
    // When defi-data-context adds isLoading + error, pass them here.
    <TableWidget
      columns={columns}
      data={rows}
      summary={<KpiStrip metrics={headerMetrics} layoutMode="single-row" compact />}
      enableSorting
      enableColumnVisibility={false}
      isLoading={false}
      emptyMessage="No rate rows"
      className="h-full min-h-0"
    />
  );
}
