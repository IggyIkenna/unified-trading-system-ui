import type { AuthProvider } from "./types"

let _instance: AuthProvider | null = null

/**
 * Return the singleton FirebaseAuthProvider.
 *
 * Firebase Auth is the sole identity provider. The lazy require()
 * avoids pulling the Firebase SDK into SSR bundles.
 */
export function getAuthProvider(): AuthProvider {
  if (typeof window === "undefined") {
    return createProvider()
  }
  if (!_instance) {
    _instance = createProvider()
  }
  return _instance
}

function createProvider(): AuthProvider {
  const { FirebaseAuthProvider } = require("./firebase-provider") as {
    FirebaseAuthProvider: new () => AuthProvider
  }
  return new FirebaseAuthProvider()
}
