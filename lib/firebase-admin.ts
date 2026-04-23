import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";

let _app: App | null = null;

/**
 * Returns the Firebase Admin SDK app singleton.
 * On Cloud Run: uses ADC automatically (no credential arg needed).
 * Locally: reads FIREBASE_ADMIN_CREDENTIAL (JSON string of service account key).
 * Returns null if neither is available (e.g. browser bundle — should never happen
 * since this file is server-only).
 */
export function getAdminApp(): App | null {
  if (_app) return _app;
  if (typeof window !== "undefined") return null;

  try {
    if (getApps().length > 0) {
      _app = getApps()[0]!;
      return _app;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const credJson = process.env.FIREBASE_ADMIN_CREDENTIAL;

    if (credJson) {
      const serviceAccount = JSON.parse(credJson) as Parameters<typeof cert>[0];
      _app = initializeApp({ credential: cert(serviceAccount), projectId });
    } else {
      // ADC — works on Cloud Run where the service account has the right IAM role.
      _app = initializeApp({ projectId });
    }
    return _app;
  } catch {
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}
