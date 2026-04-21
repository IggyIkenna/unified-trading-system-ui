import { apiClient } from "@/lib/admin/api/client";
import type { UserGroup, BulkAssignResult } from "@/lib/admin/api/types";

export async function listGroups() {
  return apiClient.get<{ groups: UserGroup[] }>("/groups");
}

export async function getGroup(id: string) {
  return apiClient.get<{ group: UserGroup }>(`/groups/${id}`);
}

export async function createGroup(data: { name: string; description: string }) {
  return apiClient.post<{ group: UserGroup }>("/groups", data);
}

export async function updateGroup(
  id: string,
  data: { name?: string; description?: string },
) {
  return apiClient.put<{ group: UserGroup }>(`/groups/${id}`, data);
}

export async function deleteGroup(id: string) {
  return apiClient.delete<void>(`/groups/${id}`);
}

export async function addGroupMember(
  groupId: string,
  member: { firebase_uid: string; name: string; email: string },
) {
  return apiClient.post<{ group: UserGroup }>(
    `/groups/${groupId}/members`,
    member,
  );
}

export async function removeGroupMember(groupId: string, firebaseUid: string) {
  return apiClient.delete<{ group: UserGroup }>(
    `/groups/${groupId}/members/${firebaseUid}`,
  );
}

export async function bulkAssignGroupToApps(
  groupId: string,
  data: { app_ids: string[]; role: string; environments: string[] },
) {
  return apiClient.post<BulkAssignResult>(
    `/groups/${groupId}/bulk-assign`,
    data,
  );
}
