"use client";

import { useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  display_name: string | null;
  email_verified: boolean;
  disabled: boolean;
  creation_time: string;
  last_sign_in_time: string | null;
  provider_data: Array<{
    provider_id: string;
    uid: string;
    email: string | null;
  }>;
  custom_claims: Record<string, unknown> | null;
}

export interface FirebaseUsersResponse {
  users: FirebaseAuthUser[];
  total: number;
  page_token: string | null;
}

const BASE = "/api/auth/provisioning";

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useFirebaseUsers — lists Firebase Auth users via the provisioning backend.
 * Backed by auth-api /provisioning/firebase-auth/users (real) or mock-handler (T0).
 */
export function useFirebaseUsers(options?: { maxResults?: number; pageToken?: string }) {
  const params = new URLSearchParams();
  if (options?.maxResults) params.set("max_results", String(options.maxResults));
  if (options?.pageToken) params.set("page_token", options.pageToken);

  return useQuery<FirebaseUsersResponse>({
    queryKey: ["firebase-users", options?.maxResults, options?.pageToken],
    queryFn: () =>
      fetchJson<FirebaseUsersResponse>(
        `${BASE}/firebase-auth/users${params.toString() ? `?${params.toString()}` : ""}`,
      ),
    staleTime: 30_000,
  });
}
