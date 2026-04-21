/**
 * Admin firebase shim. Re-exports the main UI's firebase singletons under the
 * names the migrated admin surface expects (`firebaseAuth`, `firebaseDb`).
 *
 * The main UI's SSOT is `@/lib/auth/firebase-config`. Migrated admin pages from
 * `user-management-ui` referenced `@/lib/firebase` — the fold-in rewrites those
 * imports to `@/lib/admin/firebase` and this file closes the shape gap.
 *
 * Do NOT initialise a second Firebase app here. The singletons in
 * `firebase-config.ts` are module-level and idempotent.
 *
 * In mock / test mode Firebase env vars are unset and `firebaseAuth` / `firebaseDb`
 * will be null. Callers that actually hit Firebase must null-check or wrap in a
 * try/catch; the shim does NOT throw at import time so admin pages can still
 * render their layout under mock-mode.
 */
import { firebaseAuth as _firebaseAuth, firebaseDb as _firebaseDb } from "@/lib/auth/firebase-config";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export const firebaseAuth: Auth | null = _firebaseAuth;
export const firebaseDb: Firestore | null = _firebaseDb;
