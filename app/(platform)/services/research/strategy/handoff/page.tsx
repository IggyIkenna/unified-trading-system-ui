"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StrategyPlatformNav } from "@/components/strategy-platform/strategy-nav";
import { useStrategyHandoffs } from "@/hooks/api/use-strategies";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileJson,
  GitBranch,
  Shield,
  Clock,
  User,
  MessageSquare,
  Rocket,
  Copy,
  ExternalLink,
} from "lucide-react";

// Fallback data used when the API returns no handoffs
const FALLBACK_HANDOFF = {
  strategyId: "ETH_BASIS_v3.2",
  backtestId: "bt-001",
  configVersion: "3.2.1",
  sourceExperiment: "exp-eth-basis-2024-03",

  metrics: {
    sharpe: 1.82,
    sortino: 2.14,
    returns: 24.3,
    maxDD: -8.2,
    winRate: 58.4,
    profitFactor: 1.64,
    tradesPerDay: 12.4,
  },

  champion: {
    strategyId: "ETH_BASIS_v3.1",
    sharpe: 1.65,
    returns: 22.2,
    maxDD: -8.6,
  },

  configDiff: [
    { field: "entry_threshold", old: "0.0015", new: "0.0012", type: "changed" },
    { field: "exit_threshold", old: "0.0008", new: "0.0006", type: "changed" },
    { field: "max_position_size", old: "50000", new: "75000", type: "changed" },
    {
      field: "regime_filter.enabled",
      old: "false",
      new: "true",
      type: "added",
    },
    {
      field: "regime_filter.min_volatility",
      old: "-",
      new: "0.02",
      type: "added",
    },
  ],

  riskChecks: [
    {
      name: "VaR 95% within limit",
      passed: true,
      value: "$42,500",
      limit: "$50,000",
    },
    {
      name: "Max drawdown acceptable",
      passed: true,
      value: "-8.2%",
      limit: "-15%",
    },
    {
      name: "Position concentration",
      passed: true,
      value: "12%",
      limit: "25%",
    },
    {
      name: "Correlation to existing",
      passed: true,
      value: "0.32",
      limit: "0.7",
    },
    {
      name: "Sufficient backtest period",
      passed: true,
      value: "18 months",
      limit: "12 months",
    },
  ],

  approvals: [
    {
      role: "Quant Lead",
      user: "Alice Chen",
      status: "approved",
      timestamp: "2 hours ago",
    },
    { role: "Risk Manager", user: null, status: "pending", timestamp: null },
    { role: "CTO", user: null, status: "pending", timestamp: null },
  ],
};

