"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services";
import { lifecycleStages, type LifecycleStage } from "@/lib/lifecycle-mapping";
import { PLATFORM_STATS } from "@/lib/config/platform-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Zap,
  Eye,
  Users,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Zap,
  Eye,
  Users,
  FileText,
  Settings,
};

const STAGE_ORDER: LifecycleStage[] = [
  "acquire",
  "build",
  "promote",
  "run",
  "execute",
  "observe",
  "manage",
  "report",
];

export default function DashboardPage() {
  const { user, hasEntitlement, isAdmin, isInternal } = useAuth();

  const allServices = SERVICE_REGISTRY.filter((svc) => {
    if (svc.internalOnly && user?.role !== "admin") return false;
    return true;
  });

  const visibleServices = React.useMemo(() => {
    if (!user) return [];
    return getVisibleServices(
      user.entitlements as readonly string[],
      user.role,
    );
  }, [user]);

  const visibleKeys = new Set(visibleServices.map((s) => s.key));

  if (!user) return null;

  return (
    <div className="bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header + KPIs in one row */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-xl font-semibold">
              Welcome back, {user.displayName.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.org.name} &middot; {visibleServices.length} of{" "}
              {allServices.length} services
            </p>
          </div>
          <div className="flex items-center gap-4">
            <KPI label="Venues" value={String(PLATFORM_STATS.totalVenues)} />
            <KPI
              label="Classes"
              value={String(PLATFORM_STATS.assetClassCount)}
            />
            <KPI
              label="Instruments"
              value={`${PLATFORM_STATS.instrumentTypeCount}+`}
            />
          </div>
        </div>

        {/* Lifecycle pipeline — compact */}
        <div className="flex items-center gap-1 text-[10px]">
          {STAGE_ORDER.map((stage, i) => (
            <React.Fragment key={stage}>
              {i > 0 && (
                <ChevronRight className="size-2.5 text-muted-foreground/30" />
              )}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded",
                  lifecycleStages[stage].color,
                  "bg-current/5",
                )}
              >
                {lifecycleStages[stage].label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* All services in a single compact grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {allServices.map((svc) => {
            const Icon = ICON_MAP[svc.icon] ?? Database;
            const stageInfo = lifecycleStages[svc.lifecycleStage];
            const isLocked = !visibleKeys.has(svc.key);

            if (isLocked) {
              return (
                <Card
                  key={svc.key}
                  className="border-dashed border-border/50 opacity-60"
                >
                  <CardContent className="p-4 flex gap-3">
                    <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                      <Lock className="size-4" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {svc.label}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 border-amber-500/30 text-amber-500"
                        >
                          Upgrade
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">
                        {svc.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Link key={svc.key} href={svc.href}>
                <Card className="group hover:border-white/20 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex gap-3">
                    <div
                      className={cn("flex-shrink-0 mt-0.5", stageInfo.color)}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium group-hover:text-white transition-colors">
                          {svc.label}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] uppercase tracking-wider",
                            stageInfo.color,
                          )}
                        >
                          {stageInfo.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {svc.description}
                      </p>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
