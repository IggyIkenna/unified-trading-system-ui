"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AllocatorInstance } from "@/lib/architecture-v2";
import {
  MOCK_ALLOCATOR_INSTANCES,
  MOCK_APPROVAL_QUEUE,
  MOCK_DIRECTIVE_HISTORY,
  MOCK_SHADOW_COMPARE,
} from "@/lib/mocks/fixtures/architecture-v2-fixtures";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { CheckCircle2, Clock, GitCompare, ShieldAlert } from "lucide-react";
import * as React from "react";

function statusBadge(status: AllocatorInstance["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    case "PAUSED":
      return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    case "PENDING_APPROVAL":
      return "text-sky-400 border-sky-500/40 bg-sky-500/10";
  }
}

function modeBadge(mode: AllocatorInstance["mode"]): string {
  return mode === "PRIMARY"
    ? "text-foreground border-border"
    : "text-violet-400 border-violet-500/40 bg-violet-500/10";
}

export function AllocatorDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">
            Portfolio allocator
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Per-client allocators decide how capital flows between strategy instances. 8 allocator
            archetypes (FIXED, PNL_WEIGHTED, SHARPE_WEIGHTED, RISK_PARITY, KELLY, MIN_CVAR,
            REGIME_AWARE, MANUAL) emit <code>AllocationDirective</code> events; shadow instances
            run alongside without routing capital.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Instances
              </p>
              <p className="text-2xl font-bold font-mono">{MOCK_ALLOCATOR_INSTANCES.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Managed NAV
              </p>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(
                  MOCK_ALLOCATOR_INSTANCES.reduce((a, b) => a + b.total_managed_nav_usd, 0),
                  "USD",
                  0,
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Shadow vs primary
              </p>
              <p className="text-2xl font-bold font-mono">
                {MOCK_ALLOCATOR_INSTANCES.filter((i) => i.mode === "SHADOW").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Awaiting approval
              </p>
              <p className="text-2xl font-bold font-mono">{MOCK_APPROVAL_QUEUE.length}</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="instances" className="space-y-4">
          <TabsList>
            <TabsTrigger value="instances">Instances</TabsTrigger>
            <TabsTrigger value="history">Directive history</TabsTrigger>
            <TabsTrigger value="shadow">Shadow vs primary</TabsTrigger>
            <TabsTrigger value="approvals">
              MANUAL approvals
              {MOCK_APPROVAL_QUEUE.length > 0 ? (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {MOCK_APPROVAL_QUEUE.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="instances">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Client</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Archetype</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Mode</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Cadence</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Share class</TableHead>
                      <TableHead className="text-xs text-muted-foreground">NAV</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Strategies</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_ALLOCATOR_INSTANCES.map((inst) => (
                      <TableRow
                        key={inst.allocator_instance_id}
                        className="border-border/30"
                        data-testid={`allocator-row-${inst.allocator_instance_id}`}
                      >
                        <TableCell>
                          <p className="font-medium">{inst.client_name}</p>
                          <p className="text-[10px] text-muted-foreground">{inst.client_id}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {inst.archetype}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", modeBadge(inst.mode))}>
                            {inst.mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{inst.cadence}</TableCell>
                        <TableCell className="font-mono text-xs">{inst.share_class}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatCurrency(inst.total_managed_nav_usd, "USD", 0)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {inst.managed_strategy_instance_ids.length}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", statusBadge(inst.status))}
                          >
                            {inst.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardContent className="space-y-3 pt-5">
                {MOCK_DIRECTIVE_HISTORY.map((dir) => (
                  <div
                    key={dir.directive_id}
                    className="rounded-lg border border-border/40 p-3"
                    data-testid={`directive-${dir.directive_id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {dir.allocator_instance_id} · {dir.cadence_trigger}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(dir.emitted_at).toLocaleString()} · {dir.equity_directives.length}{" "}
                          equity directives · total NAV{" "}
                          {formatCurrency(dir.total_nav_usd, "USD", 0)}
                        </p>
                      </div>
                      {dir.approved ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-400">
                          <CheckCircle2 className="mr-1 size-3" /> Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-400">
                          <Clock className="mr-1 size-3" /> Pending
                        </Badge>
                      )}
                    </div>
                    <Table>
                      <TableBody>
                        {dir.equity_directives.map((e) => (
                          <TableRow key={e.strategy_instance_id} className="border-border/20">
                            <TableCell className="text-xs">{e.strategy_instance_id}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatCurrency(e.target_equity_usd, "USD", 0)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatNumber(e.weight * 100, 1)}% (was{" "}
                              {formatNumber(e.previous_weight * 100, 1)}%)
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shadow">
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-4 pb-0">
                  <GitCompare className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Primary vs shadow weights</p>
                  <Badge variant="secondary" className="text-[10px]">
                    alloc-odum-sharpe-v1 vs alloc-odum-kelly-shadow
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Strategy</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Primary %</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Shadow %</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Δ bps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_SHADOW_COMPARE.map((r) => (
                      <TableRow key={r.strategy_instance_id} className="border-border/30">
                        <TableCell className="text-xs">{r.strategy_instance_id}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatNumber(r.primary_weight * 100, 1)}%
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatNumber(r.shadow_weight * 100, 1)}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-xs",
                            r.abs_diff_bps > 500 ? "text-amber-400" : "text-muted-foreground",
                          )}
                        >
                          {r.abs_diff_bps}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="approvals">
            <Card>
              <CardContent className="space-y-3 pt-5">
                {MOCK_APPROVAL_QUEUE.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No MANUAL allocator directives awaiting approval.
                  </p>
                ) : (
                  MOCK_APPROVAL_QUEUE.map((item) => (
                    <div
                      key={item.directive_id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                      data-testid={`approval-${item.directive_id}`}
                    >
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 size-4 text-amber-400" />
                        <div>
                          <p className="text-sm font-semibold">
                            {item.client_name} · {item.archetype}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.num_strategies} strategies ·{" "}
                            {formatCurrency(item.proposed_total_nav_usd, "USD", 0)} · submitted{" "}
                            {item.age_minutes} min ago
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            directive_id: {item.directive_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
