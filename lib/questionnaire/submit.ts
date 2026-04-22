/**
 * G1.10 — Questionnaire submit helper.
 *
 * Dev (`VITE_MOCK_API=true` or no Firebase project configured):
 *   - Write to localStorage under QUESTIONNAIRE_LOCAL_STORAGE_KEY.
 *   - demo-provider reads the same key to hydrate the persona profile.
 *
 * Staging / prod (Firebase client SDK + Firestore):
 *   - Write the response to a `/questionnaires` collection.
 *   - Firestore security rules allow anonymous writes + admin reads.
 *   - user-management-ui admin playback lists these via the Firebase
 *     admin SDK or an authenticated client with an `admin` role claim.
 *
 * Operator directive 2026-04-20: "user-management-api isn't needed — we
 * use Firebase auth; that's the API."
 */

import {
  QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY,
  QUESTIONNAIRE_LOCAL_STORAGE_KEY,
  type QuestionnaireEnvelope,
  type QuestionnaireResponse,
} from "./types";

export interface SubmitResult {
  readonly success: boolean;
  readonly sink: "localStorage" | "firestore";
  readonly submissionId?: string;
  readonly error?: string;
}

function isDevSink(): boolean {
  // Heuristic: in dev we run with VITE_MOCK_API=true OR on localhost
  // without a Firebase project configured. The UI already flips other
  // features on VITE_MOCK_API; keep parity here.
  if (typeof process !== "undefined" && process.env.VITE_MOCK_API === "true") {
    return true;
  }
  // No-window (SSR) → default to firestore so server-rendered submit
  // fails loudly. SSR submit is never the intent for this form.
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

async function submitToFirestore(
  response: QuestionnaireResponse,
  envelope: QuestionnaireEnvelope | null,
): Promise<SubmitResult> {
  try {
    // Lazy-load the firebase SDK so dev-only paths don't balloon the bundle.
    const [{ addDoc, collection, serverTimestamp }, { getFirebaseDb }] = await Promise.all([
      import("firebase/firestore"),
      import("../auth/firebase-config"),
    ]);
    const db = getFirebaseDb();
    if (db === null) {
      return {
        success: false,
        sink: "firestore",
        error: "Firebase is not configured in this environment",
      };
    }
    const docRef = await addDoc(collection(db, "questionnaires"), {
      ...response,
      ...(envelope !== null
        ? { submitted_by: { ...envelope, submissionId: undefined } }
        : {}),
      submittedAt: serverTimestamp(),
    });
    if (envelope !== null && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY,
          JSON.stringify({ ...envelope, submissionId: docRef.id }),
        );
      } catch {
        /* envelope persistence is best-effort; signup falls back to
         * server-side email lookup if it can't read the id. */
      }
    }
    return {
      success: true,
      sink: "firestore",
      submissionId: docRef.id,
    };
  } catch (error) {
    return {
      success: false,
      sink: "firestore",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function submitToLocalStorage(
  response: QuestionnaireResponse,
  envelope: QuestionnaireEnvelope | null,
): SubmitResult {
  try {
    const submissionId = `q-local-${Date.now()}`;
    const payload = {
      ...response,
      submissionId,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(QUESTIONNAIRE_LOCAL_STORAGE_KEY, JSON.stringify(payload));
    if (envelope !== null) {
      localStorage.setItem(
        QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY,
        JSON.stringify({ ...envelope, submissionId, submittedAt: payload.submittedAt }),
      );
    }
    return { success: true, sink: "localStorage", submissionId };
  } catch (error) {
    return {
      success: false,
      sink: "localStorage",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function submitQuestionnaire(
  response: QuestionnaireResponse,
  envelope: QuestionnaireEnvelope | null = null,
): Promise<SubmitResult> {
  if (isDevSink()) {
    return submitToLocalStorage(response, envelope);
  }
  return submitToFirestore(response, envelope);
}

/**
 * Hash an access code to a hex SHA-256 digest so the Firestore envelope
 * carries proof-of-access without the plain code. Falls back to an empty
 * string outside the browser / when SubtleCrypto is unavailable (SSR).
 */
export async function fingerprintAccessCode(code: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return "";
  const bytes = new TextEncoder().encode(code);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readLocalSubmission(): QuestionnaireResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(QUESTIONNAIRE_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestionnaireResponse & { submissionId?: string };
    // Strip helper fields before returning the pure response.
    const { categories, instrument_types, venue_scope, strategy_style, service_family, fund_structure } =
      parsed;
    return {
      categories,
      instrument_types,
      venue_scope,
      strategy_style,
      service_family,
      fund_structure,
    };
  } catch {
    return null;
  }
}
