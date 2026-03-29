"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { useExecutionHandoff } from "@/hooks/api/use-orders";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  Shield,
  Rocket,
  GitBranch,
  Settings,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import { ApiError } from "@/components/shared/api-error";
import { Spinner } from "@/components/shared/spinner";

const impactColors: Record<string, string> = {
  high: "text-red-500 bg-red-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-emerald-500 bg-emerald-500/10",
};

const HANDOFF_DEFAULTS = {
  algoId: "",
  algoName: "",
  version: "",
  sourceEnv: "",
  targetEnv: "",
  requestedBy: "",
  requestedAt: new Date().toISOString(),
  performance: {
    backtestSlippage: 0,
    paperSlippage: 0,
    backtestFillRate: 0,
    paperFillRate: 0,
    backtestLatency: 0,
    paperLatency: 0,
  },
  configChanges: [] as Array<{
    key: string;
    oldValue: string;
    newValue: string;
    impact: string;
  }>,
  approvals: {} as Record<string, { approved: boolean; approver: string | null; timestamp: string | null }>,
  checklist: [] as Array<{ id: string; label: string; done: boolean }>,
};

export default function ExecutionHandoffPage() {
  const { data: handoffData, isLoading, isError, error, refetch } = useExecutionHandoff();
  const mockHandoff: typeof HANDOFF_DEFAULTS = (handoffData as any)?.data ?? HANDOFF_DEFAULTS;

  const [notes, setNotes] = React.useState("");
  const [rolloutStrategy, setRolloutStrategy] = React.useState("canary");
  const [checklist, setChecklist] = React.useState(mockHandoff.checklist);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-4">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load handoff" />
        </div>
      </div>
    );
  }

  const allApprovalsComplete = Object.values(mockHandoff.approvals).every((a: any) => a.approved);
  const allChecklistComplete = checklist.every((item: any) => item.done);
  const canDeploy = allApprovalsComplete && allChecklistComplete;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-4">
          <ExecutionNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              {mockHandoff.algoName}
              <Badge variant="outline">v{mockHandoff.version}</Badge>
            </span>
          }
          description={
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{mockHandoff.sourceEnv}</Badge>
              <ArrowRight className="size-4 shrink-0" />
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                {mockHandoff.targetEnv}
              </Badge>
              <span className="mx-2 hidden sm:inline">|</span>
              <span className="flex items-center gap-1">
                <Clock className="size-4 shrink-0" />
                Requested {new Date(mockHandoff.requestedAt).toLocaleString()}
              </span>
            </div>
          }
        >
          <Button size="lg" disabled={!canDeploy} className="gap-2">
            <Rocket className="size-4" />
            Deploy to {mockHandoff.targetEnv}
          </Button>
        </PageHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Performance & Config */}
          <div className="col-span-2 space-y-6">
            {/* Performance Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance Comparison</CardTitle>
                <CardDescription>Backtest vs Paper Trading results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Slippage vs Arrival</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Backtest</span>
                        <span className="font-mono tabular-nums text-emerald-500">
                          {mockHandoff.performance.backtestSlippage >= 0 ? "+" : ""}
                          {formatNumber(mockHandoff.performance.backtestSlippage, 1)} bps
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Paper</span>
                        <span className="font-mono tabular-nums text-emerald-500">
                          {mockHandoff.performance.paperSlippage >= 0 ? "+" : ""}
                          {formatNumber(mockHandoff.performance.paperSlippage, 1)} bps
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Fill Rate</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Backtest</span>
                        <span className="font-mono tabular-nums">{mockHandoff.performance.backtestFillRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Paper</span>
                        <span className="font-mono tabular-nums">{mockHandoff.performance.paperFillRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Avg Latency</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Backtest</span>
                        <span className="font-mono tabular-nums">{mockHandoff.performance.backtestLatency}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Paper</span>
                        <span className="font-mono tabular-nums">{mockHandoff.performance.paperLatency}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Config Changes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Configuration Changes</CardTitle>
                    <CardDescription>Parameters modified from current production</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <GitBranch className="size-4" />
                    View Full Diff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockHandoff.configChanges.map((change) => (
                    <div key={change.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <code className="text-sm font-mono">{change.key}</code>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="text-muted-foreground line-through">{change.oldValue}</span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-medium">{change.newValue}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", impactColors[change.impact])}>
                        {change.impact} impact
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rollout Strategy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rollout Strategy</CardTitle>
                <CardDescription>How to deploy to production</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={rolloutStrategy} onValueChange={setRolloutStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canary">Canary (10% traffic for 24h, then full)</SelectItem>
                    <SelectItem value="gradual">Gradual (25% daily increase)</SelectItem>
                    <SelectItem value="immediate">Immediate (100% traffic)</SelectItem>
                    <SelectItem value="manual">Manual (controlled rollout)</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <label className="text-sm font-medium">Deployment Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for the deployment team..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Approvals & Checklist */}
          <div className="space-y-6">
            {/* Approval Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(mockHandoff.approvals).map(([key, approval]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      approval.approved ? "bg-emerald-500/5" : "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {approval.approved ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                      <span className="capitalize font-medium text-sm">{key}</span>
                    </div>
                    {approval.approved ? (
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{approval.approver}</div>
                        <div>{new Date(approval.timestamp!).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm">
                        Request
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deployment Checklist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="size-4" />
                  Deployment Checklist
                </CardTitle>
                <CardDescription>
                  {checklist.filter((i) => i.done).length}/{checklist.length} complete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer"
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <Checkbox checked={item.done} />
                    <span className={cn("text-sm", item.done && "line-through text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deployment Summary */}
            <Card
              className={cn(
                "border-2",
                canDeploy ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {canDeploy ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="size-5 text-amber-500" />
                  )}
                  <span className="font-medium">{canDeploy ? "Ready for Deployment" : "Pending Items"}</span>
                </div>
                {!canDeploy && (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {!allApprovalsComplete && (
                      <li>
                        - Missing approvals:{" "}
                        {Object.entries(mockHandoff.approvals)
                          .filter(([_, a]) => !a.approved)
                          .map(([k]) => k)
                          .join(", ")}
                      </li>
                    )}
                    {!allChecklistComplete && (
                      <li>- Incomplete checklist items: {checklist.filter((i) => !i.done).length}</li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
