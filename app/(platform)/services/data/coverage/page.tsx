"use client";


import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
/**
 * /services/data/coverage — Cross-stage coverage matrix.
 * User can select row/column dimensions to compare Instruments, Raw, Processed.
 * Read-only Features column links to the Build tab.
 */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import {
  DATA_CATEGORY_LABELS,
  type DataCategory,
  type CoverageStatus,
  type CoverageRow,
} from "@/lib/types/data-service";
import { MOCK_COVERAGE_ROWS } from "@/lib/mocks/fixtures/data-service";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import { Lock } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";
import { formatPercent } from "@/lib/utils/formatters";

const STATUS_COLORS: Record<CoverageStatus, string> = {
  complete: "bg-emerald-500/80 text-emerald-900",
  partial: "bg-yellow-500/70 text-yellow-900",
  missing: "bg-red-500/30 text-red-400",
  in_progress: "bg-sky-500/50 text-sky-900",
  not_applicable: "bg-muted/30 text-muted-foreground",
};

const STATUS_LABELS: Record<CoverageStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  missing: "Missing",
  in_progress: "Running",
  not_applicable: "N/A",
};

function CoverageCell({
  status,
  completionPct,
  readOnly,
  linkHref,
}: {
  status: CoverageStatus;
  completionPct?: number;
  readOnly?: boolean;
  linkHref?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded p-1.5 min-h-[44px] text-xs font-medium transition-colors",
        STATUS_COLORS[status],
        readOnly && "opacity-70",
      )}
    >
      <span>
        {completionPct != null
          ? `${formatPercent(completionPct, 0)}`
          : STATUS_LABELS[status]}
      </span>
      {readOnly && <span className="text-[9px] opacity-70">Build</span>}
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} title="View in Build tab">
        {inner}
      </Link>
    );
  }
  return inner;
}

function exportToCsv(rows: CoverageRow[]) {
  const headers = [
    "Venue",
    "Category",
    "Date",
    "Instruments %",
    "Raw Data %",
    "Processing %",
    "Features %",
  ];
  const csvRows = rows.map((r) => [
    r.venue,
    r.category,
    r.date,
    r.instruments.completionPct ?? r.instruments.status,
    r.rawData.completionPct ?? r.rawData.status,
    r.processing.completionPct ?? r.processing.status,
    r.features.completionPct ?? r.features.status,
  ]);
  const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coverage-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CoveragePage() {
  const [groupBy, setGroupBy] = React.useState<"venue" | "category">("venue");
  const [filterCategory, setFilterCategory] = React.useState<
    DataCategory | "all"
  >("all");
  const { subscribed, locked } = useScopedCategories();

  // Filter rows to only subscribed categories (backend would handle this in production)
  const scopedRows = MOCK_COVERAGE_ROWS.filter(
    (row) => subscribed.length === 0 || subscribed.includes(row.category),
  );

  const filteredRows = scopedRows.filter(
    (row) => filterCategory === "all" || row.category === filterCategory,
  );

  const sortedRows = React.useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) =>
      groupBy === "venue"
        ? a.venue.localeCompare(b.venue) || a.date.localeCompare(b.date)
        : a.category.localeCompare(b.category) ||
          a.venue.localeCompare(b.venue),
    );
    return rows;
  }, [filteredRows, groupBy]);

  const categories =
    subscribed.length > 0
      ? subscribed
      : (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]);

  // Summary stats
  const totalCells = filteredRows.length;
  const completeCells = filteredRows.filter(
    (r) => r.rawData.status === "complete",
  ).length;
  const missingCells = filteredRows.filter(
    (r) => r.rawData.status === "missing",
  ).length;

  return (
    <div className="p-6 space-y-6 platform-page-width">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader
        title="Coverage"
        description="Cross-stage completeness — Instruments → Raw → Processing →
              Features"
      />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(filteredRows)}
            >
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-foreground">
                {totalCells}
              </div>
              <div className="text-xs text-muted-foreground">
                Venue-date combinations
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {completeCells}
              </div>
              <div className="text-xs text-muted-foreground">Fully covered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div
                className={cn(
                  "text-2xl font-bold font-mono",
                  missingCells > 0 ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {missingCells}
              </div>
              <div className="text-xs text-muted-foreground">
                Missing raw data
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Group by:</span>
            <Select
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as "venue" | "category")}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Category:</span>
            <Select
              value={filterCategory}
              onValueChange={(v) =>
                setFilterCategory(v as DataCategory | "all")
              }
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
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
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          {(Object.entries(STATUS_LABELS) as [CoverageStatus, string][]).map(
            ([status, label]) => (
              <span key={status} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded", STATUS_COLORS[status])} />
                {label}
              </span>
            ),
          )}
        </div>

        {/* Coverage Matrix Table */}
        <Card>
          <CardContent className="pt-4 px-0">
            <WidgetScroll axes="horizontal" scrollbarSize="thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                    Venue
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                    Instruments
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                    Raw Data
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                    Processing
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-sky-400/70 w-24">
                    Features
                    <span className="ml-1 text-[9px]">(Build)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => (
                  <tr
                    key={`${row.venue}-${row.date}-${i}`}
                    className="border-b border-border/50 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-4 py-1.5 font-medium capitalize sticky left-0 bg-card z-10">
                      {row.venue.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          CATEGORY_COLORS[row.category],
                        )}
                      >
                        {DATA_CATEGORY_LABELS[row.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-1.5 font-mono text-muted-foreground">
                      {row.date}
                    </td>
                    <td className="px-3 py-1.5">
                      <CoverageCell
                        status={row.instruments.status}
                        completionPct={row.instruments.completionPct}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <CoverageCell
                        status={row.rawData.status}
                        completionPct={row.rawData.completionPct}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <CoverageCell
                        status={row.processing.status}
                        completionPct={row.processing.completionPct}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <CoverageCell
                        status={row.features.status}
                        completionPct={row.features.completionPct}
                        readOnly
                        linkHref="/services/research/features"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </WidgetScroll>
          </CardContent>
        </Card>

        {/* Build Tab note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLink className="size-3.5" />
          Features column is read-only here.
          <Link
            href="/services/research/features"
            className="text-sky-400 hover:underline"
          >
            Go to Build → Features
          </Link>
          to manage feature calculation.
        </div>

        {/* Locked categories notice */}
        {locked.length > 0 && (
          <div className="p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Lock className="size-3.5" />
              <span className="font-medium">Not in your subscription:</span>
              {locked.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="text-[10px] opacity-60"
                >
                  {DATA_CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              Upgrade your plan to see coverage data for additional asset
              classes.
            </p>
          </div>
        )}
    </div>
  );
}
