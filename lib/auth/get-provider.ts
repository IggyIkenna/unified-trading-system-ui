import type { AuthProvider } from "./types"
import { DemoAuthProvider } from "./demo-provider"
import { OAuthProvider } from "./oauth-provider"

let _instance: AuthProvider | null = null

/**
 * Return the singleton AuthProvider based on NEXT_PUBLIC_AUTH_PROVIDER.
 *
 * - "firebase" → FirebaseAuthProvider (lazy-loaded to avoid Firebase SDK
 *   initialization when running in demo/oauth mode)
 * - "oauth"    → OAuthProvider (stub)
 * - anything else → DemoAuthProvider (localStorage personas)
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
  const mode = process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "demo"
  if (mode === "firebase") {
    const { FirebaseAuthProvider } = require("./firebase-provider") as {
      FirebaseAuthProvider: new () => AuthProvider
    }
    return new FirebaseAuthProvider()
  }
  if (mode === "oauth") {
    return new OAuthProvider()
  }
  return new DemoAuthProvider()
}
