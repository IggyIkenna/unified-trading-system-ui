"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw, AppWindow, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
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
import { Separator } from "@/components/ui/separator";
import {
  listApplications,
  syncApplications,
  listSyncHistory,
} from "@/lib/admin/api/applications";
import { formatDateTime } from "@/lib/admin/utils";
import { useAuth } from "@/hooks/use-auth";
import { hasAdminPermission } from "@/lib/auth/admin-permissions";
import type {
  Application,
  AppCategory,
  AppStatus,
  ApplicationSyncHistoryEntry,
} from "@/lib/admin/api/types";

const STATUS_STYLES: Record<AppStatus, string> = {
  active: "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
  pending: "bg-amber-600/15 text-amber-400 border-amber-600/20",
  archived: "bg-muted text-muted-foreground",
};

const CATEGORY_LABELS: Record<AppCategory, string> = {
  ui: "UI",
  api: "API",
  service: "Service",
  control_plane: "Control Plane",
};

export default function AppsPage() {
  const { user: currentUser } = useAuth();
  const canManageApps = hasAdminPermission(currentUser, "admin:manage_apps");
  const [apps, setApps] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<string | null>(null);

  const [history, setHistory] = React.useState<ApplicationSyncHistoryEntry[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const fetchApps = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listApplications();
      setApps(res.data.applications ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = React.useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await listSyncHistory();
      setHistory(res.data.runs ?? res.data.history ?? []);
    } catch {
      /* non-critical */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApps();
    fetchHistory();
  }, [fetchApps, fetchHistory]);

  async function handleSync() {
    if (!canManageApps) {
      setSyncResult("Permission denied: admin:manage_apps required to sync applications");
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncApplications();
      const d = res.data;
      setSyncResult(
        `Sync complete: ${d.created} created, ${d.updated} updated, ${d.skipped} skipped`,
      );
      await fetchApps();
      await fetchHistory();
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = React.useMemo(() => {
    return apps.filter((a) => {
      if (categoryFilter !== "all" && a.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [apps, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Registry of all managed applications
          </p>
        </div>
        <Button size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Sync Applications
        </Button>
      </div>

      {syncResult && (
        <p className="text-sm rounded-md px-3 py-2 bg-muted">{syncResult}</p>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ui">UI</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="control_plane">Control Plane</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AppWindow}
          title="No applications found"
          description="Try changing the filters or sync from the manifest."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Environments</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow key={app.id} className="group">
                  <TableCell className="font-medium">
                    <Link
                      href={`/apps/${app.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {app.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.auth_mode}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {app.environments.map((env) => (
                        <Badge
                          key={env}
                          variant="secondary"
                          className="text-xs"
                        >
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.owner_team}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[app.status]}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/apps/${app.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Sync History
        </h2>
        {historyLoading ? (
          <Spinner className="size-5" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sync history available.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 6).map((h) => (
              <Card key={h.id}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatDateTime(h.synced_at)}
                  </p>
                  <div className="flex gap-3 text-sm">
                    <span className="text-emerald-400">
                      {h.created} created
                    </span>
                    <span className="text-primary">{h.updated} updated</span>
                    <span className="text-muted-foreground">
                      {h.skipped} skipped
                    </span>
                  </div>
                  {h.errors.length > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      {h.errors.length} error{h.errors.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
