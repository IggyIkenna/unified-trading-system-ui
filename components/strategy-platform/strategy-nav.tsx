"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FlaskConical,
  GitCompare,
  BarChart3,
  Grid3X3,
  ShoppingBasket,
  Send,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/strategy-platform/overview",
    icon: LayoutDashboard,
    description: "Research command center",
  },
  {
    label: "Backtests",
    href: "/strategy-platform/backtests",
    icon: FlaskConical,
    description: "Batch results grid",
    badge: "12",
  },
  {
    label: "Compare",
    href: "/strategy-platform/compare",
    icon: GitCompare,
    description: "Config comparison",
  },
  {
    label: "Results",
    href: "/strategy-platform/results",
    icon: BarChart3,
    description: "Result slice explorer",
  },
  {
    label: "Heatmap",
    href: "/strategy-platform/heatmap",
    icon: Grid3X3,
    description: "Performance heatmap",
  },
  {
    label: "Candidates",
    href: "/strategy-platform/candidates",
    icon: ShoppingBasket,
    description: "Shortlisted configs",
    badge: "3",
  },
  {
    label: "Handoff",
    href: "/strategy-platform/handoff",
    icon: Send,
    description: "Promotion packages",
  },
];

export function StrategyPlatformNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-4 py-2 border-b bg-card/50 overflow-x-auto",
        className,
      )}
    >
      <div className="flex items-center gap-1 mr-4">
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: "var(--surface-strategy)" }}
        />
        <span className="text-sm font-semibold">Strategy Research</span>
      </div>

      <div className="h-4 w-px bg-border mr-2" />

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-[var(--surface-strategy)]/10 text-[var(--surface-strategy)] font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="size-4" />
            {item.label}
            {item.badge && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 min-w-[20px] px-1.5 text-[10px]",
                  isActive && "bg-[var(--surface-strategy)]/20",
                )}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
