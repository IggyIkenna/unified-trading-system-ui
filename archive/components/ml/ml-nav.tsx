"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Cpu,
  Database,
  GitCompare,
  Rocket,
  Activity,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mlNavItems = [
  {
    href: "/services/research/ml/overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Platform health & alerts",
  },
  {
    href: "/services/research/ml/experiments",
    label: "Experiments",
    icon: FlaskConical,
    description: "Hypothesis tracking",
  },
  {
    href: "/services/research/ml/training",
    label: "Training Runs",
    icon: Cpu,
    description: "Active & completed runs",
  },
  {
    href: "/services/research/ml/registry",
    label: "Model Registry",
    icon: Layers,
    description: "Versioned model catalog",
  },
  {
    href: "/services/research/ml/validation",
    label: "Validation",
    icon: GitCompare,
    description: "Champion vs Challenger",
  },
  {
    href: "/services/research/ml/deploy",
    label: "Deploy",
    icon: Rocket,
    description: "Readiness checklist",
  },
  {
    href: "/services/research/ml/monitoring",
    label: "Monitoring",
    icon: Activity,
    description: "Live performance",
  },
  {
    href: "/services/research/ml/features",
    label: "Features",
    icon: Database,
    description: "Feature catalog",
  },
  {
    href: "/services/research/ml/governance",
    label: "Governance",
    icon: Shield,
    description: "Audit & compliance",
  },
];

export function MLNav({ className }: { className?: string }) {
  const pathname = usePathname() || "";

  return (
    <nav className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {mlNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2 whitespace-nowrap",
                isActive && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

export function MLNavSidebar({ className }: { className?: string }) {
  const pathname = usePathname() || "";

  return (
    <nav className={cn("space-y-1", className)}>
      {mlNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {isActive && <ChevronRight className="size-4" />}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export { mlNavItems };
