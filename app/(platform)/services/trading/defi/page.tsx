"use client"

import { DeFiOpsPanel } from "@/components/trading/defi-ops-panel"

export default function DeFiOpsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">DeFi Operations</h1>
          <p className="text-sm text-muted-foreground">
            Lending, swaps, liquidity, staking, and flash loan bundles
          </p>
        </div>
      </div>
      <DeFiOpsPanel />
    </div>
  )
}
