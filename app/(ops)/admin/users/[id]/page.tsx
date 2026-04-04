"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowLeft, Edit, UserMinus, RefreshCw, CheckCircle2, XCircle, Clock, Mail, Github } from "lucide-react";
import {
  useProvisionedUser,
  useUserWorkflows,
  useReprovisionUser,
  useAccessRequests,
  useReviewRequest,
} from "@/hooks/api/use-user-management";
import type { ProvisioningStatus, AccessRequest } from "@/lib/types/user-management";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";

const SERVICE_LABELS: Record<string, string> = {
  github: "GitHub",
  slack: "Slack",
  microsoft365: "Microsoft 365",
  gcp: "GCP IAM",
  aws: "AWS IAM",
  portal: "Portal",
};

const ENTITLEMENT_LABELS: Record<string, string> = {
  "data-basic": "Data (Basic)",
  "data-pro": "Data (Pro)",
  "execution-basic": "Execution (Basic)",
  "execution-full": "Execution (Full)",
  "ml-full": "ML & Backtesting",
  "strategy-full": "Strategy Platform",
  reporting: "Reporting & Analytics",
};

function statusBadge(s: ProvisioningStatus) {
  if (s === "provisioned") return <Badge variant="default">Provisioned</Badge>;
  if (s === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (s === "pending") return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="outline">N/A</Badge>;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useProvisionedUser(params.id);
  const workflows = useUserWorkflows(params.id);
  const reprovision = useReprovisionUser();
  const allRequests = useAccessRequests();
  const review = useReviewRequest();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load user" />
      </div>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <div className="p-6">
        <EmptyState title="User not found" description="This user ID does not exist or you do not have access." />
      </div>
    );
  }

  const isInternal = ["admin", "collaborator", "operations", "accounting"].includes(user.role);
  const userRequests = (allRequests.data?.requests ?? []).filter((r) => r.requester_email === user.email);
  const pendingRequests = userRequests.filter((r) => r.status === "pending");

  return (
    <div className="px-6 py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="min-w-0 flex-1 space-y-1"
          title={user.name}
          description={
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" /> {user.email}
                {user.github_handle && (
                  <>
                    <Github className="h-3 w-3 shrink-0" /> {user.github_handle}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Provisioned:{" "}
                  {new Date(user.provisioned_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>
                  Last modified:{" "}
                  {new Date(user.last_modified).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </>
          }
        >
          <Link href={`/admin/users/${params.id}/modify`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Modify
            </Button>
          </Link>
          <Link href={`/admin/users/${params.id}/offboard`}>
            <Button variant="destructive" size="sm">
              <UserMinus className="h-4 w-4 mr-1" /> Offboard
            </Button>
          </Link>
        </PageHeader>
      </div>

      {/* Status strip */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
        <Badge variant={isInternal ? "default" : "outline"}>{isInternal ? "Internal" : "External"}</Badge>
        <Badge variant="outline">{user.role}</Badge>
        {user.access_template && <Badge variant="outline">Template: {user.access_template.name}</Badge>}
        {pendingRequests.length > 0 && <Badge variant="destructive">{pendingRequests.length} pending request(s)</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Access (what apps/entitlements they have) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.product_slugs.length > 0 ? (
              user.product_slugs.map((slug) => (
                <div key={slug} className="flex items-center justify-between">
                  <span className="text-sm">{ENTITLEMENT_LABELS[slug] ?? slug}</span>
                  <Badge variant="default">Active</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No service entitlements granted.</p>
            )}
          </CardContent>
        </Card>

        {/* Internal: Slack/GitHub/M365/GCP/AWS provisioning status */}
        {isInternal && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Internal Provisioning</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reprovision.mutate(params.id)}
                  disabled={reprovision.isPending}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reprovision
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.entries(user.services) as [string, ProvisioningStatus][]).map(([svc, status]) => (
                <div key={svc}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{SERVICE_LABELS[svc] ?? svc}</span>
                    {statusBadge(status)}
                  </div>
                  {user.service_messages?.[svc as keyof typeof user.services] && (
                    <p className="text-xs text-muted-foreground ml-1 mt-0.5">
                      {user.service_messages[svc as keyof typeof user.services]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* External: just portal */}
        {!isInternal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portal Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Portal</span>
                {statusBadge(user.services.portal)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">External users access services through the portal.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Access Requests for this user — approve/deny inline */}
      {userRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRequests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                onApprove={() =>
                  review.mutate({
                    id: req.id,
                    action: "approve",
                    admin_note: "Approved",
                  })
                }
                onDeny={() =>
                  review.mutate({
                    id: req.id,
                    action: "deny",
                    admin_note: "Denied",
                  })
                }
                isPending={review.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Workflow History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow History</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading workflows...</p>
          ) : (workflows.data?.runs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No workflow runs recorded.</p>
          ) : (
            workflows.data?.runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <span className="font-medium capitalize">{run.run_type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      run.status === "succeeded" || run.status === "completed"
                        ? "default"
                        : run.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {run.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(run.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestRow({
  request,
  onApprove,
  onDeny,
  isPending,
}: {
  request: AccessRequest;
  onApprove: () => void;
  onDeny: () => void;
  isPending: boolean;
}) {
  const icon =
    request.status === "pending" ? (
      <Clock className="h-4 w-4 text-yellow-500" />
    ) : request.status === "approved" ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );

  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium capitalize">{request.status}</span>
          <span className="text-xs text-muted-foreground">{request.created_at.split("T")[0]}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {request.requested_entitlements.map((e) => (
            <Badge key={e} variant="outline" className="text-xs">
              {ENTITLEMENT_LABELS[e] ?? e}
            </Badge>
          ))}
        </div>
        {request.reason && <p className="text-xs text-muted-foreground">{request.reason}</p>}
        {request.admin_note && <p className="text-xs italic text-muted-foreground">Admin: {request.admin_note}</p>}
      </div>
      {request.status === "pending" && (
        <div className="flex gap-1">
          <Button size="sm" variant="default" onClick={onApprove} disabled={isPending}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={onDeny} disabled={isPending}>
            Deny
          </Button>
        </div>
      )}
    </div>
  );
}
