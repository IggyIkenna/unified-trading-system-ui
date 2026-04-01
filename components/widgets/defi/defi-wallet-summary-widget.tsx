"use client";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { DEFI_CHAINS, GAS_TOKEN_MIN_THRESHOLDS, MOCK_CHAIN_PORTFOLIOS } from "@/lib/mocks/fixtures/defi-transfer";
import type { LendingProtocol, LiquidityPool, StakingProtocol } from "@/lib/types/defi";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { AlertTriangle, RefreshCw } from "lucide-react";
import * as React from "react";
import { useDeFiData } from "./defi-data-context";
import { DeFiRebalanceDialog } from "./defi-rebalance-dialog";

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

type KeyRateRow = {
  id: string;
  protocol: string;
  asset: string;
  supplyApy: number;
  borrowApy: number | null;
};

function buildKeyRateRows(
  lendingProtocols: LendingProtocol[],
  stakingProtocols: StakingProtocol[],
  liquidityPools: LiquidityPool[],
): KeyRateRow[] {
  const out: KeyRateRow[] = [];
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
      id: `kr-lend-${n++}`,
      protocol: p.name,
      asset: bestSupply.asset || "—",
      supplyApy: bestSupply.apy,
      borrowApy: bestBorrow.apy,
    });
  }
  for (const s of stakingProtocols) {
    out.push({
      id: `kr-stake-${n++}`,
      protocol: s.name,
      asset: s.asset,
      supplyApy: s.apy,
      borrowApy: null,
    });
  }
  for (const lp of liquidityPools) {
    out.push({
      id: `kr-lp-${n++}`,
      protocol: lp.name,
      asset: `${lp.token0}/${lp.token1}`,
      supplyApy: lp.apr24h,
      borrowApy: null,
    });
  }
  return [...out].sort((a, b) => b.supplyApy - a.supplyApy).slice(0, 5);
}

export function DeFiWalletSummaryWidget(_props: WidgetComponentProps) {
  const {
    connectedWallet,
    selectedChain,
    setSelectedChain,
    tokenBalances,
    treasury,
    deltaComposite,
    triggerRebalance,
    confirmRebalance,
    cancelRebalance,
    rebalancePreview,
    lendingProtocols,
    stakingProtocols,
    liquidityPools,
  } = useDeFiData();

  const portfolio = React.useMemo(() => mockPortfolioUsd(tokenBalances), [tokenBalances]);

  const treasuryStatusColor =
    treasury.status === "normal" ? "text-emerald-400" : treasury.status === "low" ? "text-rose-400" : "text-amber-400";

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

  const keyRateRows = React.useMemo(
    () => buildKeyRateRows(lendingProtocols, stakingProtocols, liquidityPools),
    [lendingProtocols, stakingProtocols, liquidityPools],
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
          <span className="font-mono text-muted-foreground">
            ${formatNumber(treasury.treasury_balance_usd, 0)} ({treasury.treasury_pct}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Net Delta</span>
          <span
            className={cn("font-mono", deltaComposite.total_delta_usd !== 0 ? "text-amber-400" : "text-emerald-400")}
          >
            ${formatNumber(deltaComposite.total_delta_usd, 0)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-6 text-[10px] px-2 ml-auto",
            treasury.status !== "normal" && "border-amber-500/50 text-amber-400 hover:bg-amber-500/10",
          )}
          onClick={triggerRebalance}
          disabled={treasury.status === "normal"}
        >
          <RefreshCw className="size-3 mr-1" />
          Rebalance
        </Button>
      </div>

      {rebalancePreview && (
        <DeFiRebalanceDialog preview={rebalancePreview} onConfirm={confirmRebalance} onCancel={cancelRebalance} />
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

      <CollapsibleSection title="Key Rates" defaultOpen={false} count={keyRateRows.length}>
        <div className="px-1 pb-1">
          {keyRateRows.length === 0 ? (
            <p className="text-[10px] text-muted-foreground py-1">No rate data</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-muted-foreground border-b border-border/50">
                  <th className="text-left py-1 font-medium">Protocol</th>
                  <th className="text-left py-1 font-medium">Asset</th>
                  <th className="text-right py-1 font-medium">Supply APY</th>
                  <th className="text-right py-1 font-medium">Borrow APY</th>
                </tr>
              </thead>
              <tbody>
                {keyRateRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/30 last:border-0">
                    <td className="py-1 font-medium">{row.protocol}</td>
                    <td className="py-1 font-mono text-muted-foreground">{row.asset}</td>
                    <td className="py-1 text-right font-mono tabular-nums">{formatNumber(row.supplyApy, 2)}%</td>
                    <td className="py-1 text-right font-mono tabular-nums">
                      {row.borrowApy === null ? "—" : `${formatNumber(row.borrowApy, 2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
