"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_CHAINS, MOCK_CHAIN_PORTFOLIOS, GAS_TOKEN_MIN_THRESHOLDS } from "@/lib/mocks/fixtures/defi-transfer";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

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
  const { connectedWallet, selectedChain, setSelectedChain, tokenBalances, treasury, deltaComposite, triggerRebalance, rebalancePreview } = useDeFiData();

  const portfolio = React.useMemo(() => mockPortfolioUsd(tokenBalances), [tokenBalances]);

  const treasuryStatusColor = treasury.status === "normal" ? "text-emerald-400" : treasury.status === "low" ? "text-rose-400" : "text-amber-400";

  const metrics: KpiMetric[] = React.useMemo(
    () => [
      {
        label: "Connected",
        value: connectedWallet ? truncateAddr(connectedWallet) : "—",
        sentiment: "neutral",
      },
      {
        label: "Portfolio (mock USD)",
        value: `$${formatNumber(portfolio / 1000, 1)}K`,
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

  const sortedPortfolios = React.useMemo(() => [...MOCK_CHAIN_PORTFOLIOS].sort((a, b) => b.totalUsd - a.totalUsd), []);

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

      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Treasury</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-mono", treasuryStatusColor)}>
            {treasury.status.toUpperCase()}
          </Badge>
          <span className="font-mono text-muted-foreground">${formatNumber(treasury.treasury_balance_usd, 0)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Net Delta</span>
          <span className={cn("font-mono", deltaComposite.total_delta_usd !== 0 ? "text-amber-400" : "text-emerald-400")}>
            ${formatNumber(deltaComposite.total_delta_usd, 0)}
          </span>
        </div>
        {treasury.status !== "normal" && (
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 ml-auto" onClick={triggerRebalance}>
            <RefreshCw className="size-3 mr-1" />
            Rebalance
          </Button>
        )}
      </div>

      {rebalancePreview && (
        <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-1 mx-1">
          <div className="flex items-center gap-1.5 font-medium">
            <RefreshCw className="size-3 text-amber-400" />
            Rebalance preview: {rebalancePreview.action}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground font-mono">
            <span>Treasury {rebalancePreview.treasury_current_pct}%</span>
            <span>Target {rebalancePreview.treasury_target_pct}%</span>
            <span>{rebalancePreview.total_instructions} instructions</span>
            <span>~${formatNumber(rebalancePreview.estimated_gas_usd, 2)} gas</span>
          </div>
        </div>
      )}

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
                          {formatNumber(cp.gasTokenBalance, 4)}
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
