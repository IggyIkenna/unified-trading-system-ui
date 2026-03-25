/**
 * API client for onboarding request management.
 * Used by internal/admin users within UTS to review and approve/reject signups.
 */

const USER_MGMT_API =
  process.env.NEXT_PUBLIC_USER_MGMT_API_URL || "http://localhost:8017";

async function authHeaders(token: string): Promise<HeadersInit> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface OnboardingRequest {
  id: string;
  firebase_uid: string;
  applicant_name: string;
  applicant_email: string;
  company: string;
  service_type: string;
  status: "pending" | "approved" | "rejected";
  reviewer_uid: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
}

export interface AppGrant {
  app_id: string;
  role: string;
  environments?: string[];
}

export async function fetchOnboardingRequests(
  token: string,
  status?: string,
): Promise<{ requests: OnboardingRequest[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/onboarding-requests?${params.toString()}`,
    { headers: await authHeaders(token) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchRequestDetail(
  token: string,
  id: string,
): Promise<OnboardingRequest> {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/onboarding-requests/${id}`,
    { headers: await authHeaders(token) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.request ?? data;
}

export async function fetchUserDocuments(
  token: string,
  uid: string,
): Promise<{ documents: Array<{ id: string; doc_type: string; file_name: string; storage_path: string; review_status: string }> }> {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/users/${uid}/documents`,
    { headers: await authHeaders(token) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function approveRequest(
  token: string,
  id: string,
  options: { note?: string; role?: string; app_grants?: AppGrant[] },
): Promise<void> {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/onboarding-requests/${id}/approve`,
    {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify(options),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function rejectRequest(
  token: string,
  id: string,
  options: { note?: string; delete_user?: boolean },
): Promise<void> {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/onboarding-requests/${id}/reject`,
    {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify(options),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchRegisteredApps(
  token: string,
): Promise<{ applications: Array<{ app_id: string; name: string; category: string }> }> {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/applications`,
    { headers: await authHeaders(token) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
