import { apiClient } from "@/lib/admin/api/client";

export async function updateProfile(uid: string, displayName: string) {
  return apiClient.put<{
    user: { firebase_uid: string; email: string; displayName: string };
  }>("/settings/profile", { uid, displayName });
}

export async function changePassword(uid: string, newPassword: string) {
  return apiClient.post<{ success: boolean }>("/settings/change-password", {
    uid,
    newPassword,
  });
}

export async function getAdminStats() {
  return apiClient.get<{
    users: { total: number; active: number; disabled: number };
    apps: { total: number; with_capabilities: number };
    groups: { total: number; total_members: number };
    entitlements: { total: number };
    recent_audit: Array<{
      id: string;
      action: string;
      app_id?: string;
      subject_id?: string;
      actor: string;
      timestamp: string;
    }>;
  }>("/admin/stats");
}

export async function sendWelcomeEmail(email: string) {
  return apiClient.post<{
    success: boolean;
    message: string;
    reset_link: string;
  }>("/notifications/welcome", { email });
}
