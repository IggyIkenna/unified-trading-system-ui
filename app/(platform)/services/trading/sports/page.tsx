"use client"

import { SportsBetSlip } from "@/components/trading/sports-bet-slip"

export default function SportsBettingPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sports & Prediction Markets</h1>
          <p className="text-sm text-muted-foreground">
            Back/Lay exchange, fixed odds, prediction markets, and cross-book arbitrage
          </p>
        </div>
      </div>
      <SportsBetSlip />
    </div>
  )
}
