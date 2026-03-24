"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  FlaskConical,
  Brain,
  Database,
  FileText,
  Shield,
  Settings,
  Cloud,
  ClipboardCheck,
  Users,
  BarChart3,
  Bell,
  Plus,
  Play,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const ROLE_ACTIONS: Record<string, QuickAction[]> = {
  admin: [
    {
      label: "Manage Users",
      href: "/services/manage/users",
      icon: Users,
      color: "text-red-400",
    },
    {
      label: "System Health",
      href: "/ops",
      icon: Eye,
      color: "text-green-400",
    },
    {
      label: "Audit Log",
      href: "/services/manage/compliance",
      icon: ClipboardCheck,
      color: "text-yellow-400",
    },
    {
      label: "Deployments",
      href: "/devops",
      icon: Cloud,
      color: "text-blue-400",
    },
    {
      label: "Configuration",
      href: "/config",
      icon: Settings,
      color: "text-purple-400",
    },
    {
      label: "Trading",
      href: "/trading",
      icon: TrendingUp,
      color: "text-orange-400",
    },
  ],
  internal: [
    {
      label: "Trading Dashboard",
      href: "/trading",
      icon: TrendingUp,
      color: "text-orange-400",
    },
    {
      label: "Risk Overview",
      href: "/trading/risk",
      icon: Shield,
      color: "text-red-400",
    },
    {
      label: "Positions",
      href: "/trading/positions",
      icon: BarChart3,
      color: "text-green-400",
    },
    {
      label: "Active Alerts",
      href: "/trading/alerts",
      icon: Bell,
      color: "text-yellow-400",
    },
    {
      label: "New Backtest",
      href: "/research/strategy/backtests",
      icon: FlaskConical,
      color: "text-purple-400",
    },
    {
      label: "ML Models",
      href: "/research/ml",
      icon: Brain,
      color: "text-cyan-400",
    },
  ],
  "client-full": [
    {
      label: "Portfolio Overview",
      href: "/reports",
      icon: FileText,
      color: "text-cyan-400",
    },
    {
      label: "Trading",
      href: "/trading",
      icon: TrendingUp,
      color: "text-orange-400",
    },
    {
      label: "Positions",
      href: "/trading/positions",
      icon: BarChart3,
      color: "text-green-400",
    },
    {
      label: "Strategies",
      href: "/research",
      icon: FlaskConical,
      color: "text-purple-400",
    },
    {
      label: "Data Catalogue",
      href: "/data",
      icon: Database,
      color: "text-blue-400",
    },
    {
      label: "Settlements",
      href: "/reports",
      icon: FileText,
      color: "text-yellow-400",
    },
  ],
  "client-basic": [
    {
      label: "Data Catalogue",
      href: "/data",
      icon: Database,
      color: "text-blue-400",
    },
    {
      label: "Markets",
      href: "/trading/markets",
      icon: TrendingUp,
      color: "text-orange-400",
    },
    {
      label: "Explore Services",
      href: "/",
      icon: Plus,
      color: "text-green-400",
    },
  ],
};

export function QuickActions() {
  const { user, isInternal } = useAuth();
  if (!user) return null;

  let actions: QuickAction[];
  if (user.role === "admin") {
    actions = ROLE_ACTIONS.admin;
  } else if (isInternal()) {
    actions = ROLE_ACTIONS.internal;
  } else if (user.entitlements.length > 2) {
    actions = ROLE_ACTIONS["client-full"];
  } else {
    actions = ROLE_ACTIONS["client-basic"];
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-accent/50 hover:border-border"
          >
            <Icon className={cn("size-3.5", action.color)} />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
