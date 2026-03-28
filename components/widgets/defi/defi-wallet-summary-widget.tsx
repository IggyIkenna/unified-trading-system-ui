"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection, KpiStrip, type KpiMetric } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_CHAINS, MOCK_CHAIN_PORTFOLIOS, GAS_TOKEN_MIN_THRESHOLDS } from "@/lib/mocks/fixtures/defi-transfer";
import { AlertTriangle } from "lucide-react";
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

  const sortedPortfolios = React.useMemo(
    () => [...MOCK_CHAIN_PORTFOLIOS].sort((a, b) => b.totalUsd - a.totalUsd),
    [],
  );

  const totalPortfolioUsd = React.useMemo(
    () => sortedPortfolios.reduce((sum, cp) => sum + cp.totalUsd, 0),
    [sortedPortfolios],
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

      <CollapsibleSection title="Portfolio by chain" defaultOpen={true} count={sortedPortfolios.length}>
        <div className="px-1 pb-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-muted-foreground border-b border-border/50">
                <th className="text-left py-1 font-medium">Chain</th>
                <th className="text-right py-1 font-medium">Value (USD)</th>
                <th className="text-right py-1 font-medium">Gas Token</th>
                <th className="text-right py-1 font-medium">Gas Balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedPortfolios.map((cp) => {
                const threshold = GAS_TOKEN_MIN_THRESHOLDS[cp.gasTokenSymbol] ?? 0;
                const gasLow = cp.gasTokenBalance < threshold;
                return (
                  <tr key={cp.chain} className="border-b border-border/30 last:border-0">
                    <td className="py-1 font-medium">{cp.chain}</td>
                    <td className="py-1 text-right font-mono tabular-nums">
                      ${cp.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-1 text-right font-mono text-muted-foreground">{cp.gasTokenSymbol}</td>
                    <td className="py-1 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <span className={cn("font-mono tabular-nums", gasLow ? "text-amber-500" : "text-foreground")}>
                          {cp.gasTokenBalance.toFixed(4)}
                        </span>
                        {gasLow && <AlertTriangle className="size-3 text-amber-500 shrink-0" />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td className="py-1.5">Total</td>
                <td className="py-1.5 text-right font-mono tabular-nums">
                  ${totalPortfolioUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="py-1.5" />
                <td className="py-1.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}
