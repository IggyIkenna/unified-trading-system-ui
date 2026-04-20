import { describe, expect, it } from "vitest";

import {
  firebaseAuth,
  firebaseDb,
  firebaseStorage,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "@/lib/auth/firebase-config";

/**
 * Coverage lift for lib/auth/firebase-config.ts.
 *
 * In the test env we deliberately do NOT set NEXT_PUBLIC_FIREBASE_API_KEY,
 * so `hasConfig` is false and every getter returns null. That's the
 * important "graceful-degrade when Firebase is not configured" branch.
 */

describe("firebase-config — unconfigured env returns nulls", () => {
  it("getFirebaseAuth returns null", () => {
    expect(getFirebaseAuth()).toBeNull();
  });

  it("getFirebaseDb returns null", () => {
    expect(getFirebaseDb()).toBeNull();
  });

  it("getFirebaseStorage returns null", () => {
    expect(getFirebaseStorage()).toBeNull();
  });

  it("module-level exports are null when unconfigured", () => {
    expect(firebaseAuth).toBeNull();
    expect(firebaseDb).toBeNull();
    expect(firebaseStorage).toBeNull();
  });

  it("getters are idempotent (memoisation path)", () => {
    expect(getFirebaseAuth()).toBe(getFirebaseAuth());
    expect(getFirebaseDb()).toBe(getFirebaseDb());
    expect(getFirebaseStorage()).toBe(getFirebaseStorage());
  });
});
