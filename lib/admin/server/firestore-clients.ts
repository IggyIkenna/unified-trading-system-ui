/**
 * Multi-project Admin SDK Firestore clients.
 *
 * The admin UI needs to read submissions from BOTH Firebase projects:
 *   - `odum-staging`         (UAT data)
 *   - `central-element-323112` (prod data)
 *
 * Both UAT and prod Cloud Run services run on the same GCP project
 * (`central-element-323112`) and use the same compute service account,
 * which has `datastore.user` on `odum-staging` (provisioned 2026-04-25).
 * So one Admin SDK process can query both Firestores using ADC; we just
 * need named app instances pointing at each project ID.
 *
 * Initialise each app once and cache by project key. Calling
 * `getFirestoreFor("uat")` from anywhere returns the same Firestore
 * client for the lifetime of the Cloud Run instance.
 */

import admin from "firebase-admin";

const PROJECT_IDS = {
  uat: "odum-staging",
  prod: "central-element-323112",
} as const;

export type ProjectKey = keyof typeof PROJECT_IDS;
export const PROJECT_KEYS: readonly ProjectKey[] = ["uat", "prod"];

function getOrCreateApp(key: ProjectKey): admin.app.App {
  const projectId = PROJECT_IDS[key];
  const appName = `__odum_admin_${key}__`;
  const existing = admin.apps.find((a) => a !== null && a.name === appName);
  if (existing) return existing;
  return admin.initializeApp({ projectId }, appName);
}

export function getFirestoreFor(key: ProjectKey): admin.firestore.Firestore {
  return admin.firestore(getOrCreateApp(key));
}

export function projectIdFor(key: ProjectKey): string {
  return PROJECT_IDS[key];
}
