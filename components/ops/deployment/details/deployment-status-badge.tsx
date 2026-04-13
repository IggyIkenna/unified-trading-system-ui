"use client";

import { Badge } from "@/components/ui/badge";

export function DeploymentStatusBadge({ status, statusDetail }: { status: string; statusDetail?: string }) {
  const detailStatus = statusDetail || status;

  switch (detailStatus) {
    case "clean":
      return <Badge variant="success">✅ Clean</Badge>;
    case "completed_with_warnings":
      return <Badge variant="warning">⚠️ Completed with Warnings</Badge>;
    case "completed_with_errors":
      return <Badge variant="warning">⚠️ Completed with Errors</Badge>;
    case "completed":
    case "succeeded":
      return <Badge variant="success">Completed</Badge>;
    case "completed_pending_delete":
      return (
        <Badge variant="warning" title="VMs may still be deleting; delete manually if they remain">
          Completed (pending delete)
        </Badge>
      );
    case "running":
      return <Badge variant="running">Running</Badge>;
    case "failed":
      return <Badge variant="error">Failed</Badge>;
    case "pending":
      return <Badge variant="pending">Pending</Badge>;
    case "cancelled":
      return <Badge variant="warning">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
