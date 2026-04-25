import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { cert } from "firebase-admin/app";

let _app: App | null = null;

/**
 * Returns the Firebase Admin SDK app singleton.
 * On Cloud Run: uses ADC automatically (no credential arg needed).
 * Locally: reads FIREBASE_ADMIN_CREDENTIAL (JSON string of service account key)
 * — when the local Firebase Emulator Suite is running, FIRESTORE_EMULATOR_HOST
 * / FIREBASE_AUTH_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST take over and
 * the Admin SDK routes everything to localhost without a credential.
 * Returns null if neither is available (browser bundle — should never happen
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
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (credJson) {
      const serviceAccount = JSON.parse(credJson) as Parameters<typeof cert>[0];
      _app = initializeApp({ credential: cert(serviceAccount), projectId, storageBucket });
    } else {
      // ADC — works on Cloud Run where the service account has the right IAM role.
      _app = initializeApp({ projectId, storageBucket });
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

export function getAdminFirestore(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getAdminStorage(): Storage | null {
  const app = getAdminApp();
  if (!app) return null;
  return getStorage(app);
}
