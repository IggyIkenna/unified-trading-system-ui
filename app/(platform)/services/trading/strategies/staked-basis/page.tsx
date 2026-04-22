"use client";

import { Suspense } from "react";
import Link from "next/link";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";
import { DeFiSwapWidget } from "@/components/widgets/defi/defi-swap-widget";
import { DeFiTransferWidget } from "@/components/widgets/defi/defi-transfer-widget";
import { DeFiLendingWidget } from "@/components/widgets/defi/defi-lending-widget";
import { DeFiPerpShortWidget } from "@/components/widgets/defi/defi-perp-short-widget";
import { DeFiHealthFactorWidget } from "@/components/widgets/defi/defi-health-factor-widget";
import { DeFiFundingMatrixWidget } from "@/components/widgets/defi/defi-funding-matrix-widget";
import { DeFiRewardPnlWidget } from "@/components/widgets/defi/defi-reward-pnl-widget";
import { DeFiWalletSummaryWidget } from "@/components/widgets/defi/defi-wallet-summary-widget";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function StakedBasisPageContent() {
  return (
    <DeFiDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-2">
            <h1 className="text-sm font-semibold">Staked basis (weETH + perp) — UI verification</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No strategy-only widget: deploy using shared DeFi actions — SOR swap to LST, transfer margin, perp hedge
              on Book, then confirm positions, risk, and trade history. Canonical strategy id:{" "}
              <span className="font-mono text-foreground">STAKED_BASIS</span>.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/services/trading/book">
                  <ExternalLink className="size-3.5 mr-1.5" />
                  Book (TRADE short ETH perp)
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/services/trading/positions">Positions</Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/services/trading/defi">DeFi hub (trade history, strategy config)</Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/services/trading/risk">Risk</Link>
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">1. Swap (stable → weETH)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                SOR_DEX; ~90% notional to LST leg per strategy spec (amount is user-defined in demo).
              </p>
            </div>
            <WidgetScroll className="flex-1 min-h-0" viewportClassName="p-1">
              <DeFiSwapWidget instanceId="staked-basis-swap" config={{ mode: "staked-basis" }} />
            </WidgetScroll>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">2. Pledge &amp; borrow (Aave)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Pledge the LST as collateral (LEND weETH) then BORROW USDC to fund the perp margin leg — per
                architecture-v2 carry-staked-basis flow.
              </p>
            </div>
            <WidgetScroll className="flex-1 min-h-0" viewportClassName="p-1">
              <DeFiLendingWidget instanceId="staked-basis-lending" />
            </WidgetScroll>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">3. Transfer &amp; bridge</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Move USDC (or chosen stable) to Hyperliquid for cross-margin on the short leg.
              </p>
            </div>
            <WidgetScroll className="flex-1 min-h-0" viewportClassName="p-1">
              <DeFiTransferWidget instanceId="staked-basis-transfer" />
            </WidgetScroll>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">4. Short PERP (hedge leg)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Short the underlying on Hyperliquid — funding rate &gt; LST borrow cost drives the net carry.
              </p>
            </div>
            <WidgetScroll className="flex-1 min-h-0" viewportClassName="p-1">
              <DeFiPerpShortWidget instanceId="staked-basis-perp-short" />
            </WidgetScroll>
          </div>

          {/* Observation widgets (read-only) — health factor, funding matrix, wallet summary, reward P&L.
              Mapped in fixtures/strategies/carry-staked-basis.json observationWidgets. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden lg:col-span-2">
              <div className="border-b border-border px-4 py-3 bg-card/80">
                <h2 className="text-sm font-semibold">Wallet Summary</h2>
              </div>
              <DeFiWalletSummaryWidget instanceId="staked-basis-wallet" />
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="border-b border-border px-4 py-3 bg-card/80">
                <h2 className="text-sm font-semibold">Health Factor</h2>
              </div>
              <DeFiHealthFactorWidget instanceId="staked-basis-health" />
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="border-b border-border px-4 py-3 bg-card/80">
                <h2 className="text-sm font-semibold">Funding Rate Matrix</h2>
              </div>
              <DeFiFundingMatrixWidget instanceId="staked-basis-funding" />
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden lg:col-span-2">
              <div className="border-b border-border px-4 py-3 bg-card/80">
                <h2 className="text-sm font-semibold">Reward P&amp;L</h2>
              </div>
              <DeFiRewardPnlWidget instanceId="staked-basis-reward-pnl" />
            </div>
          </div>
        </div>
      </WidgetScroll>
    </DeFiDataProvider>
  );
}

export default function StakedBasisStrategyPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading Staked Basis…</div>}>
      <StakedBasisPageContent />
    </Suspense>
  );
}