export default function StrategyHandoffPage() {
  const [notes, setNotes] = React.useState("");
  const [shadowTradingEnabled, setShadowTradingEnabled] = React.useState(true);
  const [autoRollback, setAutoRollback] = React.useState(true);
  const [gradualRollout, setGradualRollout] = React.useState(true);

  const { data: rawData, isLoading, isError, refetch } = useStrategyHandoffs();
  const handoffs =
    (rawData as Record<string, unknown>)?.data ??
    (rawData as Record<string, unknown>)?.handoffs ??
    [];
  const HANDOFF_CANDIDATE =
    Array.isArray(handoffs) && handoffs.length > 0
      ? (handoffs[0] as typeof FALLBACK_HANDOFF)
      : FALLBACK_HANDOFF;

  const allChecksPass = (HANDOFF_CANDIDATE.riskChecks ?? []).every(
    (c: { passed: boolean }) => c.passed,
  );
  const pendingApprovals = (HANDOFF_CANDIDATE.approvals ?? []).filter(
    (a: { status: string }) => a.status === "pending",
  ).length;
  const canPromote = allChecksPass && pendingApprovals === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <StrategyPlatformNav />
          </div>
        </div>
        <div className="platform-page-width p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <StrategyPlatformNav />
          </div>
        </div>
        <div className="platform-page-width p-6 space-y-6">
          <Alert className="border-red-500/50 bg-red-500/5">
            <AlertTriangle className="size-4 text-red-500" />
            <AlertTitle className="text-red-500">
              Failed to load handoff data
            </AlertTitle>
            <AlertDescription>
              Could not fetch strategy handoffs from the API.{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-3">
          <StrategyPlatformNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <Send className="size-6" />
              Promotion Handoff
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Final review and approval before promoting to live trading
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Copy className="size-4 mr-2" />
              Copy Config
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="size-4 mr-2" />
              View in ML Platform
            </Button>
          </div>
        </div>

        {/* Promotion Alert */}
        {canPromote ? (
          <Alert className="border-emerald-500/50 bg-emerald-500/5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <AlertTitle className="text-emerald-500">
              Ready for Promotion
            </AlertTitle>
            <AlertDescription>
              All risk checks passed and approvals received. This strategy can
              be promoted to live trading.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="size-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Pending Items</AlertTitle>
            <AlertDescription>
              {pendingApprovals > 0 &&
                `${pendingApprovals} approval(s) pending. `}
              {!allChecksPass && "Some risk checks have not passed."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Strategy Summary */}
          <div className="col-span-2 space-y-6">
            {/* Strategy Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileJson className="size-4" />
                  Strategy Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Strategy ID
                    </div>
                    <div className="font-mono font-medium">
                      {HANDOFF_CANDIDATE.strategyId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Config Version
                    </div>
                    <div className="font-mono">
                      {HANDOFF_CANDIDATE.configVersion}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Source Backtest
                    </div>
                    <div className="font-mono">
                      {HANDOFF_CANDIDATE.backtestId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Source Experiment
                    </div>
                    <div className="font-mono">
                      {HANDOFF_CANDIDATE.sourceExperiment}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Sharpe</div>
                    <div className="text-xl font-bold font-mono">
                      {HANDOFF_CANDIDATE.metrics.sharpe}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Returns</div>
                    <div className="text-xl font-bold font-mono text-emerald-500">
                      +{HANDOFF_CANDIDATE.metrics.returns}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Max DD</div>
                    <div className="text-xl font-bold font-mono text-red-500">
                      {HANDOFF_CANDIDATE.metrics.maxDD}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">
                      Win Rate
                    </div>
                    <div className="text-xl font-bold font-mono">
                      {HANDOFF_CANDIDATE.metrics.winRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Config Diff */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="size-4" />
                  Config Changes vs Champion (
                  {HANDOFF_CANDIDATE.champion.strategyId})
                </CardTitle>
                <CardDescription>
                  {HANDOFF_CANDIDATE.configDiff.length} parameter changes from
                  current champion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Parameter</th>
                        <th className="text-left p-2 font-medium">Champion</th>
                        <th className="text-left p-2 font-medium">Candidate</th>
                        <th className="text-left p-2 font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HANDOFF_CANDIDATE.configDiff.map((diff, i) => (
                        <tr
                          key={diff.field}
                          className={cn(i % 2 === 0 && "bg-muted/20")}
                        >
                          <td className="p-2 font-mono text-xs">
                            {diff.field}
                          </td>
                          <td className="p-2 font-mono text-xs text-muted-foreground">
                            {diff.old}
                          </td>
                          <td className="p-2 font-mono text-xs">{diff.new}</td>
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                diff.type === "added" &&
                                  "bg-emerald-500/10 text-emerald-500",
                                diff.type === "changed" &&
                                  "bg-blue-500/10 text-blue-500",
                                diff.type === "removed" &&
                                  "bg-red-500/10 text-red-500",
                              )}
                            >
                              {diff.type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Risk Checks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Risk Validation Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {HANDOFF_CANDIDATE.riskChecks.map((check, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        check.passed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-red-500/30 bg-red-500/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {check.passed ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="size-4 text-red-500" />
                        )}
                        <span className="font-medium">{check.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono">{check.value}</span>
                        <span className="text-muted-foreground">
                          / {check.limit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Approvals & Actions */}
          <div className="space-y-6">
            {/* Approval Chain */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4" />
                  Approval Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {HANDOFF_CANDIDATE.approvals.map((approval, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      approval.status === "approved" &&
                        "border-emerald-500/30 bg-emerald-500/5",
                      approval.status === "pending" && "border-muted",
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm">{approval.role}</div>
                      {approval.user ? (
                        <div className="text-xs text-muted-foreground">
                          {approval.user}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-500">
                          Awaiting approval
                        </div>
                      )}
                    </div>
                    {approval.status === "approved" ? (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="size-4" />
                        <span className="text-xs">{approval.timestamp}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-amber-500">
                        Pending
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deployment Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="size-4" />
                  Deployment Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="shadow">Shadow Trading First</Label>
                    <p className="text-xs text-muted-foreground">
                      Run in paper mode before live
                    </p>
                  </div>
                  <Switch
                    id="shadow"
                    checked={shadowTradingEnabled}
                    onCheckedChange={setShadowTradingEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="rollback">Auto-Rollback</Label>
                    <p className="text-xs text-muted-foreground">
                      Revert if drawdown exceeds threshold
                    </p>
                  </div>
                  <Switch
                    id="rollback"
                    checked={autoRollback}
                    onCheckedChange={setAutoRollback}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gradual">Gradual Rollout</Label>
                    <p className="text-xs text-muted-foreground">
                      Increase allocation over time
                    </p>
                  </div>
                  <Switch
                    id="gradual"
                    checked={gradualRollout}
                    onCheckedChange={setGradualRollout}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  Promotion Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes for the audit trail..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full" size="lg" disabled={!canPromote}>
                <Rocket className="size-4 mr-2" />
                Promote to Live Trading
              </Button>
              <Button variant="outline" className="w-full">
                Request Approval
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground">
                Return to Candidates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
