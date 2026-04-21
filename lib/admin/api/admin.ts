import { apiClient } from "@/lib/admin/api/client";
import type {
  HealthCheckResult,
  HealthCheckHistoryEntry,
} from "@/lib/admin/api/types";

export async function runHealthChecks() {
  return apiClient.post<HealthCheckResult>("/admin/health-checks");
}

export async function listHealthCheckHistory() {
  return apiClient.get<{ runs: HealthCheckHistoryEntry[] }>(
    "/admin/health-checks/history",
  );
}
