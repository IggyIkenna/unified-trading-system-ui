/**
 * Admin `useAuth` shim. Delegates to the main UI's `useAuth` so migrated admin
 * pages plug into the single AuthProvider that `app/(ops)/layout.tsx` provides
 * (via the main UI's AuthProvider in `lib/providers.tsx`).
 *
 * The migrated pages only use `user` + `isAdmin()`; main UI's `useAuth` exposes
 * both. Exporting `AuthProvider` here satisfies `lib/admin/providers.tsx`'s
 * import, but the main UI's AuthProvider is the one actually mounted.
 */
"use client";

export { useAuth, AuthProvider } from "@/hooks/use-auth";
export type { AuthUser, AuthState } from "@/hooks/use-auth";
