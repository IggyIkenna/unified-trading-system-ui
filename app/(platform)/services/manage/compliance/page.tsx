"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import {
  Shield,
  Building2,
  Scale,
  FileText,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ComplianceRule {
  ruleId: string;
  description: string;
  category: "Trading" | "Risk" | "Reporting" | "KYC";
  severity: "critical" | "high" | "medium";
  status: "compliant" | "violated" | "warning";
  lastCheck: string;
}

interface Violation {
  date: string;
  ruleId: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  resolution: "open" | "investigating" | "resolved";
  assignedTo: string;
}

interface AuditEvent {
  timestamp: string;
  event: string;
  user: string;
  detail: string;
}

/* ------------------------------------------------------------------ */
/*  Inline fallback data                                               */
/* ------------------------------------------------------------------ */

const FALLBACK_RULES: ComplianceRule[] = [
  {
    ruleId: "FCA-001",
    description: "Client money segregation — CASS 7",
    category: "Trading",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "FCA-002",
    description: "Best execution policy compliance — MiFID II Article 27",
    category: "Trading",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "FCA-003",
    description: "Transaction reporting — MiFIR Article 26",
    category: "Reporting",
    severity: "critical",
    status: "warning",
    lastCheck: "2026-03-21T23:59:00Z",
  },
  {
    ruleId: "RISK-001",
    description: "Position limit breach monitoring",
    category: "Risk",
    severity: "high",
    status: "violated",
    lastCheck: "2026-03-22T07:30:00Z",
  },
  {
    ruleId: "RISK-002",
    description: "Counterparty exposure limits",
    category: "Risk",
    severity: "high",
    status: "compliant",
    lastCheck: "2026-03-22T06:00:00Z",
  },
  {
    ruleId: "RISK-003",
    description: "Leverage ratio monitoring — AIFMD",
    category: "Risk",
    severity: "high",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "KYC-001",
    description: "Client identity verification — MLR 2017",
    category: "KYC",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-20T12:00:00Z",
  },
  {
    ruleId: "KYC-002",
    description: "Sanctions screening — OFSI",
    category: "KYC",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T00:00:00Z",
  },
  {
    ruleId: "RPT-001",
    description: "Monthly regulatory returns — FCA RegData",
    category: "Reporting",
    severity: "medium",
    status: "compliant",
    lastCheck: "2026-03-15T09:00:00Z",
  },
  {
    ruleId: "RPT-002",
    description: "Suspicious activity reporting — NCA SAR",
    category: "Reporting",
    severity: "high",
    status: "warning",
    lastCheck: "2026-03-21T16:00:00Z",
  },
];

const FALLBACK_VIOLATIONS: Violation[] = [
  {
    date: "2026-03-22",
    ruleId: "RISK-001",
    detail: "Meridian Fund equities allocation exceeded 65% hard limit (64.1%)",
    severity: "high",
    resolution: "investigating",
    assignedTo: "J. Harper",
  },
  {
    date: "2026-03-21",
    ruleId: "FCA-003",
    detail: "3 transactions missing ARM submission within T+1 deadline",
    severity: "critical",
    resolution: "open",
    assignedTo: "S. Chen",
  },
  {
    date: "2026-03-20",
    ruleId: "RPT-002",
    detail:
      "Unusual transfer pattern flagged for client ACC-4412 — pending SAR review",
    severity: "high",
    resolution: "investigating",
    assignedTo: "M. Okafor",
  },
  {
    date: "2026-03-18",
    ruleId: "RISK-001",
    detail:
      "Pinnacle Investments credit allocation drift exceeded 3% threshold",
    severity: "high",
    resolution: "resolved",
    assignedTo: "J. Harper",
  },
  {
    date: "2026-03-15",
    ruleId: "KYC-001",
    detail: "Enhanced due diligence overdue for 2 high-risk clients",
    severity: "critical",
    resolution: "resolved",
    assignedTo: "A. Williams",
  },
  {
    date: "2026-03-12",
    ruleId: "FCA-002",
    detail:
      "Best execution review missed quarterly deadline — completed 2 days late",
    severity: "critical",
    resolution: "resolved",
    assignedTo: "S. Chen",
  },
  {
    date: "2026-03-10",
    ruleId: "RPT-001",
    detail: "February RegData submission contained 4 data quality errors",
    severity: "medium",
    resolution: "resolved",
    assignedTo: "L. Patel",
  },
];

