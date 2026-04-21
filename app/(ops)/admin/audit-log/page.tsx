"use client";

import * as React from "react";
import {
  Download,
  FileText,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/admin/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAuditLog } from "@/lib/admin/api/audit-log";
import { formatDateTime } from "@/lib/admin/utils";
import type { AuditLogEntry } from "@/lib/admin/api/types";

const ACTION_TYPES = [
  "all",
  "entitlement.grant",
  "entitlement.revoke",
  "group.create",
  "group.delete",
  "group.member.add",
  "group.member.remove",
  "group.bulk_assign",
  "app.sync",
  "user.onboard",
  "user.offboard",
  "user.modify",
];

export default function AuditLogPage() {
  const [entries, setEntries] = React.useState<AuditLogEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("all");

  const fetchLog = React.useCallback(async () => {
    try {
      setLoading(true);
      const params =
        actionFilter !== "all" ? { action: actionFilter } : undefined;
      const res = await listAuditLog(params);
      setEntries(res.data.entries);
      setTotal(res.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  React.useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const stats = React.useMemo(() => {
    const grants = entries.filter((e) => e.action.includes("grant")).length;
    const revokes = entries.filter((e) => e.action.includes("revoke")).length;
    const groupChanges = entries.filter((e) =>
      e.action.startsWith("group."),
    ).length;
    return { grants, revokes, groupChanges };
  }, [entries]);

  function exportCsv() {
    const header = "Action,Subject,App,Actor,Timestamp\n";
    const rows = entries.map(
      (e) =>
        `"${e.action}","${e.subject_id || ""}","${e.app_id || ""}","${e.actor}","${e.timestamp}"`,
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Track all access and administrative changes
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportCsv}
          disabled={entries.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-emerald-400" />
              <span className="text-2xl font-bold">{stats.grants}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revokes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserMinus className="size-4 text-destructive" />
              <span className="text-2xl font-bold">{stats.revokes}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Group Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="text-2xl font-bold">{stats.groupChanges}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={actionFilter} onValueChange={setActionFilter}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filter by action" />
        </SelectTrigger>
        <SelectContent>
          {ACTION_TYPES.map((a) => (
            <SelectItem key={a} value={a}>
              {a === "all" ? "All Actions" : a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No audit entries"
          description="Audit events will appear here as changes are made."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant="outline">{e.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.subject_id || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.app_id || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.actor}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(e.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
