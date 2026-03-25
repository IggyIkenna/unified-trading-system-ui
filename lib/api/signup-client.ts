/**
 * Client for the user-management-ui /api/v1/signup endpoint.
 *
 * Creates a Firebase Auth user (disabled) + Firestore profile (pending_approval)
 * + onboarding request. Admin must approve before the user can sign in.
 */

const USER_MGMT_API =
  process.env.NEXT_PUBLIC_USER_MGMT_API_URL || "http://localhost:8017";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  service_type?: string;
  selected_options?: string[];
  expected_aum?: string;
}

export interface SignupResult {
  user: {
    firebase_uid: string;
    name: string;
    email: string;
    status: string;
  };
  onboarding_request_id: string;
}

export async function submitSignup(
  payload: SignupPayload,
): Promise<SignupResult> {
  const res = await fetch(`${USER_MGMT_API}/api/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Signup failed: HTTP ${res.status}`);
  }

  return res.json();
}

export interface DocumentUploadPayload {
  firebase_uid: string;
  onboarding_request_id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  content_type?: string;
}

export async function registerDocument(payload: DocumentUploadPayload) {
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/users/${payload.firebase_uid}/documents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_request_id: payload.onboarding_request_id,
        doc_type: payload.doc_type,
        file_name: payload.file_name,
        storage_path: payload.storage_path,
        content_type: payload.content_type,
      }),
    },
  );

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Document registration failed`);
  }

  return res.json();
}
