import type { Entitlement, UserRole } from "@/lib/config/auth";
import { ALL_ENTITLEMENTS } from "@/lib/config/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  fetchAuthorization,
  type AuthorizeResult,
} from "./authorize-client";
import { getFirebaseAuth, getFirebaseDb } from "./firebase-config";
import type { AuthProvider, AuthUser, UserStatus } from "./types";

function mapBackendRole(role: AuthorizeResult["role"]): UserRole {
  if (role === "admin" || role === "owner") return "admin";
  if (role === "editor") return "internal";
  return "client";
}

const CAPABILITY_TO_ENTITLEMENT: Record<string, Entitlement[]> = {
  "data.view": ["data-basic"],
  "data.subscribe": ["data-pro"],
  "trading.view": ["execution-basic"],
  "trading.execute": ["execution-full"],
  "risk.view": ["execution-basic"],
  "risk.manage": ["execution-full"],
  "research.view": ["strategy-full", "ml-full"],
  "research.run": ["strategy-full", "ml-full"],
  "execution.view": ["execution-basic"],
  "reports.view": ["reporting"],
  "reports.export": ["reporting"],
  "manage.view": ["reporting"],
  "manage.edit": ["reporting"],
  "ops.view": ["reporting"],
  "ops.control": ["reporting"],
  "investor.view": ["investor-relations"],
  "investor.board": ["investor-board"],
  "investor.plan": ["investor-plan"],
  "investor.platform": ["investor-platform"],
  "investor.im": ["investor-im"],
  "investor.regulatory": ["investor-regulatory"],
  "investor.archive": ["investor-archive"],
};

function mapCapabilitiesToEntitlements(
  capabilities: string[],
): readonly (Entitlement | typeof ALL_ENTITLEMENTS)[] {
  if (capabilities.includes("*")) return [ALL_ENTITLEMENTS];
  const entitlements = new Set<Entitlement>();
  for (const cap of capabilities) {
    const mapped = CAPABILITY_TO_ENTITLEMENT[cap];
    if (mapped) {
      for (const e of mapped) entitlements.add(e);
    }
  }
  return Array.from(entitlements);
}

/**
 * Reads admin-granted entitlements from Firestore `app_entitlements/{email}`.
 * Written by the "Grant" button on /admin/questionnaires when an operator
 * reviews a prospect's questionnaire and provisions their demo session.
 * Returns an empty array when the doc doesn't exist or Firestore is unavailable.
 */
async function fetchGrantedEntitlements(
  email: string,
): Promise<readonly (string | { domain: string; tier: string })[]> {
  const db = getFirebaseDb();
  if (!db || !email) return [];
  try {
    const safeKey = email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
    const snap = await getDoc(doc(db, "app_entitlements", safeKey));
    if (!snap.exists()) return [];
    const data = snap.data() as {
      entitlements?: unknown;
    };
    const raw = data.entitlements;
    if (!Array.isArray(raw)) return [];
    return raw as (string | { domain: string; tier: string })[];
  } catch {
    return [];
  }
}

async function enrichUserFromBackend(
  fbUser: FirebaseUser,
): Promise<AuthUser> {
  const base: AuthUser = {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName ?? fbUser.email ?? "User",
    role: "client",
    org: { id: "default", name: "Default" },
    entitlements: [],
  };

  // Check custom claims first — written by the Admin SDK via /api/admin/set-claims.
  // These are the strongest signal: server-signed, enforced at the token level.
  const idTokenResult = await fbUser.getIdTokenResult();
  const claimsEntitlements = idTokenResult.claims["entitlements"];
  if (Array.isArray(claimsEntitlements) && claimsEntitlements.length > 0) {
    return {
      ...base,
      entitlements: claimsEntitlements as AuthUser["entitlements"],
      authorized: true,
      status: "active",
    };
  }

  // Read admin-granted entitlements in parallel with the backend authorize call.
  // These are written by the "Grant" button on /admin/questionnaires and override
  // the empty entitlement list when the user management API is not running (staging).
  const [authzResult, grantedEntitlements] = await Promise.allSettled([
    fetchAuthorization(fbUser.uid),
    fetchGrantedEntitlements(fbUser.email ?? ""),
  ]);

  const granted = grantedEntitlements.status === "fulfilled" ? grantedEntitlements.value : [];

  if (authzResult.status === "fulfilled") {
    const authz = authzResult.value;
    const backendEntitlements = mapCapabilitiesToEntitlements(authz.capabilities);
    // Merge: backend entitlements + admin-granted entitlements (deduped by string comparison)
    const merged = backendEntitlements.includes(ALL_ENTITLEMENTS)
      ? backendEntitlements
      : [
          ...backendEntitlements,
          ...granted.filter(
            (g) =>
              !backendEntitlements.some(
                (e) => JSON.stringify(e) === JSON.stringify(g),
              ),
          ),
        ];
    return {
      ...base,
      role: mapBackendRole(authz.role),
      entitlements: merged as AuthUser["entitlements"],
      authorized: authz.authorized,
      status: (authz.user_status as UserStatus) || "unknown",
      capabilities: authz.capabilities,
    };
  }

  // Backend unavailable (staging / demo) — fall back to granted entitlements only.
  if (granted.length > 0) {
    return {
      ...base,
      entitlements: granted as AuthUser["entitlements"],
      authorized: true,
      status: "active",
    };
  }

  return { ...base, authorized: false, status: "unknown" };
}

/**
 * Firebase Auth provider — authenticates against Firebase Auth
 * using email/password. After identity verification, calls the
 * user-management-api /authorize endpoint to get the user's real
 * role, capabilities, and account status.
 */
export class FirebaseAuthProvider implements AuthProvider {
  private user: AuthUser | null = null;
  private cachedToken: string | null = null;
  private lastLoginError: string | null = null;

  getLastLoginError(): string | null {
    return this.lastLoginError;
  }

  async login(email: string, password?: string): Promise<AuthUser | null> {
    if (!password) return null;
    this.lastLoginError = null;
    const auth = getFirebaseAuth();
    if (!auth) return null;
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      this.cachedToken = await credential.user.getIdToken();
      this.user = await enrichUserFromBackend(credential.user);
      return this.user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-disabled") {
        this.lastLoginError = "user-disabled";
        return null;
      }
      return null;
    }
  }

  async logout(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    this.user = null;
    this.cachedToken = null;
  }

  async getToken(): Promise<string | null> {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    this.cachedToken = await currentUser.getIdToken();
    return this.cachedToken;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  hasEntitlement(entitlement: Entitlement): boolean {
    if (!this.user) return false;
    if (this.user.entitlements.includes(ALL_ENTITLEMENTS)) return true;
    return this.user.entitlements.includes(entitlement);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const auth = getFirebaseAuth();
    if (!auth) return () => { };
    return firebaseOnAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        fbUser.getIdToken().then((t: string) => {
          this.cachedToken = t;
        });
        enrichUserFromBackend(fbUser).then((enriched) => {
          this.user = enriched;
          callback(this.user);
        });
      } else {
        this.user = null;
        this.cachedToken = null;
        callback(null);
      }
    });
  }
}
