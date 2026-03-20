"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const STAGES = [
  {
    num: "1", name: "Acquire", short: "Ingest, normalise, validate",
    color: "sky", borderClass: "border-sky-400/30", bgClass: "bg-sky-400/5",
    hoverBorder: "border-sky-400/70", textClass: "text-sky-400",
    detail: "Connect to 33 venues across crypto, TradFi, DeFi, sports, and prediction markets. Raw data is normalised into a single schema — one API, every asset class. This is where your journey starts.",
    services: ["Data Catalogue", "Market Data API", "Historical Downloads"],
    example: "A quant team connects to our API and starts pulling normalised BTC/USD data from Binance, CME, and Hyperliquid simultaneously.",
  },
  {
    num: "2", name: "Build", short: "Research, train, simulate",
    color: "violet", borderClass: "border-violet-400/30", bgClass: "bg-violet-400/5",
    hoverBorder: "border-violet-400/70", textClass: "text-violet-400",
    detail: "Train ML models to predict price direction, volatility, or regime. Configure trading signals and optimise parameters. Design strategies that span venues and asset classes.",
    services: ["ML Model Training", "Signal Configuration", "Strategy Design"],
    example: "Train a BTC direction model using 6 years of cross-venue data, then configure a signal-to-trade pipeline that triggers on model predictions.",
  },
  {
    num: "3", name: "Promote", short: "Review, approve, deploy",
    color: "amber", borderClass: "border-amber-400/30", bgClass: "bg-amber-400/5",
    hoverBorder: "border-amber-400/70", textClass: "text-amber-400",
    detail: "Backtest strategies across historical data. Compare variants side-by-side. Promote winners through paper trading, then to live. A controlled pipeline from research to production.",
    services: ["Backtesting", "Paper Trading", "Candidate Pipeline", "Approval Workflow"],
    example: "Your ETH basis strategy shows a Sharpe of 2.1 in backtest. Promote it to paper trading for 7 days, then approve for live deployment.",
  },
  {
    num: "4", name: "Run", short: "Execute, route, fill",
    color: "emerald", borderClass: "border-emerald-400/30", bgClass: "bg-emerald-400/5",
    hoverBorder: "border-emerald-400/70", textClass: "text-emerald-400",
    detail: "Execute live across venues with institutional algorithms — TWAP, VWAP, smart order routing, DeFi-native execution. Real-time position management and P&L tracking.",
    services: ["Live Execution", "Smart Order Routing", "Position Management"],
    example: "Your strategy executes simultaneously on Binance (perps), Hyperliquid (DeFi), and Deribit (options) with automated position balancing.",
  },
  {
    num: "5", name: "Observe", short: "Monitor, alert, reconcile",
    color: "cyan", borderClass: "border-cyan-400/30", bgClass: "bg-cyan-400/5",
    hoverBorder: "border-cyan-400/70", textClass: "text-cyan-400",
    detail: "Monitor risk exposure, P&L, and execution quality in real time. Receive alerts on limit breaches, model drift, or venue issues. Reconcile positions between batch and live systems.",
    services: ["Risk Dashboard", "Alerting", "Execution Analytics", "Reconciliation"],
    example: "An alert fires: margin utilisation on Binance hits 78%. The risk dashboard shows which strategies are driving it and suggests rebalancing.",
  },
  {
    num: "6", name: "Manage", short: "Allocate, govern, control",
    color: "rose", borderClass: "border-rose-400/30", bgClass: "bg-rose-400/5",
    hoverBorder: "border-rose-400/70", textClass: "text-rose-400",
    detail: "Manage client subscriptions, capital allocation, fee schedules, and user access. Internal operations — onboarding, deployment, configuration — all in one place.",
    services: ["Client Management", "Capital Allocation", "Fee Schedules", "Deployments"],
    example: "Onboard a new client, set their risk limits, assign strategy allocations, and configure their fee schedule — all from the admin dashboard.",
  },
  {
    num: "7", name: "Report", short: "Attribute, audit, disclose",
    color: "slate", borderClass: "border-slate-400/30", bgClass: "bg-slate-400/5",
    hoverBorder: "border-slate-400/70", textClass: "text-slate-400",
    detail: "Generate P&L attribution reports, settlement statements, and regulatory filings. Full audit trail for compliance. Clients see their own scoped reports; internal sees everything.",
    services: ["P&L Attribution", "Settlement", "Regulatory Reporting", "Audit Trail"],
    example: "Monthly performance report auto-generated for Alpha Capital: +4.2% MTD, Sharpe 1.8, with full factor-level attribution and fee transparency.",
  },
]

export function OperatingModelStages() {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const hovered = hoveredIdx !== null ? STAGES[hoveredIdx] : null

  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 hidden md:block" />

      {/* Stage cards */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {STAGES.map((stage, i) => (
          <div
            key={stage.name}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={cn(
                "flex flex-col items-center p-3 md:p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                stage.borderClass, stage.bgClass,
                hoveredIdx === i && stage.hoverBorder,
                hoveredIdx === i && "scale-105 shadow-lg z-10",
                hoveredIdx !== null && hoveredIdx !== i && "opacity-40",
              )}
            >
              <div className={cn("text-lg md:text-xl font-bold", stage.textClass)}>{stage.num}</div>
              <div className="text-xs md:text-sm font-semibold mt-1">{stage.name}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1 text-center leading-tight hidden sm:block">
                {stage.short}
              </div>
            </div>
            {i < 6 && (
              <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50 hidden md:block" />
            )}
          </div>
        ))}
      </div>

      {/* Hover detail panel */}
      <div
        className={cn(
          "mt-6 overflow-hidden transition-all duration-300 ease-out",
          hovered ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {hovered && (
          <div className={cn(
            "rounded-xl border p-5",
            `border-${hovered.color}-400/30 bg-${hovered.color}-400/5`
          )}
          style={{
            borderColor: `color-mix(in srgb, var(--color-${hovered.color}-400, #888) 30%, transparent)`,
            backgroundColor: `color-mix(in srgb, var(--color-${hovered.color}-400, #888) 5%, transparent)`,
          }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h3 className={cn("text-sm font-bold mb-2", hovered.textClass)}>
                  {hovered.num}. {hovered.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hovered.detail}
                </p>
                <p className="text-[11px] text-foreground/60 mt-3 italic border-l-2 border-border pl-3">
                  {hovered.example}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Platform services at this stage
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hovered.services.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        `border-${hovered.color}-400/30 text-${hovered.color}-400`
                      )}
                      style={{
                        borderColor: `color-mix(in srgb, var(--color-${hovered.color}-400, #888) 30%, transparent)`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
        Hover any stage to see what happens there. Clients enter at any stage — workflows connect at the appropriate boundary.
      </p>
    </div>
  )
}
