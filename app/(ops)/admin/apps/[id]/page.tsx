"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, ShieldAlert, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApplication } from "@/lib/admin/api/applications";
import { getAppCapabilities } from "@/lib/admin/api/app-capabilities";
import { CapabilitiesTab } from "./capabilities-tab";
import { GrantSubjectField } from "./grant-subject-field";
import {
  listEntitlements,
  grantEntitlement,
  revokeEntitlement,
} from "@/lib/admin/api/app-entitlements";
import { listAppAuditLog } from "@/lib/admin/api/audit-log";
import { formatDateTime } from "@/lib/admin/utils";
import type {
  Application,
  AppCapabilityDefinition,
  AppEntitlement,
  AppRole,
  AuditLogEntry,
} from "@/lib/admin/api/types";

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;

  const [app, setApp] = React.useState<Application | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [entitlements, setEntitlements] = React.useState<AppEntitlement[]>([]);
  const [entLoading, setEntLoading] = React.useState(true);

  const [auditLog, setAuditLog] = React.useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = React.useState(true);

  const [capDefinition, setCapDefinition] =
    React.useState<AppCapabilityDefinition | null>(null);

  const [grantOpen, setGrantOpen] = React.useState(false);
  const [grantForm, setGrantForm] = React.useState({
    subject_type: "user" as "user" | "group",
    subject_id: "",
    subject_label: "",
    role: "viewer" as AppRole,
    environments: [] as string[],
    capabilities: [] as string[],
    overrideCapabilities: false,
  });
  const [granting, setGranting] = React.useState(false);
  const [grantError, setGrantError] = React.useState("");

  const [revokeTarget, setRevokeTarget] = React.useState<AppEntitlement | null>(
    null,
  );
  const [revoking, setRevoking] = React.useState(false);

  const fetchApp = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApplication(appId);
      setApp(res.data.application);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load application",
      );
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const fetchEntitlements = React.useCallback(async () => {
    try {
      setEntLoading(true);
      const res = await listEntitlements(appId);
      setEntitlements(res.data.entitlements);
    } catch {
      /* non-critical */
    } finally {
      setEntLoading(false);
    }
  }, [appId]);

  const fetchCapabilities = React.useCallback(async () => {
    try {
      const res = await getAppCapabilities(appId);
      setCapDefinition(res.data.definition);
    } catch {
      /* non-critical */
    }
  }, [appId]);

  const fetchAudit = React.useCallback(async () => {
    try {
      setAuditLoading(true);
      const res = await listAppAuditLog(appId);
      setAuditLog(res.data.entries);
    } catch {
      /* non-critical */
    } finally {
      setAuditLoading(false);
    }
  }, [appId]);

  React.useEffect(() => {
    fetchApp();
    fetchEntitlements();
    fetchCapabilities();
    fetchAudit();
  }, [fetchApp, fetchEntitlements, fetchCapabilities, fetchAudit]);

  function toggleEnv(env: string) {
    setGrantForm((f) => ({
      ...f,
      environments: f.environments.includes(env)
        ? f.environments.filter((e) => e !== env)
        : [...f.environments, env],
    }));
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!grantForm.subject_id.trim() || grantForm.environments.length === 0) {
      setGrantError("Subject ID and at least one environment are required.");
      return;
    }
    setGranting(true);
    setGrantError("");
    try {
      await grantEntitlement({
        app_id: appId,
        subject_type: grantForm.subject_type,
        subject_id: grantForm.subject_id.trim(),
        subject_label:
          grantForm.subject_label.trim() || grantForm.subject_id.trim(),
        role: grantForm.role,
        capabilities: grantForm.overrideCapabilities
          ? grantForm.capabilities
          : undefined,
        environments: grantForm.environments,
      });
      setGrantOpen(false);
      setGrantForm({
        subject_type: "user",
        subject_id: "",
        subject_label: "",
        role: "viewer",
        environments: [],
        capabilities: [],
        overrideCapabilities: false,
      });
      await fetchEntitlements();
      await fetchAudit();
    } catch (err) {
      setGrantError(
        err instanceof Error ? err.message : "Failed to grant access",
      );
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeEntitlement(appId, revokeTarget.id);
      setRevokeTarget(null);
      await fetchEntitlements();
      await fetchAudit();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke entitlement",
      );
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="space-y-4">
        <Link href="/apps">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Applications
          </Button>
        </Link>
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error || "Application not found"}
        </p>
      </div>
    );
  }

  const envChoices =
    app.environments.length > 0 ? app.environments : ["dev", "staging", "prod"];

  return (
    <div className="space-y-6">
      <Link href="/apps">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" />
          Back to Applications
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{app.name}</CardTitle>
              <CardDescription className="mt-1">
                {app.repo} &middot; {app.category} &middot; {app.auth_mode}
              </CardDescription>
            </div>
            <Badge
              className={
                app.status === "active"
                  ? "bg-emerald-600/15 text-emerald-400 border-emerald-600/20"
                  : app.status === "pending"
                    ? "bg-amber-600/15 text-amber-400 border-amber-600/20"
                    : "bg-muted text-muted-foreground"
              }
            >
              {app.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Owner: {app.owner_team}</span>
            <span>
              Environments:{" "}
              {app.environments.map((env) => (
                <Badge key={env} variant="secondary" className="text-xs ml-1">
                  {env}
                </Badge>
              ))}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entitlements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entitlements">Entitlements</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="entitlements" className="space-y-6">
          {(!capDefinition || capDefinition.capabilities.length === 0) && (
            <p className="text-sm rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-muted-foreground">
              No capability definitions in Firestore for this app yet. Open the{" "}
              <strong className="text-foreground">Capabilities</strong> tab and
              use{" "}
              <strong className="text-foreground">
                Import defaults from seed file
              </strong>
              , or run{" "}
              <code className="text-xs">
                POST /api/v1/apps/capabilities/seed
              </code>{" "}
              on the API.
            </p>
          )}
          {/* Grant Access */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Entitlements</h2>
            <Dialog
              open={grantOpen}
              onOpenChange={(open) => {
                setGrantOpen(open);
                if (open) {
                  const envs =
                    app.environments.length > 0
                      ? app.environments
                      : ["dev", "staging", "prod"];
                  setGrantForm({
                    subject_type: "user",
                    subject_id: "",
                    subject_label: "",
                    role: "viewer",
                    environments: [...envs],
                    capabilities: [],
                    overrideCapabilities: false,
                  });
                  setGrantError("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  Grant Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleGrant}>
                  <DialogHeader>
                    <DialogTitle>Grant Access</DialogTitle>
                    <DialogDescription>
                      Grant a user or group access to {app.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label>Subject Type</Label>
                      <Select
                        value={grantForm.subject_type}
                        onValueChange={(v) =>
                          setGrantForm((f) => ({
                            ...f,
                            subject_type: v as "user" | "group",
                            subject_id: "",
                            subject_label: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <GrantSubjectField
                      subjectType={grantForm.subject_type}
                      subjectId={grantForm.subject_id}
                      subjectLabel={grantForm.subject_label}
                      onSubjectChange={(id, label) =>
                        setGrantForm((f) => ({
                          ...f,
                          subject_id: id,
                          subject_label: label,
                        }))
                      }
                    />
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select
                        value={grantForm.role}
                        onValueChange={(v) =>
                          setGrantForm((f) => ({ ...f, role: v as AppRole }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Environments</Label>
                      <p className="text-xs text-muted-foreground">
                        Uses registry values: {envChoices.join(", ")}.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {envChoices.map((env) => (
                          <label
                            key={env}
                            className="flex items-center gap-1.5 text-sm"
                          >
                            <Checkbox
                              checked={grantForm.environments.includes(env)}
                              onCheckedChange={() => toggleEnv(env)}
                            />
                            {env}
                          </label>
                        ))}
                      </div>
                    </div>
                    {capDefinition && capDefinition.capabilities.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={grantForm.overrideCapabilities}
                            onCheckedChange={(checked) => {
                              const preset =
                                capDefinition.role_presets[grantForm.role] ||
                                [];
                              setGrantForm((f) => ({
                                ...f,
                                overrideCapabilities: Boolean(checked),
                                capabilities: checked
                                  ? preset.includes("*")
                                    ? capDefinition.capabilities.map(
                                        (c) => c.key,
                                      )
                                    : [...preset]
                                  : [],
                              }));
                            }}
                          />
                          <Label className="text-sm">
                            Override capabilities for this grant
                          </Label>
                        </div>
                        {grantForm.overrideCapabilities && (
                          <ScrollArea className="max-h-48 rounded-md border p-2">
                            {capDefinition.capabilities.map((cap) => (
                              <label
                                key={cap.key}
                                className="flex items-center gap-2 py-0.5 text-sm"
                              >
                                <Checkbox
                                  checked={grantForm.capabilities.includes(
                                    cap.key,
                                  )}
                                  onCheckedChange={(checked) => {
                                    setGrantForm((f) => ({
                                      ...f,
                                      capabilities: checked
                                        ? [...f.capabilities, cap.key]
                                        : f.capabilities.filter(
                                            (c) => c !== cap.key,
                                          ),
                                    }));
                                  }}
                                />
                                <Badge
                                  variant="outline"
                                  className={
                                    cap.category === "view"
                                      ? "border-blue-600/30 text-blue-400 text-[10px]"
                                      : "border-amber-600/30 text-amber-400 text-[10px]"
                                  }
                                >
                                  {cap.category}
                                </Badge>
                                {cap.label}
                              </label>
                            ))}
                          </ScrollArea>
                        )}
                      </div>
                    )}
                    {grantError && (
                      <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                        {grantError}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={granting}>
                      {granting ? "Granting…" : "Grant Access"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {entLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : entitlements.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No entitlements"
              description="Grant access to users or groups above."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entitlements.map((ent) => (
                    <TableRow key={ent.id}>
                      <TableCell className="font-medium">
                        {ent.subject_label}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ent.subject_type}</Badge>
                      </TableCell>
                      <TableCell>{ent.role}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {ent.environments.map((env) => (
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
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(ent.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(ent)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Separator />

          {/* Audit Trail */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Audit Trail
            </h2>
            {auditLoading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No audit events for this application.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.subject_id || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.actor}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(entry.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="capabilities">
          <CapabilitiesTab appId={appId} />
        </TabsContent>
      </Tabs>

      {/* Revoke Confirm */}
      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke {revokeTarget?.role} access for &ldquo;
              {revokeTarget?.subject_label}&rdquo;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
