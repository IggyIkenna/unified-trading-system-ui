"use client";

/**
 * DART Deployment / Execution Config sub-tab (Phase 11).
 *
 * Lightweight view of per-strategy runtime config. Deep ops (chaos runner,
 * kill-switch forensics, full canary rollout) live in deployment-ui — cross-
 * link card below.
 *
 * Codex SSOT:
 *   unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md § 2.
 */

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ExternalLink, Lock, Radio, ShieldAlert, Skull, Zap } from "lucide-react";
import Link from "next/link";

export default function DeploymentPage() {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  const canAccess = isAdmin() || isInternal() || hasEntitlement("strategy-full");

  if (!canAccess) {
    return (
      <div className="p-6">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5 text-amber-400" aria-hidden />
              Upgrade to DART Full to access deployment controls
            </CardTitle>
            <CardDescription>
              Runtime profile, chaos controller, and kill-switch configuration require the Strategy-Full entitlement.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="DART · Deployment"
        description="Runtime profile, chaos controller, and kill-switch state for live strategies. Deep ops operations link out to deployment-ui."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="size-4 text-emerald-400" aria-hidden />
              Runtime profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profile</span>
              <Badge variant="outline">PRODUCTION_LIVE</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chaos controller</span>
              <Badge variant="outline">disabled</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kill-switch</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                armed · healthy
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-amber-400" aria-hidden />
              Canary status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canary cohort</span>
              <span>10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drift vs baseline</span>
              <span className="text-emerald-400">-0.02%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-rose-400" aria-hidden />
              Incident controls
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Skull className="mr-1.5 size-3.5" aria-hidden />
              Trigger kill-switch
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              Pause cohort
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deep operations (deployment-ui)</CardTitle>
          <CardDescription>
            Full canary rollout forensics, chaos scenarios, shard backfill, and VM fleet state live in deployment-ui:
            kept separate so DART stays focussed on strategy operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="http://localhost:5183" target="_blank" rel="noreferrer" className="gap-2">
              Open deployment-ui <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
