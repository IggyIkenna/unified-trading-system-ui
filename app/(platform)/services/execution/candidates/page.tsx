"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DataFreshnessStrip } from "@/components/shared/data-freshness-strip";
import type { DataSource } from "@/components/shared/data-freshness-strip";
import { BatchDetailDrawer } from "@/components/batch-workspace";
import type { DetailSection } from "@/components/batch-workspace/batch-detail-drawer";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { useExecutionCandidates } from "@/hooks/api/use-orders";
import {
  ShoppingBasket,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";

const statusConfig: Record<string, { label: string; color: string }> = {
  ready: { label: "Ready", color: "text-emerald-500" },
  pending_review: { label: "Pending Review", color: "text-amber-500" },
  needs_paper: { label: "Needs Paper", color: "text-blue-500" },
  blocked: { label: "Blocked", color: "text-red-500" },
};

export default function ExecutionCandidatesPage() {
  const { data: candidatesData, isLoading, isError, error, refetch } = useExecutionCandidates();
  const mockCandidates: Array<any> = (candidatesData as any)?.data ?? [];

  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([]);
  const [detailCandidateId, setDetailCandidateId] = React.useState<string | null>(null);

  const detailCandidate = detailCandidateId
    ? mockCandidates.find((c: { id: string }) => c.id === detailCandidateId)
    : null;

  const dataSources = React.useMemo<DataSource[]>(
    () => [{ label: "Candidates", source: "batch" as const, asOf: new Date().toISOString(), staleAfterSeconds: 300 }],
    [],
  );

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
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
          <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load candidates" />
        </div>
      </div>
    );
  }

  if (mockCandidates.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-4">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <EmptyState title="No promotion candidates" description="There are no algorithms pending promotion review." />
        </div>
      </div>
    );
  }

  const readyCandidates = mockCandidates.filter((c: any) => c.status === "ready");
  const pendingCandidates = mockCandidates.filter((c: any) => c.status !== "ready");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-4">
          <ExecutionNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Promotion Candidates"
            description="Review and approve algorithms for environment promotion"
          />
          <div className="flex items-center gap-3">
            <DataFreshnessStrip sources={dataSources} />
            <Badge variant="outline" className="gap-1">
              <ShoppingBasket className="size-3" />
              {selectedCandidates.length} selected
            </Badge>
            <Button disabled={selectedCandidates.length === 0} className="gap-2">
              <ArrowRight className="size-4" />
              Promote Selected
            </Button>
          </div>
        </div>

        {/* Narrative summary */}
        <div className="px-4 py-3 rounded-lg border border-border/30 bg-muted/5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground/80">Promotion Pipeline</span>:{" "}
            <span className="font-mono">{mockCandidates.length}</span> candidates under review.{" "}
            <span className="font-mono text-emerald-400">{readyCandidates.length}</span> ready for promotion,{" "}
            <span className="font-mono text-amber-400">
              {mockCandidates.filter((c) => c.status === "pending_review").length}
            </span>{" "}
            pending review,{" "}
            <span className="font-mono text-blue-400">
              {mockCandidates.filter((c) => c.status === "needs_paper").length}
            </span>{" "}
            need paper trading.
            {mockCandidates.filter((c) => c.status === "blocked").length > 0 && (
              <>
                {" "}
                <span className="font-mono text-red-400">
                  {mockCandidates.filter((c) => c.status === "blocked").length}
                </span>{" "}
                blocked.
              </>
            )}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardContent className="pt-5 pb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.1em]">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Ready for Promotion
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                {readyCandidates.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardContent className="pt-5 pb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.1em]">
                <Clock className="size-3.5 text-amber-500" />
                Pending Review
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                {mockCandidates.filter((c) => c.status === "pending_review").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardContent className="pt-5 pb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.1em]">
                <Zap className="size-3.5 text-blue-500" />
                Needs Paper Trading
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                {mockCandidates.filter((c) => c.status === "needs_paper").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardContent className="pt-5 pb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.1em]">
                <TrendingUp className="size-3.5" />
                Avg Improvement
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight font-mono text-emerald-500">
                +1.4 bps
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Algorithm Candidates</CardTitle>
            <CardDescription>Select candidates to batch promote or review individually</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Promotion Path</TableHead>
                  <TableHead className="text-right">Slippage vs Arrival</TableHead>
                  <TableHead className="text-right">Fill Rate</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCandidates.map((candidate) => {
                  const status = statusConfig[candidate.status] || statusConfig.blocked;
                  const checklistComplete = Object.values(candidate.checklist).filter(Boolean).length;
                  const checklistTotal = Object.values(candidate.checklist).length;

                  return (
                    <TableRow
                      key={candidate.id}
                      className={cn(selectedCandidates.includes(candidate.id) && "bg-primary/5")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                          disabled={candidate.status !== "ready"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{candidate.algoName}</div>
                        <div className="text-xs text-muted-foreground">{candidate.algoId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {candidate.sourceEnv}
                          </Badge>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {candidate.targetEnv}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono tabular-nums",
                            candidate.metrics.slippageVsArrival >= 0 ? "text-emerald-500" : "text-red-500",
                          )}
                        >
                          {candidate.metrics.slippageVsArrival >= 0 ? "+" : ""}
                          {formatNumber(candidate.metrics.slippageVsArrival, 1)} bps
                        </span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.slippage} vs current</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono tabular-nums">{candidate.metrics.fillRate}%</span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.fillRate}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono tabular-nums">{candidate.metrics.avgLatency}ms</span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.latency}</div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm font-medium", status.color)}>{status.label}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${(checklistComplete / checklistTotal) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {checklistComplete}/{checklistTotal}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setDetailCandidateId(candidate.id)}
                        >
                          Review
                          <ChevronRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Checklist Details */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Approval Checklist</CardTitle>
            <CardDescription>Required approvals before promotion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {
                  key: "backtestComplete",
                  label: "Backtest Complete",
                  icon: CheckCircle2,
                },
                {
                  key: "paperTradingComplete",
                  label: "Paper Trading",
                  icon: Zap,
                },
                {
                  key: "riskApproved",
                  label: "Risk Approval",
                  icon: AlertTriangle,
                },
                {
                  key: "complianceApproved",
                  label: "Compliance",
                  icon: CheckCircle2,
                },
                {
                  key: "opsApproved",
                  label: "Ops Approval",
                  icon: CheckCircle2,
                },
              ].map((item) => {
                const approvedCount = mockCandidates.filter(
                  (c) => c.checklist[item.key as keyof typeof c.checklist],
                ).length;

                return (
                  <div key={item.key} className="text-center p-4 border rounded-lg">
                    <item.icon
                      className={cn(
                        "size-8 mx-auto mb-2",
                        approvedCount === mockCandidates.length ? "text-emerald-500" : "text-muted-foreground",
                      )}
                    />
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {approvedCount}/{mockCandidates.length} approved
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Detail Drawer */}
        {detailCandidate && (
          <BatchDetailDrawer
            open={detailCandidateId !== null}
            onClose={() => setDetailCandidateId(null)}
            entityName={detailCandidate.algoName}
            entityVersion={detailCandidate.algoId}
            entityType="execution_algo"
            platform="execution"
            status={detailCandidate.status}
            sections={
              [
                {
                  title: "Performance",
                  items: [
                    {
                      label: "Slippage vs Arrival",
                      value: `${detailCandidate.metrics.slippageVsArrival >= 0 ? "+" : ""}${formatNumber(detailCandidate.metrics.slippageVsArrival, 1)} bps`,
                      format: "mono" as const,
                    },
                    { label: "Fill Rate", value: `${detailCandidate.metrics.fillRate}%`, format: "mono" as const },
                    { label: "Avg Latency", value: `${detailCandidate.metrics.avgLatency}ms`, format: "mono" as const },
                  ],
                },
                {
                  title: "Improvement vs Current",
                  items: [
                    { label: "Slippage", value: detailCandidate.improvement.slippage, format: "text" as const },
                    { label: "Fill Rate", value: detailCandidate.improvement.fillRate, format: "text" as const },
                    { label: "Latency", value: detailCandidate.improvement.latency, format: "text" as const },
                  ],
                },
                {
                  title: "Promotion Path",
                  items: [
                    { label: "Source Env", value: detailCandidate.sourceEnv, format: "text" as const },
                    { label: "Target Env", value: detailCandidate.targetEnv, format: "text" as const },
                  ],
                },
              ] satisfies DetailSection[]
            }
            onAddToBasket={() => {
              if (!selectedCandidates.includes(detailCandidate.id)) {
                setSelectedCandidates((prev) => [...prev, detailCandidate.id]);
              }
            }}
          >
            {/* Checklist detail */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approval Checklist
              </h4>
              <div className="space-y-2">
                {Object.entries(detailCandidate.checklist as Record<string, boolean>).map(([key, passed]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {passed ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    ) : (
                      <Clock className="size-3.5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </BatchDetailDrawer>
        )}
      </div>
    </div>
  );
}
