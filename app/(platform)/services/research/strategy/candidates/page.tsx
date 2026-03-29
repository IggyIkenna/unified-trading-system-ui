"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Rocket, GitCompare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { MOCK_CANDIDATES, type CandidateStatus, type StrategyCandidate } from "@/lib/mocks/fixtures/research-pages";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: CandidateStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="size-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 gap-1">
          <XCircle className="size-3" />
          Rejected
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidatesPage() {
  const [statusFilter, setStatusFilter] = React.useState<"all" | CandidateStatus>("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = statusFilter === "all" ? MOCK_CANDIDATES : MOCK_CANDIDATES.filter((c) => c.status === statusFilter);

  const pendingCount = MOCK_CANDIDATES.filter((c) => c.status === "pending").length;
  const approvedCount = MOCK_CANDIDATES.filter((c) => c.status === "approved").length;
  const rejectedCount = MOCK_CANDIDATES.filter((c) => c.status === "rejected").length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Target className="size-6" />
              Strategy Candidates
            </span>
          }
          description="Strategies awaiting review for promotion to live trading"
        >
          <Link href="/services/research/strategy/compare">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={selected.size < 2}>
              <GitCompare className="size-3.5" />
              Compare Selected ({selected.size})
            </Button>
          </Link>
        </PageHeader>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total Candidates</div>
              <div className="text-3xl font-semibold font-mono">{MOCK_CANDIDATES.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Pending</div>
              <div className="text-3xl font-semibold font-mono text-amber-400">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Approved</div>
              <div className="text-3xl font-semibold font-mono text-emerald-400">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Rejected</div>
              <div className="text-3xl font-semibold font-mono text-red-400">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Candidate Pipeline</CardTitle>
                <CardDescription>
                  {filtered.length} strateg{filtered.length === 1 ? "y" : "ies"} shown
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | CandidateStatus)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Strategy Name</TableHead>
                    <TableHead className="text-right">Sharpe</TableHead>
                    <TableHead className="text-right">Max Drawdown</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(candidate.id)}
                          onCheckedChange={() => toggleSelect(candidate.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{candidate.name}</div>
                          <div className="text-xs text-muted-foreground">by {candidate.submittedBy}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(candidate.sharpe, 2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-400">
                        {formatPercent(candidate.maxDrawdown, 1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatPercent(candidate.winRate, 1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-400">
                        +{formatPercent(candidate.totalReturn, 1)}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(candidate.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{candidate.submittedAt}</TableCell>
                      <TableCell className="text-right">
                        <Link href="/services/promote">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 h-7 text-xs"
                            disabled={candidate.status === "rejected"}
                          >
                            <Rocket className="size-3" />
                            Promote
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
