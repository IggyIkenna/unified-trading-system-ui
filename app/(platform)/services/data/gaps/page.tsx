"use client";

/**
 * /services/data/gaps — Gaps & Quality detection.
 * Evolves from missing/page.tsx with enhanced severity, batch backfill, quality checks, alerts.
 */

import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";
import { AlertRow } from "@/components/shared/alert-row";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import { MOCK_ALERTS, MOCK_ENHANCED_GAPS } from "@/lib/mocks/fixtures/data-service";
import { DATA_CATEGORY_LABELS, type DataCategory, type DataGap } from "@/lib/types/data-service";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2, Download, Filter, RefreshCw } from "lucide-react";
import * as React from "react";

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    color: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    color: "text-sky-400 bg-sky-400/10 border-sky-400/30",
    dot: "bg-sky-500",
  },
};

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "text-muted-foreground border-muted-foreground/30",
  },
  backfilling: {
    label: "Backfilling",
    color: "text-sky-400 border-sky-400/30",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-400 border-emerald-400/30",
  },
  wont_fix: {
    label: "Won't Fix",
    color: "text-muted-foreground/50 border-muted-foreground/20",
  },
};

function exportGapsToJson(gaps: DataGap[]) {
  const json = JSON.stringify(gaps, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gaps-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GapsPage() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<DataCategory | "all">("all");
  const { subscribed, locked } = useScopedCategories();

  const categories = subscribed.length > 0 ? subscribed : (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]);

  // Scope gaps to subscribed categories
  const scopedGaps = MOCK_ENHANCED_GAPS.filter((gap) => subscribed.length === 0 || subscribed.includes(gap.category));

  const filtered = scopedGaps.filter((gap) => {
    if (severityFilter !== "all" && gap.severity !== severityFilter) return false;
    if (statusFilter !== "all" && gap.status !== statusFilter) return false;
    if (categoryFilter !== "all" && gap.category !== categoryFilter) return false;
    return true;
  });

  const actionableGaps = filtered.filter((g) => g.status === "open" || g.status === "backfilling");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === actionableGaps.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(actionableGaps.map((g) => g.id)));
    }
  }

  async function handleBatchBackfill() {
    const selectedGaps = MOCK_ENHANCED_GAPS.filter((g) => selected.has(g.id));
    if (selectedGaps.length === 0) return;

    // Group gaps by service+category to batch API calls
    const groups = new Map<string, { service: string; category: string; dates: string[] }>();
    for (const gap of selectedGaps) {
      const key = `${gap.service}:${gap.category}`;
      const existing = groups.get(key);
      if (existing) {
        existing.dates.push(gap.date);
      } else {
        groups.set(key, { service: gap.service, category: gap.category, dates: [gap.date] });
      }
    }

    // Fire batch run for each service+category group
    for (const [, group] of groups) {
      try {
        const res = await fetch("/deployment-api/api/batch/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cluster: group.category.toLowerCase(),
            as_of_date: group.dates[0],
            service: group.service,
            category: group.category,
          }),
        });
        if (!res.ok) {
          console.error("Backfill failed for %s: %s", group.service, await res.text());
        }
      } catch (err) {
        console.error("Backfill request failed for %s: %s", group.service, err);
      }
    }

    setSelected(new Set());
  }

  const criticalCount = MOCK_ENHANCED_GAPS.filter((g) => g.severity === "critical" && g.status !== "resolved").length;
  const openCount = MOCK_ENHANCED_GAPS.filter((g) => g.status === "open").length;
  const backfillingCount = MOCK_ENHANCED_GAPS.filter((g) => g.status === "backfilling").length;

  const dataAlerts = MOCK_ALERTS.filter(
    (a) => a.type === "gap_detected" || a.type === "data_stale" || a.type === "download_failed",
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <PageHeader
          className="mb-6"
          title="Gaps & Quality"
          description="Missing data detection, quality checks, and backfill management"
        >
          <Button variant="outline" size="sm" onClick={() => exportGapsToJson(filtered)}>
            <Download className="size-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </PageHeader>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Critical Gaps"
            primary={criticalCount}
            tone="data"
            density="compact"
            variant="bordered"
            borderedSurfaceClassName={criticalCount > 0 ? "border-red-500/30" : undefined}
            primaryClassName={cn(
              "font-mono text-2xl font-bold",
              criticalCount > 0 ? "text-red-400" : "text-muted-foreground",
            )}
          />
          <MetricCard
            label="Open"
            primary={openCount}
            tone="data"
            density="compact"
            variant="bordered"
            primaryClassName="font-mono text-2xl font-bold text-orange-400"
          />
          <MetricCard
            label="Backfilling"
            primary={backfillingCount}
            tone="data"
            density="compact"
            variant="bordered"
            primaryClassName="font-mono text-2xl font-bold text-sky-400"
          />
          <MetricCard
            label="Resolved (7d)"
            primary={MOCK_ENHANCED_GAPS.filter((g) => g.status === "resolved").length}
            tone="data"
            density="compact"
            variant="bordered"
            primaryClassName="font-mono text-2xl font-bold text-emerald-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="backfilling">Backfilling</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="wont_fix">{"Won't Fix"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as DataCategory | "all")}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {DATA_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected.size > 0 && (
            <Button size="sm" className="h-8 text-xs ml-auto" onClick={handleBatchBackfill}>
              <Download className="size-3 mr-1.5" />
              Backfill {selected.size} selected
            </Button>
          )}
        </div>

        {/* Gap Table */}
        <Card className="mb-6">
          <CardContent className="pt-4 px-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 w-8">
                    <Checkbox
                      checked={selected.size === actionableGaps.length && actionableGaps.length > 0}
                      onCheckedChange={() => {
                        toggleSelectAll();
                      }}
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Severity</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Venue</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Instrument</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Gap Period</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Days</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cause</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((gap) => {
                  const sevConfig = SEVERITY_CONFIG[gap.severity];
                  const statConfig = STATUS_CONFIG[gap.status];
                  const isActionable = gap.status === "open" || gap.status === "backfilling";

                  return (
                    <tr
                      key={gap.id}
                      className={cn(
                        "border-b border-border/50 hover:bg-accent/20 transition-colors",
                        selected.has(gap.id) && "bg-primary/5",
                      )}
                    >
                      <td className="px-4 py-2">
                        {isActionable && (
                          <Checkbox
                            checked={selected.has(gap.id)}
                            onCheckedChange={() => {
                              toggleSelect(gap.id);
                            }}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cn("text-[10px]", sevConfig.color)}>
                          {sevConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cn("text-[10px]", statConfig.color)}>
                          {statConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[gap.category])}>
                          {DATA_CATEGORY_LABELS[gap.category]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-medium capitalize">{gap.venue.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 font-mono">{gap.instrument ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">
                        {gap.gapStart === gap.gapEnd ? gap.gapStart : `${gap.gapStart} → ${gap.gapEnd}`}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{gap.daysAffected}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">{gap.cause ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="size-8 mb-2 text-emerald-400" />
                <span className="text-sm">No gaps match your filters</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="size-4" />
              Recent Alerts
              <Badge variant="secondary" className="text-xs">
                {dataAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dataAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No recent alerts</div>
            ) : (
              <div className="space-y-0">
                {dataAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    density="relaxed"
                    severity={alert.severity}
                    title={alert.title}
                    description={alert.message}
                    timestamp={alert.timestamp}
                    timestampMode="absolute"
                    unread={!alert.read}
                    actionHref={alert.actionHref}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
