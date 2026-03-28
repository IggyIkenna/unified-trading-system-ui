"use client";

import * as React from "react";
import { HelpCircle, MessageSquarePlus, X, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// ── Page descriptions ────────────────────────────────────────────────────────
// Keyed by pathname prefix. First match wins.

const PAGE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  "/services/trading/overview": {
    title: "Trading Overview",
    description: "Portfolio snapshot with key metrics, positions summary, and quick actions. Customise the layout with widgets.",
  },
  "/services/trading/positions": {
    title: "Positions",
    description: "Real-time view of all open positions across venues and asset classes. Filter by strategy, venue, or asset class. P&L is shown per-position and aggregated.",
  },
  "/services/trading/orders": {
    title: "Orders",
    description: "All open, filled, and cancelled orders. Click an order to see fill detail. Use filters to narrow by venue, status, or instrument.",
  },
  "/services/trading/pnl": {
    title: "P&L",
    description: "Full P&L attribution by strategy, venue, and asset class. Includes waterfall charts, daily bars, and cumulative return curves.",
  },
  "/services/trading/defi": {
    title: "DeFi",
    description: "Execute DeFi operations — swaps (Uniswap), flash loans (Aave), and cross-chain bridges. All trades are pre-simulated before broadcast.",
  },
  "/services/trading/sports": {
    title: "Sports",
    description: "Browse fixtures, view odds across bookmakers, and place bets. The Arb tab highlights cross-venue arbitrage opportunities.",
  },
  "/services/trading/predictions": {
    title: "Predictions",
    description: "Event-based prediction markets from Polymarket and other venues. Browse markets, trade outcomes, and track your portfolio.",
  },
  "/services/trading/options": {
    title: "Options & Futures",
    description: "Traditional and crypto options/futures trading. Expiry strip navigation, Greeks display, scenario analysis, and watchlist.",
  },
  "/services/trading/markets": {
    title: "Markets",
    description: "Live market data overview with price tickers, volume charts, and market microstructure. Filter by venue or asset class.",
  },
  "/services/trading/risk": {
    title: "Risk",
    description: "Real-time risk exposure dashboards — VaR, margin utilisation, concentration risk, and drawdown tracking.",
  },
  "/services/trading/alerts": {
    title: "Alerts",
    description: "Triggered alerts for position limits, drawdown thresholds, venue latency, and missed fills. Configure thresholds in settings.",
  },
  "/services/trading/book": {
    title: "Trade Book",
    description: "Complete audit trail of every trade — order placement, fill, settlement. Use for compliance queries, debugging, or reconciliation.",
  },
  "/services/trading/terminal": {
    title: "Terminal",
    description: "Full-featured order ticket with algo selection, smart routing, and execution controls. Place market, limit, and stop orders.",
  },
  "/services/trading/strategies": {
    title: "Strategies",
    description: "All active and paused strategies with live performance metrics. Click a strategy to see detailed P&L, signals, and configuration.",
  },
  "/services/trading/accounts": {
    title: "Accounts",
    description: "Connected trading accounts — venue credentials, balances, margin status, and connectivity. Link new venue accounts here.",
  },
  "/services/trading/bundles": {
    title: "Bundles",
    description: "Group multiple orders into atomic packages (e.g., simultaneous buy/sell across venues). Bundles execute all-or-nothing.",
  },
  "/services/trading/instructions": {
    title: "Instructions",
    description: "Pending and executed trading instructions from the strategy service. Each instruction specifies instrument, direction, size, and urgency.",
  },
  "/services/data/overview": {
    title: "Data Overview",
    description: "Instrument catalogues, market data coverage, venue status, and data freshness monitoring across all asset classes.",
  },
  "/services/data/instruments": {
    title: "Instruments",
    description: "Full instrument catalogue — search by name, symbol, venue, or asset class. Each entry shows listing date, data coverage, and trading status.",
  },
  "/services/data/coverage": {
    title: "Coverage",
    description: "Data feed coverage across venues and instruments. Gaps are highlighted. Check which venues have active feeds and last update timestamps.",
  },
  "/services/data/venues": {
    title: "Venues",
    description: "All connected exchanges and data providers with status (online/degraded/offline), supported asset classes, and latency metrics.",
  },
  "/services/data/gaps": {
    title: "Data Gaps",
    description: "Scan for missing data across all instruments and venues. Each gap shows time range, affected instrument, and venue. Queue gaps for backfill.",
  },
  "/services/research/overview": {
    title: "Research Overview",
    description: "Research pipeline dashboard — backtests, ML models, feature engineering, and signal configuration.",
  },
  "/services/research/strategy/backtests": {
    title: "Backtests",
    description: "Configure and run strategy backtests. Select instruments, date range, and parameters. Results show P&L curves, drawdown, and fill detail.",
  },
  "/services/research/ml": {
    title: "ML Pipeline",
    description: "Model training runs, feature importance, and live inference metrics. Train, validate, and promote models to production.",
  },
  "/services/research/features": {
    title: "Features",
    description: "Browse the 600+ feature catalogue across 7 services. View feature definitions, freshness, and compute pipelines.",
  },
  "/services/reports/overview": {
    title: "Reports",
    description: "Portfolio reports — executive summary, settlement detail, reconciliation, and regulatory compliance. Export to CSV or PDF.",
  },
  "/services/reports/executive": {
    title: "Executive Report",
    description: "Portfolio-level P&L attribution, risk metrics, and performance charts. Configurable date ranges (daily, weekly, monthly).",
  },
  "/services/observe/health": {
    title: "System Health",
    description: "Real-time health status of all services, data pipelines, and venue connections. Latency metrics and uptime tracking.",
  },
  "/services/observe/risk": {
    title: "Risk Dashboard",
    description: "Portfolio exposure by venue, asset class, and currency. VaR, margin utilisation, concentration risk, and drawdown tracking.",
  },
  "/services/observe/alerts": {
    title: "Alert Management",
    description: "All triggered alerts with severity, trigger condition, and recommended action. Configure alert rules and thresholds.",
  },
  "/services/promote": {
    title: "Promote",
    description: "8-stage pipeline to take strategies from candidate to live production. Each gate must pass before the next stage unlocks.",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Your platform home — all services, KPIs, and quick actions at a glance. Scope adjusts to your subscription tier.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your profile, API keys, notification preferences, and subscription tier.",
  },
  "/admin": {
    title: "Admin & Ops",
    description: "System administration — user management, deployments, service registry, batch jobs, and operational monitoring.",
  },
};