const FALLBACK_AUDIT: AuditEvent[] = [
  {
    timestamp: "2026-03-22T08:15:00Z",
    event: "Compliance scan completed",
    user: "system",
    detail: "10 rules checked — 1 violated, 2 warnings",
  },
  {
    timestamp: "2026-03-22T07:45:00Z",
    event: "Violation opened",
    user: "system",
    detail: "RISK-001: Meridian Fund position limit breach",
  },
  {
    timestamp: "2026-03-21T17:30:00Z",
    event: "Investigation started",
    user: "M. Okafor",
    detail: "RPT-002: SAR review for ACC-4412 transfer pattern",
  },
  {
    timestamp: "2026-03-21T16:00:00Z",
    event: "Rule status changed",
    user: "system",
    detail: "FCA-003: compliant -> warning (ARM delay)",
  },
  {
    timestamp: "2026-03-18T14:20:00Z",
    event: "Violation resolved",
    user: "J. Harper",
    detail: "RISK-001: Pinnacle credit drift corrected via rebalance",
  },
  {
    timestamp: "2026-03-15T11:00:00Z",
    event: "KYC review completed",
    user: "A. Williams",
    detail: "EDD completed for 2 high-risk clients",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const RULE_STATUS_STYLES: Record<ComplianceRule["status"], string> = {
  compliant: "bg-emerald-500/20 text-emerald-400",
  violated: "bg-red-500/20 text-red-400",
  warning: "bg-amber-500/20 text-amber-400",
};

const SEVERITY_STYLES: Record<ComplianceRule["severity"], string> = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-amber-500/20 text-amber-400",
  medium: "bg-sky-500/20 text-sky-400",
};

const RESOLUTION_STYLES: Record<Violation["resolution"], string> = {
  open: "bg-red-500/20 text-red-400",
  investigating: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
};

const CATEGORY_STYLES: Record<ComplianceRule["category"], string> = {
  Trading: "bg-violet-500/20 text-violet-400",
  Risk: "bg-orange-500/20 text-orange-400",
  Reporting: "bg-sky-500/20 text-sky-400",
  KYC: "bg-pink-500/20 text-pink-400",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

const rulesColumns: ColumnDef<ComplianceRule, unknown>[] = [
  {
    accessorKey: "ruleId",
    header: "Rule ID",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.getValue<string>("ruleId")}
      </span>
    ),
  },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const v = row.getValue<ComplianceRule["category"]>("category");
      return (
        <Badge variant="outline" className={CATEGORY_STYLES[v]}>
          {v}
        </Badge>
      );
    },
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const v = row.getValue<ComplianceRule["severity"]>("severity");
      return <Badge className={SEVERITY_STYLES[v]}>{v}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const v = row.getValue<ComplianceRule["status"]>("status");
      return <Badge className={RULE_STATUS_STYLES[v]}>{v}</Badge>;
    },
  },
  {
    accessorKey: "lastCheck",
    header: "Last Check",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatTimestamp(row.getValue<string>("lastCheck"))}
      </span>
    ),
  },
];

