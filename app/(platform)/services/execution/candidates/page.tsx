"use client";

import { PageHeader } from "@/components/platform/page-header";
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

const statusConfig: Record<string, { label: string; color: string }> = {
  ready: { label: "Ready", color: "text-emerald-500" },
  pending_review: { label: "Pending Review", color: "text-amber-500" },
  needs_paper: { label: "Needs Paper", color: "text-blue-500" },
  blocked: { label: "Blocked", color: "text-red-500" },
};

export default function ExecutionCandidatesPage() {
  const { data: candidatesData, isLoading } = useExecutionCandidates();
  const mockCandidates: Array<any> = (candidatesData as any)?.data ?? [];

  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([]);

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

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
          <div className="flex items-center gap-2">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Ready for Promotion
              </div>
              <div className="text-2xl font-bold tabular-nums">{readyCandidates.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="size-4 text-amber-500" />
                Pending Review
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {mockCandidates.filter((c) => c.status === "pending_review").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="size-4 text-blue-500" />
                Needs Paper Trading
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {mockCandidates.filter((c) => c.status === "needs_paper").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="size-4" />
                Avg Improvement
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-500">+1.4 bps</div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Algorithm Candidates</CardTitle>
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
                        <Button variant="ghost" size="sm" className="gap-1">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Approval Checklist</CardTitle>
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
      </div>
    </div>
  );
}
