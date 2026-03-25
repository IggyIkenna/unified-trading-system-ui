import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth } from "./firebase-config";
import type { AuthProvider, AuthUser, UserStatus } from "./types";
import type { Entitlement, UserRole } from "@/lib/config/auth";
import { ALL_ENTITLEMENTS } from "@/lib/config/auth";
import {
  fetchAuthorization,
  type AuthorizeResult,
} from "./authorize-client";

function mapBackendRole(role: AuthorizeResult["role"]): UserRole {
  if (role === "admin" || role === "owner") return "admin";
  if (role === "editor") return "internal";
  return "client";
}

function mapCapabilitiesToEntitlements(
  capabilities: string[],
): readonly (Entitlement | typeof ALL_ENTITLEMENTS)[] {
  if (capabilities.includes("*")) return [ALL_ENTITLEMENTS];
  return capabilities as Entitlement[];
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

  try {
    const authz = await fetchAuthorization(fbUser.uid);
    return {
      ...base,
      role: mapBackendRole(authz.role),
      entitlements: mapCapabilitiesToEntitlements(authz.capabilities),
      authorized: authz.authorized,
      status: (authz.user_status as UserStatus) || "unknown",
      capabilities: authz.capabilities,
    };
  } catch {
    return { ...base, authorized: false, status: "unknown" };
  }
}

/**
 * Firebase Auth provider — authenticates against Firebase Auth
 * using email/password. After identity verification, calls the
 * user-management-ui /authorize endpoint to get the user's real
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
    if (!auth) return () => {};
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
