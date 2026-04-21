import { apiClient } from "@/lib/admin/api/client";
import type { AuditLogEntry } from "@/lib/admin/api/types";

export async function listAuditLog(params?: {
  action?: string;
  limit?: number;
}) {
  return apiClient.get<{ entries: AuditLogEntry[]; total: number }>(
    "/audit-log",
    {
      params,
    },
  );
}

export async function listAppAuditLog(appId: string) {
  return apiClient.get<{ entries: AuditLogEntry[] }>(
    `/apps/${appId}/audit-log`,
  );
}
