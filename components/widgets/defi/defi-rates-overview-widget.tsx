"use client";

import * as React from "react";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { DeFiRatesRow } from "@/lib/types/defi";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

function formatTvl(usd: number): string {
  if (usd >= 1e9) return `$${formatNumber(usd / 1e9, 1)}B`;
  if (usd >= 1e6) return `$${formatNumber(usd / 1e6, 0)}M`;
  return `$${formatNumber(usd, 0)}`;
}

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
      out.push({
        id: `lend-s-${n++}`,
        protocol: p.name,
        category: "Lending supply",
        detail: `Best: ${bestSupply.asset}`,
        apyPct: bestSupply.apy,
        tvlUsd: 12e9,
      });
      out.push({
        id: `lend-b-${n++}`,
        protocol: p.name,
        category: "Lending borrow",
        detail: `Best: ${bestBorrow.asset}`,
        apyPct: bestBorrow.apy,
        tvlUsd: 12e9,
      });
    }
    for (const s of stakingProtocols) {
      out.push({
        id: `stake-${n++}`,
        protocol: s.name,
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

  const columns: DataTableColumn<DeFiRatesRow>[] = [
    { key: "protocol", label: "Protocol / pool", accessor: "protocol" },
    { key: "category", label: "Category", accessor: "category" },
    { key: "detail", label: "Detail", accessor: "detail" },
    {
      key: "apy",
      label: "APY / APR %",
      accessor: (r) => <span className="font-mono">{formatNumber(r.apyPct, 2)}</span>,
      align: "right",
    },
    {
      key: "tvl",
      label: "TVL",
      accessor: (r) => <span className="font-mono text-muted-foreground">{formatTvl(r.tvlUsd)}</span>,
      align: "right",
    },
  ];

  return (
    <div className="space-y-2 p-1">
      <KpiStrip metrics={headerMetrics} columns={2} />
      <DataTableWidget<DeFiRatesRow>
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        emptyMessage="No rate rows"
        className="border rounded-md"
      />
    </div>
  );
}
