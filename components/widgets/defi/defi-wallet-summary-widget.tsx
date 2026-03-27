"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiStrip, type KpiMetric } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_CHAINS } from "@/lib/mocks/fixtures/defi-transfer";
import { useDeFiData } from "./defi-data-context";

function truncateAddr(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function mockPortfolioUsd(balances: Record<string, number>): number {
  const ethPx = 3200;
  const btcPx = 65000;
  return (
    (balances.ETH ?? 0) * ethPx +
    (balances.WETH ?? 0) * ethPx +
    (balances.USDC ?? 0) +
    (balances.USDT ?? 0) +
    (balances.DAI ?? 0) +
    (balances.WBTC ?? 0) * btcPx
  );
}

export function DeFiWalletSummaryWidget(_props: WidgetComponentProps) {
  const { connectedWallet, selectedChain, setSelectedChain, tokenBalances } = useDeFiData();

  const portfolio = React.useMemo(() => mockPortfolioUsd(tokenBalances), [tokenBalances]);

  const metrics: KpiMetric[] = React.useMemo(
    () => [
      {
        label: "Connected",
        value: connectedWallet ? truncateAddr(connectedWallet) : "—",
        sentiment: "neutral",
      },
      {
        label: "Portfolio (mock USD)",
        value: `$${(portfolio / 1000).toFixed(1)}K`,
        sentiment: "neutral",
      },
      {
        label: "Tracked tokens",
        value: String(Object.keys(tokenBalances).length),
        sentiment: "neutral",
      },
    ],
    [connectedWallet, portfolio, tokenBalances],
  );

  return (
    <div className="space-y-2 p-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Chain</span>
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFI_CHAINS.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <KpiStrip metrics={metrics} columns={3} />
    </div>
  );
}
