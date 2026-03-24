"use client";

/**
 * /services/data/gaps — Gaps & Quality detection.
 * Evolves from missing/page.tsx with enhanced severity, batch backfill, quality checks, alerts.
 */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  RefreshCw,
  CheckCircle2,
  Bell,
  Filter,
  ArrowRight,
} from "lucide-react";
import {
  DATA_CATEGORY_LABELS,
  type DataCategory,
  type DataGap,
} from "@/lib/data-service-types";
import { MOCK_ENHANCED_GAPS, MOCK_ALERTS } from "@/lib/data-service-mock-data";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import { Lock } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";

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
  const [categoryFilter, setCategoryFilter] = React.useState<
    DataCategory | "all"
  >("all");
  const { subscribed, locked } = useScopedCategories();

  const categories =
    subscribed.length > 0
      ? subscribed
      : (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]);

  // Scope gaps to subscribed categories
  const scopedGaps = MOCK_ENHANCED_GAPS.filter(
    (gap) => subscribed.length === 0 || subscribed.includes(gap.category),
  );

  const filtered = scopedGaps.filter((gap) => {
    if (severityFilter !== "all" && gap.severity !== severityFilter)
      return false;
    if (statusFilter !== "all" && gap.status !== statusFilter) return false;
    if (categoryFilter !== "all" && gap.category !== categoryFilter)
      return false;
    return true;
  });

  const actionableGaps = filtered.filter(
    (g) => g.status === "open" || g.status === "backfilling",
  );

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

  function handleBatchBackfill() {
    // In real implementation: dispatch backfill jobs for selected gap IDs
    alert(`Backfill queued for ${selected.size} gaps`);
    setSelected(new Set());
  }

  const criticalCount = MOCK_ENHANCED_GAPS.filter(
    (g) => g.severity === "critical" && g.status !== "resolved",
  ).length;
  const openCount = MOCK_ENHANCED_GAPS.filter(
    (g) => g.status === "open",
  ).length;
  const backfillingCount = MOCK_ENHANCED_GAPS.filter(
    (g) => g.status === "backfilling",
  ).length;

  const dataAlerts = MOCK_ALERTS.filter(
    (a) =>
      a.type === "gap_detected" ||
      a.type === "data_stale" ||
      a.type === "download_failed",
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gaps & Quality</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Missing data detection, quality checks, and backfill management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportGapsToJson(filtered)}
            >
              <Download className="size-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={criticalCount > 0 ? "border-red-500/30" : ""}>
            <CardContent className="pt-4">
              <div
                className={cn(
                  "text-2xl font-bold font-mono",
                  criticalCount > 0 ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {criticalCount}
              </div>
              <div className="text-xs text-muted-foreground">Critical Gaps</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-orange-400">
                {openCount}
              </div>
              <div className="text-xs text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-sky-400">
                {backfillingCount}
              </div>
              <div className="text-xs text-muted-foreground">Backfilling</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {
                  MOCK_ENHANCED_GAPS.filter((g) => g.status === "resolved")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">Resolved (7d)</div>
            </CardContent>
          </Card>
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
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as DataCategory | "all")}
          >
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
            <Button
              size="sm"
              className="h-8 text-xs ml-auto"
              onClick={handleBatchBackfill}
            >
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
                      checked={
                        selected.size === actionableGaps.length &&
                        actionableGaps.length > 0
                      }
                      onCheckedChange={() => {
                        toggleSelectAll();
                      }}
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Severity
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Venue
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Instrument
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Gap Period
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">
                    Days
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Cause
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((gap) => {
                  const sevConfig = SEVERITY_CONFIG[gap.severity];
                  const statConfig = STATUS_CONFIG[gap.status];
                  const isActionable =
                    gap.status === "open" || gap.status === "backfilling";

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
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", sevConfig.color)}
                        >
                          {sevConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", statConfig.color)}
                        >
                          {statConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            CATEGORY_COLORS[gap.category],
                          )}
                        >
                          {DATA_CATEGORY_LABELS[gap.category]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-medium capitalize">
                        {gap.venue.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {gap.instrument ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">
                        {gap.gapStart === gap.gapEnd
                          ? gap.gapStart
                          : `${gap.gapStart} → ${gap.gapEnd}`}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {gap.daysAffected}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">
                        {gap.cause ?? "—"}
                      </td>
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
              <div className="text-sm text-muted-foreground py-4">
                No recent alerts
              </div>
            ) : (
              <div className="space-y-0">
                {dataAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full mt-1.5 flex-shrink-0",
                        alert.severity === "critical"
                          ? "bg-red-500"
                          : alert.severity === "warning"
                            ? "bg-amber-500"
                            : "bg-sky-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {alert.title}
                        </span>
                        {!alert.read && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {alert.message}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(alert.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {alert.actionHref && (
                      <Link href={alert.actionHref} className="flex-shrink-0">
                        <ArrowRight className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
