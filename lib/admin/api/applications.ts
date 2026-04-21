import { apiClient } from "@/lib/admin/api/client";
import type {
  Application,
  ApplicationSyncResult,
  ApplicationSyncHistoryEntry,
} from "@/lib/admin/api/types";

export async function listApplications() {
  return apiClient.get<{ applications: Application[]; total: number }>("/apps");
}

export async function getApplication(id: string) {
  return apiClient.get<{ application: Application }>(`/apps/${id}`);
}

export async function syncApplications() {
  return apiClient.post<ApplicationSyncResult>("/apps/sync");
}

export async function updateApplication(
  id: string,
  data: Partial<Omit<Application, "id" | "created_at" | "updated_at">>,
) {
  return apiClient.put<{ app: Application }>(`/apps/${id}`, data);
}

export async function listSyncHistory() {
  return apiClient.get<{
    runs: ApplicationSyncHistoryEntry[];
    history?: ApplicationSyncHistoryEntry[];
    total: number;
  }>("/apps/sync-history");
}
