import { apiClient } from "@/lib/admin/api/client";
import type { AppCapabilityDefinition, AuthorizeResult } from "@/lib/admin/api/types";

export async function getAppCapabilities(appId: string) {
  return apiClient.get<{ definition: AppCapabilityDefinition }>(
    `/apps/${appId}/capabilities`,
  );
}

export async function updateAppCapabilities(
  appId: string,
  payload: {
    capabilities: AppCapabilityDefinition["capabilities"];
    role_presets: AppCapabilityDefinition["role_presets"];
  },
) {
  return apiClient.put<{ definition: AppCapabilityDefinition }>(
    `/apps/${appId}/capabilities`,
    payload,
  );
}

export async function authorize(appId: string, uid: string, env?: string) {
  return apiClient.get<AuthorizeResult>("/authorize", {
    params: { app_id: appId, uid, env },
  });
}

export async function seedCapabilities() {
  return apiClient.post<{
    created: number;
    updated: number;
    synced_at: string;
  }>("/apps/capabilities/seed");
}
