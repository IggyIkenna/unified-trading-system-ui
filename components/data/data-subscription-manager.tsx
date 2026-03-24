"use client";

// DataSubscriptionManager — Shows active subscriptions + paywall for unsubscribed shards
// Admin: sees all org subscriptions
// Client: sees their own, upgrade CTAs for locked shards
// Demo: shows mock subscriptions with "Demo Mode" badge, no real actions

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Cloud,
  Zap,
  Download,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import type {
  DataSubscription,
  AccessMode,
  OrgMode,
} from "@/lib/data-service-types";
import { DATA_CATEGORY_LABELS, PRICING_MODELS } from "@/lib/data-service-types";

// Access mode badge colours
const ACCESS_MODE_STYLE: Record<
  AccessMode,
  { badge: string; icon: React.ElementType; label: string }
> = {
  in_system: {
    badge: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
    icon: Zap,
    label: "In-System",
  },
  download: {
    badge: "text-amber-500  border-amber-500/30  bg-amber-500/5",
    icon: Download,
    label: "Download",
  },
};

interface DataSubscriptionManagerProps {
  subscriptions: DataSubscription[];
  orgMode: OrgMode;
  onUpgrade?: () => void;
  onAddShard?: () => void;
  className?: string;
}

export function DataSubscriptionManager({
  subscriptions,
  orgMode,
  onUpgrade,
  onAddShard,
  className,
}: DataSubscriptionManagerProps) {
  const active = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trial",
  );
  const totalMonthlyCents = active.reduce(
    (sum, s) => sum + s.monthlyCostCents,
    0,
  );
  const totalGbUsed = active.reduce((sum, s) => sum + s.gbUsedThisMonth, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">
              Active Subscriptions
            </div>
            <div className="mt-1 text-2xl font-bold font-mono">
              {active.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">
              GB Queried (MTD)
            </div>
            <div className="mt-1 text-2xl font-bold font-mono">
              {totalGbUsed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Monthly Cost</div>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {orgMode === "demo"
                ? "—"
                : `$${(totalMonthlyCents / 100).toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo mode banner */}
      {orgMode === "demo" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          Demo mode — subscriptions are illustrative. Sign in to manage real
          data access.
        </div>
      )}

      {/* Subscription cards */}
      {active.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Lock className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No active subscriptions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the catalogue and subscribe to your first data shard.
            </p>
            <Button className="mt-4" onClick={onAddShard}>
              <Plus className="mr-2 size-4" />
              Browse Catalogue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((sub) => {
            const accessStyle = ACCESS_MODE_STYLE[sub.accessMode];
            const AccessIcon = accessStyle.icon;
            const usagePct = (sub.gbUsedThisMonth / sub.gbLimitThisMonth) * 100;
            const isNearLimit = usagePct > 80;

            return (
              <Card
                key={sub.id}
                className={cn(sub.status === "trial" && "border-amber-500/30")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {sub.label}
                        {sub.status === "trial" && (
                          <Badge
                            variant="outline"
                            className="text-amber-500 border-amber-500/30 text-[10px]"
                          >
                            TRIAL
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-1">
                        {sub.shardFilters.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {DATA_CATEGORY_LABELS[cat]}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", accessStyle.badge)}
                    >
                      <AccessIcon className="mr-1 size-3" />
                      {accessStyle.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Venues + data types */}
                  <div className="flex flex-wrap gap-1">
                    {sub.shardFilters.venues.map((v) => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sub.shardFilters.dataTypes.map((dt) => (
                      <Badge
                        key={dt}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {dt}
                      </Badge>
                    ))}
                  </div>

                  {/* Usage bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {sub.gbUsedThisMonth} GB / {sub.gbLimitThisMonth} GB
                        used this month
                      </span>
                      {isNearLimit && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle className="size-3" /> Near limit
                        </span>
                      )}
                    </div>
                    <Progress
                      value={usagePct}
                      className={cn(
                        "h-1.5",
                        isNearLimit
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-sky-500",
                      )}
                    />
                  </div>

                  {/* Footer: cost + date range + renewal */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Cloud className="size-3" />
                        {sub.cloudTarget.toUpperCase()}
                      </span>
                      <span>
                        {sub.shardFilters.dateFrom} → {sub.shardFilters.dateTo}
                      </span>
                      {sub.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Renews {sub.expiresAt}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-mono font-semibold">
                      {orgMode === "demo"
                        ? "—"
                        : `$${(sub.monthlyCostCents / 100).toLocaleString()}/mo`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paywall upgrade CTA (client mode only) */}
      {orgMode === "client" && active.length < 3 && (
        <Card className="border-dashed border-sky-500/30 bg-sky-500/5">
          <CardContent className="py-5 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Unlock more asset classes</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add DeFi, TradFi, or Onchain Perps data to your subscription
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onUpgrade}>
              <ArrowUpRight className="mr-2 size-4" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add shard CTA */}
      {orgMode !== "demo" && (
        <Button variant="outline" className="w-full" onClick={onAddShard}>
          <Plus className="mr-2 size-4" />
          Add Data Shard
        </Button>
      )}
    </div>
  );
}