const violationsColumns: ColumnDef<Violation, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue<string>("date")}</span>
    ),
  },
  {
    accessorKey: "ruleId",
    header: "Rule",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.getValue<string>("ruleId")}
      </span>
    ),
  },
  {
    accessorKey: "detail",
    header: "Violation Detail",
    cell: ({ row }) => (
      <span className="max-w-[300px] truncate block">
        {row.getValue<string>("detail")}
      </span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const v = row.getValue<Violation["severity"]>("severity");
      return <Badge className={SEVERITY_STYLES[v]}>{v}</Badge>;
    },
  },
  {
    accessorKey: "resolution",
    header: "Resolution",
    cell: ({ row }) => {
      const v = row.getValue<Violation["resolution"]>("resolution");
      return <Badge className={RESOLUTION_STYLES[v]}>{v}</Badge>;
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue<string>("assignedTo")}
      </span>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CompliancePage() {
  const { user, token } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compliance-status", user?.id],
    queryFn: () => apiFetch("/api/audit/compliance", token),
    enabled: !!user,
  });

  const rules: ComplianceRule[] = React.useMemo(() => {
    const apiRules = (data as Record<string, unknown>)?.rules as
      | ComplianceRule[]
      | undefined;
    return Array.isArray(apiRules) && apiRules.length > 0
      ? apiRules
      : FALLBACK_RULES;
  }, [data]);

  const violations: Violation[] = React.useMemo(() => {
    const apiViolations = (data as Record<string, unknown>)?.violations as
      | Violation[]
      | undefined;
    return Array.isArray(apiViolations) && apiViolations.length > 0
      ? apiViolations
      : FALLBACK_VIOLATIONS;
  }, [data]);

  const auditEvents: AuditEvent[] = React.useMemo(() => {
    const apiEvents = (data as Record<string, unknown>)?.audit_trail as
      | AuditEvent[]
      | undefined;
    return Array.isArray(apiEvents) && apiEvents.length > 0
      ? apiEvents
      : FALLBACK_AUDIT;
  }, [data]);

  const [fcaOpen, setFcaOpen] = React.useState(false);

  /* Loading state */
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* Error state */
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <AlertTriangle className="size-10 text-destructive" />
              <div>
                <p className="font-semibold">Failed to load compliance data</p>
                <p className="text-sm text-muted-foreground mt-1">
                  An error occurred while fetching compliance status.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compliantCount = rules.filter((r) => r.status === "compliant").length;
  const violatedCount = rules.filter((r) => r.status === "violated").length;
  const warningCount = rules.filter((r) => r.status === "warning").length;

  return (
    <div className="p-6 space-y-6">
      {/* FCA info — collapsible */}
      <Collapsible open={fcaOpen} onOpenChange={setFcaOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="size-5 text-primary" />
                  <CardTitle className="text-base">
                    FCA Authorisation &mdash; Odum Research Ltd
                  </CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Active
                  </Badge>
                </div>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${fcaOpen ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="size-6 text-primary" />
                    <span className="font-semibold">FCA Registration</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Reference Number
                    </span>
                    <span className="font-mono font-semibold">975797</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Firm Type</span>
                    <span className="font-medium">Investment Firm</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Permitted Activities
                    </p>
                    <div className="grid gap-1.5">
                      {[
                        "Arranging deals in investments",
                        "Making arrangements with a view to transactions",
                        "Managing investments",
                        "Advising on investments",
                        "Dealing in investments as agent",
                      ].map((activity) => (
                        <div
                          key={activity}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="size-1.5 rounded-full bg-emerald-400" />
                          <span>{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="size-6 text-primary" />
                    <span className="font-semibold">Registered Office</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Odum Research Ltd</p>
                    <p>9 Appold Street</p>
                    <p>London EC2A 2AP</p>
                    <p>United Kingdom</p>
                    <p className="pt-2 text-foreground font-medium">
                      Registered in England and Wales
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Key Documents
                    </p>
                    {[
                      "Client Agreement",
                      "Best Execution Policy",
                      "Conflicts of Interest Policy",
                      "Complaints Procedure",
                    ].map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-muted-foreground" />
                          <span>{doc}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Available on request
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground">
                    <p>
                      Contact:{" "}
                      <a
                        href="mailto:compliance@odum-research.com"
                        className="text-primary hover:underline"
                      >
                        compliance@odum-research.com
                      </a>
                    </p>
                    <p className="mt-1">
                      Verify at{" "}
                      <a
                        href="https://register.fca.org.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        FCA Register
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <Scale className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold font-mono">
                  {compliantCount}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{rules.length}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2.5">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Violated</p>
                <p className="text-2xl font-bold font-mono">{violatedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <AlertTriangle className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold font-mono">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rules table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            <CardTitle className="text-base">Compliance Rules</CardTitle>
            <div className="ml-auto">
              <ExportDropdown
                data={rules}
                columns={[
                  { key: "ruleId", header: "Rule ID" },
                  { key: "description", header: "Description" },
                  { key: "category", header: "Category" },
                  { key: "severity", header: "Severity" },
                  { key: "status", header: "Status" },
                  {
                    key: "lastCheck",
                    header: "Last Check",
                    format: (v: unknown) => formatTimestamp(String(v ?? "")),
                  },
                ]}
                filename="compliance-rules"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={rulesColumns}
            data={rules}
            enableColumnVisibility={false}
            emptyMessage="No compliance rules found."
          />
        </CardContent>
      </Card>

      {/* Violations Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-400" />
            <CardTitle className="text-base">Violations Log</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {violations.filter((v) => v.resolution !== "resolved").length}{" "}
              open
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={violationsColumns}
            data={violations}
            enableColumnVisibility={false}
            emptyMessage="No violations recorded."
          />
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <CardTitle className="text-base">Audit Trail</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="shrink-0 mt-0.5">
                  <div className="size-2 rounded-full bg-primary/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{evt.event}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(evt.timestamp)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {evt.user}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate">
                    {evt.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
