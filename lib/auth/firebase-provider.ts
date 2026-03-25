import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth } from "./firebase-config";
import type { AuthProvider, AuthUser } from "./types";
import type { Entitlement } from "@/lib/config/auth";
import { ALL_ENTITLEMENTS } from "@/lib/config/auth";

function firebaseUserToAuthUser(fbUser: FirebaseUser): AuthUser {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName ?? fbUser.email ?? "User",
    role: "client",
    org: { id: "default", name: "Default" },
    entitlements: [],
  };
}

/**
 * Firebase Auth provider — authenticates against Firebase Auth
 * using email/password. The user's role and entitlements are NOT
 * stored in Firebase; they come from the user-management-ui
 * /authorize endpoint (Phase 2). This provider handles identity only.
 */
export class FirebaseAuthProvider implements AuthProvider {
  private user: AuthUser | null = null;
  private cachedToken: string | null = null;

  async login(email: string, password?: string): Promise<AuthUser | null> {
    if (!password) return null;
    const auth = getFirebaseAuth();
    if (!auth) return null;
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      this.user = firebaseUserToAuthUser(credential.user);
      this.cachedToken = await credential.user.getIdToken();
      return this.user;
    } catch {
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
        this.user = firebaseUserToAuthUser(fbUser);
        fbUser.getIdToken().then((t: string) => {
          this.cachedToken = t;
        });
        callback(this.user);
      } else {
        this.user = null;
        this.cachedToken = null;
        callback(null);
      }
    });
  }
}
