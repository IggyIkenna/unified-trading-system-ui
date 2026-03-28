"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Play,
  Bell,
  FileText,
  CheckCircle2,
  TrendingUp,
  Brain,
  Shield,
  Zap,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityEvent {
  id: string;
  stage: string;
  stageColor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

const MOCK_ACTIVITY: ActivityEvent[] = [
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
    description:
      "Accuracy improved 0.68 → 0.72, champion/challenger swap pending",
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
    description:
      "Aave V3 lending rates — 180 days of historical data available",
    timestamp: "1d ago",
    href: "/services/data/overview",
  },
];

export function ActivityFeed({
  maxItems = 6,
  visibleStages,
}: {
  maxItems?: number;
  /** If provided, only show events matching these stage labels */
  visibleStages?: string[];
}) {
  const filtered = visibleStages
    ? MOCK_ACTIVITY.filter((e) => visibleStages.includes(e.stage))
    : MOCK_ACTIVITY;
  const events = filtered.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const Icon = event.icon;
        const content = (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-colors",
              event.href && "hover:bg-accent/50 cursor-pointer",
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {event.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] shrink-0", event.stageColor)}
                >
                  {event.stage}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {event.description}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">
              {event.timestamp}
            </span>
          </div>
        );

        if (event.href) {
          return (
            <Link key={event.id} href={event.href} className="block">
              {content}
            </Link>
          );
        }
        return <React.Fragment key={event.id}>{content}</React.Fragment>;
      })}
    </div>
  );
}