function getPageInfo(pathname: string): { title: string; description: string } | null {
  // Try exact match first, then prefix match (longest first)
  if (PAGE_DESCRIPTIONS[pathname]) return PAGE_DESCRIPTIONS[pathname];

  const sorted = Object.keys(PAGE_DESCRIPTIONS).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname.startsWith(prefix)) return PAGE_DESCRIPTIONS[prefix];
  }
  return null;
}

// ── Components ───────────────────────────────────────────────────────────────

interface PageHelpProps {
  pathname: string;
  className?: string;
}

export function PageHelp({ pathname, className }: PageHelpProps) {
  const info = getPageInfo(pathname);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState("");
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  if (!info) return null;

  function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    // In production this would POST to an API. For now, log + show confirmation.
    console.info("[Feedback]", { page: pathname, feedback: feedbackText.trim() });
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setFeedbackSent(false);
      setFeedbackText("");
    }, 1500);
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Help icon with tooltip */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label={`Help: ${info.title}`}
          >
            <HelpCircle className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 p-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{info.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Feedback button */}
      <Popover open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <PopoverTrigger asChild>
          <button
            className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-80 p-3">
          {feedbackSent ? (
            <p className="text-sm text-emerald-400 text-center py-4">
              Thanks for your feedback!
            </p>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-2">
              <p className="text-xs font-medium">Feedback for {info.title}</p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Suggest improvements, report issues, or request features..."
                className="w-full h-20 bg-muted/50 rounded-md border border-border/60 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:border-primary/40"
                autoFocus
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="h-7 text-xs gap-1.5" disabled={!feedbackText.trim()}>
                  <Send className="size-3" />
                  Send
                </Button>
              </div>
            </form>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
