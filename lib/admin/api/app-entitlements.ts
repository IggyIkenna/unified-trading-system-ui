import { apiClient } from "@/lib/admin/api/client";
import type { AppEntitlement, GrantEntitlementRequest } from "@/lib/admin/api/types";

export async function listEntitlements(appId: string) {
  return apiClient.get<{ entitlements: AppEntitlement[] }>(
    `/apps/${appId}/entitlements`,
  );
}

export async function grantEntitlement(data: GrantEntitlementRequest) {
  return apiClient.post<{ entitlement: AppEntitlement }>(
    `/apps/${data.app_id}/entitlements`,
    data,
  );
}

export async function revokeEntitlement(appId: string, entitlementId: string) {
  return apiClient.delete<void>(`/apps/${appId}/entitlements/${entitlementId}`);
}
