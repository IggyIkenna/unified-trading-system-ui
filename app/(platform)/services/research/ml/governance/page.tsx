"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  Search,
  Filter,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitCommit,
  History,
  Eye,
  Lock,
  Unlock,
  ChevronRight,
  Calendar,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMLGovernance } from "@/hooks/api/use-ml-models";

export default function GovernancePage() {
  const { data: governanceData, isLoading } = useMLGovernance();
  const rawEvents: Array<Record<string, unknown>> =
    (governanceData as any)?.data ?? (governanceData as any)?.events ?? [];

  // Derive governance data from audit events
  const auditLog = rawEvents.map((e: any, i: number) => ({
    id: e.id ?? i + 1,
    timestamp: e.timestamp ?? "",
    action: e.action ?? "",
    model: e.model ?? "—",
    user: e.user ?? "system",
    avatar:
      e.avatar ?? (e.user ? String(e.user).slice(0, 2).toUpperCase() : "SY"),
    details: e.details ?? "",
    status: e.status ?? "success",
  }));

  const pendingApprovals: Array<any> = rawEvents
    .filter(
      (e: any) =>
        e.action === "PROMOTION_REQUESTED" ||
        (e.type === "promotion" && e.status === "pending"),
    )
    .map((e: any, i: number) => ({
      id: e.id ?? i + 1,
      type: e.type ?? "promotion",
      model: e.model ?? "",
      requestedBy: e.requestedBy ?? e.user ?? "",
      requestedAt: e.requestedAt ?? e.timestamp ?? "",
      stage: e.stage ?? "CHALLENGER \u2192 CHAMPION",
      approvers: e.approvers ?? [],
      riskScore: e.riskScore ?? "low",
      validationScore: e.validationScore ?? null,
    }));

  const accessControl: Array<any> = rawEvents
    .filter(
      (e: any) => e.type === "access_control" || e.action === "ACCESS_GRANTED",
    )
    .map((e: any) => ({
      user: e.user ?? "",
      role: e.role ?? "viewer",
      models: e.models ?? ["*"],
      permissions: e.permissions ?? ["read"],
      lastActive: e.lastActive ?? "—",
    }));

  const complianceReports: Array<any> = rawEvents
    .filter((e: any) => e.type === "compliance_report")
    .map((e: any) => ({
      id: e.id ?? "",
      name: e.name ?? "",
      type: e.reportType ?? "monthly",
      generatedAt: e.generatedAt ?? "",
      status: e.status ?? "draft",
      pages: e.pages ?? 0,
    }));
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  if (isLoading)
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const filteredAuditLog = auditLog.filter((entry) => {
    const matchesSearch =
      entry.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction =
      actionFilter === "all" ||
      entry.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      PROMOTION_REQUESTED: "bg-[#60a5fa]",
      PROMOTION_APPROVED: "bg-[var(--status-success)]",
      VALIDATION_COMPLETED: "bg-[var(--status-success)]",
      TRAINING_COMPLETED: "bg-[var(--status-success)]",
      CONFIG_CHANGED: "bg-[#a78bfa]",
      ROLLBACK_EXECUTED: "bg-[var(--status-warning)]",
      DEPLOYMENT_STARTED: "bg-[#60a5fa]",
      FEATURE_REGISTERED: "bg-[#4ade80]",
      ACCESS_GRANTED: "bg-[#f59e0b]",
      MODEL_RETIRED: "bg-muted-foreground",
    };
    return (
      <Badge className={colors[action] || "bg-muted"}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/services/research/ml/overview">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="size-5" />
                  Governance & Audit
                </h1>
                <p className="text-sm text-muted-foreground">
                  Audit trail, approvals, access control, and compliance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Export Audit Log
              </Button>
              <Button size="sm">
                <FileText className="size-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="size-8 text-[#60a5fa]" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold">
                    {pendingApprovals.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <History className="size-8 text-[#a78bfa]" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Audit Events (7d)
                  </p>
                  <p className="text-2xl font-bold">{auditLog.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="size-8 text-[#4ade80]" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{accessControl.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="size-8 text-[#f59e0b]" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Compliance Reports
                  </p>
                  <p className="text-2xl font-bold">
                    {complianceReports.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            {pendingApprovals.map((approval) => (
              <Card
                key={approval.id}
                className="border-[var(--status-warning)]/30"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {approval.type === "promotion" ? (
                          <Badge className="bg-[#60a5fa]">
                            Promotion Request
                          </Badge>
                        ) : (
                          <Badge className="bg-[#a78bfa]">Config Change</Badge>
                        )}
                        <span>{approval.model}</span>
                      </CardTitle>
                      <CardDescription>
                        Requested by {approval.requestedBy} on{" "}
                        {approval.requestedAt}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          approval.riskScore === "low"
                            ? "border-[var(--status-success)] text-[var(--status-success)]"
                            : "border-[var(--status-warning)] text-[var(--status-warning)]"
                        }
                      >
                        {approval.riskScore} risk
                      </Badge>
                      {approval.validationScore && (
                        <Badge variant="outline">
                          Validation: {approval.validationScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Stage:</span>
                      <span className="font-medium">{approval.stage}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Approval Chain</p>
                      <div className="flex items-center gap-4">
                        {approval.approvers.map(
                          (
                            approver: {
                              name: string;
                              role: string;
                              status: string;
                              approvedBy?: string;
                            },
                            idx: number,
                          ) => (
                            <div
                              key={approver.name}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  approver.status === "approved"
                                    ? "border-[var(--status-success)]/50 bg-[var(--status-success)]/10"
                                    : "border-muted"
                                }`}
                              >
                                {approver.status === "approved" ? (
                                  <CheckCircle2 className="size-4 text-[var(--status-success)]" />
                                ) : (
                                  <Clock className="size-4 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">
                                    {approver.name}
                                  </p>
                                  {approver.approvedBy && (
                                    <p className="text-xs text-muted-foreground">
                                      {approver.approvedBy}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {idx < approval.approvers.length - 1 && (
                                <ChevronRight className="size-4 text-muted-foreground" />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="size-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[var(--status-success)] hover:bg-[var(--status-success)]/90"
                      >
                        <CheckCircle2 className="size-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[var(--status-error)] border-[var(--status-error)]/50"
                      >
                        <XCircle className="size-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit log..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="promotion">Promotions</SelectItem>
                      <SelectItem value="deployment">Deployments</SelectItem>
                      <SelectItem value="config">Config Changes</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="access">Access Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {entry.timestamp}
                        </TableCell>
                        <TableCell>{getActionBadge(entry.action)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.model}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-xs">
                                {entry.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{entry.user}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                          {entry.details}
                        </TableCell>
                        <TableCell>
                          {entry.status === "success" ? (
                            <CheckCircle2 className="size-4 text-[var(--status-success)]" />
                          ) : entry.status === "warning" ? (
                            <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                          ) : (
                            <Clock className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Access Control List
                    </CardTitle>
                    <CardDescription>
                      User roles and permissions for ML platform
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Users className="size-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Model Access</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessControl.map((user) => (
                      <TableRow key={user.user}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-8">
                              <AvatarFallback>
                                {user.user.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.user}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.models.join(", ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((perm: string) => (
                              <Badge
                                key={perm}
                                variant="secondary"
                                className="text-xs"
                              >
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.lastActive}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Lock className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Reports Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Compliance Reports
                    </CardTitle>
                    <CardDescription>
                      Model risk and regulatory documentation
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <FileText className="size-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono">{report.id}</TableCell>
                        <TableCell className="font-medium">
                          {report.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.generatedAt}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              report.status === "published"
                                ? "bg-[var(--status-success)]"
                                : report.status === "draft"
                                  ? "bg-muted"
                                  : "bg-[var(--status-warning)]"
                            }
                          >
                            {report.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.pages}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
