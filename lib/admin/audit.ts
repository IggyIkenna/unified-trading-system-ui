/**
 * Admin audit-log emitter.
 *
 * Writes a structured event to the Firestore `/admin_events` collection when
 * Firebase is available, and always emits a structured `console.info` line so
 * Cloud Run / Cloud Logging picks it up as a JSON log entry regardless of
 * whether the Firestore write succeeded. Fire-and-forget: errors in the
 * Firestore path are swallowed so a logging failure never fails a business
 * operation.
 *
 * SSOT for event types: maintained inline here until the events corpus grows
 * past ~10 types (promote to a UAC enum then). Current types:
 *   - ADMIN_DOC_DELETED  — onboarding document removed from per-org store
 */

import { firebaseDb } from "@/lib/admin/firebase";

export type AdminEventType = "ADMIN_DOC_DELETED";

export interface AdminEventPayload {
  readonly type: AdminEventType;
  readonly actor?: string;
  readonly target: Record<string, unknown>;
  readonly details?: Record<string, unknown>;
}

/**
 * Emit an admin-level audit event. Always resolves — never throws.
 */
export async function recordAdminEvent(payload: AdminEventPayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const record = { ...payload, timestamp };

  // Always emit a structured log line — survives if Firestore is unreachable.
  // Cloud Run + local dev will both capture this via stdout.
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({ level: "info", kind: "admin_event", ...record }),
  );

  if (firebaseDb === null) return;
  try {
    const { addDoc, collection, serverTimestamp } = await import(
      "firebase/firestore"
    );
    await addDoc(collection(firebaseDb, "admin_events"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Swallow — we already logged to stdout.
  }
}
