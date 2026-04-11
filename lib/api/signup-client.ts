/**
 * Client for the user-management-ui /api/v1/signup endpoint.
 *
 * Creates a Firebase Auth user (disabled) + Firestore profile (pending_approval)
 * + onboarding request. Admin must approve before the user can sign in.
 */

// In mock mode, use relative URLs so the mock handler intercepts them.
// In production, call the UMU backend directly.
import { isMockDataMode } from "@/lib/runtime/data-mode";

const isMockMode =
  typeof process !== "undefined" &&
  isMockDataMode();

const USER_MGMT_API = isMockMode
  ? ""
  : (process.env.NEXT_PUBLIC_USER_MGMT_API_URL || "http://localhost:8017").replace(/\/+$/, "");

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  service_type?: string;
  applicant_type?: string;
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
    if (res.status === 404) {
      throw new Error(
        body.error ||
        "Signup API not found (404). Deploy a user-management API that exposes POST /api/v1/signup, or set NEXT_PUBLIC_USER_MGMT_API_URL to that service’s base URL.",
      );
    }
    throw new Error(body.error || `Signup failed: HTTP ${res.status}`);
  }

  return res.json();
}

export interface DocumentUploadPayload {
  firebase_uid: string;
  onboarding_request_id: string;
  doc_type: string;
  file_name: string;
  content_type?: string;
  file: Blob;
}

export async function uploadUserDocument(payload: DocumentUploadPayload) {
  const base64 = arrayBufferToBase64(await payload.file.arrayBuffer());
  const res = await fetch(
    `${USER_MGMT_API}/api/v1/users/${payload.firebase_uid}/documents/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_request_id: payload.onboarding_request_id,
        doc_type: payload.doc_type,
        file_name: payload.file_name,
        content_type: payload.content_type || "application/octet-stream",
        file_base64: base64,
      }),
    },
  );

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Document upload failed`);
  }

  return res.json();
}
