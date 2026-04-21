"use client";

/**
 * DART Strategy Configuration surface (Phase 11).
 *
 * Tabs: Confirmers / ML / Execution Backtest / Strategy Params.
 *
 * Entitlement gate: visible to personas with BOTH `strategy-full` AND
 * `ml-full` (or admin/internal). DART Signals-In personas never see this —
 * they don't configure strategies, they bring their own signals.
 *
 * Codex SSOT:
 *   unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md § 2-4.
 */

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { StrategyParamVersionBumpModal } from "@/components/dart/strategy-param-version-bump-modal";
import { AlertTriangle, ArrowUpCircle, Brain, FlaskConical, Lock, Settings2, Shield } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function StrategyConfigPage() {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  const [bumpOpen, setBumpOpen] = React.useState(false);

  // Gate: both strategy-full AND ml-full (or admin/internal)
  const canAccess =
    isAdmin() || isInternal() || (hasEntitlement("strategy-full") && hasEntitlement("ml-full"));

  if (!canAccess) {
    return (
      <div className="p-6">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5 text-amber-400" aria-hidden />
              Upgrade to DART Full to configure strategies
            </CardTitle>
            <CardDescription>
              Strategy configuration requires both Strategy-Full and ML-Full
              entitlements. DART Signals-In clients bring their own signals and
              do not configure Odum strategies — see the Signal Intake tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/services/signals/dashboard">Go to Signal Intake</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="DART · Strategy Configuration"
        description={
          <span>
            Configure confirmers, ML, execution-backtest, and strategy parameters
            for a live strategy. Param edits trigger the version-bump modal — see{" "}
            <Link
              href="https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/dart-tab-structure.md"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              codex § 4
            </Link>
            .
          </span>
        }
      >
        <Badge variant="outline" className="gap-1">
          <Shield className="size-3" aria-hidden />
          Batch = Live parity enforced
        </Badge>
      </PageHeader>

      <Tabs defaultValue="params" className="space-y-4">
        <TabsList>
          <TabsTrigger value="confirmers" data-testid="strategy-config-tab-confirmers">
            <Shield className="mr-1 size-3.5" aria-hidden />
            Confirmers
          </TabsTrigger>
          <TabsTrigger value="ml" data-testid="strategy-config-tab-ml">
            <Brain className="mr-1 size-3.5" aria-hidden />
            ML
          </TabsTrigger>
          <TabsTrigger value="backtest" data-testid="strategy-config-tab-backtest">
            <FlaskConical className="mr-1 size-3.5" aria-hidden />
            Execution Backtest
          </TabsTrigger>
          <TabsTrigger value="params" data-testid="strategy-config-tab-params">
            <Settings2 className="mr-1 size-3.5" aria-hidden />
            Strategy Params
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confirmers" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Pre-trade confirmers</CardTitle>
              <CardDescription>
                Sanity checks that must pass before any strategy-generated order
                reaches the execution layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Confirmer registry read API wiring pending — see admin
              truthiness follow-up.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>ML model binding</CardTitle>
              <CardDescription>
                Select the ML model for this strategy, retrain schedule, and
                subscribed feature groups. Feature subscriptions are read-only —
                managed centrally in admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ML model registry read API wiring pending.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Execution-backtest configuration</CardTitle>
              <CardDescription>
                Matching-engine simulation config: slippage model, commission
                model, latency model, venue liquidity. Used to measure execution
                alpha vs live fills.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Execution-backtest registry wiring pending.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="params" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Strategy parameters (live)</CardTitle>
              <CardDescription>
                Editing a live parameter opens the version-bump modal. Recommended
                path: bump the strategy version. Emergency hot-reload requires
                typing <code>I-ACCEPT-PARITY-BREAK</code> to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => setBumpOpen(true)}
                data-testid="strategy-config-edit-params"
              >
                <ArrowUpCircle className="mr-1.5 size-4" aria-hidden />
                Edit live parameters…
              </Button>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="size-3.5 text-amber-400" aria-hidden />
                Ad-hoc edits break backtest/live parity — prefer version bumps.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StrategyParamVersionBumpModal
        open={bumpOpen}
        strategyId="CARRY_AND_YIELD.CARRY_BASIS_PERP.eth-perp-binance-10m"
        currentVersion="v5"
        proposedVersion="v6"
        paramDiffSummary={`- entry_threshold: 0.02 → 0.025\n- hold_max_minutes: 60 → 45`}
        onBumpVersion={() => {
          // TODO: wire to strategy-service POST /api/strategy/{id}/version-bump
          setBumpOpen(false);
        }}
        onHotReload={() => {
          // TODO: wire to strategy-service POST /api/strategy/{id}/hot-reload
          //       with audit-log event STRATEGY_PARAM_AD_HOC_CHANGE
          setBumpOpen(false);
        }}
        onCancel={() => setBumpOpen(false)}
      />
    </div>
  );
}
