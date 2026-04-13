"use client";

import { Suspense } from "react";
import Link from "next/link";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";
import { DeFiSwapWidget } from "@/components/widgets/defi/defi-swap-widget";
import { DeFiTransferWidget } from "@/components/widgets/defi/defi-transfer-widget";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function StakedBasisPageContent() {
  return (
    <DeFiDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2 gap-4">
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-2">
          <h1 className="text-sm font-semibold">Staked basis (weETH + perp) — UI verification</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No strategy-only widget: deploy using shared DeFi actions — SOR swap to LST, transfer margin, perp hedge on
            Book, then confirm positions, risk, and trade history. Canonical strategy id:{" "}
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
          <div className="flex-1 min-h-0 overflow-auto p-1">
            <DeFiSwapWidget instanceId="staked-basis-swap" config={{ mode: "staked-basis" }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="border-b border-border px-4 py-3 bg-card/80">
            <h2 className="text-sm font-semibold">2. Transfer &amp; bridge</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Move USDC (or chosen stable) to Hyperliquid for cross-margin on the short leg.
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-1">
            <DeFiTransferWidget instanceId="staked-basis-transfer" />
          </div>
        </div>
      </div>
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
