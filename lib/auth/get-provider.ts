import type { AuthProvider } from "./types"
import { DemoAuthProvider } from "./demo-provider"
import { OAuthProvider } from "./oauth-provider"

let _instance: AuthProvider | null = null

/**
 * Return the singleton AuthProvider based on NEXT_PUBLIC_AUTH_PROVIDER.
 *
 * - "oauth" → OAuthProvider (stub — to be implemented)
 * - anything else → DemoAuthProvider (localStorage personas)
 *
 * The singleton is created lazily and cached for the lifetime of the
 * browser tab. Server-side (SSR), a fresh instance is returned each
 * call since there is no persistent browser state.
 */
export function getAuthProvider(): AuthProvider {
  if (typeof window === "undefined") {
    // SSR: no singleton, always fresh (no localStorage)
    return createProvider()
  }
  if (!_instance) {
    _instance = createProvider()
  }
  return _instance
}

function createProvider(): AuthProvider {
  const mode = process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "demo"
  if (mode === "oauth") {
    return new OAuthProvider()
  }
  return new DemoAuthProvider()
}
