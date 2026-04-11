import type { AuthProvider } from "./types";

let _instance: AuthProvider | null = null;

/**
 * Return the singleton auth provider.
 *
 * When NEXT_PUBLIC_AUTH_PROVIDER=demo (local dev / mock mode),
 * uses DemoAuthProvider with persona switching (no Firebase needed).
 * Otherwise uses FirebaseAuthProvider.
 */
export function getAuthProvider(): AuthProvider {
  if (typeof window === "undefined") {
    return createProvider();
  }
  if (!_instance) {
    _instance = createProvider();
  }
  return _instance;
}

function createProvider(): AuthProvider {
  const useDemo = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "demo";

  if (useDemo) {
    const { DemoAuthProvider } = require("./demo-provider") as {
      DemoAuthProvider: new () => AuthProvider;
    };
    return new DemoAuthProvider();
  }

  const { FirebaseAuthProvider } = require("./firebase-provider") as {
    FirebaseAuthProvider: new () => AuthProvider;
  };
  return new FirebaseAuthProvider();
}
