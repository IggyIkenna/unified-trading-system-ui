/**
 * Client for the portal's native /api/v1/signup route.
 *
 * Creates a Firebase Auth user (disabled) + Firestore profile (pending_approval)
 * + onboarding request via the same-origin Admin SDK route. Admin must approve
 * before the user can sign in.
 *
 * Same-origin call — no NEXT_PUBLIC_USER_MGMT_API_URL anymore. The legacy
 * user-management-api Cloud Run service is being retired.
 */

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

/** How the prospect wants to be reached. One of phone / telegram / whatsapp. */
export type ContactChannelKind = "phone" | "telegram" | "whatsapp";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
  /** Legacy field — prefer contact_channel + contact_value on new signups. */
  phone?: string;
  /** Preferred contact channel (phone / Telegram / WhatsApp). */
  contact_channel?: ContactChannelKind;
  /** Handle or phone number for the chosen channel. */
  contact_value?: string;
  service_type?: string;
  applicant_type?: string;
  selected_options?: string[];
  expected_aum?: string;
  /** Entity registered address — required for IM / Regulatory contract generation. */
  entity_address?: string;
  /**
   * Firestore doc id of the prospect's prior questionnaire response, when
   * available. Backend falls back to lookup-by-email if omitted.
   */
  questionnaire_response_id?: string;
  /**
   * Ask the backend to trigger Firebase Auth email verification for the new
   * account (admin SDK generates the verification link + queues the email).
   * Client-side `sendEmailVerification()` can't be used here because accounts
   * are created disabled — the user isn't signed in at signup time.
   */
  send_email_verification?: boolean;
}

export interface SignupResult {
  user: {
    firebase_uid: string;
    name: string;
    email: string;
    status: string;
  };
  onboarding_request_id: string;
  questionnaire_response_id?: string | null;
  email_verification_pending?: boolean;
}

export async function submitSignup(payload: SignupPayload): Promise<SignupResult> {
  const res = await fetch(`/api/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
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
  const res = await fetch(`/api/v1/users/${encodeURIComponent(payload.firebase_uid)}/documents/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      onboarding_request_id: payload.onboarding_request_id,
      doc_type: payload.doc_type,
      file_name: payload.file_name,
      content_type: payload.content_type || "application/octet-stream",
      file_base64: base64,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Document upload failed`);
  }

  return res.json();
}
