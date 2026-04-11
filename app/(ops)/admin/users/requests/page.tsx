"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Inbox, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAccessRequests, useReviewRequest, usePermissionCatalogue } from "@/hooks/api/use-user-management";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";
import { toast } from "@/hooks/use-toast";
import type { AccessRequest } from "@/lib/types/user-management";

function statusIcon(status: string) {
  if (status === "pending") return <Clock className="h-4 w-4 text-yellow-500" />;
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "denied") return <XCircle className="h-4 w-4 text-red-500" />;
  return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
}

function statusVariant(status: string) {
  if (status === "pending") return "secondary" as const;
  if (status === "approved") return "default" as const;
  if (status === "denied") return "destructive" as const;
  return "outline" as const;
}

const ENTITLEMENT_LABELS: Record<string, string> = {
  "data-basic": "Data (Basic)",
  "data-pro": "Data (Pro)",
  "execution-basic": "Execution (Basic)",
  "execution-full": "Execution (Full)",
  "ml-full": "ML & Backtesting",
  "strategy-full": "Strategy Platform",
  reporting: "Reporting & Analytics",
};

/** Build a label lookup from catalogue data, falling back to ENTITLEMENT_LABELS */
function useCatalogueLabels(): Record<string, { label: string; domain: string }> {
  const { data: catalogueData } = usePermissionCatalogue();
  return React.useMemo(() => {
    const map: Record<string, { label: string; domain: string }> = {};
    if (!catalogueData?.domains) return map;
    for (const domain of catalogueData.domains) {
      for (const cat of domain.categories) {
        for (const perm of cat.permissions) {
          map[perm.key] = { label: perm.label, domain: domain.label };
        }
      }
    }
    return map;
  }, [catalogueData]);
}

export default function AccessRequestsPage() {
  const [filter, setFilter] = React.useState<string>("");
  const { data, isLoading, isError, error, refetch } = useAccessRequests(filter || undefined);
  const review = useReviewRequest();
  const catalogueLabels = useCatalogueLabels();

  const handleReview = (id: string, action: "approve" | "deny") => {
    const request = (data?.requests ?? []).find((r) => r.id === id);
    const note = action === "deny" ? "Denied by admin" : "Approved by admin";
    review.mutate({ id, action, admin_note: note });
    if (request) {
      toast({
        title: action === "approve" ? "Approved" : "Denied",
        description:
          action === "approve"
            ? `Confirmation email would be sent to ${request.requester_email}`
            : `Notification email would be sent to ${request.requester_email}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-6">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load access requests" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Inbox className="h-6 w-6" /> Access Requests
          </span>
        }
        description="Review and approve pending access requests from users"
      >
        {["", "pending", "approved", "denied"].map((s) => (
          <Button
            key={s || "all"}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </PageHeader>

      <div className="grid gap-3">
        {(data?.requests ?? []).map((req) => (
          <RequestCard key={req.id} request={req} onReview={handleReview} isPending={review.isPending} catalogueLabels={catalogueLabels} />
        ))}
        {(data?.requests ?? []).length === 0 && (
          <EmptyState title="No requests" description="There are no access requests for this filter." icon={Inbox} />
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onReview,
  isPending,
  catalogueLabels,
}: {
  request: AccessRequest;
  onReview: (id: string, action: "approve" | "deny") => void;
  isPending: boolean;
  catalogueLabels: Record<string, { label: string; domain: string }>;
}) {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {statusIcon(request.status)}
              <span className="font-medium">{request.requester_name}</span>
              <span className="text-sm text-muted-foreground">{request.requester_email}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {request.requested_entitlements.map((e) => {
                const catInfo = catalogueLabels[e];
                return (
                  <Badge key={e} variant="outline" title={catInfo ? catInfo.domain : undefined}>
                    {catInfo ? `${catInfo.domain}: ${catInfo.label}` : ENTITLEMENT_LABELS[e] ?? e}
                  </Badge>
                );
              })}
              {request.requested_role && <Badge variant="secondary">Role: {request.requested_role}</Badge>}
            </div>
            {request.reason && <p className="text-sm text-muted-foreground">{request.reason}</p>}
            {request.admin_note && (
              <p className="text-sm italic text-muted-foreground">
                Admin: {request.admin_note} — {request.reviewed_by}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
            <span className="text-xs text-muted-foreground">{request.created_at.split("T")[0]}</span>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              aria-label="Approve access request"
              onClick={() => onReview(request.id, "approve")}
              disabled={isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReview(request.id, "deny")} disabled={isPending}>
              <XCircle className="h-4 w-4 mr-1" /> Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
