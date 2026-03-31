import { Bell, Brain, CheckCircle2, Database, FileText, FlaskConical, Play, TrendingUp } from "lucide-react";
import type * as React from "react";

export interface ActivityEvent {
  id: string;
  stage: string;
  stageColor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-1",
    stage: "Observe",
    stageColor: "text-cyan-400",
    icon: Bell,
    title: "Risk limit 80% utilization",
    description: "Cross-margin utilization on Binance approaching threshold",
    timestamp: "2 min ago",
    href: "/services/observe/alerts",
  },
  {
    id: "act-2",
    stage: "Trading",
    stageColor: "text-emerald-400",
    icon: TrendingUp,
    title: "Strategy Alpha-7 live on Binance",
    description: "3 instruments active, P&L +$12.4K since deployment",
    timestamp: "14 min ago",
    href: "/services/trading/overview",
  },
  {
    id: "act-3",
    stage: "Research",
    stageColor: "text-violet-400",
    icon: FlaskConical,
    title: "Backtest completed: ETH Basis v3.2",
    description: "Sharpe 2.1, Max DD -4.2%, 1,842 trades over 180 days",
    timestamp: "1h ago",
    href: "/services/research/strategy/backtests",
  },
  {
    id: "act-4",
    stage: "Promote",
    stageColor: "text-amber-400",
    icon: Play,
    title: "BTC Momentum promoted to paper trading",
    description: "Awaiting 7-day paper validation before live deployment",
    timestamp: "3h ago",
    href: "/services/promote/pipeline",
  },
  {
    id: "act-5",
    stage: "Research",
    stageColor: "text-violet-400",
    icon: Brain,
    title: "Model retrained: BTC Direction v3.2.1",
    description: "Accuracy improved 0.68 → 0.72, champion/challenger swap pending",
    timestamp: "4h ago",
    href: "/services/research/ml/registry",
  },
  {
    id: "act-6",
    stage: "Reports",
    stageColor: "text-slate-400",
    icon: FileText,
    title: "Monthly P&L report generated",
    description: "Alpha Capital — March 2026 performance attribution ready",
    timestamp: "6h ago",
    href: "/services/reports/overview",
  },
  {
    id: "act-7",
    stage: "Reports",
    stageColor: "text-slate-400",
    icon: CheckCircle2,
    title: "Settlement completed",
    description: "Alpha Capital profit share $312K settled to Barclays",
    timestamp: "1d ago",
    href: "/services/reports/settlement",
  },
  {
    id: "act-8",
    stage: "Data",
    stageColor: "text-sky-400",
    icon: Database,
    title: "DeFi data backfill complete",
    description: "Aave V3 lending rates — 180 days of historical data available",
    timestamp: "1d ago",
    href: "/services/data/overview",
  },
];
