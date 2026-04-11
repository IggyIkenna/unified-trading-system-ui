"use client";

import { DataTable } from "@/components/shared/data-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegulatoryReports } from "@/hooks/api/use-reports";
import {
  MOCK_REPORTS,
  type Jurisdiction,
  type RegulatoryReport,
  type ReportStatus,
  type ReportType,
} from "@/lib/mocks/fixtures/reports-regulatory";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  RefreshCw,
  Shield,
} from "lucide-react";
import * as React from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  MIFID_II_ART26: "MiFID II Transaction Reporting (Art. 26)",
  MIFID_II_ART27: "MiFID II Best Execution (Art. 27)",
  FCA_BEST_EXEC: "FCA Best Execution",
  EMIR_DERIVATIVE: "EMIR Derivative Reporting",
  FCA_TRANSACTION: "FCA Transaction Reporting",
};

const REPORT_TYPE_SHORT: Record<ReportType, string> = {
  MIFID_II_ART26: "MiFID II",
  MIFID_II_ART27: "MiFID II",
  FCA_BEST_EXEC: "FCA",
  EMIR_DERIVATIVE: "EMIR",
  FCA_TRANSACTION: "FCA",
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string; icon: React.ElementType }> = {
  submitted: {
    label: "Submitted",
    className: "bg-emerald-500/15 text-emerald-400 border-transparent",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-transparent",
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-500/15 text-rose-400 border-transparent",
    icon: AlertTriangle,
  },
  draft: {
    label: "Draft",
    className: "bg-slate-500/15 text-slate-400 border-transparent",
    icon: FileText,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge className={cn("gap-1", config.className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

function ReportTypeBadge({ reportType }: { reportType: ReportType }) {
  const short = REPORT_TYPE_SHORT[reportType];
  const colorClass =
    short === "MiFID II"
      ? "bg-blue-500/15 text-blue-400 border-transparent"
      : short === "FCA"
        ? "bg-violet-500/15 text-violet-400 border-transparent"
        : "bg-cyan-500/15 text-cyan-400 border-transparent";
  return <Badge className={colorClass}>{short}</Badge>;
}

function JurisdictionBadge({ jurisdiction }: { jurisdiction: Jurisdiction }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        jurisdiction === "EU" ? "border-blue-500/40 text-blue-400" : "border-violet-500/40 text-violet-400",
      )}
    >
      {jurisdiction}
    </Badge>
  );
}

function DetailPanel({ report }: { report: RegulatoryReport }) {
  return (
    <div className="bg-muted/30 border rounded-md px-6 py-4 mt-1">
      <div className="grid grid-cols-3 gap-6">
        {/* Filing info */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filing Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Report</span>
              <span className="font-medium">{REPORT_TYPE_LABELS[report.reportType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs">{report.filingReference ?? "Not yet assigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span>{report.period}</span>
            </div>
          </div>
        </div>

        {/* Instruments */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Instruments Covered ({report.instrumentsCovered.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {report.instrumentsCovered.map((inst) => (
              <Badge key={inst} variant="outline" className="text-xs font-mono">
                {inst}
              </Badge>
            ))}
          </div>
        </div>

        {/* Best execution metrics */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Execution Metrics</h4>
          {report.bestExecutionMetrics ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border px-3 py-2">
                <div className="text-xs text-muted-foreground">Avg Slippage</div>
                <div className="text-sm font-mono font-medium">{report.bestExecutionMetrics.avgSlippage}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-xs text-muted-foreground">Fill Rate</div>
                <div className="text-sm font-mono font-medium">{report.bestExecutionMetrics.fillRate}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-xs text-muted-foreground">Price Improvement</div>
                <div className="text-sm font-mono font-medium">{report.bestExecutionMetrics.priceImprovement}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-xs text-muted-foreground">Venue Score</div>
                <div className="text-sm font-mono font-medium">{report.bestExecutionMetrics.venueScore}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not applicable for this report type</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function makeColumns(
  expandedId: string | null,
  onToggleExpand: (id: string) => void,
): ColumnDef<RegulatoryReport, unknown>[] {
  return [
    {
      id: "expand",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const isExpanded = expandedId === row.original.id;
        return (
          <button
            type="button"
            className="p-0 bg-transparent border-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(row.original.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "reportType",
      header: "Report Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ReportTypeBadge reportType={row.original.reportType} />
          <span className="text-sm">{REPORT_TYPE_LABELS[row.original.reportType]}</span>
        </div>
      ),
    },
    {
      accessorKey: "jurisdiction",
      header: "Jurisdiction",
      cell: ({ row }) => <JurisdictionBadge jurisdiction={row.original.jurisdiction} />,
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => <span className="text-sm">{row.original.period}</span>,
    },
    {
      accessorKey: "filingDate",
      header: "Filed",
      cell: ({ row }) => <span className="text-sm font-mono">{formatDate(row.original.filingDate)}</span>,
    },
    {
      accessorKey: "nextDueDate",
      header: "Next Due",
      cell: ({ row }) => {
        const report = row.original;
        const dueDays = daysUntil(report.nextDueDate);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{formatDate(report.nextDueDate)}</span>
            {report.status !== "submitted" && dueDays <= 14 && dueDays > 0 && (
              <span className="text-xs text-amber-400">({dueDays}d)</span>
            )}
            {report.status !== "submitted" && dueDays <= 0 && <span className="text-xs text-rose-400">(past due)</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RegulatoryPage() {
  const { data: rawData, isLoading, isError, refetch } = useRegulatoryReports();
  const mockDataMode = isMockDataMode();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("all");

  // Resolve API data or fall back to mock
  const reports: RegulatoryReport[] = React.useMemo(() => {
    const apiReports = (rawData as { data?: RegulatoryReport[] } | undefined)?.data;
    if (Array.isArray(apiReports) && apiReports.length > 0) return apiReports;
    return mockDataMode ? MOCK_REPORTS : [];
  }, [rawData, mockDataMode]);

  // Summary counts
  const counts = React.useMemo(() => {
    let submitted = 0;
    let pending = 0;
    let overdue = 0;
    for (const r of reports) {
      if (r.status === "submitted") submitted++;
      else if (r.status === "pending") pending++;
      else if (r.status === "overdue") overdue++;
    }
    return { submitted, pending, overdue };
  }, [reports]);

  // Filter by tab
  const filtered = React.useMemo(() => {
    if (activeTab === "all") return reports;
    return reports.filter((r) => r.status === activeTab);
  }, [reports, activeTab]);

  // Upcoming deadlines (next 5)
  const upcomingDeadlines = React.useMemo(() => {
    return [...reports]
      .filter((r) => r.status !== "submitted")
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 5);
  }, [reports]);

  // Toggle expand handler
  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Column definitions (depend on expandedId for chevron state)
  const columns = React.useMemo(() => makeColumns(expandedId, handleToggleExpand), [expandedId, handleToggleExpand]);

  // Currently expanded report
  const expandedReport = React.useMemo(
    () => (expandedId ? (filtered.find((r) => r.id === expandedId) ?? null) : null),
    [expandedId, filtered],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertTriangle className="size-10 text-rose-400" />
            <p className="text-sm text-muted-foreground">Failed to load regulatory reports</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (reports.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
            <Shield className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No regulatory reports found</p>
            <p className="text-xs text-muted-foreground/70">
              Reports will appear here once compliance filings are generated
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{counts.submitted}</div>
                <div className="text-xs text-muted-foreground">Submitted</div>
              </div>
              <CheckCircle className="size-8 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-amber-400">{counts.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <Clock className="size-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-rose-400">{counts.overdue}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
              <AlertTriangle className="size-8 text-rose-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Report table — spans 2 cols */}
        <div className="col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Reports</TabsTrigger>
                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
              <ExportDropdown
                data={filtered.map((r) => ({
                  reportType: REPORT_TYPE_LABELS[r.reportType],
                  jurisdiction: r.jurisdiction,
                  period: r.period,
                  filingDate: formatDate(r.filingDate),
                  nextDueDate: formatDate(r.nextDueDate),
                  status: STATUS_CONFIG[r.status].label,
                  filingReference: r.filingReference ?? "--",
                }))}
                columns={[
                  { key: "reportType", header: "Report Type" },
                  { key: "jurisdiction", header: "Jurisdiction" },
                  { key: "period", header: "Period" },
                  { key: "filingDate", header: "Filing Date" },
                  { key: "nextDueDate", header: "Next Due Date" },
                  { key: "status", header: "Status" },
                  { key: "filingReference", header: "Filing Reference" },
                ]}
                filename="regulatory-reports"
              />
            </div>

            <TabsContent value={activeTab} className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <DataTable
                    columns={columns}
                    data={filtered}
                    enableSorting
                    enableColumnVisibility={false}
                    emptyMessage="No reports match your filter."
                  />
                </CardContent>
              </Card>
              {expandedReport && <DetailPanel report={expandedReport} />}
            </TabsContent>
          </Tabs>
        </div>

        {/* Compliance calendar — right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                Compliance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All filings up to date</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((report) => {
                    const dueDays = daysUntil(report.nextDueDate);
                    const isOverdue = dueDays <= 0;
                    return (
                      <div
                        key={report.id}
                        className={cn(
                          "flex items-start gap-3 rounded-md border p-3",
                          isOverdue && "border-rose-500/30 bg-rose-500/5",
                          !isOverdue && dueDays <= 7 && "border-amber-500/30 bg-amber-500/5",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 size-2 rounded-full shrink-0",
                            isOverdue ? "bg-rose-400" : dueDays <= 7 ? "bg-amber-400" : "bg-muted-foreground/50",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <ReportTypeBadge reportType={report.reportType} />
                            <JurisdictionBadge jurisdiction={report.jurisdiction} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {REPORT_TYPE_LABELS[report.reportType]}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-mono text-muted-foreground">
                              {formatDate(report.nextDueDate)}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-medium",
                                isOverdue ? "text-rose-400" : dueDays <= 7 ? "text-amber-400" : "text-muted-foreground",
                              )}
                            >
                              {isOverdue ? `${Math.abs(dueDays)}d overdue` : `${dueDays}d left`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report types legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Report Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Object.entries(REPORT_TYPE_LABELS) as Array<[ReportType, string]>).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <ReportTypeBadge reportType={key} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
